'use client';

export function SubscriptionTab() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      current: true,
      features: [
        '10 questions per day',
        'Basic statistics',
        'Community lobby access',
        'Study streak tracking',
      ],
    },
    {
      name: 'Basic',
      price: '$9',
      period: 'per month',
      current: false,
      features: [
        'Unlimited questions',
        'Advanced statistics',
        'Priority support',
        'Custom study plans',
        'All Free features',
      ],
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$29',
      period: 'per month',
      current: false,
      features: [
        'Everything in Basic',
        'Expert Q&A sessions',
        'Downloadable resources',
        'Personalized coaching',
        '1-on-1 study sessions',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium">
          Subscription management coming soon! Premium features will be available shortly.
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Plans</h2>
        <p className="text-gray-600 mb-6">
          Choose the plan that best fits your study needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-2xl shadow-xl p-6 border-2 transition-all ${
              plan.current
                ? 'border-primary-600'
                : plan.highlighted
                ? 'border-primary-400 scale-105'
                : 'border-gray-200'
            }`}
          >
            {plan.highlighted && (
              <div className="bg-primary-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full inline-block mb-4">
                Most Popular
              </div>
            )}

            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-gray-600 text-sm ml-2">{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className={`w-full py-3 rounded-xl font-bold transition-all disabled:cursor-not-allowed ${
                plan.current
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-blue-100 text-blue-400'
              }`}
            >
              {plan.current ? 'Current Plan' : 'Coming Soon'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
