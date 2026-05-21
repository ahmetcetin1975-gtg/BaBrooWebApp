# BabrooWebApp

Next.js 16 (App Router) + Tailwind 4 + Cookie Auth + Email/Phone/Google Login (GIS)

Backend: API proxy handlers (varsayılan root: http://localhost:8081)

## Kurulum
```bash
npm install
cp .env.example .env.local
# .env.local içine NEXT_PUBLIC_GOOGLE_CLIENT_ID ekle
npm run dev
```

Local gelistirme adresi: `http://localhost:3001`

## URL'ler
- /tr/login
- /tr/register (Phone OTP Send/Verify)
- /tr/home/products
- /tr/home/services

## IIS Release
```bash
npm run build:iis
```

This creates `iis-release/` with:
- standalone Next.js server
- static assets
- `web.config`
- `.env.production` from `.env.local`

Configure IIS (run terminal as Administrator):
```bash
npm run iis:configure
```

Create a deployable zip (contents are at site root, not nested in `iis-release/`):
```bash
npm run build:iis:zip
```

If you deploy the zip to another server and see iisnode `HRESULT: 0x2`:
- Make sure extracted site root contains `web.config` and `server.js` directly.
- Ensure Node.js is installed on that server.
- Keep IIS app pool mapped to the extracted folder root (not parent folder).
- Use the generated `web.config` with `nodeProcessCommandLine="%programfiles%\\nodejs\\node.exe"` (or set `IIS_NODE_PROCESS_CMD` in `.env.local` before `npm run build:iis` if your host requires a different full path).
- By default, IIS logging/dev errors are disabled in release to avoid permission failures on `iisnode` log folder. For temporary diagnostics, set:
  - `IISNODE_LOGGING_ENABLED=true`
  - `IISNODE_DEV_ERRORS_ENABLED=true`
