import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/authContext';

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

// ─── Coming Soon Modal ────────────────────────────────────────────────────────
const ComingSoonModal = ({ plan, onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);
  if (!plan) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl mx-auto mb-4">⚡</div>
          <h2 className="text-xl font-black text-white mb-1">{plan.name} Plan — Coming Soon</h2>
          <p className="text-sm text-gray-400">We're building this out. Drop your email and we'll notify you the moment it launches.</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What you'll get</p>
          <ul className="space-y-2">
            {plan.features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
            {plan.features.length > 4 && <li className="text-xs text-gray-500 pl-6">+ {plan.features.length - 4} more features</li>}
          </ul>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 text-center">
          <p className="text-xs text-gray-400 mb-1">Starting at</p>
          <p className="text-3xl font-black text-amber-400">${plan.annualPrice}<span className="text-sm font-normal text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-500 mt-1">billed annually · or ${plan.monthlyPrice}/mo monthly</p>
        </div>
        {!submitted ? (
          <form onSubmit={(e) => { e.preventDefault(); if (email) setSubmitted(true); }} className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"/>
            <button type="submit" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold text-white transition-all">Notify Me</button>
          </form>
        ) : (
          <div className="flex items-center justify-center py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-emerald-400 text-sm font-medium">✅ You're on the list!</span>
          </div>
        )}
        <button onClick={onClose} className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-400 transition-all">Maybe later</button>
      </div>
    </div>
  );
};

