import { estimateTokens } from './token-counter.js';

export interface Section {
  /** Heading text without the leading #'s; "" for content before the first heading. */
  heading: string;
  level: number;
  text: string;
  tokens: number;
  index: number;
}

export interface BudgetResult {
  markdown: string;
  truncated: boolean;
  /** Headings of sections that were dropped, so the agent can ask for them by name. */
  omitted: string[];
  sectionsKept: number;
  sectionsTotal: number;
}

const HEADING = /^(#{1,6})\s+(.*)$/;

/** Split markdown into heading-delimited sections, ignoring "#" lines inside fenced code. */
export function splitSections(markdown: string): Section[] {
  const sections: Section[] = [];
  let current: { heading: string; level: number; lines: string[] } = { heading: '', level: 0, lines: [] };
  let inFence = false;

  const flush = () => {
    const text = current.lines.join('\n').trim();
    if (text) {
      sections.push({ heading: current.heading, level: current.level, text, tokens: estimateTokens(text), index: sections.length });
    }
  };

  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = inFence ? null : line.match(HEADING);
    if (m) {
      flush();
      current = { heading: m[2].trim(), level: m[1].length, lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  flush();
  return sections;
}

const STOPWORDS = new Set(
  'a an and are as at be by for from how i in is it of on or show tell that the this to was what when where which who why with find get me all just only about'.split(' ')
);

function terms(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) ?? [])
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => t.replace(/(ies|es|s)$/, (s) => (s === 'ies' ? 'y' : ''))); // crude plural folding
}

/**
 * BM25-style relevance of each section to the focus string.
 * Heading matches count triple — a section *titled* "Pricing" beats one that mentions price once.
 */
export function scoreSections(sections: Section[], focus: string): number[] {
  const q = [...new Set(terms(focus))];
  if (q.length === 0) return sections.map(() => 0);

  const docs = sections.map((s) => {
    const body = terms(s.text);
    const head = terms(s.heading);
    const tf = new Map<string, number>();
    for (const t of body) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of head) tf.set(t, (tf.get(t) ?? 0) + 3);
    return { tf, len: body.length || 1 };
  });

  const N = docs.length;
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, N);
  const k1 = 1.2;
  const b = 0.75;
  const df = new Map(q.map((t) => [t, docs.filter((d) => d.tf.has(t)).length]));

  return docs.map((d) => {
    let score = 0;
    for (const t of q) {
      const f = d.tf.get(t) ?? 0;
      if (!f) continue;
      const n = df.get(t)!;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avgLen)));
    }
    return score;
  });
}

function truncateToTokens(text: string, tokens: number): string {
  const chars = tokens * 4;
  if (text.length <= chars) return text;
  const cut = text.lastIndexOf('\n', chars);
  return text.slice(0, cut > chars * 0.5 ? cut : chars).trimEnd() + '\n…';
}

/**
 * Fit markdown into a token budget.
 *
 * Without a focus, keep sections in document order until the budget runs out.
 * With a focus, keep the most relevant sections first (always including the page's
 * lead section for orientation), then re-emit them in original order so the result
 * still reads like the page.
 */
export function applyBudget(markdown: string, opts: { maxTokens?: number; focus?: string }): BudgetResult {
  const sections = splitSections(markdown);
  const total = sections.length;
  const maxTokens = opts.maxTokens && opts.maxTokens > 0 ? opts.maxTokens : Infinity;
  const focus = opts.focus?.trim();

  const fits = estimateTokens(markdown) <= maxTokens;
  if (fits && !focus) {
    return { markdown, truncated: false, omitted: [], sectionsKept: total, sectionsTotal: total };
  }

  let order: Section[] = sections;
  let leadIsFiller = false;
  if (focus) {
    const scores = scoreSections(sections, focus);
    if (scores.some((s) => s > 0)) {
      // Relevant sections get first claim on the budget; the lead (intro/infobox) only
      // fills what's left. Otherwise a bulky intro can starve the answer out entirely.
      // Only text before the first heading, or an h1 title block, counts as the page's lead.
      // A page that opens straight into "## Install" has no lead — that's just a section.
      const first = sections[0];
      const hasLead = !!first && (first.heading === '' || first.level === 1);
      const relevant = sections
        .map((s, i) => ({ s, score: scores[i] }))
        .filter(({ s, score }) => score > 0 && !(hasLead && s.index === 0))
        .sort((a, b) => b.score - a.score)
        .map(({ s }) => s);
      const lead = hasLead && scores[0] === 0 ? [first] : [];
      order = hasLead && scores[0] > 0 ? [first, ...relevant] : [...relevant, ...lead];
      leadIsFiller = lead.length > 0;
    }
    // nothing matched — fall back to document order rather than returning nothing
  }

  const kept = new Map<number, string>();
  let used = 0;
  for (const s of order) {
    const remaining = maxTokens - used;
    if (s.tokens <= remaining) {
      kept.set(s.index, s.text);
      used += s.tokens;
    } else if (kept.size === 0) {
      // Single oversized top section — keep a truncated slice so we never return empty.
      kept.set(s.index, truncateToTokens(s.text, maxTokens));
      break;
    } else if (leadIsFiller && s.index === 0 && remaining >= 120) {
      // A trimmed intro still orients the reader; skip it only if the scrap would be useless.
      kept.set(s.index, truncateToTokens(s.text, remaining));
      used = maxTokens;
    }
  }

  const keptSections = sections.filter((s) => kept.has(s.index));
  const omitted = sections.filter((s) => !kept.has(s.index) && s.heading).map((s) => s.heading);
  const truncated = keptSections.length < total || !fits;

  return {
    markdown: keptSections.map((s) => kept.get(s.index)!).join('\n\n'),
    truncated,
    omitted,
    sectionsKept: keptSections.length,
    sectionsTotal: total,
  };
}
