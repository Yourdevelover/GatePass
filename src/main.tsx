import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabaseMisconfigured } from './lib/supabase.ts';

if (supabaseMisconfigured) {
  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:sans-serif;">
      <div style="background:#1e293b;border:1px solid #ef4444;border-radius:12px;padding:32px;max-width:480px;width:90%;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">⚙️</div>
        <h2 style="color:#ef4444;margin:0 0 12px;font-size:20px;">Environment Variables Belum Di-set</h2>
        <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;line-height:1.6;">
          Tambahkan environment variables berikut di <strong style="color:#fff;">Vercel Dashboard → Settings → Environment Variables</strong>:
        </p>
        <div style="background:#0f172a;border-radius:8px;padding:16px;text-align:left;margin-bottom:24px;">
          <code style="color:#34d399;font-size:13px;display:block;margin-bottom:8px;">VITE_SUPABASE_URL</code>
          <code style="color:#34d399;font-size:13px;display:block;">VITE_SUPABASE_ANON_KEY</code>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0;">Setelah menambahkan, klik <strong style="color:#fff;">Redeploy</strong> di Vercel.</p>
      </div>
    </div>
  `;
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
