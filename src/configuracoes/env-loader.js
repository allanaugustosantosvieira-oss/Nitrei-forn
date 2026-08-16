import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ENV_PATH = path.resolve(__dirname, '../../.env');

export function carregarEnv(envPath = ENV_PATH) {
  const vars = {};
  try {
    if (existsSync(envPath)) {
      const raw = readFileSync(envPath, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        let trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        if (trimmed.startsWith('export ')) trimmed = trimmed.slice(7).trim();
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (key) vars[key] = value;
      }
    }
  } catch {
    /* .env opcional — ignora erros */
  }
  return vars;
}