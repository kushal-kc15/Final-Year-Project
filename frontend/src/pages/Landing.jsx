import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Camera,
  CornerDownRight,
  Plus,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';

/* ------------------------------------------------------------------ */
/*  Vyapar Margadarshan · Landing                                      */
/*                                                                     */
/*  Register: product (design serves the product).                     */
/*  Voice:    editorial ledger. Ruled lines, cinnabar red ink, paper.  */
/*                                                                     */
/*  Anti-references we honor:                                          */
/*    · no "marketing brochure" — the page is a working surface        */
/*    · no identical card grids — every section earns its layout      */
/*    · no eyebrow above every section — only the masthead has one     */
/*    · no 01/02/03 scaffolding — the four instruments speak for      */
/*      themselves                                                     */
/*                                                                     */
/*  Anti-patterns we refuse:                                           */
/*    · gradient text · side-stripe borders · 32px+ rounded cards     */
/*    · border + giant drop-shadow ghost cards · sketchy SVG          */
/*    · repeating-linear-gradient stripes                              */
/* ------------------------------------------------------------------ */

const HERO_ENTRIES = [
  { label: 'Stock from M.K. Suppliers',     amount: '−₨ 18,400', tone: 'cinnabar' },
  { label: 'Three customers, morning',      amount: '+₨ 12,750', tone: 'moss' },
  { label: 'Tea and biscuits',              amount: '−₨ 220',    tone: 'cinnabar' },
  { label: 'Auto-rickshaw to bank',         amount: '−₨ 350',    tone: 'cinnabar' },
  { label: 'Customer S. Shrestha',          amount: '+₨ 4,500',  tone: 'moss' },
  { label: 'Pashmina lot, Asan',            amount: '−₨ 7,200',  tone: 'cinnabar' },
];

const DAY_BOOK_ENTRIES = [
  { who: 'Sunita R.',  label: 'Office stationery',          amount: '−₨ 1,840', tone: 'cinnabar' },
  { who: 'Hari K.',     label: 'Client lunch · Bota Momo',   amount: '−₨ 2,150', tone: 'cinnabar' },
  { who: 'Annapurna',   label: 'Office rent, May',           amount: '−₨ 24,000', tone: 'cinnabar' },
  { who: 'Invoice #41', label: 'Kankai Hydropower, retainer', amount: '+₨ 85,000', tone: 'moss' },
];

const APPROVAL_QUEUE = [
  { who: 'Prakash Tamang', role: 'Field · Birtamode',   what: 'Diesel for delivery van',   amount: '₨ 3,200',  when: '2h' },
  { who: 'Mira Adhikari',  role: 'Marketing · KTM',      what: 'Meta ads · April',          amount: '₨ 18,500', when: '5h' },
  { who: 'R. Subedi',      role: 'Operations · Pokhara',  what: 'Hotel · client visit',      amount: '₨ 6,400',  when: '1d' },
];

const BUDGETS = [
  { name: 'Marketing',      spent: 78, total: 100, unit: 'k' },
  { name: 'Office rent',    spent: 100, total: 100, unit: 'k' },
  { name: 'Travel',         spent: 42, total: 80,  unit: 'k' },
  { name: 'Equipment',      spent: 19, total: 60,  unit: 'k' },
];

/* ----- small atoms ------------------------------------------------ */

function Eyebrow({ children, className = '' }) {
  return (
    <p className={`eyebrow ${className}`}>
      {children}
    </p>
  );
}

/* A cinnabar underline that genuinely underlines — a hand-drawn-feel
   stroke, not a CSS gradient. Used for emphasis in display copy. */
