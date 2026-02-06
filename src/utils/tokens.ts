/**
 * Token estimation utilities
 *
 * Uses a simple heuristic: ~4 characters per token for English text
 * This is a rough estimate - actual tokenization varies by model
 */

const CHARS_PER_TOKEN = 4;

export function estimateTokens(content: string): number {
  // Simple estimation: divide by average chars per token
  // Account for whitespace and special characters
  const cleanedContent = content.replace(/\s+/g, ' ').trim();
  return Math.ceil(cleanedContent.length / CHARS_PER_TOKEN);
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens}`;
  }
  return `${(tokens / 1000).toFixed(1)}k`;
}

export function tokenPercentage(tokens: number, total: number): string {
  if (total === 0) return '0%';
  return `${((tokens / total) * 100).toFixed(1)}%`;
}
