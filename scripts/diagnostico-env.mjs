import {
  TOKEN,
  CLIENT_ID,
  GUILD_ID,
  API_KEY,
  API_PORT,
  diagnosticarAmbiente,
} from '../src/configuracoes/ambiente.js';

const mascara = (v) => {
  if (!v) return '(VAZIO)';
  if (v.length <= 8) return '***';
  return `${v.slice(0, 5)}...${v.slice(-4)}`;
};

const origem = diagnosticarAmbiente();

console.log('--- DIAGNÓSTICO DE AMBIENTE ---');
console.log('Diretório atual :', process.cwd());
console.log('TOKEN           :', mascara(TOKEN), `(origem: ${origem.TOKEN})`);
console.log('CLIENT_ID       :', CLIENT_ID || '(VAZIO)', `(origem: ${origem.CLIENT_ID})`);
console.log('GUILD_ID        :', GUILD_ID || '(VAZIO)', `(origem: ${origem.GUILD_ID})`);
console.log('API_KEY         :', mascara(API_KEY), `(origem: ${origem.API_KEY})`);
console.log('API_PORT        :', API_PORT, `(origem: ${origem.API_PORT})`);
console.log('TOKEN no process.env?', Boolean(process.env.TOKEN));
