#!/usr/bin/env node

// Detect if running as CLI or MCP server
const args = process.argv.slice(2);
const hasCliArgs = args.length > 0;

async function main() {
  if (hasCliArgs) {
    // Run as CLI
    const { runCli } = await import('./cli-main.js');
    await runCli();
  } else {
    // Run as MCP server (default behavior for backward compatibility)
    const { startMcpServer } = await import('./mcp-server.js');
    await startMcpServer();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

export {};