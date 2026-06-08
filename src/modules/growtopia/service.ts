import type { StoreRepository } from "../store/repository";
import type {
  BotStatus,
  BotStatusNotification,
  DepositNotification,
  DepositResult,
} from "./model";

export class GrowtopiaService {
  constructor(private readonly store: StoreRepository) {}

  async updateBotStatus(status: BotStatusNotification): Promise<BotStatus> {
    const data: BotStatus = {
      ...status,
      updated_at: new Date().toISOString(),
    };
    await this.store.setSetting("growtopia_bot_status", data);
    return data;
  }

  async processDeposit(
    notification: DepositNotification,
  ): Promise<DepositResult> {
    const { grow_id, amount_locks } = notification;

    if (amount_locks <= 0) {
      throw new Error("amount_locks harus lebih dari 0");
    }

    const user = await this.store.getUserByGrowId(grow_id);
    if (!user) {
      throw new Error(`User dengan GrowID ${grow_id} tidak ditemukan`);
    }

    const rate = await this.store.getSetting<number>("dl_rate_idr_per_dl");
    const deltaIdr = Math.round((amount_locks / 100) * rate);

    const updated = await this.store.addBalance({
      discordId: user.discord_id,
      deltaLocks: amount_locks,
      deltaIdr,
      note: "Deposit dari Growtopia",
      actorDiscordId: "GROWTOPIA_BOT",
    });

    return {
      ok: true,
      discord_id: updated.discord_id,
      grow_id: updated.grow_id ?? grow_id,
      balance_locks: updated.balance_locks,
      credited_locks: amount_locks,
    };
  }
}
