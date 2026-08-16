import { createServer } from 'node:http';

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = '';
    let tamanho = 0;
    req.on('data', (chunk) => {
      tamanho += chunk.length;
      if (tamanho > 1_000_000) {
        reject(new Error('Corpo da requisição muito grande.'));
        req.destroy();
        return;
      }
      dados += chunk;
    });
    req.on('end', () => {
      if (!dados.trim()) return resolve({});
      try {
        resolve(JSON.parse(dados));
      } catch {
        reject(new Error('JSON inválido no corpo da requisição.'));
      }
    });
    req.on('error', reject);
  });
}

function ehLoopback(ip) {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

export function iniciarServidorApi(client, opts) {
  const {
    guildState,
    getCart,
    deliverCart,
    saveState,
    apiKey,
    port,
    state,
  } = opts;

  if (!apiKey) {
    console.warn('[API] Nenhuma API key configurada. Somente requisições locais serão aceitas.');
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname;
    const ip = req.socket.remoteAddress || '';
    const isLocal = ehLoopback(ip);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const send = (code, data) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    const auth = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim()
      || (req.headers['x-api-key'] || '').trim();
    const autorizado = apiKey ? auth === apiKey : isLocal;

    if (route === '/health' || route === '/') {
      return send(200, { ok: true, bot: client.user?.username || 'discord-bot' });
    }

    if (!route.startsWith('/api/')) {
      return send(404, { error: 'Rota não encontrada.' });
    }

    if (!autorizado) {
      return send(401, { error: 'Não autorizado. Envie a API key em Authorization: Bearer <key>.' });
    }

    try {
      if (route === '/api/carts/pending' && req.method === 'GET') {
        const resultado = {};
        for (const [gid, gs] of Object.entries(client.guilds.cache)) {
          const pendentes = (gs?.carts || []).filter((item) =>
            ['AWAITING_APPROVAL', 'AWAITING_MANUAL_PAYMENT', 'AWAITING_STORM_PAYMENT'].includes(item.status),
          );
          if (pendentes.length === 0) continue;
          resultado[gid] = pendentes.map((item) => {
            const product = gs.products.find((p) => p.id === item.productId);
            return {
              publicId: item.publicId,
              cartId: item.id,
              status: item.status,
              userId: item.userId,
              product: product?.name || 'Desconhecido',
              total: item.total,
              paymentMethod: item.paymentMethod || null,
            };
          });
        }
        return send(200, { ok: true, pending: resultado });
      }

      if (route === '/api/payments/confirm' && req.method === 'POST') {
        const body = await lerCorpo(req);
        const { guildId, cartId, amount, paymentId } = body;
        if (!guildId || !cartId) {
          return send(400, { ok: false, error: 'Campos obrigatórios: guildId e cartId.' });
        }
        const gs = guildState(guildId);
        if (!gs) return send(404, { ok: false, error: 'Servidor não configurado no bot.' });

        const cart = getCart(gs, cartId);
        if (!cart) return send(404, { ok: false, error: `Carrinho ${cartId} não encontrado.` });
        if (cart.status === 'DELIVERED') {
          return send(200, { ok: true, already: true, cart: cart.publicId, message: 'Carrinho já entregue.' });
        }
        if (['CANCELLED', 'DECLINED', 'EXPIRED'].includes(cart.status)) {
          return send(409, { ok: false, cart: cart.publicId, error: `Carrinho está ${cart.status.toLowerCase()}.` });
        }
        if (amount != null && Number(amount).toFixed(2) !== Number(cart.total).toFixed(2)) {
          return send(400, {
            ok: false,
            cart: cart.publicId,
            error: `Valor informado (${amount}) não confere com o carrinho (${cart.total}).`,
          });
        }

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return send(404, { ok: false, error: 'Bot não está neste servidor.' });

        const fakeInteraction = { guild };
        const result = await deliverCart(fakeInteraction, gs, cart, guild.ownerId, true);
        if (result.ok) await saveState();
        return send(result.ok ? 200 : 400, {
          ok: result.ok,
          cart: cart.publicId,
          paymentId: paymentId || null,
          message: result.message,
        });
      }

      if (route === '/api/config/restore' && req.method === 'POST') {
        const body = await lerCorpo(req);
        if (!body || typeof body.guilds !== 'object' || typeof body.drafts !== 'object') {
          return send(400, { ok: false, error: 'Envie o estado completo com os campos guilds e drafts.' });
        }
        state.guilds = body.guilds;
        state.drafts = body.drafts;
        await saveState();
        const totalGuilds = Object.keys(state.guilds).length;
        return send(200, {
          ok: true,
          guilds: totalGuilds,
          message: `Configuração restaurada (${totalGuilds} servidor(es)).`,
        });
      }

      return send(404, { error: 'Rota não encontrada.' });
    } catch (err) {
      console.error('[API] Erro ao processar:', err.message);
      return send(500, { ok: false, error: err.message });
    }
  });

  server.listen(port, () => {
    console.log(`[API] Servidor de pagamentos ouvindo na porta ${port}`);
  });
  server.on('error', (err) => {
    console.error('[API] Falha ao abrir porta:', err.message);
  });
  return server;
}
