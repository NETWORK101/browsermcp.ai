import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig, resolveStateDir, DEFAULT_CONFIG } from '../../src/config/schema.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'localmcp-compat-'));
const write = (p: string, v: unknown) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v));
};

describe('rename compatibility: browsermcp names keep working', () => {
  it('state dir prefers ~/.localmcp, falls back to an existing ~/.browsermcp, defaults to ~/.localmcp', () => {
    const home = tmp();
    expect(resolveStateDir(home)).toBe(path.join(home, '.localmcp'));
    fs.mkdirSync(path.join(home, '.browsermcp'));
    expect(resolveStateDir(home)).toBe(path.join(home, '.browsermcp'));
    fs.mkdirSync(path.join(home, '.localmcp'));
    expect(resolveStateDir(home)).toBe(path.join(home, '.localmcp'));
  });

  it('reads .browsermcp.json when .localmcp.json is absent, and .localmcp.json when both exist', () => {
    const cwd = tmp();
    const home = tmp();
    write(path.join(cwd, '.browsermcp.json'), { distill: { maxTokens: 1234 } });
    expect(loadConfig({ cwd, home }).distill.maxTokens).toBe(1234);
    write(path.join(cwd, '.localmcp.json'), { distill: { maxTokens: 999 } });
    expect(loadConfig({ cwd, home }).distill.maxTokens).toBe(999);
  });

  it('reads the old global config path when the new one is absent; project config still wins', () => {
    const cwd = tmp();
    const home = tmp();
    write(path.join(home, '.config', 'browsermcp', 'config.json'), { limits: { maxSessionsPerDay: 7 }, distill: { maxTokens: 50 } });
    const c = loadConfig({ cwd, home });
    expect(c.limits.maxSessionsPerDay).toBe(7);
    expect(c.distill.maxTokens).toBe(50);
    write(path.join(cwd, '.localmcp.json'), { distill: { maxTokens: 80 } });
    expect(loadConfig({ cwd, home }).distill.maxTokens).toBe(80);
    expect(loadConfig({ cwd, home }).limits.maxSessionsPerDay).toBe(7);
  });

  it('defaults are untouched when nothing exists', () => {
    const c = loadConfig({ cwd: tmp(), home: tmp() });
    expect(c.policy).toEqual(DEFAULT_CONFIG.policy);
  });
});
