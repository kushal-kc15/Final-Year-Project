import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ACCENT = '#E8830A';
const BG = '#FFFBF5';
const DARK = '#1C1410';
const MID = '#6B5744';
const SURFACE = '#F5EFE6';
const BORDER = '#E8DDD0';

// ── Navbar ─────────────────────────────────────────
function Nav({ scrolled }) {
  return (
    <nav
      style={{
        background: scrolled ? `${BG}f5` : 'transparent',
        borderBottom: scrolled ? `1px solid ${BORDER}` : 'none',
      }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition"
    >
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: ACCENT }}
          >
            <span className="material-icons text-white text-sm">
              account_balance_wallet
            </span>
          </div>
          <span className="font-semibold text-sm" style={{ color: DARK }}>
            Vyapar Margadarshan
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-sm">
          {['Features', 'How it works', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="hover:text-black transition"
              style={{ color: MID }}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm" style={{ color: MID }}>
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: DARK, color: 'white' }}
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Main ───────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: BG, color: DARK }} className="min-h-screen font-sans">

      <Nav scrolled={scrolled} />

      {/* ── Hero ───────────────── */}
      <section className="pt-40 pb-24 px-8">
        <div className="max-w-6xl mx-auto">

          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Understand where your money goes — clearly and in real time.
            </h1>

            <p className="text-lg mb-8" style={{ color: MID }}>
              Track expenses, manage approvals, and gain full control of your business finances — built for Nepali businesses.
            </p>

            <div className="flex gap-4">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition"
                style={{ background: DARK, color: 'white' }}
              >
                Start for free
              </Link>

              <a
                href="#how-it-works"
                className="px-6 py-3 rounded-xl text-sm font-semibold border"
                style={{ borderColor: BORDER }}
              >
                See how it works
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ───────────────── */}
      <section className="py-16 px-8" style={{ background: SURFACE }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Businesses' },
            { value: 'रू 2Cr+', label: 'Tracked' },
            { value: '99.9%', label: 'Uptime' },
            { value: '<24h', label: 'Approvals' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm" style={{ color: MID }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────── */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-6xl mx-auto">

          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to manage expenses
            </h2>
            <p style={{ color: MID }}>
              Simple tools designed for real business workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: 'receipt_long', title: 'Expense Tracking', desc: 'Track and organize every expense easily.' },
              { icon: 'task_alt', title: 'Approvals', desc: 'Approve or reject expenses with clarity.' },
              { icon: 'bar_chart', title: 'Reports', desc: 'Understand spending with clear insights.' },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
                style={{ borderColor: BORDER }}
              >
                <span className="material-icons mb-3" style={{ color: ACCENT }}>
                  {f.icon}
                </span>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: MID }}>{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ───────────────── */}
      <section className="py-24 px-8 text-center" style={{ background: SURFACE }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            Start managing your finances today
          </h2>
          <p className="mb-6" style={{ color: MID }}>
            Join businesses that already have full control over their spending.
          </p>
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition"
            style={{ background: DARK, color: 'white' }}
          >
            Create free account
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────── */}
      <footer className="py-10 px-8 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto text-center text-sm" style={{ color: MID }}>
          © 2025 Vyapar Margadarshan. All rights reserved.
        </div>
      </footer>
    </div>
  );
}