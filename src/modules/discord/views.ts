import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

import { formatIdr, formatLockUnits } from "../../shared/lib/money";
import type { LiveProduct, StoreSettings } from "../store/model";

const EMBED_DESCRIPTION_LIMIT = 4096;
const PRODUCT_SEPARATOR = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

export const BUTTON_IDS = {
  buy: "buyer:buy",
  growId: "buyer:grow-id",
  balance: "buyer:balance",
  depositWorld: "buyer:deposit-world",
  qris: "buyer:qris",
} as const;

export const MODAL_IDS = {
  buy: "modal:buy",
  growId: "modal:grow-id",
  qris: "modal:qris",
} as const;

function buildProductBlock(product: LiveProduct): string {
  const stock =
    product.available_stock > 0
      ? `**${product.available_stock.toLocaleString("id-ID")}** ✅`
      : "**HABIS** ❌";

  return [
    `👑 **${product.name.toUpperCase()}** 👑`,
    product.description ? `❓ Deskripsi: **${product.description}** ⭐` : null,
    `🏷️ Kode: **${product.code}**`,
    `📦 Stok: ${stock}`,
    `💰 Harga: **${formatLockUnits(product.price_locks)}**${product.price_idr !== null ? ` | ${formatIdr(product.price_idr)}` : ""}`,
    `🎁 Produk Terjual: **${product.total_sold.toLocaleString("id-ID")}**`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPanelDescription(
  products: LiveProduct[],
  settings: StoreSettings,
  updatedAt: number,
): string {
  const header = [
    `🕰️ *Last Update:* <t:${updatedAt}:R>`,
    `📈 Rate DL: **${formatIdr(settings.dl_rate_idr_per_dl)}/DL**`,
    PRODUCT_SEPARATOR,
  ].join("\n");
  const footer = [
    PRODUCT_SEPARATOR,
    "🛒 Gunakan tombol di bawah untuk bertransaksi.",
    "🔒 Detail akun, saldo, dan pembelian hanya terlihat oleh Anda.",
  ].join("\n");

  if (products.length === 0) {
    return [header, "📭 **Belum ada produk aktif.**", footer].join("\n");
  }

  const visibleBlocks: string[] = [];
  for (const product of products) {
    const candidate = [...visibleBlocks, buildProductBlock(product)].join(
      `\n${PRODUCT_SEPARATOR}\n`,
    );
    const hiddenCount = products.length - visibleBlocks.length - 1;
    const hiddenNotice =
      hiddenCount > 0
        ? `\n\n⚠️ **${hiddenCount} produk lainnya belum ditampilkan karena batas Discord.**`
        : "";
    const description = `${header}\n${candidate}${hiddenNotice}\n${footer}`;

    if (description.length > EMBED_DESCRIPTION_LIMIT) break;
    visibleBlocks.push(buildProductBlock(product));
  }

  const hiddenCount = products.length - visibleBlocks.length;
  const hiddenNotice =
    hiddenCount > 0
      ? `\n\n⚠️ **${hiddenCount} produk lainnya belum ditampilkan karena batas Discord.**`
      : "";

  return [
    header,
    visibleBlocks.join(`\n${PRODUCT_SEPARATOR}\n`),
    hiddenNotice,
    footer,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, EMBED_DESCRIPTION_LIMIT);
}

export function buildStorePanel(input: {
  storeName: string;
  products: LiveProduct[];
  settings: StoreSettings;
}): {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const updatedAt = Math.floor(Date.now() / 1000);
  const embed = new EmbedBuilder()
    .setColor(0xf58220)
    .setTitle("📣 PRODUCT LIST 📣")
    .setDescription(
      buildPanelDescription(input.products, input.settings, updatedAt),
    )
    .setFooter({ text: `🛍️ ${input.storeName} • Auto Store` })
    .setTimestamp();

  const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.buy)
      .setLabel("Beli")
      .setEmoji("🛒")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.growId)
      .setLabel("Set GrowID")
      .setEmoji("👤")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.balance)
      .setLabel("Saldo")
      .setEmoji("💰")
      .setStyle(ButtonStyle.Secondary),
  );
  const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.depositWorld)
      .setLabel("Deposit World")
      .setEmoji("🌍")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.qris)
      .setLabel("QRIS TopUp")
      .setEmoji("📱")
      .setStyle(ButtonStyle.Success),
  );

  return {
    embeds: [embed],
    components: [firstRow, secondRow],
  };
}
