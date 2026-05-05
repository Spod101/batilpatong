# Vite + Supabase Boilerplate

Opinionated React starter powered by Vite, Tailwind, and a minimal Supabase client setup.

## Quick start

```bash
npm install
```

Copy the env template and add your Supabase keys:

```bash
copy .env.example .env.local
```

```bash
npm run dev
```

## Supabase setup

Create a project in Supabase and set these environment variables in .env.local:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The client is prewired in [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts).

## What's included

- TailwindCSS with custom fonts and layout base styles
- React Router with starter routes
- Supabase client + .env.example

## Scripts

- npm run dev
- npm run build
- npm run preview
- npm run lint
