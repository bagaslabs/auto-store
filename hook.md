# Webhook API — Growtopia Bot

## Konfigurasi

Set `GROWTOPIA_DEPOSIT_TOKEN` di `.env`. Endpoint hanya aktif jika token diisi.

Semua request wajib menyertakan header:

```
Authorization: Bearer <GROWTOPIA_DEPOSIT_TOKEN>
Content-Type: application/json
```

---

## POST /webhooks/growtopia/deposit

Menambahkan saldo (balance) user berdasarkan GrowID.

### Body — Format BGL/DL/WL

```json
{
  "grow_id": "R29VTs",
  "bgl": 1,
  "dl": 2,
  "wl": 50
}
```

1 BGL = 10.000 locks, 1 DL = 100 locks, 1 WL = 1 lock

### Body — Format langsung locks

```json
{
  "grow_id": "R29VTs",
  "amount_locks": 10250
}
```

### Response sukses

```json
{
  "ok": true,
  "discord_id": "123456789",
  "grow_id": "R29VTs",
  "balance_locks": 50000,
  "credited_locks": 10250
}
```

### Response error

```json
{ "ok": false, "error": "User dengan GrowID R29VTs tidak ditemukan" }
```

---

## POST /webhooks/growtopia/status

Mengirim status terkini bot Growtopia (online/offline, world, ping).

### Body

```json
{
  "online": true,
  "world": "OVERSTORE",
  "ping": 45
}
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `online` | boolean | `true` = online, `false` = offline |
| `world` | string | Nama world tempat bot berada |
| `ping` | integer | Ping / latency dalam ms (>= 0) |

### Response sukses

```json
{
  "ok": true,
  "status": {
    "online": true,
    "world": "OVERSTORE",
    "ping": 45,
    "updated_at": "2026-06-08T09:30:00.000Z"
  }
}
```

### Response error

```json
{ "ok": false, "error": "online wajib diisi (boolean)" }
```

---

## Tampilan di Discord

Saat user klik tombol **Deposit World** di panel, embed akan menampilkan:

- World, Owner, Bot in-game
- Status bot (🟢 Online / 🔴 Offline) + world tujuan + ping
- Waktu terakhir update (relative)
- Peringatan keamanan

Bagian status bot hanya muncul jika sudah pernah ada data dari endpoint `/status`.
