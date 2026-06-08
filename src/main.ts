import { createApp } from "./app";
import { StoreBot } from "./modules/discord/bot";
import { MidtransService } from "./modules/payments/midtrans";
import { StoreRepository } from "./modules/store/repository";
import { loadConfig } from "./shared/config";
import { createDatabaseClient } from "./shared/database";

const config = loadConfig();
const database = createDatabaseClient(config);
const store = new StoreRepository(database);
const midtrans = new MidtransService(config.midtrans);
const bot = new StoreBot(config, store, midtrans);
const app = createApp({
  config,
  store,
  midtrans,
  notifyPayment: (result) => bot.notifyPayment(result),
}).listen({
  hostname: config.host,
  port: config.port,
});

await bot.start();

console.log(
  `${config.storeName} API aktif di http://${config.host}:${app.server?.port}`,
);

async function shutdown(signal: string): Promise<void> {
  console.log(`Menerima ${signal}, menghentikan aplikasi...`);
  await bot.stop();
  await app.stop();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
