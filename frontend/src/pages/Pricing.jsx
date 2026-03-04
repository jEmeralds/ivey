import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/authContext';

// ─── Coming Soon Modal (paid plans) ──────────────────────────────────────────
const ComingSoonModal = ({ plan, onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  if (!plan) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 ${plan.name === 'Professional' ? 'bg-purple-500/15' : 'bg-blue-500/15'}`}>
          {plan.name === 'Professional' ? '⚡' : '🏢'}
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">{plan.name} Plan — Coming Soon</h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          We're working hard to bring you the {plan.name} plan. {user ? "We'll notify you at your registered email when it launches." : "Leave your email and we'll notify you the moment it launches."}
        </p>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">What you'll get</p>
          <ul className="space-y-2">
            {plan.features.slice(0, 4).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${plan.name === 'Professional' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>✓</span>
                {feature}
              </li>
            ))}
            {plan.features.length > 4 && (
              <li className="text-xs text-gray-500 pl-6">+ {plan.features.length - 4} more features</li>
            )}
          </ul>
        </div>

        <div className={`rounded-xl p-4 mb-6 text-center border ${plan.name === 'Professional' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
          <p className="text-xs text-gray-400 mb-1">Starting at</p>
          <p className={`text-3xl font-bold ${plan.name === 'Professional' ? 'text-purple-300' : 'text-blue-300'}`}>
            ${plan.annualPrice}<span className="text-sm font-normal text-gray-400">/mo</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">billed annually · or ${plan.monthlyPrice}/mo monthly</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
            />
            <button
              type="submit"
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${plan.name === 'Professional' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Notify Me
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <span className="text-green-400 text-sm font-medium">✅ You're on the list! We'll notify you at {email}</span>
          </div>
        )}

        <button onClick={onClose} className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-all">
          Maybe later
        </button>
      </div>
    </div>
  );
};

