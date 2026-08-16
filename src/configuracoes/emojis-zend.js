import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../config.json');
const ENV_PATH = path.resolve(__dirname, '../../.env');

function pastaEmojiDoConfig() {
  try {
    if (process.env.EMOJI_FOLDER && process.env.EMOJI_FOLDER.trim()) return process.env.EMOJI_FOLDER.trim();
    if (existsSync(ENV_PATH)) {
      const raw = readFileSync(ENV_PATH, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('export ')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        if (trimmed.slice(0, eq).trim() === 'EMOJI_FOLDER') {
          let value = trimmed.slice(eq + 1).trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (value) return value;
        }
      }
    }
    if (!existsSync(CONFIG_PATH)) return null;
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    return typeof config.emojiFolder === 'string' && config.emojiFolder.trim() ? config.emojiFolder.trim() : null;
  } catch {
    return null;
  }
}

const pastaConfigurada = pastaEmojiDoConfig();

export const PASTA_EMOJIS_ZEND = pastaConfigurada
  ? path.resolve(__dirname, '../..', pastaConfigurada)
  : path.join(process.cwd(), 'discord-emojis', 'upload');
export const ARQUIVO_METADADOS_EMOJIS_ZEND = path.join(process.cwd(), 'discord-emojis', 'metadata.json');
export const EXTENSOES_EMOJI_ZEND = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

export const SINCRONIA_EMOJI_ZEND = {
  escopo: 'application',
  origem: 'discord-emojis/upload',
  descricao: 'Os emojis ficam como arquivos locais e sao sincronizados no aplicativo do bot, sem usar slots do servidor.',
};
