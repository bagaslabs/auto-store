import { describe, expect, test } from "bun:test";

import type { LiveProduct, StoreSettings } from "../store/model";
import { buildStorePanel } from "./views";

const settings: StoreSettings = {
  qris_rate_idr_per_dl: 5_000,
  dl_rate_idr_per_dl: 5_000,
  deposit_world: {
    world: "OVERSTORE",
    owner: "OWNER",
    bot_name: "BOT",
    note: "Aman",
  },
};

function product(index: number): LiveProduct {
  return {
    id: `${index}`,
    name: `Product ${index}`,
    code: `P${index}`,
    price_locks: 145,
    price_idr: 7_250,
    description: "Produk Growtopia",
    total_sold: 12_345,
    active: true,
    available_stock: index % 2 === 0 ? 100 : 0,
  };
}

describe("buildStorePanel", () => {
  test("renders all products inside one emoji-rich embed", () => {
    const panel = buildStorePanel({
      storeName: "Wilcraft Store",
      products: [product(1), product(2)],
      settings,
    });
    const embed = panel.embeds[0]?.toJSON();
    const buyButton = panel.components[0]?.toJSON().components[0];

    expect(panel.embeds).toHaveLength(1);
    expect(embed?.title).toBe("📣 PRODUCT LIST 📣");
    expect(embed?.description).toContain("🕰️ *Last Update:*");
    expect(embed?.description).toContain("👑 **PRODUCT 1** 👑");
    expect(embed?.description).toContain("📦 Stok: **HABIS** ❌");
    expect(embed?.description).toContain("1 dl 45 wl");
    expect(buyButton && "emoji" in buyButton ? buyButton.emoji?.name : null).toBe(
      "🛒",
    );
  });

  test("stays within Discord's description limit", () => {
    const panel = buildStorePanel({
      storeName: "Wilcraft Store",
      products: Array.from({ length: 100 }, (_, index) => product(index)),
      settings,
    });
    const description = panel.embeds[0]?.toJSON().description ?? "";

    expect(description.length).toBeLessThanOrEqual(4096);
    expect(description).toContain("produk lainnya belum ditampilkan");
  });
});
