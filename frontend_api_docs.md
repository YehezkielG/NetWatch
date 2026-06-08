# Backend API Documentation — Network Prediction Dashboard
**For AI Agent: React Frontend Integration**

Backend: FastAPI · Storage: Local JSON · Model: LSTM Attention (Keras)
Server: `http://34.87.39.234:8000`  ·  CORS: `*` (semua origin diizinkan)

---

## 1. Arsitektur Singkat

```
GNS3 Docker Container
  └── dataset_instansi.csv  (READ-ONLY, per-detik)
          │
          ▼
  [Worker: INGEST]          polling setiap 1 detik
  ├── predict.json          → endpoint /predict   (update setiap 1 detik)
  └── history.json          → endpoint /history   (update setiap 1 menit)

  [Worker: FUTURE]          jalan setiap 60 detik
  └── future.json           → endpoint /future    (180 baris per-menit)

  [Worker: FUTURESEC]       jalan setiap 60 detik
  └── futureseconds.json    → endpoint /futureseconds (interpolasi dari future.json)
```

**Konfigurasi model saat ini:**
| Parameter | Nilai |
|---|---|
| `WINDOW_SIZE` | 60 baris |
| `HORIZON` | 5 langkah ke depan |
| Fitur | `traffic_in_bps`, `traffic_out_bps`, `latency_ms` |
| Model | `lstm_att_model` (Keras `.keras`) |

---

## 2. Fitur Data (3 Fitur, Tanpa Loss)

Semua response menggunakan 3 kunci fitur berikut:

| Key | Satuan | Keterangan |
|---|---|---|
| `in` | bps | Bandwidth Inbound (traffic masuk) |
| `out` | bps | Bandwidth Outbound (traffic keluar) |
| `lat` | ms | Latency / Round Trip Time |

> [!NOTE]
> Fitur `loss` (packet loss %) telah **dihapus** dari model dan semua response.
> GNS3 CSV yang baru tidak mengandung kolom loss.

---

## 3. Endpoint API

### `GET /`
Health check.
```json
{ "status": "Backend Active", "storage": "local-json" }
```

---

### `GET /predict`  ← **Data Utama untuk Dashboard Live**

Mengembalikan prediksi instan terbaru. Di-update setiap ~1 detik oleh background worker.

