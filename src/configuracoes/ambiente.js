import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PermissionFlagsBits } from 'discord.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../config.json');
const ENV_PATH = path.resolve(__dirname, '../../.env');

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

function carregarEnvArquivo() {
  const vars = {};
  try {
    if (existsSync(ENV_PATH)) {
      const raw = readFileSync(ENV_PATH, 'utf8');
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
    /* .env opcional */
  }
  return vars;
}

const envArquivo = carregarEnvArquivo();
const config = carregarConfig();

export const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN || envArquivo.TOKEN || envArquivo.DISCORD_TOKEN || config.token || config.DISCORD_TOKEN || '';
export const CLIENT_ID = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID || envArquivo.CLIENT_ID || envArquivo.DISCORD_CLIENT_ID || config.clientId || config.DISCORD_CLIENT_ID || '';
export const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID || envArquivo.GUILD_ID || envArquivo.DISCORD_GUILD_ID || config.guildId || config.DISCORD_GUILD_ID || '';
export const SYNC_EMOJIS_ONLY = process.argv.includes('--sync-emojis');
export const SYNC_EMOJIS_ON_START =
  SYNC_EMOJIS_ONLY ||
  /^true$/i.test(String(process.env.SYNC_EMOJIS_ON_START || '')) ||
  /^true$/i.test(String(envArquivo.SYNC_EMOJIS_ON_START || '')) ||
  config.syncEmojisOnStart === true ||
  /^true$/i.test(String(config.SYNC_EMOJIS_ON_START || ''));
export const MANAGE_GUILD_EXPRESSIONS =
  PermissionFlagsBits.ManageGuildExpressions ?? PermissionFlagsBits.ManageEmojisAndStickers;
export const APPROVAL_ROLE_ID = process.env.APPROVAL_ROLE_ID || envArquivo.APPROVAL_ROLE_ID || config.approvalRoleId || '';
export const API_KEY = process.env.BOT_API_KEY || envArquivo.BOT_API_KEY || config.apiKey || '';
export const API_PORT = Number(process.env.PORT || envArquivo.PORT || config.apiPort || 10000);

export function diagnosticarAmbiente() {
  const origemDe = (variaveisEnv, chavesConfig) => {
    for (const k of variaveisEnv) if (process.env[k]) return `env ${k}`;
    for (const k of variaveisEnv) if (envArquivo[k]) return `.env ${k}`;
    for (const k of chavesConfig) if (config[k]) return `config.json ${k}`;
    return 'NÃO DEFINIDO';
  };
  return {
    TOKEN: origemDe(['TOKEN', 'DISCORD_TOKEN'], ['token', 'DISCORD_TOKEN']),
    CLIENT_ID: origemDe(['CLIENT_ID', 'DISCORD_CLIENT_ID'], ['clientId', 'DISCORD_CLIENT_ID']),
    GUILD_ID: origemDe(['GUILD_ID', 'DISCORD_GUILD_ID'], ['guildId', 'DISCORD_GUILD_ID']),
    API_KEY: origemDe(['BOT_API_KEY'], ['apiKey']),
    API_PORT: origemDe(['PORT'], ['apiPort']),
  };
}

export function validarAmbiente() {
  const faltantes = [];
  if (!TOKEN) faltantes.push('TOKEN');
  if (!CLIENT_ID) faltantes.push('CLIENT_ID');
  if (!faltantes.length) return;
  console.error(
    `Configuração incompleta: falta ${faltantes.join(' e ')}. ` +
      'Defina as variáveis no painel do Render (Environment) — o .env local NÃO é enviado para o Render. ' +
      'Ou preencha config.json.',
  );
  process.exit(1);
}
