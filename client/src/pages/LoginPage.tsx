import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, Key } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { cn } from '@/lib/utils';

const STREAM_COUNT = 15;
const STORAGE_EMAIL_KEY = 'terminal-luxe-remembered-email';
const STORAGE_REMEMBER_KEY = 'terminal-luxe-remember-node';
const SESSION_TAB_KEY = 'terminal-luxe-active-tab';
const LANDING_TABS = ['Simulate', 'Institutional', 'Edge', 'Support'] as const;

type LandingTab = (typeof LANDING_TABS)[number];

function getHeroCopy(tab: LandingTab) {
  switch (tab) {
    case 'Institutional':
      return 'Built for enterprise execution and low-latency deployment.';
    case 'Edge':
      return 'Trade with edge-level throughput and predictive insight.';
    case 'Support':
      return 'Dedicated system support for secure institutional workflows.';
    default:
      return 'Precision execution. Zero risk. The command center for the modern trader. Experience the power of professional-grade latency and order book depth.';
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberNode, setRememberNode] = useState(false);
  const [activeTab, setActiveTab] = useState<LandingTab>('Simulate');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    const storedTab = sessionStorage.getItem(SESSION_TAB_KEY) as LandingTab | null;
    if (storedTab && LANDING_TABS.includes(storedTab)) {
      setActiveTab(storedTab);
    }

    const storedRemember = localStorage.getItem(STORAGE_REMEMBER_KEY) === 'true';
    const storedEmail = localStorage.getItem(STORAGE_EMAIL_KEY);
    if (storedRemember && storedEmail) {
      setEmail(storedEmail);
      setRememberNode(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    clearError();
  }, [email, password, clearError]);

  useEffect(() => {
    sessionStorage.setItem(SESSION_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_REMEMBER_KEY, rememberNode ? 'true' : 'false');
    if (rememberNode) {
      localStorage.setItem(STORAGE_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(STORAGE_EMAIL_KEY);
    }
  }, [rememberNode, email]);

  const streams = useMemo(
    () =>
      Array.from({ length: STREAM_COUNT }, () => ({
        left: `${Math.random() * 100}vw`,
        duration: `${5 + Math.random() * 10}s`,
        delay: `-${Math.random() * 10}s`,
        opacity: 0.1 + Math.random() * 0.2,
      })),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // error state set by store
    }
  };

  const handleResetCredentials = () => {
    setEmail('');
    setPassword('');
    setRememberNode(false);
    localStorage.removeItem(STORAGE_EMAIL_KEY);
    localStorage.removeItem(STORAGE_REMEMBER_KEY);
  };

  const handleTabClick = (tab: LandingTab) => {
    setActiveTab(tab);
  };

  const getStarted = () => navigate('/register');
  const goLogin = () => navigate('/login');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#121317] text-slate-100 scroll-smooth snap-y snap-mandatory">
      <div className="fixed inset-0 z-[-1]">
        <img
          className="h-full w-full object-cover opacity-60"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc3K4rY0nS_7ZGWNOXfWRUft60_WVmg9_CBUYcBiwecPAeecW4rEVUlC8LFB_FNaSZRdrgDPUEYRaRTVt_llnKABRA8pIEhhDIn85Y6GFjkbj87LnLcJKNyJCM_qZ-YQdRYyZ3_8dEg1vI_EHIWDufY_6e1FwCD4AWdPiVyNuXVMSZxcJymvfiVJctmQX56OkketVXYOOHK5_V7pUrObnwDAEi9wef5cXE0TTC93-kh_xMHqEPVtN51lRLgok1qSdUvbP4vGWOK6g"
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#121317]/40 via-[#121317]/60 to-[#121317]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121317] via-transparent to-[#121317]/40" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {streams.map((stream, index) => (
            <span
              key={index}
              className="absolute h-[100px] w-[1px] bg-gradient-to-b from-transparent via-[#46f1c5] to-transparent"
              style={{
                left: stream.left,
                opacity: stream.opacity,
                animationName: 'login-stream',
                animationDuration: stream.duration,
                animationDelay: stream.delay,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes login-stream {
          0% { transform: translateY(-120vh); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
        @keyframes hero-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }
      `}</style>

      <header className="fixed top-0 z-50 w-full border-b border-slate-700/30 bg-[#121317]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-[#46f1c5] drop-shadow-[0_0_16px_rgba(70,241,197,0.25)]">
              TERMINAL LUXE
            </span>
          </div>
          <nav className="hidden items-center gap-8 md:flex text-sm uppercase tracking-[0.18em] text-slate-300">
            {LANDING_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'transition-colors',
                  tab === activeTab
                    ? 'border-b-2 border-[#46f1c5] pb-1 font-semibold text-[#46f1c5]'
                    : 'hover:text-[#46f1c5] text-slate-300'
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <button
              type="button"
              onClick={goLogin}
              className="rounded-lg px-3 py-2 transition hover:text-[#46f1c5] active:opacity-80"
            >
              Login
            </button>
            <button
              type="button"
              onClick={getStarted}
              className="rounded-lg bg-[#46f1c5] px-4 py-2 font-semibold text-slate-950 transition hover:brightness-105 active:opacity-90"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-screen max-w-[1440px] gap-10 px-6 py-32 md:grid-cols-12 md:items-center snap-start">
        <section className="md:col-span-7 flex flex-col gap-8 z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-[#46f1c5]" />
              <span className="text-xs uppercase tracking-[0.25em] text-[#46f1c5]">
                High Frequency Engine
              </span>
            </div>
            <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.05] text-white md:text-[64px]">
              INSTITUTIONAL GRADE SIMULATION.
            </h1>
            <p className="max-w-lg text-base leading-8 text-slate-300">
              {getHeroCopy(activeTab)}
            </p>
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/30 bg-[#0d1320]/80 p-4 text-xs uppercase tracking-[0.22em] text-slate-400">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(70,241,197,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(70,241,197,0.06),transparent_30%)] pointer-events-none" />
              <div className="relative flex items-center gap-4 overflow-hidden">
                <div
                  className="flex whitespace-nowrap gap-8 text-slate-300"
                  style={{ animation: 'hero-marquee 24s linear infinite' }}
                >
                  {['EUR/USD 1.3721', 'S&P 500 +0.41%', 'NAS100 +0.29%', 'BTC/USD 67,430', 'OIL +0.18%', 'JPY 149.12'].map((item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#46f1c5]" />
                      {item}
                    </span>
                  ))}
                </div>
                <div
                  className="flex whitespace-nowrap gap-8 text-slate-300"
                  style={{ animation: 'hero-marquee 24s linear infinite', animationDelay: '2s' }}
                >
                  {['FXEQ / 5m | Market Depth', 'AI Signal: Long USQ2', 'Liquidity Heatmap Active', 'Execution Spread 0.28bps', 'Risk Engine Synced'].map((item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#46f1c5]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700/40 bg-white/5 px-6 py-5">
              <span className="block text-2xl font-semibold text-[#46f1c5]">0.4ms</span>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">Latency</p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-white/5 px-6 py-5">
              <span className="block text-2xl font-semibold text-[#46f1c5]">99.99%</span>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">Uptime</p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-white/5 px-6 py-5">
              <span className="block text-2xl font-semibold text-[#46f1c5]">100Gbps</span>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">Thruput</p>
            </div>
          </div>
        </section>

        <aside className="md:col-span-5 flex justify-center md:justify-end z-10">
          <div className="w-full max-w-[420px] rounded-3xl border border-slate-700/30 bg-[#11151c]/85 p-10 shadow-[0_0_30px_rgba(70,241,197,0.12)] backdrop-blur-xl">
            <div className="space-y-3 text-slate-100">
              <h2 className="text-2xl font-semibold">Access Terminal</h2>
              <p className="text-sm text-slate-400">Enter your credentials to connect to the secure node.</p>
            </div>

            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <AlertCircle className="h-4 w-4 text-red-300" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Email Address</label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#46f1c5]" />
                  <input
                    className="w-full rounded-2xl border border-slate-700/60 bg-[#0f1720]/90 px-14 py-3 text-sm text-slate-100 outline-none transition focus:border-[#46f1c5]/60 focus:ring-2 focus:ring-[#46f1c5]/20"
                    placeholder="name@institutional.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Password</label>
                <div className="relative group">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#46f1c5]" />
                  <input
                    className="w-full rounded-2xl border border-slate-700/60 bg-[#0f1720]/90 px-14 py-3 pr-14 text-sm text-slate-100 outline-none transition focus:border-[#46f1c5]/60 focus:ring-2 focus:ring-[#46f1c5]/20"
                    placeholder="••••••••"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#46f1c5]"
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberNode}
                    onChange={(e) => setRememberNode(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-[#0f1720] text-[#46f1c5] focus:ring-[#46f1c5]"
                  />
                  Remember Node
                </label>
                <button
                  type="button"
                  onClick={handleResetCredentials}
                  className="text-[#46f1c5] hover:underline"
                >
                  Reset Credentials
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className={cn(
                  'w-full rounded-2xl bg-[#46f1c5] px-6 py-3 font-semibold text-slate-950 transition hover:brightness-105 active:opacity-90',
                  isLoading && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isLoading ? 'Authenticating...' : 'AUTHENTICATE'}
              </button>
            </form>

            <div className="mt-10 flex items-center gap-3 text-slate-500">
              <span className="h-px flex-1 bg-slate-700/50" />
              <span className="uppercase tracking-[0.2em]">Secure Protocol</span>
              <span className="h-px flex-1 bg-slate-700/50" />
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-6 text-slate-400">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-[#46f1c5]" />
                <span className="uppercase tracking-[0.18em]">AES-256</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-[#46f1c5]" />
                <span className="uppercase tracking-[0.18em]">MFA READY</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="mx-auto max-w-[1440px] space-y-16 px-6 pb-24">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="snap-start rounded-[32px] border border-slate-700/30 bg-[#11151c]/85 p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#46f1c5]">Simulate</span>
              <h2 className="text-3xl font-semibold text-white">Trade Without Risk.</h2>
              <p className="max-w-2xl text-base leading-8 text-slate-300">
                Experience institutional-grade execution in a fully simulated market environment with real-time analytics and AI-assisted insights.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {[
                  'Real-Time Paper Trading',
                  'Multi-Asset Simulation',
                  'AI Trade Copilot',
                  'Portfolio Replay',
                  'Historical Backtesting',
                  'Multi-Timeframe Execution',
                ].map((feature) => (
                  <div key={feature} className="rounded-3xl border border-slate-700/40 bg-slate-950/50 p-4 text-sm text-slate-200">
                    {feature}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="mt-4 inline-flex rounded-full bg-[#46f1c5] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Start Simulating
              </button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-slate-700/40 bg-[#0e1620]/95 p-4 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                  <span>Live Mini Chart</span>
                  <span className="text-[#46f1c5]">FXEQ / 5m</span>
                </div>
                <div className="mt-4 h-32 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(70,241,197,0.06),transparent_35%),linear-gradient(180deg,rgba(15,23,32,1),rgba(7,12,18,1))] p-4">
                  <div className="h-full w-full rounded-2xl bg-[linear-gradient(90deg,rgba(70,241,197,0.2),transparent)]" />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-700/40 bg-[#0e1620]/95 p-4 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                  <span>Simulated P&amp;L</span>
                  <span className="text-[#46f1c5]">Realtime</span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-white">+$124.8k</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">24h paper gains</p>
                  </div>
                  <div className="rounded-full border border-[#46f1c5]/30 bg-[#46f1c5]/10 px-3 py-1 text-xs text-[#46f1c5]">
                    +3.2% ROI
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-700/30 bg-[#0f1720]/80 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
              <span>Execution Feed</span>
              <span>Real-time simulation</span>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {[
                'Bought 3,200 contracts @ 1.3721 — Smart Order Routing matched within 2ms',
                'AI Copilot flagged a high-conviction long on US Tech momentum',
                'Portfolio Replay triggered risk engine validation at 15:18 UTC',
              ].map((line) => (
                <div key={line} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#46f1c5]" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
          className="snap-start rounded-[32px] border border-slate-700/30 bg-[#11151c]/85 p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] xl:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#46f1c5]">Institutional</span>
              <h2 className="text-3xl font-semibold text-white">Institutional Execution Infrastructure.</h2>
              <p className="text-base leading-8 text-slate-300">
                Built for low-latency execution, multi-terminal workflows, and advanced quantitative market analysis.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  'Multi-Chart Workspaces',
                  'Smart Order Routing',
                  'Advanced DOM Ladder',
                  'AI Signal Intelligence',
                  'Correlation Matrix',
                  'Risk Engine',
                  'Orderflow Analytics',
                ].map((feature) => (
                  <div key={feature} className="rounded-3xl border border-slate-700/40 bg-slate-950/50 p-4 text-sm text-slate-200">
                    {feature}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="mt-4 inline-flex rounded-full bg-[#46f1c5] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Access Institutional Suite
              </button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-slate-700/40 bg-[#0e1620]/95 p-4 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                  <div className="rounded-2xl bg-[#0f1720]/90 p-4">
                    <p className="text-2xl font-semibold text-[#46f1c5]">0.4ms</p>
                    <p className="mt-1 text-[11px] text-slate-500">Average Latency</p>
                  </div>
                  <div className="rounded-2xl bg-[#0f1720]/90 p-4">
                    <p className="text-2xl font-semibold text-[#46f1c5]">99.99%</p>
                    <p className="mt-1 text-[11px] text-slate-500">Uptime</p>
                  </div>
                  <div className="rounded-2xl bg-[#0f1720]/90 p-4">
                    <p className="text-2xl font-semibold text-[#46f1c5]">100Gbps</p>
                    <p className="mt-1 text-[11px] text-slate-500">Throughput</p>
                  </div>
                  <div className="rounded-2xl bg-[#0f1720]/90 p-4">
                    <p className="text-2xl font-semibold text-[#46f1c5]">24/7</p>
                    <p className="mt-1 text-[11px] text-slate-500">Monitoring</p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/40 bg-[#0b121a]/95 p-5 shadow-[0_0_24px_rgba(70,241,197,0.08)]">
                <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(70,241,197,0.12),transparent_45%)] opacity-70" />
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Terminal Dashboard Preview</div>
                <div className="mt-4 h-48 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,rgba(70,241,197,0.14),transparent_30%),linear-gradient(180deg,rgba(15,23,32,1),rgba(5,10,16,1))] p-4">
                  <div className="grid h-full gap-3">
                    <div className="h-4 w-1/2 rounded-full bg-[#46f1c5]/20 backdrop-blur-sm" />
                    <div className="flex gap-2">
                      <div className="h-4 flex-1 rounded-full bg-[#46f1c5]/10" />
                      <div className="h-4 flex-1 rounded-full bg-[#46f1c5]/20" />
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-3 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      <div className="rounded-2xl bg-[#0e1620]/90 p-2">Market Depth</div>
                      <div className="rounded-2xl bg-[#0e1620]/90 p-2">Risk</div>
                      <div className="rounded-2xl bg-[#0e1620]/90 p-2">Orderflow</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.16 }}
          className="snap-start rounded-[32px] border border-slate-700/30 bg-[#11151c]/85 p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#46f1c5]">Edge</span>
              <h2 className="text-3xl font-semibold text-white">Gain the Market Edge.</h2>
              <p className="text-base leading-8 text-slate-300">
                Leverage AI-powered insights, predictive analytics, and advanced technical intelligence to stay ahead of market momentum.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {[
                  'AI Market Copilot',
                  'Trend Detection Engine',
                  'Volatility Scanner',
                  'Smart Alerts',
                  'Liquidity Heatmaps',
                  'Sentiment Analysis',
                  'Trade Probability Scoring',
                ].map((feature) => (
                  <div key={feature} className="rounded-3xl border border-slate-700/40 bg-slate-950/50 p-4 text-sm text-slate-200">
                    {feature}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="mt-4 inline-flex rounded-full bg-[#46f1c5] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Unlock Trading Intelligence
              </button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-slate-700/40 bg-[#0c1420]/95 p-5 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
                  <span>AI Confidence</span>
                  <span className="text-[#46f1c5]">High</span>
                </div>
                <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-900">
                  <div className="h-full w-[82%] rounded-full bg-[#46f1c5]" />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-700/40 bg-[#0c1420]/95 p-5 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Liquidity Heatmap</div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }, (_, index) => (
                    <div
                      key={index}
                      className={`h-10 rounded-xl ${index % 3 === 0 ? 'bg-[#46f1c5]/30' : index % 2 === 0 ? 'bg-[#46f1c5]/20' : 'bg-slate-800'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-700/40 bg-[#0c1420]/95 p-5 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
                  <span>Signal Stream</span>
                  <span className="text-[#46f1c5]">Live</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-200">
                  <div className="flex items-center justify-between rounded-2xl bg-[#121b28]/90 p-3">
                    <span>Signal: USQ2 QUANT LONG</span>
                    <span className="text-[#46f1c5]">0.86</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#121b28]/90 p-3">
                    <span>Momentum Alert</span>
                    <span className="text-[#46f1c5]">+12.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.24 }}
          className="snap-start rounded-[32px] border border-slate-700/30 bg-[#11151c]/85 p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#46f1c5]">Support</span>
              <h2 className="text-3xl font-semibold text-white">24/7 Trader Support.</h2>
              <p className="text-base leading-8 text-slate-300">
                From onboarding to advanced execution workflows, our support ecosystem is built for traders at every level.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-3">
                {[
                  'Live Terminal Assistance',
                  'AI Helpdesk',
                  'Strategy Documentation',
                  'Workspace Tutorials',
                  'API Integration Help',
                  'Community Channels',
                ].map((feature) => (
                  <div key={feature} className="rounded-3xl border border-slate-700/40 bg-slate-950/50 p-4 text-sm text-slate-200">
                    {feature}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="mt-4 inline-flex rounded-full bg-[#46f1c5] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Contact Support
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-700/40 bg-[#0c1420]/95 p-5 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Community Stats</div>
                <div className="mt-4 grid gap-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between rounded-2xl bg-[#121b28]/90 px-4 py-3">
                    <span>Active Trading Desks</span>
                    <span className="text-[#46f1c5]">184</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#121b28]/90 px-4 py-3">
                    <span>Support Tickets</span>
                    <span className="text-[#46f1c5]">9/10 response SLAs</span>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-700/40 bg-[#0c1420]/95 p-5 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Helpdesk Ticket</div>
                <div className="mt-4 rounded-3xl bg-[#111b27]/90 p-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                    <span>Ticket #4821</span>
                    <span className="text-[#46f1c5]">Open</span>
                  </div>
                  <p className="mt-3 leading-6 text-slate-300">
                    High-priority onboarding request for risk engine integration and API sync.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-700/40 bg-[#0c1420]/95 p-5 shadow-[0_0_20px_rgba(70,241,197,0.08)]">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">FAQs</div>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  {[
                    'How quickly can I onboard new terminals?',
                    'What latency guarantees are included?',
                    'Is there support for API orderflow integration?',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-[#111b27]/90 px-4 py-3">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <footer className="border-t border-slate-700/30 bg-[#0f1720]/90 py-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-1 text-slate-400 md:items-start">
            <span className="text-sm font-semibold text-[#46f1c5] uppercase tracking-[0.2em]">TERMINAL LUXE</span>
            <span className="text-xs text-slate-500">© 2024 Terminal Luxe Systems. Institutional Grade Simulation.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Regulatory Disclosures</a>
            <a href="#" className="hover:text-white transition">API Documentation</a>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-[#46f1c5] animate-pulse" />
            <span className="text-xs uppercase tracking-[0.2em]">All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
