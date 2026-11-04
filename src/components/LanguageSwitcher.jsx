import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="lang-switcher-pill">
      <Globe size={14} strokeWidth={2.5} className="lang-icon" />
      <div className="lang-options">
        <button 
          className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('en')}
          type="button"
        >
          EN
        </button>
        <button 
          className={`lang-btn ${i18n.language === 'mr' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('mr')}
          type="button"
        >
          MR
        </button>
      </div>
    </div>
  );
}
