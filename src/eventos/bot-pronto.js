import { ActivityType } from 'discord.js';
// Branding Nitrei #Forn! (ver infraestrutura/creditos.js)
import { CREDIT_INVITE, CREDIT_NAME, garantirCreditos } from '../infraestrutura/creditos.js';
import { APPROVAL_ROLE_ID } from '../configuracoes/ambiente.js';

async function repararAcessoCarrinhos(client, guilds) {
  for (const [gid, gs] of Object.entries(guilds || {})) {
    const guild = await client.guilds.fetch(gid).catch(() => null);
    if (!guild) continue;
    const members = APPROVAL_ROLE_ID ? await guild.members.fetch().catch(() => null) : null;
    const approvers = members ? [...members.filter((m) => m.roles.cache.has(APPROVAL_ROLE_ID)).values()] : [];
    if (approvers.length === 0) continue;
    for (const cart of gs.carts || []) {
      if (!['AWAITING_APPROVAL', 'AWAITING_MANUAL_PAYMENT', 'AWAITING_STORM_PAYMENT'].includes(cart.status) || !cart.channelId) continue;
      const channel = await guild.channels.fetch(cart.channelId).catch(() => null);
      if (!channel) continue;
      if (channel.isThread()) {
        await channel.members.add(cart.userId).catch(() => null);
        for (const a of approvers) await channel.members.add(a.id).catch(() => null);
      } else if (channel.isTextBased()) {
        await channel.permissionOverwrites.edit(APPROVAL_ROLE_ID, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          ManageChannels: true,
        }).catch(() => null);
      }
      console.log(`   carrinho ${cart.publicId}: acesso liberado para ${approvers.length} aprovador(es)`);
    }
  }
}

export function registrarEventoBotPronto(
  client,
  {
    state,
    applySyncedEmojiOverrides,
    iniciarAgendadorAutomacoes,
    iniciarMonitorStormWallet,
    repostarProdutos,
    deliverCart,
    cancelCart,
    statusCobrancaStorm,
    saveState,
    scheduleGiveaway,
    syncEmojisOnStart,
    guildId,
    guildState,
    syncLocalEmojis,
    syncEmojisOnly,
  },
) {
  client.once('clientReady', async () => {
    garantirCreditos();
    const tag = client.user.tag;
    const guilds = client.guilds.cache.size;

    console.clear();
    console.log('');
    console.log('  ─────────────────────────────');
    console.log(`   ${CREDIT_NAME} · online`);
    console.log(`   ${tag}`);
    console.log(`   ${guilds} servidor(es)`);
    console.log(`   ${CREDIT_INVITE}`);
    console.log('  ─────────────────────────────');
    console.log('');

    try {
      await client.user.setPresence({
        status: 'online',
        // Presence discreta: quem olhar o bot vê o invite
        activities: [{ name: CREDIT_INVITE, type: ActivityType.Watching }],
      });
    } catch {
      /* ignore */
    }

    for (const gs of Object.values(state.guilds || {})) {
      applySyncedEmojiOverrides(gs);
    }

    for (const [gid, gs] of Object.entries(state.guilds || {})) {
      const guild = await client.guilds.fetch(gid).catch(() => null);
      if (!guild) continue;
      for (const giveaway of gs.giveaways || []) {
        if (giveaway.status !== 'active') continue;
        scheduleGiveaway(guild, giveaway);
      }
    }

    await repararAcessoCarrinhos(client, state.guilds);

    iniciarAgendadorAutomacoes(client, { state, saveState, repostarProdutos });
    iniciarMonitorStormWallet(client, { state, saveState, deliverCart, cancelCart, statusCobrancaStorm });

    if (!syncEmojisOnStart) return;

    try {
      const lista = guildId
        ? [await client.guilds.fetch(guildId)]
        : [...client.guilds.cache.values()];

      for (const guild of lista) {
        const gs = guildState(guild.id);
        const result = await syncLocalEmojis(guild, gs, (event) => {
          if (event.status === 'created' || event.status === 'failed') {
            console.log(
              `   emoji ${event.status}: ${event.name}${event.error ? ` (${event.error})` : ''}`,
            );
          }
        });
        console.log(
          `   sync ${guild.name}: +${result.created.length} · =${result.reused.length} · !${result.failed.length}`,
        );
      }
    } catch (error) {
      console.error('   sync emojis falhou:', error.message);
      if (syncEmojisOnly) process.exitCode = 1;
    } finally {
      if (syncEmojisOnly) {
        client.destroy();
        setTimeout(() => process.exit(process.exitCode || 0), 250);
      }
    }
  });
}