// ─── Free Tier Modal ──────────────────────────────────────────────────────────
const FreeTierModal = ({ onClose }) => {
  const navigate = useNavigate();
  const benefits = [
    { icon:'🚀', title:'5 Campaigns/month',   desc:'Create up to 5 full marketing campaigns'     },
    { icon:'🤖', title:'4 AI Providers',       desc:'Claude, GPT-4, Gemini & Grok'               },
    { icon:'📱', title:'13+ Content Formats',  desc:'TikTok, Instagram, YouTube, Email and more'  },
    { icon:'🎨', title:'Design Editor',        desc:'18 palettes, drag-drop canvas, PNG export'   },
    { icon:'💼', title:'Brand Identity',       desc:'Full brand profile system'                   },
    { icon:'🆓', title:'Always Free',          desc:'No credit card required, ever'               },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mx-auto mb-4">🆓</div>
          <h2 className="text-xl font-black text-white mb-1">What's included in Starter</h2>
          <p className="text-sm text-gray-400">Everything you need to get started — completely free.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-3">
              <div className="text-xl mb-1">{b.icon}</div>
              <div className="text-sm font-bold text-white mb-0.5">{b.title}</div>
              <div className="text-xs text-gray-400">{b.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { onClose(); navigate('/signup'); }} className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-amber-700 transition-all">Create Free Account</button>
          <button onClick={() => { onClose(); navigate('/login'); }} className="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-700 transition-all">Sign In</button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-400 transition-all">Close</button>
      </div>
    </div>
  );
};

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const FAQItem = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  const [ref, visible] = useReveal(0.1);
  return (
    <div ref={ref} className={`transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay:`${index*60}ms`}}>
      <button onClick={() => setOpen(!open)} className="w-full text-left bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-500 transition-all group">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{q}</h3>
          <span className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
        {open && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{a}</p>}
      </button>
    </div>
  );
};

// ─── Main Pricing Page ────────────────────────────────────────────────────────
const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [heroRef, heroVisible] = useReveal(0.1);
  const [cardsRef, cardsVisible] = useReveal(0.1);

  const plans = [
    {
      name: 'Starter',
      description: 'Everything you need to create viral content — completely free.',
      monthlyPrice: 0, annualPrice: 0,
      features: ['5 campaigns per month','13+ content formats','4 AI providers (Claude, GPT-4, Gemini, Grok)','Design Editor with PNG export','Brand Identity system','Social media posting','Community gallery','Email support'],
      cta: 'Get Started Free',
      popular: false, color: 'gray', type: 'free',
      icon: '🆓',
    },
    {
      name: 'Professional',
      description: 'For marketing teams and agencies with high-volume needs.',
      monthlyPrice: 29, annualPrice: 24,
      features: ['Unlimited campaigns','500 content pieces/month','All AI providers + priority','Advanced analytics','Team collaboration (5 members)','Scheduled & autonomous posting','Priority support','Custom brand profiles'],
      cta: 'Coming Soon',
      popular: true, color: 'emerald', type: 'paid',
      icon: '⚡',
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with custom requirements and dedicated support.',
      monthlyPrice: 99, annualPrice: 79,
      features: ['Unlimited everything','Custom content formats','White-label options','Advanced team management','Custom AI model training','API access','Dedicated account manager','24/7 phone support'],
      cta: 'Coming Soon',
      popular: false, color: 'amber', type: 'paid',
      icon: '🏢',
    },
  ];

  const handleCTA = (plan) => {
    if (plan.type === 'free') { isAuthenticated ? navigate('/dashboard') : setActiveModal('free'); }
    else setActiveModal(plan);
  };

  const getCtaLabel = (plan) => {
    if (plan.type === 'free') return isAuthenticated ? '🚀 Go to Dashboard' : 'Get Started Free';
    return '🔔 Notify Me at Launch';
  };

  const faqs = [
    { q: 'Can I change plans anytime?',          a: "Yes. Upgrade, downgrade, or cancel at any time. Changes take effect at the next billing cycle." },
    { q: 'What happens if I exceed my limits?',  a: "We'll notify you when approaching limits. You can upgrade anytime or wait until your limits reset next cycle." },
    { q: 'Is there a free trial for paid plans?', a: "Yes — 14-day free trial with full access once paid plans launch. No credit card required during trial." },
    { q: 'When will paid plans be available?',   a: "We're actively building payment infrastructure. Sign up for notifications on any paid plan card above." },
    { q: 'Do you offer team discounts?',         a: "Yes! Teams of 10+ get special pricing. Contact us for a custom quote." },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"/>
          <div className="absolute top-10 right-1/4 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-3xl"/>
        </div>
        <div ref={heroRef} className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
            Pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-5">
            Simple, transparent<br/>
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">pricing.</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Start free, upgrade as you grow. No hidden fees, no surprises. Cancel anytime.
          </p>

          {isAuthenticated && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <span className="text-amber-400 text-sm font-medium">✅ Signed in as {user?.email} · Currently on Starter</span>
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-semibold ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
            <button onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-emerald-600' : 'bg-gray-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
            <span className={`text-sm font-semibold ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Annual
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/20">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Cards ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div ref={cardsRef} className={`grid lg:grid-cols-3 gap-6 transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {plans.map((plan, i) => (
            <div key={i} className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
              plan.popular ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`} style={{transitionDelay:`${i*80}ms`}}>

              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-full shadow-lg shadow-emerald-500/30">Most Popular</span>
                </div>
              )}

              {plan.type === 'paid' && (
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">🚧 Coming Soon</span>
                </div>
              )}

              {plan.type === 'free' && isAuthenticated && (
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">✅ Your Plan</span>
                </div>
              )}

              <div className="p-7">
                <div className="text-center mb-7">
                  <div className="text-3xl mb-3">{plan.icon}</div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-gray-900 dark:text-white">${isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Billed ${(plan.annualPrice*12).toFixed(0)}/year
                      <span className="ml-1 text-amber-400 font-semibold">(save ${((plan.monthlyPrice-plan.annualPrice)*12).toFixed(0)})</span>
                    </p>
                  )}
                  {plan.monthlyPrice === 0 && <p className="text-xs text-emerald-400 font-semibold mt-1">Free forever · No credit card</p>}
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${plan.popular ? 'bg-emerald-500/20 text-emerald-400' : plan.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-400'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button onClick={() => handleCTA(plan)}
                  className={`w-full py-3.5 rounded-xl font-black text-sm transition-all ${
                    plan.type === 'free' && isAuthenticated ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 shadow-lg' :
                    plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20' :
                    plan.color === 'amber' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20' :
                    'bg-gray-700 text-white hover:bg-gray-600'
                  }`}>
                  {getCtaLabel(plan)}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="text-center mt-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">30-day money-back guarantee on all paid plans</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800 py-20 px-4">
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

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-gray-800 relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl"/>
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {isAuthenticated ? "You're already on the Starter plan. Start creating campaigns now." : "Join creators and businesses using IVey to generate viral content."}
          </p>
          {isAuthenticated ? (
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl text-sm">
              Go to Dashboard <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
          ) : (
            <Link to="/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl text-sm">
              Start Free Today <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
          )}
          <p className="text-xs text-gray-600 mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Modals */}
      {activeModal === 'free' && <FreeTierModal onClose={() => setActiveModal(null)}/>}
      {activeModal && activeModal !== 'free' && <ComingSoonModal plan={activeModal} onClose={() => setActiveModal(null)}/>}
    </div>
  );
};

export default Pricing;