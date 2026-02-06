/**
 * Summary HTML generator.
 *
 * Following composition: generate output, let browser handle presentation.
 * Following clarity: keep the logic simple.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { RunSummary } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate summary HTML file with embedded data.
 *
 * @param summary - Run summary data
 * @param outputDir - Directory to write summary file
 * @returns Path to generated HTML file
 */
export function generateSummaryHtml(summary: RunSummary, outputDir: string): string {
  // Read template
  const templatePath = path.join(__dirname, '../../ui/summary.html');

  let template: string;
  try {
    template = fs.readFileSync(templatePath, 'utf-8');
  } catch {
    throw new Error(`Summary template not found: ${templatePath}`);
  }

  // Verify template has closing body tag
  if (!template.includes('</body>')) {
    console.error('Summary template missing </body> tag');
    throw new Error('Summary template missing </body> tag');
  }

  // Embed data as script tag - MUST be before the render script runs
  // Escape </ sequences to prevent breaking out of the script tag (XSS prevention)
  const safeJson = JSON.stringify(summary, null, 2).replace(/<\//g, '<\\/');
  const dataScript = `<script id="ralph-summary-data" type="application/json">\n${safeJson}\n</script>`;

  // Insert BEFORE the main script (which calls render()), not at end of body
  // The main script starts with <script>\n'use strict';
  template = template.replace("<script>\n'use strict';", `${dataScript}\n<script>\n'use strict';`);

  // Write output file
  const outputPath = path.join(outputDir, `ralph-summary-${summary.sessionId}.html`);
  fs.writeFileSync(outputPath, template);

  // Also write JSON for reference
  const jsonPath = path.join(outputDir, `ralph-summary-${summary.sessionId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  return outputPath;
}

/**
 * Open summary in default browser.
 *
 * @param htmlPath - Path to HTML file
 */
export async function openSummary(htmlPath: string): Promise<void> {
  const { exec } = await import('child_process');

  // Cross-platform open command
  const platform = process.platform;
  let cmd: string;

  if (platform === 'darwin') {
    cmd = `open "${htmlPath}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${htmlPath}"`;
  } else {
    cmd = `xdg-open "${htmlPath}"`;
  }

  return new Promise((resolve) => {
    exec(cmd, (error) => {
      if (error) {
        // Don't fail if browser can't open, just log
        console.error(`Could not open browser: ${error.message}`);
      }
      resolve();
    });
  });
}