function InkedUnderline({ children, className = '' }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg
        aria-hidden
        viewBox="0 0 200 8"
        preserveAspectRatio="none"
        className="absolute left-0 right-0 -bottom-1 w-full h-[6px] text-cinnabar-500"
      >
        <path
          d="M2 5 C 40 2, 80 7, 120 4 S 180 3, 198 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* The signature SVG stroke that runs off the right edge of a panel —
   a literal "total line" that breaks the container, suggesting
   continuity beyond the page. */
function EdgeRule({ className = '', tone = 'cinnabar' }) {
  const colour = tone === 'cinnabar' ? '#c2412a' : tone === 'moss' ? '#5a7a4a' : '#1c1a17';
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 6"
      preserveAspectRatio="none"
      className={`block h-[2px] w-full ${className}`}
    >
      <line x1="0" y1="3" x2="200" y2="3" stroke={colour} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ----- section blocks --------------------------------------------- */

function Nav() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 py-4 flex items-center justify-between gap-4">
        <Link to="/" aria-label="Vyapar Margadarshan home" className="shrink-0">
          <Logo size={28} withWordmark wordmarkSize="lg" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-ink-soft">
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-ink transition-colors">Reviews</a>
          <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
        </nav>

        <nav className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex h-9 px-3 items-center text-sm text-ink-soft hover:text-ink transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-sm bg-cinnabar-500 text-paper text-sm font-medium border border-cinnabar-500 hover:bg-cinnabar-600 hover:border-cinnabar-600 transition-colors"
          >
            Create account
            <ArrowRight size={14} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const issueLabel = `Vol. 2 · No. ${String(today.getDate()).padStart(2, '0')}`;

  return (
    <section className="border-b border-rule">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          {/* Copy */}
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow className="mb-5">
              <span className="text-cinnabar-600">{issueLabel}</span>
              <span className="text-ink-faint mx-2">·</span>
              <span>{dateLabel}</span>
            </Eyebrow>

            <h1 className="font-display font-medium text-[2.5rem] sm:text-6xl lg:text-7xl leading-[0.98] tracking-[-0.035em] text-ink text-balance">
              An expense book for the way money{' '}
              <InkedUnderline>actually moves</InkedUnderline>{' '}
              in a small business.
            </h1>

            <p className="mt-7 max-w-[54ch] text-lg text-ink-soft leading-[1.55] text-pretty">
              Vyapar Margadarshan replaces scattered receipts and spreadsheets with a working ledger —
              every rupee, every receipt, every approval, on one clean page.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="inline-flex h-12 items-center gap-2 px-5 rounded-sm bg-cinnabar-500 text-paper text-base font-medium border border-cinnabar-500 hover:bg-cinnabar-600 hover:border-cinnabar-600 transition-colors"
              >
                Start free
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 items-center gap-1.5 px-1 text-base text-ink border-b border-ink hover:text-cinnabar-700 hover:border-cinnabar-700 transition-colors"
              >
                I already have a book
              </Link>
            </div>

            <p className="mt-4 text-xs text-ink-muted">
              Free during the beta. No card. NPR, INR, USD, EUR · Web, Android, iOS.
            </p>
          </div>

          {/* The ledger page — a literal, working day book */}
          <div className="col-span-12 lg:col-span-5">
            <div className="relative">
              {/* Off-page cinnabar stroke peeking from the top-right corner */}
              <div className="absolute -top-3 right-4 left-12 hidden lg:block">
                <EdgeRule tone="cinnabar" />
              </div>

              <div className="bg-paper border border-rule shadow-page rounded-md p-5 sm:p-6 relative overflow-hidden">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 border-b border-rule pb-3 mb-4">
                  <div className="min-w-0">
                    <Eyebrow>Day book</Eyebrow>
                    <p className="font-display text-base mt-1 text-ink truncate">
                      Mero Pasal, Kathmandu
                    </p>
                  </div>
                  <span className="ribbon bg-moss-50 text-moss-700 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-pill bg-moss-500" aria-hidden />
                    in balance
                  </span>
                </div>

                {/* Entries */}
                <ul className="text-sm divide-y divide-rule">
                  {HERO_ENTRIES.map((e, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-ink truncate">{e.label}</span>
                      <span
                        className={`num shrink-0 ${
                          e.tone === 'cinnabar' ? 'text-cinnabar-700' : 'text-moss-700'
                        }`}
                      >
                        {e.amount}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* The total rule that runs off the page on the right */}
                <div className="mt-4 -mx-5 sm:-mx-6">
                  <div className="px-5 sm:px-6">
                    <EdgeRule tone="cinnabar" />
                  </div>
                </div>

                <div className="pt-3 flex items-baseline justify-between">
                  <Eyebrow>Net today</Eyebrow>
                  <span className="num text-lg text-ink font-medium">−₨ 1,720</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-ink-faint text-right">
                A working page from a real ledger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Instruments() {
  return (
    <section id="features" className="border-b border-rule bg-paper-deep/40">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 py-16 sm:py-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-end mb-10 sm:mb-14">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-[-0.025em] text-ink text-balance">
              Four instruments.
              <br />
              <span className="text-ink-muted">One page.</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 text-ink-soft text-base leading-relaxed">
            <p>
              The ledger is the product. Everything else — the camera, the
              routing, the totals — exists to keep the page honest.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 1 — Day book */}
          <article className="col-span-12 md:col-span-6 bg-paper border border-rule rounded-md p-5 shadow-xs">
            <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
              <div>
                <Eyebrow>The day book</Eyebrow>
                <h3 className="font-display text-xl mt-1 text-ink">Every rupee, in order.</h3>
              </div>
              <CornerDownRight size={16} className="text-ink-faint shrink-0" aria-hidden />
            </div>
            <ul className="divide-y divide-rule text-sm mt-2">
              {DAY_BOOK_ENTRIES.map((e, i) => (
                <li key={i} className="py-2.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-ink truncate">{e.label}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{e.who}</p>
                  </div>
                  <span
                    className={`num shrink-0 ${
                      e.tone === 'cinnabar' ? 'text-cinnabar-700' : 'text-moss-700'
                    }`}
                  >
                    {e.amount}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-rule flex items-baseline justify-between">
              <Eyebrow>Net today</Eyebrow>
              <span className="num text-ink font-medium">+₨ 60,010</span>
            </div>
          </article>

          {/* 2 — Receipts / OCR */}
          <article className="col-span-12 md:col-span-6 bg-paper border border-rule rounded-md p-5 shadow-xs">
            <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
              <div>
                <Eyebrow>Receipts</Eyebrow>
                <h3 className="font-display text-xl mt-1 text-ink">A photo. A line in the book.</h3>
              </div>
              <Camera size={16} className="text-ink-faint shrink-0" aria-hidden />
            </div>

            <div className="mt-4 grid grid-cols-12 gap-4">
              {/* The receipt itself */}
              <div className="col-span-5">
                <div className="bg-paper-deep border border-rule rounded-sm p-3 text-[10px] leading-snug font-mono text-ink-soft relative">
                  <p className="text-center text-ink font-semibold text-[11px] tracking-wide">BOTA MOMO HOUSE</p>
                  <p className="text-center text-ink-faint text-[9px]">Jhamsikhel, Lalitpur</p>
                  <p className="text-ink-faint mt-1.5">14/05/2026  ·  13:42</p>
                  <div className="my-1.5 border-t border-dashed border-rule-strong" />
                  <div className="space-y-0.5">
                    <div className="flex justify-between"><span>2× Momo</span><span>320</span></div>
                    <div className="flex justify-between"><span>1× Chowmein</span><span>180</span></div>
                    <div className="flex justify-between"><span>3× Coke</span><span>240</span></div>
                    <div className="flex justify-between"><span>Service</span><span>74</span></div>
                  </div>
                  <div className="my-1.5 border-t border-dashed border-rule-strong" />
                  <div className="flex justify-between text-ink font-semibold">
                    <span>TOTAL</span><span>₨ 814</span>
                  </div>
                  {/* the cinnabar tick mark — confirms OCR read it */}
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-pill bg-cinnabar-500 text-paper text-[10px] font-bold flex items-center justify-center animate-tick" aria-hidden>✓</span>
                </div>
              </div>
              {/* The extracted fields */}
              <div className="col-span-7 space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                  <span className="text-ink-muted text-xs">Vendor</span>
                  <span className="text-ink">Bota Momo House, Jhamsikhel</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                  <span className="text-ink-muted text-xs">Date</span>
                  <span className="text-ink num">14 May 2026</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                  <span className="text-ink-muted text-xs">Category</span>
                  <span className="text-ink">Food & Dining</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-muted text-xs">Amount</span>
                  <span className="num text-ink font-medium">₨ 814</span>
                </div>
                <button
                  type="button"
                  className="mt-1 w-full h-8 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-sm bg-cinnabar-500 text-paper border border-cinnabar-500 hover:bg-cinnabar-600 transition-colors"
                >
                  <Plus size={12} aria-hidden />
                  File in the book
                </button>
              </div>
            </div>
          </article>

          {/* 3 — Approvals */}
          <article className="col-span-12 md:col-span-7 bg-paper border border-rule rounded-md p-5 shadow-xs">
            <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
              <div>
                <Eyebrow>Approvals</Eyebrow>
                <h3 className="font-display text-xl mt-1 text-ink">A tap. A line. Done.</h3>
              </div>
              <span className="ribbon bg-cinnabar-50 text-cinnabar-700">
                <span className="h-1.5 w-1.5 rounded-pill bg-cinnabar-500" aria-hidden />
                3 waiting
              </span>
            </div>
            <ul className="divide-y divide-rule">
              {APPROVAL_QUEUE.map((a, i) => (
                <li key={i} className="py-3 flex items-center gap-3">
                  <div
                    aria-hidden
                    className="h-8 w-8 rounded-pill bg-inkwell-50 text-ink-soft text-xs font-semibold flex items-center justify-center border border-rule shrink-0"
                  >
                    {a.who.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">
                      {a.who} <span className="text-ink-faint">·</span> {a.role}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{a.what}</p>
                  </div>
                  <span className="num text-sm text-ink shrink-0 hidden sm:inline">{a.amount}</span>
                  <span className="text-xs text-ink-faint shrink-0 hidden md:inline">{a.when}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <button
                      type="button"
                      className="h-7 px-2.5 text-xs font-medium rounded-sm bg-ink text-paper hover:bg-ink-soft transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="h-7 px-2.5 text-xs font-medium rounded-sm border border-rule-strong text-ink-soft hover:text-ink hover:border-ink-muted transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* 4 — Budgets */}
          <article className="col-span-12 md:col-span-5 bg-paper border border-rule rounded-md p-5 shadow-xs">
            <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
              <div>
                <Eyebrow>Budgets</Eyebrow>
                <h3 className="font-display text-xl mt-1 text-ink">A red rule, before it breaks.</h3>
              </div>
            </div>
            <ul className="mt-3 space-y-3.5">
              {BUDGETS.map((b) => {
                const pct = Math.min(100, Math.round((b.spent / b.total) * 100));
                const warn = pct >= 85;
                return (
                  <li key={b.name}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink">{b.name}</span>
                      <span className="num text-ink-muted">
                        <span className={warn ? 'text-cinnabar-700 font-medium' : ''}>{pct}%</span>{' '}
                        <span className="text-ink-faint">of ₨ {b.total}{b.unit}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-[3px] bg-rule rounded-pill overflow-hidden">
                      <div
                        className={`h-full ${warn ? 'bg-cinnabar-500' : 'bg-ink'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 pt-3 border-t border-rule text-xs text-ink-muted leading-relaxed">
              The rule thickens to cinnabar at 85%. You find out before the
              budget does.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}


/* Pricing, reviews and FAQ are kept restrained so the landing still feels like
   a product page, not a generic SaaS brochure. */
const PLANS = [
  {
    name: 'Starter',
    price: 'Free demo',
    note: 'For a single workspace and project review.',
    features: ['Staff submissions', 'Receipt attachment', 'Owner approval queue', 'Basic report preview'],
  },
  {
    name: 'Business',
    price: 'Team',
    note: 'For small teams that handle expenses every week.',
    features: ['Receipt OCR', 'Budget tracking', 'CSV exports', 'Workspace roles'],
    featured: true,
  },
  {
    name: 'Institution',
    price: 'Custom',
    note: 'For demos, training, and larger organization workflows.',
    features: ['Team management', 'Advanced reports', 'Budget monitoring', 'Setup support'],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 py-16 sm:py-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8 mb-9">
          <div className="col-span-12 lg:col-span-5">
            <h2 className="font-display font-medium text-3xl sm:text-4xl leading-[1.05] tracking-[-0.025em] text-ink text-balance">
              Simple plans for a simple book.
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-6 lg:col-start-7 text-ink-soft leading-relaxed max-w-[62ch]">
            No enterprise theatre. Start with a workspace, add people when the workflow makes sense, and keep the ledger clean.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`border rounded-md p-5 ${
                plan.featured
                  ? 'bg-ink text-paper border-ink shadow-page'
                  : 'bg-paper border-rule shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <h3 className={`font-display text-xl ${plan.featured ? 'text-paper' : 'text-ink'}`}>{plan.name}</h3>
                  <p className={`mt-1 text-xs ${plan.featured ? 'text-paper/70' : 'text-ink-muted'}`}>{plan.note}</p>
                </div>
                <span className={`ribbon shrink-0 ${plan.featured ? 'bg-cinnabar-500 text-paper' : 'bg-paper-deep text-ink-soft'}`}>
                  {plan.price}
                </span>
              </div>

              <ul className="mt-4 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex items-start gap-2.5 text-sm ${plan.featured ? 'text-paper/90' : 'text-ink-soft'}`}>
                    <Check size={14} className={plan.featured ? 'mt-0.5 text-cinnabar-300 shrink-0' : 'mt-0.5 text-cinnabar-500 shrink-0'} aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.name === 'Institution' ? '/login' : '/register'}
                className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-sm border text-sm font-medium transition-colors ${
                  plan.featured
                    ? 'bg-paper text-ink border-paper hover:bg-paper-deep'
                    : 'bg-cinnabar-500 text-paper border-cinnabar-500 hover:bg-cinnabar-600 hover:border-cinnabar-600'
                }`}
              >
                {plan.name === 'Institution' ? 'Discuss setup' : 'Create account'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: 'The approval queue made pending staff expenses clear without opening a spreadsheet.',
    name: 'Suman Adhikari',
    role: 'Store manager',
  },
  {
    quote: 'Receipts stayed attached to the expense, so monthly review was less confusing.',
    name: 'Anita Sharma',
    role: 'Small business owner',
  },
  {
    quote: 'The budget view helped us explain spending during the final project demonstration.',
    name: 'Bishal Karki',
    role: 'Project reviewer',
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="border-b border-rule bg-paper-deep/35">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 py-16 sm:py-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8 mb-9">
          <div className="col-span-12 lg:col-span-4">
            <h2 className="font-display font-medium text-3xl sm:text-4xl leading-[1.05] tracking-[-0.025em] text-ink text-balance">
              Notes from the counter.
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-7 lg:col-start-6 text-ink-soft leading-relaxed">
            Short comments from the people who need the workflow to stay practical: submit, review, total, export.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="bg-paper border border-rule rounded-md p-5 shadow-xs">
              <blockquote className="font-display text-xl leading-snug text-ink text-balance">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 pt-4 border-t border-rule">
                <p className="text-sm font-medium text-ink">{item.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">{item.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ['Can staff submit expenses?', 'Yes. Staff can file an expense, attach the receipt, and follow whether it is pending, approved, or returned.'],
  ['Can owners approve or return expenses?', 'Yes. Owners review staff expenses from a queue and can return an expense with a reason.'],
  ['Does receipt scanning work?', 'Yes. Receipt OCR can fill common fields such as vendor, date, amount, and category before the expense is submitted.'],
  ['Can reports be exported?', 'Yes. Approved expenses can be reviewed by period and exported as CSV.'],
  ['Is it only for large companies?', 'No. The workflow is designed for small teams first, then scales to a larger workspace.'],
];

function FAQ() {
  return (
    <section id="faq" className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 py-16 sm:py-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
          <div className="col-span-12 lg:col-span-4">
            <h2 className="font-display font-medium text-3xl sm:text-4xl leading-[1.05] tracking-[-0.025em] text-ink text-balance">
              Questions before opening the book.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted max-w-sm">
              Practical answers about submissions, approvals, receipt scanning, and reports.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="border-t border-rule">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group border-b border-rule py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-ink">
                    <span className="font-medium">{question}</span>
                    <span className="text-cinnabar-600 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
/* The masthead / closer. Restrained. One sentence, one button. */
function Closer() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 py-14 sm:py-16">
        <div className="border-t border-b border-rule py-10 sm:py-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <Eyebrow className="mb-3">Built for the workshop</Eyebrow>
            <p className="font-display text-2xl sm:text-3xl leading-[1.15] tracking-[-0.025em] text-ink text-balance max-w-[28ch]">
              A ledger, a printer, and a phone. That is the whole workshop.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex h-12 items-center gap-2 px-5 self-start sm:self-end rounded-sm bg-cinnabar-500 text-paper text-base font-medium border border-cinnabar-500 hover:bg-cinnabar-600 hover:border-cinnabar-600 transition-colors"
          >
            Create account
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-ink-muted">
        <span>© {new Date().getFullYear()} Vyapar Margadarshan</span>
        <span>Made for small businesses, in Kathmandu.</span>
      </div>
    </footer>
  );
}

/* ----- page ------------------------------------------------------- */

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav />
      <main>
        <Hero />
        <Instruments />
        <Pricing />
        <Testimonials />
        <FAQ />
        <Closer />
      </main>
      <Footer />
    </div>
  );
}