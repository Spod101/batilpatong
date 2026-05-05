import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.15),_transparent_55%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_55%,_#ecfeff_100%)] text-ink-950">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/"
              className="font-display text-xl font-semibold tracking-tight"
            >
              Vite + Supabase Kit
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
              <Link
                to="/dashboard"
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm transition hover:border-slate-300"
              >
                Dashboard
              </Link>
              <Link
                to="/about"
                className="rounded-full border border-transparent px-4 py-2 transition hover:border-slate-200"
              >
                About
              </Link>
            </nav>
          </header>

          <main className="flex-1 py-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-6 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>Supabase-ready template</span>
            <span>Ship fast with Vite + Vercel</span>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  )
}

function Home() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 shadow-glow backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-700">
          Boilerplate starter
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
          A calm, modular base for React + Supabase projects.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Routing, Tailwind, and a Supabase client are prewired so you can
          focus on your product instead of setup.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="rounded-full bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-700/30 transition hover:bg-cyan-800"
          >
            Open Dashboard
          </Link>
          <a
            href="https://supabase.com/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Supabase Docs
          </a>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Ready out of the box
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Tailwind with custom fonts & layout polish.</li>
            <li>React Router with starter routes.</li>
            <li>Supabase client + env template.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-900 p-6 text-slate-100 shadow-sm">
          <h2 className="font-display text-xl font-semibold">Env checklist</h2>
          <div className="mt-3 rounded-xl bg-slate-800/60 p-4 text-xs">
            <p>VITE_SUPABASE_URL=</p>
            <p>VITE_SUPABASE_ANON_KEY=</p>
          </div>
          <p className="mt-3 text-xs text-slate-300">
            Copy .env.example to .env.local and paste your keys.
          </p>
        </div>
      </aside>
    </div>
  )
}

function Dashboard() {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-10 shadow-sm">
      <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
      <p className="mt-3 text-slate-600">
        This is your scaffold for auth, data, and protected routes.
      </p>
    </section>
  )
}

function About() {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-10 shadow-sm">
      <h1 className="font-display text-3xl font-semibold">About</h1>
      <p className="mt-3 text-slate-600">
        Replace this copy with your product overview or onboarding steps.
      </p>
    </section>
  )
}

export default App