// ─── Free Tier Modal ──────────────────────────────────────────────────────────
const FreeTierModal = ({ onClose }) => {
  const navigate = useNavigate();

  const benefits = [
    { icon: '🚀', title: '5 Campaigns/month', desc: 'Create up to 5 full marketing campaigns' },
    { icon: '🤖', title: '3 AI Providers', desc: 'Access Claude, GPT-4, and Gemini' },
    { icon: '📱', title: '10+ Content Formats', desc: 'TikTok, Instagram, YouTube, Email and more' },
    { icon: '🔗', title: 'Save & Share', desc: 'Save content and share via public links' },
    { icon: '📊', title: 'Marketing Strategy', desc: 'AI-generated strategy for every campaign' },
    { icon: '🆓', title: 'Always Free', desc: 'No credit card required, ever' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center text-2xl mx-auto mb-4">🆓</div>
          <h2 className="text-xl font-bold text-white mb-1">What's included in Starter</h2>
          <p className="text-sm text-gray-400">Everything you need to get started — completely free, no credit card needed.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-3">
              <div className="text-xl mb-1">{b.icon}</div>
              <div className="text-sm font-semibold text-white mb-0.5">{b.title}</div>
              <div className="text-xs text-gray-400">{b.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { onClose(); navigate('/signup'); }}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-all"
          >
            Create Free Account
          </button>
          <button
            onClick={() => { onClose(); navigate('/login'); }}
            className="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-all"
          >
            Sign In
          </button>
        </div>

        <button onClick={onClose} className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-all">
          Close
        </button>
      </div>
    </div>
  );
};

// ─── Main Pricing Page ────────────────────────────────────────────────────────
const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals and small businesses getting started with AI content",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "5 campaigns per month",
        "50 content pieces per month",
        "3 AI providers (Claude, GPT-4, Gemini)",
        "10+ content formats",
        "Save & share content",
        "Basic analytics",
        "Email support"
      ],
      cta: "Get Started Free",
      popular: false,
      color: "gray",
      type: "free"
    },
    {
      name: "Professional",
      description: "Ideal for marketing teams and agencies with regular content needs",
      monthlyPrice: 29,
      annualPrice: 24,
      features: [
        "Unlimited campaigns",
        "500 content pieces per month",
        "All AI providers + priority access",
        "15+ content formats",
        "Advanced analytics & insights",
        "Team collaboration (5 members)",
        "Media upload & integration",
        "Priority support"
      ],
      cta: "Coming Soon",
      popular: true,
      color: "purple",
      type: "paid"
    },
    {
      name: "Enterprise",
      description: "Designed for large organizations with custom requirements",
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        "Unlimited everything",
        "Custom content formats",
        "White-label options",
        "Advanced team management",
        "Custom AI model training",
        "API access",
        "Dedicated account manager",
        "24/7 phone support"
      ],
      cta: "Coming Soon",
      popular: false,
      color: "blue",
      type: "paid"
    }
  ];

  const handleCTA = (plan) => {
    if (plan.type === 'free') {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        setActiveModal('free');
      }
    } else {
      setActiveModal(plan);
    }
  };

  const getCtaLabel = (plan) => {
    if (plan.type === 'free') {
      return isAuthenticated ? '🚀 Go to Dashboard' : 'Get Started Free';
    }
    return '🔔 Notify Me at Launch';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">

      {/* Hero — flat, same bg as page */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Start free, upgrade as you grow. No hidden fees, no surprises.
              Cancel anytime with 30-day money-back guarantee.
            </p>

            {isAuthenticated && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-6">
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                  ✅ You're signed in as {user?.email} — currently on the Starter plan
                </span>
              </div>
            )}

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isAnnual ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Annual
                <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  Save 20%
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${
                plan.popular
                  ? 'border-purple-500 dark:border-purple-400 shadow-purple-100 dark:shadow-purple-900/20'
                  : plan.color === 'blue'
                  ? 'border-gray-200 dark:border-blue-900/50'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-purple-600 text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {plan.type === 'paid' && (
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${plan.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                    🚧 Coming Soon
                  </span>
                </div>
              )}

              {plan.type === 'free' && isAuthenticated && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    ✅ Your Plan
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">{plan.description}</p>

                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/month</span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Billed as ${(plan.annualPrice * 12).toFixed(0)}/year
                      <span className="ml-1 text-green-500 font-medium">(save ${((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)})</span>
                    </p>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <p className="text-xs text-green-500 font-medium mt-2">Free forever · No credit card needed</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <svg className={`w-3 h-3 ${
                          plan.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                          plan.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                          'text-green-600 dark:text-green-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCTA(plan)}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-center transition-all ${
                    plan.type === 'free' && isAuthenticated
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20'
                      : plan.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/25'
                      : plan.color === 'blue'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  }`}
                >
                  {getCtaLabel(plan)}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-green-700 dark:text-green-300 font-medium text-sm">
              30-day money-back guarantee on all paid plans
            </span>
          </div>
        </div>
      </div>

      {/* FAQ — flat, same bg as page */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently asked questions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Everything you need to know about IVey pricing</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Can I change plans anytime?", a: "Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the next billing cycle." },
              { q: "What happens if I exceed my limits?", a: "We'll notify you when you're approaching your limits. You can upgrade anytime or wait until the next billing cycle when your limits reset." },
              { q: "Do you offer team discounts?", a: "Yes! Teams of 10+ users get special pricing. Contact our sales team for a custom quote tailored to your needs." },
              { q: "Is there a free trial?", a: "Our Starter plan is completely free forever. For paid plans, we offer a 14-day free trial with full access to all features once they launch." },
              { q: "When will paid plans be available?", a: "We're actively building out our paid plans and payment infrastructure. Sign up for notifications on the pricing cards above and we'll let you know the moment they launch." },
            ].map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {isAuthenticated ? "You're already on the Starter plan. Start creating campaigns now." : "Join thousands of marketers using IVey to create viral content"}
          </p>
          {isAuthenticated ? (
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors shadow-sm">
              Go to Dashboard
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors shadow-sm">
              Start Free Today
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'free' && <FreeTierModal onClose={() => setActiveModal(null)} />}
      {activeModal && activeModal !== 'free' && <ComingSoonModal plan={activeModal} onClose={() => setActiveModal(null)} />}
    </div>
  );
};

export default Pricing;