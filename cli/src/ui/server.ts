/**
 * cc-config UI Server
 *
 * Local web server for managing Claude Code configuration via browser.
 * Serves the dashboard UI and provides API endpoints for MCP servers and tools.
 *
 * Design principles applied:
 * - Cooper: Goal-directed (users want to toggle settings, not navigate menus)
 * - Norman: Immediate feedback on all actions
 * - Rams: Minimal API surface
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { listTools, installTool, uninstallTool } from '../tools/index.js';

interface MCPServer {
  name: string;
  description?: string;
  enabled: boolean;
  command?: string;
  args?: string[];
}

interface APIResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

/**
 * Read MCP configuration from .mcp.json
 */
function readMCPConfig(): { mcpServers?: Record<string, unknown> } {
  const configPaths = [
    path.join(process.cwd(), '.mcp.json'),
    path.join(process.env.HOME || '', '.config', 'claude', 'mcp.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        continue;
      }
    }
  }

  return { mcpServers: {} };
}

/**
 * Write MCP configuration to .mcp.json
 */
function writeMCPConfig(config: { mcpServers?: Record<string, unknown> }): boolean {
  const configPath = path.join(process.cwd(), '.mcp.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of MCP servers with status
 */
function getMCPServers(): MCPServer[] {
  const config = readMCPConfig();
  const servers = config.mcpServers || {};

  return Object.entries(servers).map(([name, serverConfig]) => {
    const cfg = serverConfig as Record<string, unknown>;
    return {
      name,
      description: (cfg.description as string) || `MCP server: ${name}`,
      enabled: cfg.disabled !== true,
      command: cfg.command as string | undefined,
      args: cfg.args as string[] | undefined
    };
  });
}

/**
 * Toggle MCP server enabled state
 */
function toggleMCPServer(name: string, enabled: boolean): boolean {
  const config = readMCPConfig();
  if (!config.mcpServers || !config.mcpServers[name]) {
    return false;
  }

  const serverConfig = config.mcpServers[name] as Record<string, unknown>;
  if (enabled) {
    delete serverConfig.disabled;
  } else {
    serverConfig.disabled = true;
  }

  return writeMCPConfig(config);
}

/**
 * Parse JSON body from request
 */
function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

/**
 * Send JSON response
 */
function sendJSON(res: http.ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

/**
 * Serve static HTML file
 * Handles both development (src/) and production (dist/) paths
 */
function serveHTML(res: http.ServerResponse): void {
  // ESM: use import.meta.url to get current file location
  const currentFileUrl = new URL(import.meta.url);
  const currentDir = path.dirname(currentFileUrl.pathname);

  // Try multiple possible locations for the HTML file
  const possiblePaths = [
    path.join(currentDir, 'index.html'),  // Same dir (src/ui or dist/ui)
    path.join(currentDir, '..', '..', 'src', 'ui', 'index.html'),  // From dist to src
    path.join(process.cwd(), 'src', 'ui', 'index.html'),  // From CLI working dir
  ];

  let htmlContent: string | null = null;

  for (const htmlPath of possiblePaths) {
    if (fs.existsSync(htmlPath)) {
      htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      break;
    }
  }

  if (!htmlContent) {
    res.writeHead(404);
    res.end('UI not found. Tried: ' + possiblePaths.join(', '));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlContent);
}

/**
 * Handle API requests
 */
async function handleAPI(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string
): Promise<void> {
  const method = req.method || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    sendJSON(res, {});
    return;
  }

  // GET /api/mcp-servers
  if (pathname === '/api/mcp-servers' && method === 'GET') {
    const servers = getMCPServers();
    sendJSON(res, servers);
    return;
  }

  // POST /api/mcp-servers/:name/toggle
  const toggleMatch = pathname.match(/^\/api\/mcp-servers\/([^/]+)\/toggle$/);
  if (toggleMatch && method === 'POST') {
    const name = decodeURIComponent(toggleMatch[1]);
    const body = await parseBody(req);
    const enabled = body.enabled === true;

    const success = toggleMCPServer(name, enabled);
    sendJSON(res, {
      success,
      message: success
        ? `${name} ${enabled ? 'enabled' : 'disabled'}`
        : `Failed to toggle ${name}`
    } as APIResponse);
    return;
  }

  // GET /api/tools
  if (pathname === '/api/tools' && method === 'GET') {
    const tools = listTools();
    sendJSON(res, tools);
    return;
  }

  // POST /api/tools/:name/install
  const installMatch = pathname.match(/^\/api\/tools\/([^/]+)\/install$/);
  if (installMatch && method === 'POST') {
    const name = decodeURIComponent(installMatch[1]);
    const body = await parseBody(req);
    const force = body.force === true;

    const result = installTool(name, { force });
    sendJSON(res, result);
    return;
  }

  // POST /api/tools/:name/uninstall
  const uninstallMatch = pathname.match(/^\/api\/tools\/([^/]+)\/uninstall$/);
  if (uninstallMatch && method === 'POST') {
    const name = decodeURIComponent(uninstallMatch[1]);
    const result = uninstallTool(name);
    sendJSON(res, result);
    return;
  }

  // 404
  sendJSON(res, { success: false, message: 'Not found' }, 404);
}

/**
 * Create and start the UI server
 */
export function startUIServer(port = 3847): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const pathname = url.pathname;

    // API routes
    if (pathname.startsWith('/api/')) {
      await handleAPI(req, res, pathname);
      return;
    }

    // Serve HTML for root
    if (pathname === '/' || pathname === '/index.html') {
      serveHTML(res);
      return;
    }

    // 404 for other paths
    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    console.log(`\n  cc-config UI running at:\n`);
    console.log(`  \x1b[36mhttp://localhost:${port}\x1b[0m\n`);
  });

  return server;
}

/**
 * CLI entry point
 */
export function runUI(options: { port?: number } = {}): void {
  const port = options.port || 3847;

  const server = startUIServer(port);

  // Open browser
  const opener = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'start'
      : 'xdg-open';

  exec(`${opener} http://localhost:${port}`);

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n  Shutting down...');
    server.close();
    process.exit(0);
  });
}
