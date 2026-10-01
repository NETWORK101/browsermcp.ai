import { existsSync } from 'fs';
import type { BrowserMcpConfig } from '../config/schema.js';
import { profileDirFor } from '../browser/manager.js';

export type Policy = BrowserMcpConfig['policy'];

export type PolicyDecision = { ok: true; url: URL } | { ok: false; reason: string };

const WEB_SCHEMES = new Set(['http:', 'https:']);

/**
 * Match a host (optionally with port) against a glob such as:
 *   "example.com"      exact host, any port
 *   "*.example.com"    any subdomain (not the apex)
 *   "localhost:3000"   exact host + port
 *   "localhost:*"      host, any port
 *   "*"                everything
 */
export function hostMatches(pattern: string, url: URL): boolean {
  const p = pattern.trim().toLowerCase();
  if (p === '*') return true;

  const [hostPat, portPat] = p.split(/:(?=[^:]*$)/); // split on the last colon
  const host = url.hostname.toLowerCase();
  const port = url.port || (url.protocol === 'https:' ? '443' : url.protocol === 'http:' ? '80' : '');

  if (portPat !== undefined && portPat !== '*' && portPat !== port) return false;

  if (hostPat.startsWith('*.')) {
    const suffix = hostPat.slice(1); // ".example.com"
    return host.endsWith(suffix) && host.length > suffix.length;
  }
  return host === hostPat;
}

/**
 * Decide whether an agent-supplied URL may be opened.
 * Deny rules win over allow rules; an empty allow list means "any web host".
 */
export function checkUrl(raw: string, policy: Policy): PolicyDecision {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: `Not a valid absolute URL: ${raw}` };
  }

  if (url.protocol === 'file:') {
    return policy.allowFileUrls
      ? { ok: true, url }
      : { ok: false, reason: 'file:// URLs are disabled (set policy.allowFileUrls in .browsermcp.json to enable).' };
  }
  if (!WEB_SCHEMES.has(url.protocol)) {
    return { ok: false, reason: `Scheme "${url.protocol}" is not allowed — only http(s) URLs can be opened.` };
  }

  const denied = policy.deny.find((p) => hostMatches(p, url));
  if (denied) return { ok: false, reason: `${url.host} is blocked by policy.deny ("${denied}").` };

  if (policy.allow.length > 0 && !policy.allow.some((p) => hostMatches(p, url))) {
    return { ok: false, reason: `${url.host} is not in policy.allow. Allowed: ${policy.allow.join(', ')}` };
  }

  return { ok: true, url };
}

const FENCE_TAG = 'untrusted-page-content';

/**
 * Wrap page-derived text in an explicit boundary so the model can tell
 * "what the page says" apart from "what the user asked". Any attempt by the
 * page to close the fence early is neutralised.
 */
export function fenceUntrusted(content: string, source: string): string {
  const safe = content.replaceAll(`</${FENCE_TAG}`, `<\\/${FENCE_TAG}`);
  return `<${FENCE_TAG} source="${source.replaceAll('"', '%22')}">\n${safe}\n</${FENCE_TAG}>`;
}

/** True when browsermcp will read as the user: a saved login profile or an attached browser. */
export function usesSignedInSession(browser: BrowserMcpConfig['browser']): boolean {
  if (browser.cdpEndpoint) return true;
  if (browser.profile === 'persistent') return true;
  if (browser.profile === 'auto') return existsSync(profileDirFor(browser.engine, browser.profileDir));
  return false;
}

export type InteractDecision = { allowed: true } | { allowed: false; reason: string };

/**
 * Resolve policy.allowInteract. "auto" keeps clicks and typing off whenever the agent would act
 * with the user's credentials — the combination vendors warn about (signed-in browser + injection).
 */
export function interactDecision(config: BrowserMcpConfig): InteractDecision {
  const v = config.policy.allowInteract;
  if (v === true) return { allowed: true };
  if (v === false) {
    return { allowed: false, reason: 'interact is disabled by policy.allowInteract: false (read-only mode).' };
  }
  if (!usesSignedInSession(config.browser)) return { allowed: true };
  return {
    allowed: false,
    reason:
      'interact is off while browsermcp uses your signed-in session (policy.allowInteract: "auto"). ' +
      'To let the agent click and type as you, set "allowInteract": true in .browsermcp.json.',
  };
}

/** Deny rules apply to every request a page makes — subresources, iframes, fetch/XHR — not just navigation. */
export function isDeniedRequest(raw: string, policy: Policy): boolean {
  if (policy.deny.length === 0) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (!/^(https?|wss?):$/.test(url.protocol)) return false;
  return policy.deny.some((p) => hostMatches(p, url));
}
