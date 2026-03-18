import React from "react";
import "./App.css";

function App() {
  return (
    <div className="container">
      
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="logo">Vyapar Margdarshan</h1>
        <ul className="nav-links">
          <li>Home</li>
          <li>Features</li>
          <li>Pricing</li>
          <li><button className="btn">Login</button></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h2>Manage Your Expenses with Logic</h2>
          <p>Track, analyze and grow your money with a premium experience.</p>
          <button className="btn">Get Started</button>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="card">
          <h3>Smart Tracking</h3>
          <p>Track all your expenses easily.</p>
        </div>

        <div className="card">
          <h3>Analytics</h3>
          <p>Beautiful charts and insights.</p>
        </div>

        <div className="card">
          <h3>Secure</h3>
          <p>Your data is always safe.</p>
        </div>
      </section>

    </div>
  );
}

export default App;