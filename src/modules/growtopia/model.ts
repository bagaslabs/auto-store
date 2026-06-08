export interface DepositNotification {
  grow_id: string;
  amount_locks: number;
}

export interface DepositResult {
  ok: boolean;
  discord_id: string;
  grow_id: string;
  balance_locks: number;
  credited_locks: number;
}

export interface BotStatusNotification {
  online: boolean;
  world: string;
  ping: number;
}

export interface BotStatus {
  online: boolean;
  world: string;
  ping: number;
  updated_at: string;
}
