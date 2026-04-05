import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ACCENT   = '#E8830A';
const BG       = '#FFFBF5';
const DARK     = '#1C1410';
const MID      = '#6B5744';
const SURFACE  = '#F5EFE6';
const BORDER   = '#E8DDD0';

// ── Squiggle underline SVG ────────────────────────────────────────────────────
function Squiggle({ color = ACCENT }) {
  return (
    <svg viewBox="0 0 200 12" className="w-full" fill="none">
      <path d="M2 8 Q25 2 50 8 Q75 14 100 8 Q125 2 150 8 Q175 14 198 8"
        stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ scrolled }) {
  return (
    <nav style={{ background: scrolled ? `${BG}f5` : 'transparent', borderBottom: scrolled ? `1px solid ${BORDER}` : 'none' }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
            <span className="material-icons text-white text-sm">account_balance_wallet</span>
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: DARK, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Vyapar Margadarshan
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it works', 'Pricing'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm transition-colors" style={{ color: MID, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium transition-colors"
            style={{ color: MID, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Sign in
          </Link>
          <Link to="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            style={{ background: DARK, color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: BG, color: DARK, fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-fraunces { font-family: 'Fraunces', serif; }
      `}</style>

      <Nav scrolled={scrolled} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-8 relative overflow-hidden">
        {/* Warm radial glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${ACCENT}12 0%, transparent 70%)` }} />

        <div className="max-w-6xl mx-auto relative">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10 border"
            style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}30` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
              Made for Nepali businesses
            </span>
          </div>

          {/* Headline */}
          <div className="max-w-4xl mb-8">
            <h1 className="font-fraunces text-[clamp(48px,7vw,88px)] leading-[1.0] tracking-tight mb-0" style={{ color: DARK }}>
              Know where every
            </h1>
            <div className="relative inline-block mb-2">
              <h1 className="font-fraunces text-[clamp(48px,7vw,88px)] leading-[1.0] tracking-tight italic" style={{ color: ACCENT }}>
                rupee goes.
              </h1>
              <div className="absolute -bottom-2 left-0 right-0">
                <Squiggle />
              </div>
            </div>
            <h1 className="font-fraunces text-[clamp(48px,7vw,88px)] leading-[1.0] tracking-tight" style={{ color: `${DARK}40` }}>
              Always.
            </h1>
          </div>

          {/* Sub + CTA */}
          <div className="grid md:grid-cols-2 gap-10 items-center mt-12">
            <p className="text-lg leading-relaxed max-w-md" style={{ color: MID }}>
              Track expenses, manage approvals, and understand your spending — all in one place, built for the way small businesses in Nepal actually work.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <Link to="/register"
                className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-4 rounded-2xl transition-all text-sm shadow-lg"
                style={{ background: DARK, color: 'white' }}>
                Start for free
                <span className="material-icons text-sm">arrow_forward</span>
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-4 rounded-2xl transition-all text-sm border"
                style={{ color: DARK, borderColor: BORDER, background: 'white' }}>
                See how it works
              </a>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-14 pt-10 flex items-center gap-8 flex-wrap" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex -space-x-2">
              {['R', 'S', 'A', 'P', 'B'].map((l, i) => (
                <div key={l} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: ['#E8830A','#3B5BDB','#10b981','#8b5cf6','#ec4899'][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: MID }}>
              <span className="font-semibold" style={{ color: DARK }}>500+ businesses</span> manage finances with Vyapar
            </p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-icons text-sm" style={{ color: ACCENT }}>star</span>
              ))}
              <span className="text-sm font-semibold ml-1" style={{ color: DARK }}>4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-8" style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {[
            { value: '500+',    label: 'Active businesses'   },
            { value: 'रू 2Cr+', label: 'Expenses tracked'   },
            { value: '99.9%',   label: 'Uptime'             },
            { value: '< 24h',   label: 'Approval speed'     },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-fraunces text-4xl mb-1" style={{ color: DARK }}>{s.value}</p>
              <p className="text-sm" style={{ color: MID }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: ACCENT }}>Features</p>
            <h2 className="font-fraunces text-5xl leading-tight mb-4" style={{ color: DARK }}>
              Built for how you <em>actually</em> work
            </h2>
            <p className="text-base leading-relaxed" style={{ color: MID }}>
              Not another bloated ERP. Just the tools a growing Nepali business genuinely needs.
            </p>
          </div>

          {/* 2x3 feature grid with large number anchors */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { n: '01', icon: 'receipt_long',    title: 'Expense Tracking',   desc: 'Submit expenses in seconds. Categories, vendors, descriptions — everything captured in one tap.' },
              { n: '02', icon: 'task_alt',        title: 'Smart Approvals',    desc: 'No more WhatsApp chains. Managers approve or reject with clear reasons. Staff always know their status.' },
              { n: '03', icon: 'account_balance', title: 'Budget Control',     desc: 'Set limits. Get alerted before you breach them. Stop discovering overspend at month end.' },
              { n: '04', icon: 'bar_chart',       title: 'Visual Reports',     desc: 'Spending trends, category breakdowns, period comparisons. Understand your money in seconds.' },
              { n: '05', icon: 'storefront',      title: 'Vendor Insights',    desc: 'See where your money flows. Which vendors cost most? Where can you negotiate better?' },
              { n: '06', icon: 'manage_accounts', title: 'Role Permissions',   desc: 'Owner, Manager, Staff. Everyone sees exactly what they need — nothing more, nothing less.' },
            ].map(f => (
              <div key={f.n}
                className="rounded-2xl p-7 border transition-all hover:-translate-y-0.5 group cursor-default"
                style={{ background: 'white', borderColor: BORDER }}>
                {/* Number + icon row */}
                <div className="flex items-start justify-between mb-6">
                  <span className="font-fraunces text-5xl leading-none" style={{ color: `${DARK}10` }}>{f.n}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                    <span className="material-icons text-[20px]" style={{ color: ACCENT }}>{f.icon}</span>
                  </div>
                </div>
                <h3 className="font-fraunces text-xl mb-2 group-hover:text-[#E8830A] transition-colors" style={{ color: DARK }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: MID }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-8" style={{ background: SURFACE, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: ACCENT }}>How it works</p>
            <h2 className="font-fraunces text-5xl leading-tight" style={{ color: DARK }}>
              Three steps to <em>clarity</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${BORDER}, ${BORDER}, transparent)` }} />

            {[
              { step: '1', title: 'Create your workspace', desc: 'Sign up and set up your organisation in under 2 minutes. No credit card, no setup fee.', icon: 'business' },
              { step: '2', title: 'Invite your team',       desc: 'Add your team and assign roles. Each person sees only what they need to.', icon: 'group_add'   },
              { step: '3', title: 'Track and grow',         desc: 'Start submitting and approving expenses. Watch your financial picture become clear.', icon: 'trending_up' },
            ].map(s => (
              <div key={s.step} className="text-center relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
                  style={{ background: 'white', borderColor: BORDER }}>
                  <span className="material-icons text-2xl" style={{ color: ACCENT }}>{s.icon}</span>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto mb-4"
                  style={{ background: ACCENT }}>
                  {s.step}
                </div>
                <h3 className="font-fraunces text-xl mb-2" style={{ color: DARK }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: MID }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: ACCENT }}>Pricing</p>
            <h2 className="font-fraunces text-5xl leading-tight" style={{ color: DARK }}>
              Simple. <em>Transparent.</em> Fair.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="rounded-3xl p-8 border" style={{ background: 'white', borderColor: BORDER }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: MID }}>Free Trial</p>
              <div className="flex items-end gap-1 mb-2">
                <p className="font-fraunces text-5xl" style={{ color: DARK }}>रू 0</p>
                <p className="text-sm mb-2" style={{ color: MID }}>/month</p>
              </div>
              <p className="text-sm mb-8" style={{ color: MID }}>30 days, everything included.</p>
              <div className="space-y-3 mb-8" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1.5rem' }}>
                {['All features for 30 days', 'Up to 5 team members', 'No credit card required', 'Full support'].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: DARK }}>
                    <span className="material-icons text-sm" style={{ color: ACCENT }}>check_circle</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/register"
                className="block w-full py-3.5 text-center text-sm font-semibold rounded-2xl border-2 transition-all"
                style={{ borderColor: DARK, color: DARK }}>
                Start free trial
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-3xl p-8 relative overflow-hidden" style={{ background: DARK }}>
              <div className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: ACCENT, color: 'white' }}>
                Most popular
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: `${ACCENT}` }}>Pro</p>
              <div className="flex items-end gap-1 mb-2">
                <p className="font-fraunces text-5xl text-white">रू 2,999</p>
                <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>/month</p>
              </div>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>For teams that mean business.</p>
              <div className="space-y-3 mb-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                {['Unlimited team members', 'Everything in Free', 'Advanced analytics', 'Priority support', 'CSV & PDF exports'].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                    <span className="material-icons text-sm" style={{ color: ACCENT }}>check_circle</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/register"
                className="block w-full py-3.5 text-center text-sm font-semibold rounded-2xl transition-all"
                style={{ background: ACCENT, color: 'white' }}>
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 text-center" style={{ background: SURFACE, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-fraunces text-5xl leading-tight mb-6" style={{ color: DARK }}>
            Start managing your finances <em>today.</em>
          </h2>
          <p className="text-base mb-8" style={{ color: MID }}>
            Join 500+ Nepali businesses who finally know where their money goes.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl text-sm transition-all"
            style={{ background: DARK, color: 'white' }}>
            Create free account
            <span className="material-icons text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
                <span className="material-icons text-white text-sm">account_balance_wallet</span>
              </div>
              <span className="font-semibold text-sm" style={{ color: DARK }}>Vyapar Margadarshan</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: MID }}>
              Financial management built for Nepal's growing businesses.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog']        },
            { title: 'Company', links: ['About', 'Blog', 'Contact']               },
            { title: 'Legal',   links: ['Privacy Policy', 'Terms of Service']      },
          ].map(col => (
            <div key={col.title}>
              <p className="font-semibold text-sm mb-4" style={{ color: DARK }}>{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm transition-colors hover:opacity-80" style={{ color: MID }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8"
          style={{ borderTop: `1px solid ${BORDER}` }}>
          <p className="text-sm" style={{ color: MID }}>© 2025 Vyapar Margadarshan. All rights reserved.</p>
          <p className="text-sm" style={{ color: MID }}>Made with care for Nepal 🇳🇵</p>
        </div>
      </footer>
    </div>
  );
}