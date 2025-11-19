# CalmTinnitus – Persistent Dual-Therapy Prototype (Notch + CR)

This build combines:

- **Gemini v2 logic**
  - Persistent tinnitus pitch and session length via `localStorage`
  - Dual therapies: Notch Therapy (pink noise with notch) & Coordinated Reset (CR) tone engine
  - Session History tab – logs completed sessions (duration, pitch, mode, therapyType)

- **Previous PWA structure**
  - App Router layout with `<link rel="manifest">` and `theme-color`
  - Simple service worker registration in `/app/page.tsx`
  - `manifest.json` + app icons

## Files

- `/app/layout.tsx` – Root layout + PWA meta
- `/app/page.tsx` – Main CalmTinnitus UI and Web Audio engine
- `/app/globals.css` – UI styling
- `/public/manifest.json` – PWA manifest
- `/public/sw.js` – Service worker
- `/public/icons/icon-192x192.png`
- `/public/icons/icon-512x512.png`

## Important Disclaimer

CalmTinnitus is **experimental** and is **not** a medical device.  
It does not diagnose, treat, cure, or prevent any disease.  
Use only at low volume and alongside professional care (ENT / audiologist).
