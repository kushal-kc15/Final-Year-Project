import React from "react";

const LandingPage = () => {
  return (
    <div style={styles.container}>
      <style>{internalCSS}</style>

      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.logo}></div>
        <div style={styles.navLinks}>
          <span>About</span>
          <span>Blog</span>
          <span>Support</span>
        </div>
      </div>

      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroText}>
          <h1 className="title">Vyapar Margdarshan</h1>
          <h3>Smart Expense Tracking for SMEs</h3>
          <p>
            Organize expenses, gain insights, and make better financial decisions.
          </p>
          <button style={styles.primaryBtn}>Get Started Free</button>
        </div>

        <div style={styles.mockup}>
          <div className="mock-box">📊 App Mockup</div>
        </div>
      </div>

      {/* Features */}
      <div style={styles.section}>
        <h2>Key Features</h2>
        <div style={styles.grid}>
          <div className="card">Expense Entry & Categorization</div>
          <div className="card">Rule-Based Advisory</div>
          <div className="card">Dashboard & Reports</div>
          <div className="card">Secure User Roles</div>
        </div>
      </div>

      {/* Why Section */}
      <div style={styles.section}>
        <h2>Why SMEs Need Vyapar Margdarshan</h2>
        <div style={styles.grid}>
          <div className="card">
            <h3>Save Time</h3>
            <p>Automate your tracking</p>
          </div>
          <div className="card">
            <h3>Reduce Errors</h3>
            <p>Accurate records</p>
          </div>
          <div className="card">
            <h3>Gain Insights</h3>
            <p>Smart Alerts & Analysis</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={styles.section}>
        <h2>Testimonials & Logos</h2>
        <div style={styles.flex}>
          <div className="testimonial">SME Owner Testimonial</div>
          <div className="logos">Local SME Logos</div>
        </div>
      </div>

      {/* Info Section */}
      <div style={styles.section}>
        <div style={styles.flex}>
          <div className="info-box">
            <h3>Data Safety</h3>
            <p>Your information secured</p>
          </div>
          <div className="info-box">
            <h3>Made for SMEs</h3>
            <p>Tailored for local business</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={styles.section}>
        <h2>Free Trial Available</h2>
        <button style={styles.primaryBtn}>Sign Up with Email</button>
        <p>Or sign up with:</p>
        <div>
          <button className="social-btn">G</button>
          <button className="social-btn">M</button>
        </div>
        <p>
          Already have an account? <span className="link">Log in</span>
        </p>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>About</span>
        <span>Blog</span>
        <span>Support</span>
        <span>Privacy Policy</span>
        <span>Terms</span>
        <span>Soch College of IT</span>
      </div>
    </div>
  );
};

export default LandingPage;

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#ffffff",
    color: "#333",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 40px",
    borderBottom: "1px solid #eee",
  },
  navLinks: {
    display: "flex",
    gap: "20px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    padding: "50px",
  },
  heroText: {
    maxWidth: "50%",
  },
  primaryBtn: {
    backgroundColor: "#d4af37",
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "15px",
  },
  mockup: {
    width: "40%",
  },
  section: {
    padding: "40px",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  flex: {
    display: "flex",
    justifyContent: "space-around",
    gap: "20px",
    flexWrap: "wrap",
  },
  footer: {
    display: "flex",
    justifyContent: "space-around",
    padding: "20px",
    borderTop: "1px solid #eee",
    fontSize: "14px",
  },
};

const internalCSS = `
  .title {
    color: #d4af37;
    font-weight: bold;
  }

  .card {
    border: 1px solid #eee;
    padding: 20px;
    border-radius: 10px;
    background: #fff;
    transition: 0.3s;
  }

  .card:hover {
    box-shadow: 0 4px 10px rgba(212, 175, 55, 0.3);
  }

  .mock-box {
    height: 200px;
    border: 2px dashed #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .testimonial, .logos {
    border: 1px solid #ddd;
    padding: 20px;
    width: 300px;
  }

  .info-box {
    border: 1px solid #ddd;
    padding: 20px;
    width: 300px;
  }

  .social-btn {
    margin: 5px;
    padding: 10px 15px;
    border: none;
    background: #d4af37;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  }

  .link {
    color: #d4af37;
    cursor: pointer;
  }
`;