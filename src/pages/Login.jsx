import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, 
  Sparkles, Layers, Activity, Wifi, CheckCircle2 
} from 'lucide-react';
import { setAuth } from '../store/DataStore';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('krishnaniti@gmail.com');
  const [password, setPassword] = useState('Krishnaniti123');
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'krishnaniti@gmail.com' && password === 'Krishnaniti123') {
      setIsLoggingIn(true);

      setTimeout(() => {
        setLoginSuccess(true);
        setIsLoggingIn(false);

        setTimeout(() => {
          setAuth(true);
          const savedPath = localStorage.getItem('codecraft_last_visited_path');
          const target = location.state?.from?.pathname || (savedPath && savedPath !== '/' ? savedPath : '/products');
          navigate(target, { replace: true });
        }, 800);
      }, 900);
    } else {
      alert(t('login.invalid_credentials'));
    }
  };

  return (
    <div className={`login-page-body ${isDark ? 'dark-mode' : ''}`}>
      <div className="login-wrapper">

        {/* =========================
             LEFT BRANDING PANEL
        ========================== */}
        <section className="branding-panel">
          <div className="wave"></div>
          <div className="wave two"></div>
          <div className="wave three"></div>

          {/* Top Brand Bar */}
          <div className="branding-top">
            <div className="brand">
              <img src="/favicon.svg" alt="Codecraft CRM" className="brand-logo-img" />
              <div className="brand-text">
                <div className="brand-name">
                  {t('login.brand_name')}
                  <span>{t('login.brand_sub')}</span>
                </div>
              </div>
            </div>
            <div className="brand-pill">
              <Sparkles size={12} className="pill-sparkle" />
              <span>CRM Platform</span>
            </div>
          </div>

          {/* Main Showcase (Fills the center space) */}
          <div className="branding-middle">
            <div className="hero-content">
              <h2 className="hero-title">
                {t('login.hero_title_1')}<br />
                <span>{t('login.hero_title_2')}</span>
              </h2>
              <p className="hero-description">
                {t('login.hero_desc')}
              </p>
            </div>

            {/* Glass Feature Highlights */}
            <div className="features-glass-card">
              <div className="glass-feature-item">
                <div className="glass-feature-icon">
                  <Layers size={17} />
                </div>
                <div className="glass-feature-info">
                  <div className="glass-feature-title">Multi-Product Pipeline</div>
                  <div className="glass-feature-sub">Unified tracking for ERP, Election & AI modules</div>
                </div>
              </div>

              <div className="glass-feature-item">
                <div className="glass-feature-icon">
                  <Activity size={17} />
                </div>
                <div className="glass-feature-info">
                  <div className="glass-feature-title">Real-Time Journey Logging</div>
                  <div className="glass-feature-sub">Calls, scheduled demos & milestone tracking</div>
                </div>
              </div>

              <div className="glass-feature-item">
                <div className="glass-feature-icon">
                  <Wifi size={17} />
                </div>
                <div className="glass-feature-info">
                  <div className="glass-feature-title">100% Offline PWA Mode</div>
                  <div className="glass-feature-sub">Fast desktop application with local cache sync</div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="branding-metrics-bar">
              <div className="metric-pill">
                <span className="metric-num">5</span>
                <span className="metric-label">Products</span>
              </div>
              <div className="metric-sep"></div>
              <div className="metric-pill">
                <span className="metric-num">100%</span>
                <span className="metric-label">Offline Sync</span>
              </div>
              <div className="metric-sep"></div>
              <div className="metric-pill">
                <span className="metric-num">Instant</span>
                <span className="metric-label">PDF Reports</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Quote */}
          <div className="branding-footer">
            <div className="quote-box">
              <span className="quote-mark">“</span>
              <p className="quote-text">{t('login.quote').replace(/<br\s*\/?>/gi, ' ')}</p>
            </div>
          </div>
        </section>

        {/* =========================
             RIGHT LOGIN PANEL
        ========================== */}
        <section className="form-panel">
          <div className="login-top-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setIsDark(!isDark)}
            >
              ◐ <span>{isDark ? t('login.light') : t('login.dark')}</span>
            </button>
          </div>

          <div className="form-inner">
            {/* Header */}
            <div className="form-header">
              <div className="security-icon-badge">
                <ShieldCheck size={26} strokeWidth={2.4} />
              </div>
              <h1>{t('login.welcome_back')}</h1>
              <p>{t('login.portal_title')}</p>
              <div className="small-line"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="login-form-element">

              {/* Username */}
              <div className="field">
                <label htmlFor="username">{t('login.username_label')}</label>
                <div className="input-wrapper">
                  <Mail size={16} strokeWidth={2} className="input-icon" />
                  <input
                    id="username"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('login.username_placeholder')}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor="password">{t('login.password_label')}</label>
                <div className="input-wrapper">
                  <Lock size={16} strokeWidth={2} className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.password_placeholder')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="remember">
                  <input type="checkbox" id="remember" defaultChecked />
                  <span>{t('login.remember_me')}</span>
                </label>
                <a href="#" className="forgot" onClick={(e) => { e.preventDefault(); alert("Please contact administrator for credential recovery."); }}>{t('login.forgot_password')}</a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="login-btn"
                disabled={isLoggingIn || loginSuccess}
              >
                {isLoggingIn ? (
                  <>
                    <span>{t('login.signing_in')}</span>
                    <span className="arrow-spinner">⌛</span>
                  </>
                ) : loginSuccess ? (
                  <>
                    <span>{t('login.login_success')}</span>
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  </>
                ) : (
                  <>
                    <span>{t('login.login_button')}</span>
                    <ArrowRight size={17} strokeWidth={2.4} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Note */}
            <div className="demo-credentials-badge">
              <span className="demo-badge-tag">Demo Access</span>
              <span className="demo-badge-info">krishnaniti@gmail.com</span>
            </div>

            {/* Support / Trust footer */}
            <div className="form-security-footer">
              <ShieldCheck size={13} className="shield-trust-icon" />
              <span>256-Bit SSL Encrypted &bull; Supabase Protected</span>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
