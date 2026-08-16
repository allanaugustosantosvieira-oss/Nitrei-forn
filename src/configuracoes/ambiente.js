import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PermissionFlagsBits } from 'discord.js';
import { carregarEnv } from './env-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../config.json');

function carregarConfig() {
  if (!existsSync(CONFIG_PATH)) return {};

  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Falha ao ler config.json:', err.message);
    process.exit(1);
  }
}

const env = carregarEnv();
const config = carregarConfig();

export const TOKEN = env.TOKEN || env.DISCORD_TOKEN || config.token || config.DISCORD_TOKEN || '';
export const CLIENT_ID = env.CLIENT_ID || env.DISCORD_CLIENT_ID || config.clientId || config.DISCORD_CLIENT_ID || '';
export const GUILD_ID = env.GUILD_ID || env.DISCORD_GUILD_ID || config.guildId || config.DISCORD_GUILD_ID || '';
export const SYNC_EMOJIS_ONLY = process.argv.includes('--sync-emojis');
export const SYNC_EMOJIS_ON_START =
  SYNC_EMOJIS_ONLY ||
  /^true$/i.test(String(env.SYNC_EMOJIS_ON_START || '')) ||
  config.syncEmojisOnStart === true ||
  /^true$/i.test(String(config.SYNC_EMOJIS_ON_START || ''));
export const MANAGE_GUILD_EXPRESSIONS =
  PermissionFlagsBits.ManageGuildExpressions ?? PermissionFlagsBits.ManageEmojisAndStickers;
export const APPROVAL_ROLE_ID = env.APPROVAL_ROLE_ID || config.approvalRoleId || '';

export function validarAmbiente() {
  if (!TOKEN || !CLIENT_ID) {
    console.error('Preencha "token" e "clientId" no config.json ou no arquivo .env.');
    process.exit(1);
  }
}
