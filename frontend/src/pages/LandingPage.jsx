import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/">
              <Logo className="w-16 h-16" variant="default" />
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors px-4 py-2">
                Sign In
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
              <span className="material-icons text-green-600 text-sm">verified</span>
              <span className="text-sm font-semibold text-green-700">Trusted by 500+ Nepali Businesses</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
              Expense Management,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Simplified for You
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto font-medium">
              Track expenses, approve budgets, and generate reports in minutes. 
              Built for Your businesses..
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/register" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-base font-semibold shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all flex items-center gap-2">
                Sign Up
              </Link>
              <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl text-base font-semibold transition-all flex items-center gap-2">
                <span className="material-icons text-red-500">play_circle</span>
                Sign In
              </button>
            </div>

            {/* Trust Line */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="material-icons text-green-600 text-lg">check_circle</span>
                <span className="font-medium">Free 30-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-green-600 text-lg">check_circle</span>
                <span className="font-medium">No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-green-600 text-lg">check_circle</span>
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-6xl mx-auto">
            {/* Floating Elements - Expense Related */}
            <div className="absolute -top-10 left-10 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-green-600 text-lg">check_circle</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Approved</div>
                  <div className="text-lg font-bold text-gray-900">रू 12,400</div>
                </div>
              </div>
            </div>

            <div className="absolute -top-10 right-10 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-orange-600 text-lg">pending</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Pending</div>
                  <div className="text-lg font-bold text-gray-900">8</div>
                </div>
              </div>
            </div>

            <div className="absolute top-20 -right-10 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-blue-600 text-lg">receipt_long</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">This Month</div>
                  <div className="text-sm font-semibold text-gray-900">रू 4.8L</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-20 -left-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-4 text-white z-10">
              <div className="text-xs mb-1 font-medium">Budget Used</div>
              <div className="text-2xl font-bold">68%</div>
            </div>

            {/* Main Dashboard */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser Bar */}
              <div className="bg-gray-100 px-6 py-4 flex items-center gap-3 border-b border-gray-200">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-block bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-sm text-gray-600">
                    app.vyapar.com.np
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-sm text-gray-500 mb-1 font-medium">Expense Dashboard</div>
                    <div className="text-2xl font-bold text-gray-900">Track expenses, manage approvals, and monitor budgets in real-time.</div>
                  </div>
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                    Add Expense
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-700">Recent Expenses</span>
                      <span className="material-icons text-gray-400 text-sm">more_horiz</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Office Supplies</span>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">Approved</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Team Lunch</span>
                        <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium">Pending</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Software License</span>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">Approved</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="text-sm font-semibold text-gray-700 mb-4">Categories</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-blue-500">restaurant</span>
                        <span className="text-sm text-gray-700">Food & Dining</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-green-500">directions_car</span>
                        <span className="text-sm text-gray-700">Transport</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-purple-500">business_center</span>
                        <span className="text-sm text-gray-700">Office</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="text-sm font-semibold text-gray-700 mb-4">Team Members</div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        KK
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Kushal KC</div>
                        <div className="text-xs text-gray-500">Owner</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Manage team expenses, set budgets, and approve requests in real-time.</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm font-semibold text-gray-900">Monthly Expense Trends</div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600 font-medium">Expenses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-600 font-medium">Budget</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-40 gap-2">
                    {[40, 65, 45, 80, 60, 90, 75, 55, 85, 70, 95, 78].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-1">
                        <div 
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div 
                          className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all hover:from-purple-600 hover:to-purple-500"
                          style={{ height: `${height * 0.7}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-gray-500">
                    <span>Month 1</span>
                    <span>Month 2</span>
                    <span>Month 3</span>
                    <span>Month 4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Floating Card */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200 z-10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-blue-500">receipt_long</span>
                  <span className="text-sm font-semibold text-gray-700">Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-green-500">approval</span>
                  <span className="text-sm font-semibold text-gray-700">Approvals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-purple-500">analytics</span>
                  <span className="text-sm font-semibold text-gray-700">Reports</span>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  +5 more
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Sets Us Apart
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore the features that make managing your operations easier, smarter, and more efficient.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                <span className="material-icons text-white text-2xl">dashboard_customize</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customizable Views</h3>
              <p className="text-gray-600 leading-relaxed">
                Easily tailor your dashboard with flexible layouts, widgets, and data displays that fit your workflow.
              </p>
            </div>

            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <span className="material-icons text-white text-2xl">analytics</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-Time Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Access live metrics and actionable insights to make informed decisions faster and stay ahead of the game.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">Choose the plan that fits your business needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                period: 'Forever',
                features: ['Up to 5 users', '50 expenses/month', 'Basic reports', 'Email support'],
                cta: 'Start Free',
                popular: false,
              },
              {
                name: 'Business',
                price: 'रू 2,499',
                period: 'per month',
                features: ['Unlimited users', 'Unlimited expenses', 'Advanced reports', 'Priority support', 'Custom workflows'],
                cta: 'Start Free Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'Contact us',
                features: ['Everything in Business', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`bg-white rounded-2xl p-8 ${
                plan.popular ? 'border-2 border-blue-500 shadow-2xl shadow-blue-500/20 relative' : 'border border-gray-200 shadow-lg'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  </div>
                  <p className="text-sm text-gray-600">{plan.period}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="material-icons text-green-500 text-xl">check_circle</span>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 lg:px-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8 leading-tight">
            Manage all your business expenses in one platform.
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-sm">
              Start a free trial
            </Link>
            <a href="mailto:hello@vyapar.com.np" className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-sm">
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <Link to="/" className="inline-block mb-4">
                <Logo className="w-12 h-12" variant="white" />
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed">
                Complete expense management solution for Nepali businesses.
              </p>
            </div>

            {/* Help & Resources */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Help & Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Business Travel</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Expense Management</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Corporate Cards</a></li>
              </ul>
            </div>

            {/* Free Tools */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Free Tools</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Free Expense Calculator</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Free Budget Calculator</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Invoice Templates</a></li>
              </ul>
            </div>

            {/* Company Info */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company Info</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="material-icons text-base">phone</span>
                  <span>Monday-Friday<br/>+977-XXX-XXXX</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="material-icons text-base">email</span>
                  <span>support@vyapar.com.np</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Security</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Compliance</a>
              <a href="#" className="hover:text-gray-300 transition-colors">IPR Complaints</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Anti-spam Policy</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            </div>
            <p className="text-xs text-gray-500">© 2026 Vyapar Margadarshan Pvt. Ltd. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
