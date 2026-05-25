import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { DEFAULT_CONFIG } from './schema.js';

const MCP_CONFIG = JSON.stringify(
  {
    mcpServers: {
      headlessdev: {
        command: 'npx',
        args: ['-y', 'headlessdev'],
      },
    },
  },
  null,
  2
);

export async function runInit(): Promise<void> {
  // 1. Write .headlessdev.json to CWD
  const localConfigPath = join(process.cwd(), '.headlessdev.json');
  writeFileSync(localConfigPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n', 'utf-8');
  console.log(`Created ${localConfigPath}`);

  // 2. Print MCP config instructions
  console.log('\nAdd this to your Claude Code MCP settings:\n');
  console.log(MCP_CONFIG);

  // 3. Detect Claude Code config location
  const claudeJsonPath = join(homedir(), '.claude.json');
  const claudeSettingsPath = join(homedir(), '.claude', 'settings.json');
  if (existsSync(claudeJsonPath)) {
    console.log(`\nDetected Claude Code config at: ${claudeJsonPath}`);
  } else if (existsSync(claudeSettingsPath)) {
    console.log(`\nDetected Claude Code config at: ${claudeSettingsPath}`);
  }

  // 4. Detect Cursor
  const cursorMcpPath = join(homedir(), '.cursor', 'mcp.json');
  if (existsSync(cursorMcpPath)) {
    console.log(`\nDetected Cursor MCP config at: ${cursorMcpPath}`);
    console.log('Add the same mcpServers block to that file.');
  }

  console.log('\nheadlessdev init complete!');
}
