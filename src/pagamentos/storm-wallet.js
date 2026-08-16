const STORM_BASE = 'https://wallet.stormapplications.com';

async function stormRequest(path, { method = 'GET', apiKey, body } = {}) {
  const res = await fetch(`${STORM_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const detail = Array.isArray(json.details) ? ` — ${json.details.map((d) => `${d.field}: ${d.message}`).join('; ')}` : '';
    throw new Error(json.error || `StorM Wallet: HTTP ${res.status}${detail}`);
  }
  return json.data || json;
}

/** API key da StorM Wallet: prioriza variável de ambiente, depois a config salva. */
export function stormApiKey(gs) {
  return process.env.STORM_WALLET_API_KEY || gs?.payments?.storm?.apiKey || '';
}

export function stormConfigurado(gs) {
  const storm = gs?.payments?.storm;
  return Boolean(storm?.enabled && storm?.configured && stormApiKey(gs));
}

export async function criarCobrancaStorm({ gs, amount, payerName, payerDocument, description, externalId, metadata }) {
  return stormRequest('/api/v1/payments/create', {
    method: 'POST',
    apiKey: stormApiKey(gs),
    body: {
      amount,
      payerName,
      payerDocument,
      description,
      externalId,
      metadata,
    },
  });
}

export async function statusCobrancaStorm({ gs, paymentId }) {
  return stormRequest(`/api/v1/payments/${encodeURIComponent(paymentId)}`, {
    apiKey: stormApiKey(gs),
  });
}

/** Converte o data URL do QR (data:image/png;base64,...) em Buffer. */
export function stormQrBuffer(qrCode) {
  if (!qrCode) return null;
  const base64 = String(qrCode).split(',')[1] || String(qrCode);
  return Buffer.from(base64, 'base64');
}
