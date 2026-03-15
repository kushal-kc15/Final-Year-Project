import React from "react";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header Section */}
      <header className="text-center py-12 bg-white shadow">
        <h1 className="text-4xl font-bold">Vyapar Margdarshan</h1>
        <p className="mt-2 text-lg">Smart Expense Tracking for SMEs</p>
        <p className="mt-1 text-gray-600">
          Organize expenses, gain insights, and make better financial decisions.
        </p>
        <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg">
          Get Started Free
        </button>
        <div className="mt-4 text-red-600 font-semibold">
          Alert: Overspending Detected!
        </div>
      </header>

      {/* Key Features */}
      <section className="py-12 px-6">
        <h2 className="text-2xl font-semibold text-center mb-6">Key Features</h2>
        <ul className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
          <li>Expense Entry & Categorization</li>
          <li>Rule-Based Advisory</li>
          <li>Dashboard & Reports</li>
          <li>Secure User Roles</li>
        </ul>
      </section>

      {/* Why SMEs Need */}
      <section className="bg-gray-100 py-12 px-6">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Why SMEs Need Vyapar Margdarshan
        </h2>
        <ul className="max-w-3xl mx-auto space-y-3 text-center">
          <li>Save Time: Automate your tracking</li>
          <li>Reduce Errors: Accurate records</li>
          <li>Gain Insights: Smart Alerts & Analysis</li>
        </ul>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-6">
        <h2 className="text-2xl font-semibold text-center mb-6">Testimonials</h2>
        <p className="text-center italic">"This tool transformed our SME finances!"</p>
        <div className="flex justify-center mt-4 space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        </div>
      </section>

      {/* Data Safety */}
      <section className="bg-gray-100 py-12 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">Data Safety</h2>
        <p>Your Information Secured</p>
        <p className="mt-2">Made for SMEs — Tailored for Local Business</p>
      </section>

      {/* Pricing / Sign Up */}
      <section className="py-12 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">Free Trial Available</h2>
        <p>Affordable Plans</p>
        <div className="mt-6">
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg">
            Sign Up with Email
          </button>
          <div className="mt-4 flex justify-center space-x-4">
            <button className="px-4 py-2 bg-gray-200 rounded">G</button>
            <button className="px-4 py-2 bg-gray-200 rounded">M</button>
          </div>
          <p className="mt-4 text-sm">
            Already have an account? <a href="#" className="text-blue-600">Log in</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 text-center">
        <nav className="space-x-4">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Blog</a>
          <a href="#" className="hover:underline">Support</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms</a>
        </nav>
        <p className="mt-4">Soch College of IT</p>
      </footer>
    </div>
  );
}

export default LandingPage;


