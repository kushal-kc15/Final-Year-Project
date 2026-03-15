import React from 'react';
import { Wallet, PieChart, Shield, Zap, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wallet className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">SpendSmart AI</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition">Features</a>
          <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
          <a href="#security" className="hover:text-blue-600 transition">Security</a>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition shadow-sm">
          Get Started Free
        </button>
      </nav>

      {/* Hero Section */}
      <header className="px-8 py-20 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
          Master your money with <span className="text-blue-600">Intelligence.</span>
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop wondering where your paycheck went. SpendSmart uses AI to categorize 
          expenses, predict future bills, and help you save $500+ every month.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2">
            Start Tracking Now <ChevronRight size={20} />
          </button>
          <button className="bg-white border border-slate-300 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition">
            View Demo
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="px-8 py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-16 text-center">Why switch to SpendSmart?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Zap className="text-blue-600" size={32} />}
              title="Auto-Categorization"
              description="Our AI learns your habits and automatically labels transactions with 99% accuracy."
            />
            <FeatureCard 
              icon={<PieChart className="text-blue-600" size={32} />}
              title="Visual Analytics"
              description="Deep-dive into your spending with beautiful, interactive charts and weekly insights."
            />
            <FeatureCard 
              icon={<Shield className="text-blue-600" size={32} />}
              title="Bank-Grade Security"
              description="We use 256-bit encryption and never store your login credentials. Your data is yours."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <footer className="bg-blue-600 py-20 text-center text-white px-8">
        <h2 className="text-4xl font-bold mb-6">Ready to take control?</h2>
        <p className="text-blue-100 mb-10 text-lg">Join 50,000+ users optimizing their financial future.</p>
        <button className="bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-slate-100 transition shadow-lg">
          Create Your Free Account
        </button>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-md transition">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;