**Response schema:**
```json
{
  "timestamp": "2026-06-07T12:16:59.929471+00:00",
  "actual": {
    "in": 852780.0,
    "out": 693951.0,
    "lat": 143.0
  },
  "pred": {
    "in": 17687952.0,
    "out": 1161817.375,
    "lat": 47.429508
  },
  "pred_steps": [
    {"in": 17687952.0, "out": 1161817.375, "lat": 47.429508},
    {"in": 27403242.0, "out": 1335035.375, "lat": 67.202354},
    {"in": 30424274.0, "out": 1187590.25,  "lat": 75.591766},
    {"in": 25968290.0, "out": 888951.1875, "lat": 71.397423},
    {"in": 18660860.0, "out": 546398.0,    "lat": 59.305241}
  ],
  "features": ["traffic_in_bps", "traffic_out_bps", "latency_ms"],
  "model": "lstm_att_model"
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `timestamp` | ISO 8601 string | Waktu pengambilan data (UTC) |
| `actual` | `{in, out, lat}` | Nilai terukur dari GNS3 saat ini |
| `pred` | `{in, out, lat}` | Prediksi untuk **t+1** (1 detik ke depan) |
| `pred_steps` | array of `{in, out, lat}` | Prediksi **5 langkah** ke depan: [t+1, t+2, t+3, t+4, t+5] |
| `features` | string[] | Nama kolom asli dari CSV/scaler |
| `model` | string | Nama model yang digunakan |

> [!WARNING]
> Endpoint ini mengembalikan **503 Service Unavailable** jika worker belum selesai inisialisasi atau GNS3 belum menghasilkan data. Frontend harus menangani ini dengan graceful fallback (tampilkan "Memuat..." atau skeleton loader).

**Polling yang disarankan:** setiap `1000ms – 2000ms`

---

### `GET /history`  ← **Grafik Historis**

Riwayat actual vs predicted, di-aggregate per menit. Maksimal **180 baris** (3 jam terakhir).

**Response schema:**
```json
{
  "data": [
    {
      "timestamp": "2026-06-07T12:12:00",
      "actual": {"in": 1099335.0, "out": 917780.0, "lat": 143.333333},
      "pred":   {"in": 18272747.333333, "out": 928171.5, "lat": 97.301148}
    },
    ...
  ]
}
```

**Polling yang disarankan:** setiap `60000ms` (1 menit)

---

### `GET /future`  ← **Grafik Prediksi 3 Jam ke Depan**

Prediksi masa depan autoregresif per menit, maksimal **180 baris** (3 jam).

**Response schema:**
```json
{
  "data": [
    {"in": 15000000.0, "out": 800000.0, "lat": 55.0},
    {"in": 14500000.0, "out": 790000.0, "lat": 58.0},
    ...
  ]
}
```

> [!NOTE]
> Tidak ada `timestamp` pada tiap row. Frontend harus meng-generate timestamp masa depan secara client-side, mulai dari waktu request + (index × 60 detik).

**Polling yang disarankan:** setiap `60000ms` (1 menit)

---

### `GET /futureseconds?minutes={n}`  ← **Grafik Prediksi Granular Per Detik**

Prediksi per-detik, hasil interpolasi linear dari `future.json`. Maksimal **10800 baris** (3 jam × 3600 detik).

**Query Parameter:**
| Parameter | Tipe | Default | Min | Max | Keterangan |
|---|---|---|---|---|---|
| `minutes` | integer | 5 | 1 | 60 | Berapa menit ke depan yang dikembalikan |

**Contoh request:** `GET /futureseconds?minutes=10`

**Response schema:**
```json
{
  "minutes": 10,
  "seconds": 600,
  "data": [
    {"in": 15000000.0, "out": 800000.0, "lat": 55.0},
    {"in": 14992000.0, "out": 799000.0, "lat": 55.05},
    ...
  ]
}
```

> [!NOTE]
> `data` berisi tepat `minutes × 60` item (contoh: `minutes=10` → 600 item).
> Data diinterpolasi secara linear dari per-menit ke per-detik; bukan hasil model langsung.

**Polling yang disarankan:** setiap `60000ms` (1 menit)

---

## 4. Saran Implementasi Frontend

### Komponen yang Disarankan

| Komponen | Endpoint | Polling |
|---|---|---|
| Live Gauge / Speedometer (In, Out, Lat) | `/predict` → `actual` | 1–2 detik |
| Next-Step Prediction Badge | `/predict` → `pred` | 1–2 detik |
| Short-Term Forecast Bar (5 steps) | `/predict` → `pred_steps` | 1–2 detik |
| Historical Line Chart (3 jam) | `/history` | 60 detik |
| Future Forecast Chart (3 jam) | `/future` | 60 detik |
| Granular Forecast (detik) | `/futureseconds?minutes=5` | 60 detik |

### Penanganan Error

```javascript
// Contoh pattern polling yang aman
const fetchPredict = async () => {
  try {
    const res = await fetch('http://34.87.39.234:8000/predict');
    if (res.status === 503) {
      setStatus('Menunggu data GNS3...');
      return;
    }
    const data = await res.json();
    // data.actual, data.pred, data.pred_steps tersedia
  } catch (e) {
    setStatus('Backend tidak terjangkau');
  }
};
```

### Format Nilai

Nilai bandwidth (`in`, `out`) dalam **bps** (bits per second). Untuk tampilan:
- `>= 1_000_000` → tampilkan sebagai `{value/1_000_000:.2f} Mbps`
- `>= 1_000` → tampilkan sebagai `{value/1_000:.2f} Kbps`
- `< 1_000` → tampilkan sebagai `{value:.0f} bps`

Nilai latency (`lat`) dalam **ms** (milliseconds).

---

## 5. Hal Penting untuk AI Agent

> [!IMPORTANT]
> **Nilai prediksi bisa besar/tidak akurat.** Model LSTM yang digunakan dilatih dengan data lama dan kadang menghasilkan nilai `in` yang jauh lebih besar dari aktual (misalnya: actual 1.3 Mbps, pred 17 Mbps). Ini adalah **keterbatasan model**, bukan bug kode. Frontend harus:
> - Menggunakan **sumbu Y dinamis** (auto-scale) pada grafik, bukan fixed scale
> - Mempertimbangkan **color-coding**: jika pred > 2× actual, tampilkan peringatan

> [!IMPORTANT]
> **`futureseconds.json` bergantung pada `future.json`.** Worker futuresec baru bisa jalan setelah `future.json` terisi (60 detik setelah server start). Jika `/futureseconds` mengembalikan `data: []`, tunggu 1–2 menit dan coba lagi.

> [!NOTE]
> **Server restart.** Jika server perlu di-restart, jalankan:
> ```bash
> pkill -f "uvicorn app:app"
> cd /home/yehezkielhaganta/internet-prediction-backend
> nohup venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
> ```
> Atau jika server lama berjalan sebagai root: `sudo pkill -f "uvicorn app:app"`

---

## 6. File Struktur Backend

```
internet-prediction-backend/
├── app.py              # FastAPI app + endpoints
├── services.py         # Background workers (INGEST, FUTURE, FUTURESEC)
├── predictor.py        # Model inference (predict_from_file, predict_iterative_from_file)
├── model.keras         # LSTM Attention model (Keras format)
├── minmax_scaler.pkl   # MinMaxScaler (sklearn) untuk 3 fitur
├── data/
│   ├── predict.json    # ← /predict endpoint (update ~1 detik)
│   ├── history.json    # ← /history endpoint (update ~1 menit)
│   ├── future.json     # ← /future endpoint (update ~60 detik)
│   └── futureseconds.json # ← /futureseconds endpoint (update ~60 detik)
└── server.log          # Log server (tail -f untuk monitoring)
```
