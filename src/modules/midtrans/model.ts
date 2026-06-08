import type { SettlementResult } from "../store/model";

export interface PaymentNotifier {
  (result: SettlementResult): Promise<void>;
}
