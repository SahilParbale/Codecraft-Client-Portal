import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuth } from '../store/DataStore';
import './Login.css';
import logoImg from '../assets/logo.jpeg';

export default function Login() {
  const [username, setUsername] = useState('krishnaniti@gmail.com');
  const [password, setPassword] = useState('password123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const availableHeight = window.innerHeight - 68; // Account for 34px padding top+bottom
      if (availableHeight < 750) {
        setScale(availableHeight / 750);
      } else {
        setScale(1);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      setIsLoggingIn(true);

      // Simulate API delay as requested in the HTML script
      setTimeout(() => {
        setLoginSuccess(true);
        setIsLoggingIn(false);

        setTimeout(() => {
          setAuth(true);
          navigate('/products');
        }, 800);
      }, 1000);
    }
  };

  return (
    <div className={`login-page-body ${isDark ? 'dark-mode' : ''}`}>
      <div 
        className="login-wrapper" 
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >

        {/* =========================
             LEFT BRANDING PANEL
        ========================== */}
        <section className="branding-panel">
          <div className="wave"></div>
          <div className="wave two"></div>
          <div className="wave three"></div>

          {/* Logo */}
          <div className="brand">

            <div className="brand-text">
              <div className="brand-name">
                CODECRAFT
                <span>SOLUTIONS</span>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="hero-content">
            <h2 className="hero-title">
              Track. Monitor.<br />
              <span>Deliver.</span>
            </h2>
            <p className="hero-description">
              Welcome back! Log in to access your projects,
              updates, and client insights all in one place.
            </p>



            {/* Features */}
            <div className="features">
              <div className="feature">
                <div className="feature-icon">♢</div>
                <div className="feature-title">Secure</div>
                <div className="feature-text">Your data is safe<br />with us.</div>
              </div>
              <div className="feature">
                <div className="feature-icon">⚡</div>
                <div className="feature-title">Fast</div>
                <div className="feature-text">Quick access to<br />what matters.</div>
              </div>
              <div className="feature">
                <div className="feature-icon">▥</div>
                <div className="feature-title">Reliable</div>
                <div className="feature-text">Insights you can<br />count on.</div>
              </div>
            </div>

            {/* Quote */}
            <div className="quote">
              <div className="quote-mark">“</div>
              <div>
                Building digital solutions that drive<br />
                success for your business.”
              </div>
            </div>
          </div>
        </section>

        {/* =========================
             RIGHT LOGIN PANEL
        ========================== */}
        <section className="form-panel">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setIsDark(!isDark)}
          >
            ◐ <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          <div className="form-inner">

            {/* Header */}
            <div className="form-header">
              <div className="security-icon">♙</div>
              <h1>Welcome Back</h1>
              <p>Client Tracking Portal</p>
              <div className="small-line"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin}>

              {/* Username */}
              <div className="field">
                <label htmlFor="username">USERNAME</label>
                <div className="input-wrapper">
                  <span className="input-icon">♙</span>
                  <input
                    id="username"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor="password">PASSWORD</label>
                <div className="input-wrapper">
                  <span className="input-icon">♙</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    ◉
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="remember">
                  <input type="checkbox" id="remember" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot">Forgot Password?</a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="login-btn"
                style={{ opacity: isLoggingIn ? 0.8 : 1 }}
                disabled={isLoggingIn || loginSuccess}
              >
                {isLoggingIn ? (
                  <>
                    <span>Signing in...</span>
                    <span className="arrow">→</span>
                  </>
                ) : loginSuccess ? (
                  <>
                    <span>Login Successful</span>
                    <span>✓</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <span className="arrow">→</span>
                  </>
                )}
              </button>
            </form>



            {/* Support */}
            <div className="support">
              Need help? <a href="#">Contact support</a>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
