import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../config.json');

function pastaEmojiDoConfig() {
  try {
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
