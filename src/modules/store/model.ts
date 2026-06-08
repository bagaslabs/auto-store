export interface UserAccount {
  discord_id: string;
  grow_id: string | null;
  balance_locks: number;
  total_deposit_idr: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price_locks: number;
  price_idr: number | null;
  description: string;
  total_sold: number;
  active: boolean;
}

export interface LiveProduct extends Product {
  available_stock: number;
}

export interface PurchaseResult {
  order_id: string;
  product_name: string;
  product_code: string;
  unit_price_locks?: number;
  quantity: number;
  total_price_locks: number;
  balance_locks: number;
  created_at?: string;
  delivered_items: string[];
}

export interface Transaction {
  id: string;
  user_id: string;
  type: "topup" | "purchase";
  amount_idr: number;
  fee_idr: number;
  gross_amount_idr: number;
  amount_locks: number;
  status: "pending" | "settlement" | "failed" | "expired" | "cancelled";
  midtrans_order_id: string | null;
  midtrans_transaction_id: string | null;
  qr_url: string | null;
  expires_at: string | null;
}

export interface SettlementResult {
  transaction_id: string;
  discord_id: string;
  amount_idr: number;
  credited_locks: number;
  balance_locks: number;
  already_credited: boolean;
}

export interface StoreSettings {
  qris_rate_idr_per_dl: number;
  dl_rate_idr_per_dl: number;
  deposit_world: {
    world: string;
    owner: string;
    bot_name: string;
    note: string;
  };
}

export interface ProductInput {
  name: string;
  code: string;
  priceLocks: number;
  priceIdr?: number | null;
  description?: string;
}

export interface ProductUpdate {
  name?: string;
  code?: string;
  priceLocks?: number;
  priceIdr?: number | null;
  description?: string;
  active?: boolean;
}

export interface TopupInput {
  discordId: string;
  orderId: string;
  amountIdr: number;
  feeIdr: number;
  grossAmountIdr: number;
  amountLocks: number;
  expiresAt: Date;
}
