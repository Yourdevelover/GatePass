# GatePass - Smart Parking System

Sistem parkir digital terpadu dengan teknologi NFC dan QR Code untuk kemudahan dan kecepatan transaksi.

## Fitur

- **Top Up Saldo** - Isi saldo dengan berbagai metode pembayaran (Bank Transfer, E-Wallet, dll)
- **Bayar Parkir** - Pembayaran parkir menggunakan NFC atau QR Code
- **Kelola Kendaraan** - Daftarkan kendaraan motor, mobil, atau truk
- **Riwayat Transaksi** - Lihat semua transaksi top up dan parkir
- **Admin Panel** - Dashboard admin untuk kelola lokasi, pengguna, dan transaksi
- **Dark Mode** - Tema gelap/terang dengan auto-detection

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React

## Deploy ke Vercel

### 1. Fork atau Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/gatepass.git
cd gatepass
```

### 2. Deploy via Vercel Dashboard

1. Buka [vercel.com](https://vercel.com) dan login
2. Klik "Add New Project"
3. Import repository GitHub Anda
4. Vercel otomatis detect Vite project
5. Klik "Deploy"

### 3. Setup Environment Variables

Di Vercel Dashboard > Settings > Environment Variables, tambahkan:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Redeploy

Setelah menambahkan env vars, trigger redeploy.

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview build locally
npm run preview
```

## Test Users

| Email | Password | Role | Saldo |
|-------|----------|------|-------|
| admin@gmail.com | 112233 | Admin | Rp 0 |
| youraccount@gmail.com | user1234 | User | Rp 100,000 |

## Project Structure

```
├── src/
│   ├── components/     # Reusable components
│   ├── context/        # Auth & Theme context
│   ├── lib/           # Supabase client
│   ├── pages/         # Page components
│   ├── services/      # API services
│   └── types/         # TypeScript types
├── public/            # Static assets
├── vercel.json        # Vercel SPA routing config
└── supabase/
    └── migrations/    # Database migrations
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous key |

## License

MIT
