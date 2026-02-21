import { Link } from 'react-router-dom';
import { useState } from 'react';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

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
        "Basic analytics",
        "Email support"
      ],
      cta: "Get Started Free",
      popular: false,
      color: "gray"
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
      cta: "Start Free Trial",
      popular: true,
      color: "purple"
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
      cta: "Contact Sales",
      popular: false,
      color: "blue"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      
      {/* Hero Section */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Start free, upgrade as you grow. No hidden fees, no surprises. 
              Cancel anytime with 30-day money-back guarantee.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
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
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm transition-all hover:shadow-lg ${
                plan.popular
                  ? 'border-purple-500 dark:border-purple-400 shadow-purple-100 dark:shadow-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-purple-600 text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{isAnnual ? 'month' : 'month'}
                    </span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      ${plan.monthlyPrice * 12}/year billed monthly
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <Link
                    to={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                    className={`block w-full py-4 px-6 rounded-xl font-semibold text-center transition-colors ${
                      plan.popular
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-green-700 dark:text-green-300 font-medium">
              30-day money-back guarantee on all paid plans
            </span>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to know about IVey pricing
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
                Changes take effect at the next billing cycle.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We'll notify you when you're approaching your limits. You can upgrade anytime 
                or wait until the next billing cycle when your limits reset.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer team discounts?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! Teams of 10+ users get special pricing. Contact our sales team 
                for a custom quote tailored to your needs.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our Starter plan is completely free forever. For paid plans, we offer 
                a 14-day free trial with full access to all features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of marketers using IVey to create viral content
          </p>
          <Link 
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            Start Free Today
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;