import { Elysia } from "elysia";

import type { AppConfig } from "../../shared/config";
import type { StoreRepository } from "../store/repository";
import { GrowtopiaService } from "./service";

export function createGrowtopiaModule(input: {
  config: AppConfig;
  store: StoreRepository;
}) {
  const service = new GrowtopiaService(input.store);

  function checkAuth(request: Request): {
    ok: true;
  } | { ok: false; status: number; body: { ok: false; error: string } } {
    if (!input.config.growtopia.enabled) {
      return {
        ok: false,
        status: 503,
        body: { ok: false, error: "Growtopia belum diaktifkan" },
      };
    }
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${input.config.growtopia.depositToken}`) {
      return {
        ok: false,
        status: 401,
        body: { ok: false, error: "Unauthorized" },
      };
    }
    return { ok: true };
  }

  return new Elysia({ name: "Growtopia.Module" })
    .post("/webhooks/growtopia/deposit", async ({ body, set, request }) => {
      const authResult = checkAuth(request);
      if (!authResult.ok) {
        set.status = authResult.status;
        return authResult.body;
      }

      const { grow_id, amount_locks, bgl, dl, wl } = body as Record<
        string,
        unknown
      >;

      const totalLocks =
        typeof amount_locks === "number"
          ? amount_locks
          : Number(bgl ?? 0) * 10_000 +
              Number(dl ?? 0) * 100 +
              Number(wl ?? 0);

      if (
        !grow_id ||
        typeof grow_id !== "string" ||
        grow_id.trim().length === 0
      ) {
        set.status = 400;
        return { ok: false, error: "grow_id wajib diisi" };
      }

      if (!Number.isSafeInteger(totalLocks) || totalLocks <= 0) {
        set.status = 400;
        return { ok: false, error: "Jumlah deposit harus lebih dari 0" };
      }

      try {
        const result = await service.processDeposit({
          grow_id: grow_id.trim(),
          amount_locks: totalLocks,
        });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Gagal memproses deposit";
        set.status = 400;
        return { ok: false, error: message };
      }
    })
    .post("/webhooks/growtopia/status", async ({ body, set, request }) => {
      const authResult = checkAuth(request);
      if (!authResult.ok) {
        set.status = authResult.status;
        return authResult.body;
      }

      const { online, world, ping } = body as Record<string, unknown>;

      if (typeof online !== "boolean") {
        set.status = 400;
        return { ok: false, error: "online wajib diisi (boolean)" };
      }

      if (!world || typeof world !== "string") {
        set.status = 400;
        return { ok: false, error: "world wajib diisi" };
      }

      if (typeof ping !== "number" || !Number.isInteger(ping) || ping < 0) {
        set.status = 400;
        return { ok: false, error: "ping wajib diisi (integer >= 0)" };
      }

      try {
        const result = await service.updateBotStatus({ online, world, ping });
        return { ok: true, status: result };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Gagal memperbarui status";
        set.status = 500;
        return { ok: false, error: message };
      }
    });
}
