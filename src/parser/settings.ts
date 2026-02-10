import * as fs from 'fs';
import type { SettingsParsed, ConfigScope } from '../types.js';

export async function parseSettings(filePath: string, scope: ConfigScope): Promise<SettingsParsed | null> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const settings = JSON.parse(content);

    return {
      path: filePath,
      scope,
      model: settings.model,
      permissions: settings.permissions,
      hooks: settings.hooks,
      mcpServers: settings.enabledMcpjsonServers || [],
      env: settings.env
    };
  } catch {
    return null;
  }
}
