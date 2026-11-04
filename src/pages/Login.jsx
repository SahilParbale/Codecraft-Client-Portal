import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setAuth } from '../store/DataStore';
import LanguageSwitcher from '../components/LanguageSwitcher';
import PWAInstallButton from '../components/PWAInstallButton';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('krishnaniti@gmail.com');
  const [password, setPassword] = useState('Krishnaniti123');
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      // Don't apply scale transform on mobile/tablet viewports to allow natural scrolling
      if (window.innerWidth <= 850) {
        setScale(1);
        return;
      }
      const availableHeight = window.innerHeight - 68;
      if (availableHeight < 750) {
        setScale(Math.max(0.7, availableHeight / 750));
      } else {
        setScale(1);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'krishnaniti@gmail.com' && password === 'Krishnaniti123') {
      setIsLoggingIn(true);

      // Simulate API delay
      setTimeout(() => {
        setLoginSuccess(true);
        setIsLoggingIn(false);

        setTimeout(() => {
          setAuth(true);
          const savedPath = localStorage.getItem('codecraft_last_visited_path');
          const target = location.state?.from?.pathname || (savedPath && savedPath !== '/' ? savedPath : '/products');
          navigate(target, { replace: true });
        }, 800);
      }, 1000);
    } else {
      alert(t('login.invalid_credentials'));
    }
  };

  return (
    <div className={`login-page-body ${isDark ? 'dark-mode' : ''}`}>
      <div 
        className="login-wrapper" 
        style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'center center' } : undefined}
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
                {t('login.brand_name')}
                <span>{t('login.brand_sub')}</span>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="hero-content">
            <h2 className="hero-title">
              {t('login.hero_title_1')}<br />
              <span>{t('login.hero_title_2')}</span>
            </h2>
            <p className="hero-description">
              {t('login.hero_desc')}
            </p>

            {/* Features */}
            <div className="features">
              <div className="feature">
                <div className="feature-icon">♢</div>
                <div className="feature-title">{t('login.feature_1_title')}</div>
                <div className="feature-text" dangerouslySetInnerHTML={{ __html: t('login.feature_1_desc') }}></div>
              </div>
              <div className="feature">
                <div className="feature-icon">⚡</div>
                <div className="feature-title">{t('login.feature_2_title')}</div>
                <div className="feature-text" dangerouslySetInnerHTML={{ __html: t('login.feature_2_desc') }}></div>
              </div>
              <div className="feature">
                <div className="feature-icon">▥</div>
                <div className="feature-title">{t('login.feature_3_title')}</div>
                <div className="feature-text" dangerouslySetInnerHTML={{ __html: t('login.feature_3_desc') }}></div>
              </div>
            </div>

            {/* Quote */}
            <div className="quote">
              <div className="quote-mark">“</div>
              <div dangerouslySetInnerHTML={{ __html: t('login.quote') }}></div>
            </div>
          </div>
        </section>

        {/* =========================
             RIGHT LOGIN PANEL
        ========================== */}
        <section className="form-panel">
          <div className="login-top-actions">
            <LanguageSwitcher />
            <PWAInstallButton variant="login-variant" />
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
              <div className="security-icon">♙</div>
              <h1>{t('login.welcome_back')}</h1>
              <p>{t('login.portal_title')}</p>
              <div className="small-line"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin}>

              {/* Username */}
              <div className="field">
                <label htmlFor="username">{t('login.username_label')}</label>
                <div className="input-wrapper">
                  <span className="input-icon">♙</span>
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
                  <span className="input-icon">♙</span>
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
                    ◉
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="remember">
                  <input type="checkbox" id="remember" />
                  <span>{t('login.remember_me')}</span>
                </label>
                <a href="#" className="forgot">{t('login.forgot_password')}</a>
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
                    <span>{t('login.signing_in')}</span>
                    <span className="arrow">→</span>
                  </>
                ) : loginSuccess ? (
                  <>
                    <span>{t('login.login_success')}</span>
                    <span>✓</span>
                  </>
                ) : (
                  <>
                    <span>{t('login.login_button')}</span>
                    <span className="arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Support */}
            <div className="support" dangerouslySetInnerHTML={{ __html: t('login.support') }}></div>

          </div>
        </section>
      </div>
    </div>
  );
}
