// frontend/src/pages/PricingPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/authContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const useReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

// ─── Currency selector + checkout modal ──────────────────────────────────────
const CheckoutModal = ({ plan, onClose }) => {
  const [currency, setCurrency] = useState('KES');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const KES_PRICES = { starter: 2470, creator: 6370, studio: 12870 };
  const priceKES   = plan ? (KES_PRICES[plan.id] || plan.price * 130) : 0;

  const handlePay = async () => {
    if (!isAuthenticated) { navigate('/signup'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/payments/checkout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan: plan.id, currency }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.configured === false) {
          setError('Payments are being set up — please try again shortly.');
          return;
        }
        throw new Error(data.error || 'Failed to start payment');
      }

      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">{plan.icon}</div>
          <h2 className="text-xl font-black text-white">IVey {plan.name}</h2>
          <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
        </div>

        {/* Currency picker */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select your currency</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'USD', label: '🌍 USD',  sub: `$${plan.price}/month`,         desc: 'International · Card (contact us)' },
              { id: 'KES', label: '🇰🇪 KES',  sub: `KES ${priceKES.toLocaleString()}/month`, desc: 'Kenya · M-Pesa / Card' },
            ].map(c => (
              <button key={c.id} onClick={() => setCurrency(c.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  currency === c.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}>
                <p className="text-sm font-bold text-white">{c.label}</p>
                <p className={`text-sm font-black mt-0.5 ${currency === c.id ? 'text-emerald-400' : 'text-gray-300'}`}>{c.sub}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Payment methods shown */}
        <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl mb-5">
          <p className="text-xs font-bold text-gray-400 mb-2">Payment methods available</p>
          <div className="flex flex-wrap gap-2">
            {(currency === 'KES'
              ? ['M-Pesa', 'Visa / Mastercard', 'Bank Transfer']
              : ['Visa / Mastercard', 'Bank Transfer']
            ).map(m => (
              <span key={m} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-lg">{m}</span>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">Powered by Paystack · Secure & encrypted</p>
        </div>

        {/* Features summary */}
        <ul className="space-y-1.5 mb-5">
          {plan.features.slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-emerald-400 flex-shrink-0">✓</span>{f}
            </li>
          ))}
          {plan.features.length > 4 && (
            <li className="text-xs text-gray-600 pl-4">+ {plan.features.length - 4} more features</li>
          )}
        </ul>

        {error && (
          <div className="px-3 py-2 bg-red-900/20 border border-red-800 text-red-400 rounded-xl text-xs mb-4">
            ⚠️ {error}
          </div>
        )}

        <button onClick={handlePay} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white rounded-xl font-black text-sm transition-all shadow-lg disabled:opacity-50">
          {loading
            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/><span>Loading...</span></>
            : <><span>🔒</span><span>Pay {currency === 'KES' ? `KES ${priceKES.toLocaleString()}` : `$${plan.price}`} / month</span></>
          }
        </button>

        <div className="text-center mt-3 space-y-1">
          <p className="text-xs text-gray-600">7-day free trial · Cancel anytime · 30-day money back</p>
          <button onClick={onClose} className="text-xs text-gray-600 hover:text-gray-400 transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const FAQItem = ({ q, a, index }) => {
  const [open, setOpen]    = useState(false);
  const [ref, visible]     = useReveal(0.1);
  return (
    <div ref={ref} className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 60}ms` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full text-left bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{q}</h3>
          <span className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
        {open && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{a}</p>}
      </button>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Pricing = () => {
  const [isAnnual,    setIsAnnual]    = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [userPlan,    setUserPlan]    = useState(null);
  const { isAuthenticated, user }     = useAuth();
  const navigate                      = useNavigate();
  const [heroRef,  heroVisible]       = useReveal(0.1);
  const [cardsRef, cardsVisible]      = useReveal(0.1);

  useEffect(() => {
    if (isAuthenticated) fetchUserPlan();
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') {
      setTimeout(() => fetchUserPlan(), 2000);
    }
  }, [isAuthenticated]);

  const fetchUserPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/payments/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      setUserPlan(data.plan || 'free');
    } catch {}
  };

  const plans = [
    {
      id:          'free',
      name:        'Free',
      icon:        '🆓',
      description: 'Start creating AI scripts and strategies — forever free.',
      price:       0,
      annualPrice: 0,
      color:       'gray',
      features: [
        'Unlimited AI scripts',
        'Marketing strategy',
        'Gemini AI',
        '1 brand profile',
        '3 products',
        'Campaign management',
      ],
    },
    {
      id:          'starter',
      name:        'Starter',
      icon:        '🚀',
      description: 'Scripts + multi-platform distribution. For solo creators.',
      price:       19,
      annualPrice: 15,
      color:       'blue',
      features: [
        'Unlimited AI scripts',
        'Gemini + Claude Haiku',
        '2 brand profiles',
        '10 products',
        '20 social posts/month',
        'Multi-platform distribution',
        'Marketing strategy',
        '7-day free trial',
      ],
    },
    {
      id:          'creator',
      name:        'Creator',
      icon:        '⚡',
      description: 'Full automation. Scripts, HeyGen videos, distribution.',
      price:       49,
      annualPrice: 39,
      color:       'emerald',
      popular:     true,
      features: [
        'Everything in Starter',
        'Gemini + Claude Haiku + Sonnet',
        '5 brand profiles',
        'Unlimited products',
        '5 HeyGen videos/month',
        '50 social posts/month',
        'Automated video production',
        '7-day free trial',
      ],
    },
    {
      id:          'studio',
      name:        'Studio',
      icon:        '🎬',
      description: 'Maximum power. For agencies and serious content ops.',
      price:       99,
      annualPrice: 79,
      color:       'violet',
      features: [
        'Everything in Creator',
        'All AI providers (GPT-4o, Claude Sonnet)',
        'Unlimited brands',
        'Unlimited products',
        '20 HeyGen videos/month',
        'Unlimited social posts',
        'Priority support',
        '7-day free trial',
      ],
    },
  ];

  const colorMap = {
    gray:    { border: 'border-gray-200 dark:border-gray-700', btn: 'bg-gray-700 hover:bg-gray-600 text-white',                         check: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
    blue:    { border: 'border-blue-500/30',                   btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',       check: 'bg-blue-500/20 text-blue-400'    },
    emerald: { border: 'border-emerald-500',                   btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20', check: 'bg-emerald-500/20 text-emerald-400' },
    violet:  { border: 'border-violet-500/30',                 btn: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20',  check: 'bg-violet-500/20 text-violet-400'  },
  };

  const faqs = [
    { q: 'What payment methods do you accept?',
      a: 'We accept M-Pesa, Visa/Mastercard, and bank transfer via Flutterwave — covering Kenya and international cards in 150+ countries.' },
    { q: 'Is there a free trial?',
      a: 'Yes — all paid plans include a 7-day free trial with full access. No credit card required to start.' },
    { q: 'Can I change plans anytime?',
      a: 'Yes. Upgrade or downgrade at any time. Upgrades take effect immediately, downgrades at end of billing cycle.' },
    { q: 'How does HeyGen video production work?',
      a: 'IVey connects to HeyGen via API. You pick an avatar and voice in Studio, IVey submits your script automatically, and the finished MP4 is ready to distribute — no manual steps.' },
    { q: 'Do I need a HeyGen or Ayrshare account?',
      a: 'No. IVey handles everything through our accounts. You just pay IVey — one subscription covers scripts, video production, and distribution.' },
    { q: 'What happens to my content if I downgrade?',
      a: 'Your campaigns, scripts, and brand profiles are always yours. Downgrading limits future usage but never deletes existing content.' },
    { q: 'Can I get a refund?',
      a: '30-day money-back guarantee on all paid plans, no questions asked. Email support@ivey.app.' },
    { q: 'Do you offer agency pricing?',
      a: 'The Studio plan supports unlimited brands and products — ideal for agencies. Contact us for custom volume pricing.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"/>
          <div className="absolute top-10 right-1/4 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-3xl"/>
        </div>
        <div ref={heroRef} className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
            Simple Pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-5">
            One subscription.<br/>
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Everything included.</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            AI scripts, HeyGen video production, and multi-platform distribution — all in one place. M-Pesa accepted.
          </p>

          {isAuthenticated && userPlan && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <span className="text-amber-400 text-sm font-medium capitalize">✅ You're on the {userPlan} plan</span>
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-semibold ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
            <button onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
            <span className={`text-sm font-semibold ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Annual
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/20">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div ref={cardsRef} className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {plans.map((plan, i) => {
            const colors    = colorMap[plan.color];
            const isCurrent = isAuthenticated && userPlan === plan.id;
            const price     = isAnnual ? plan.annualPrice : plan.price;

            return (
              <div key={i} className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col ${colors.border}`}
                style={{ transitionDelay: `${i * 80}ms` }}>

                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-full shadow-lg">Most Popular</span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">✅ Your Plan</span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-center mb-5">
                    <div className="text-3xl mb-2">{plan.icon}</div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">${price}</span>
                      <span className="text-gray-500 text-sm">/mo</span>
                    </div>
                    {isAnnual && plan.price > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ${plan.annualPrice * 12}/yr
                        <span className="ml-1 text-amber-400 font-semibold">(save ${(plan.price - plan.annualPrice) * 12})</span>
                      </p>
                    )}
                    {plan.price === 0 && <p className="text-xs text-emerald-400 font-semibold mt-1">Free forever · No card needed</p>}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${colors.check}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (isCurrent) return;
                      if (plan.id === 'free') { isAuthenticated ? navigate('/dashboard') : navigate('/signup'); return; }
                      if (!isAuthenticated) { navigate('/signup'); return; }
                      setActiveModal(plan);
                    }}
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-xl font-black text-sm transition-all shadow-lg disabled:opacity-60 disabled:cursor-default ${colors.btn}`}>
                    {isCurrent
                      ? '✅ Current Plan'
                      : plan.id === 'free'
                        ? isAuthenticated ? '🚀 Go to Dashboard' : 'Get Started Free'
                        : '🔒 Start Free Trial'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">🔒 Secure payments</span>
          <span className="flex items-center gap-1.5">🔄 Cancel anytime</span>
          <span className="flex items-center gap-1.5">💰 30-day money back</span>
          <span className="flex items-center gap-1.5">📱 M-Pesa accepted</span>
          <span className="flex items-center gap-1.5">🎁 7-day free trial</span>
          <span className="flex items-center gap-1.5">🌍 150+ countries</span>
        </div>
      </section>

      {/* What's included */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">One subscription. Three tools.</h2>
            <p className="text-gray-500 dark:text-gray-400">Tools that would cost $80+/month separately — bundled into IVey.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'AI Script Engine',        desc: 'Claude, GPT-4o, Gemini — IVey picks the best model. Scripts scored for viral potential before you see them.',                                    from: 'Free', upto: 'All plans' },
              { icon: '🎬', title: 'HeyGen Video Production', desc: 'Pick an avatar, IVey submits your script automatically. Video produced, stored, and ready to distribute — no manual steps.',                   from: 'Creator', upto: 'Creator & Studio' },
              { icon: '🚀', title: 'Multi-Platform Distribution', desc: 'One click posts to TikTok, Instagram, Facebook, LinkedIn. Auto-generates captions for each platform from your campaign.',                 from: 'Starter', upto: 'Starter and up' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{item.desc}</p>
                <span className="text-xs text-emerald-400 font-semibold">Available on {item.upto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Frequently asked questions</h2>
            <p className="text-gray-500 dark:text-gray-500">Everything you need to know about IVey pricing.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} index={i}/>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 dark:border-gray-800 relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl"/>
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Start creating today.</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {isAuthenticated
              ? "You're already in. Go create something viral."
              : 'Free forever on the Free plan. Upgrade when you need video production and distribution.'}
          </p>
          {isAuthenticated ? (
            <Link to="/dashboard?section=studio"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl text-sm">
              Open Studio <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl text-sm">
                Start Free <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm">
                Sign In
              </Link>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-4">No credit card required · M-Pesa accepted · Cancel anytime</p>
        </div>
      </section>

      {activeModal && <CheckoutModal plan={activeModal} onClose={() => setActiveModal(null)} />}
    </div>
  );
};

export default Pricing;