import React, { useState } from 'react';
import { Monitor, Download, CheckCircle, Wifi, X, Sparkles } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import './PWAInstallButton.css';

export default function PWAInstallButton({ variant = 'default' }) {
  const { isStandalone, isOnline, installApp, hasPrompt } = usePWA();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (hasPrompt) {
      const res = await installApp();
      if (res && res.outcome === 'dismissed') {
        // User cancelled, do nothing
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // If already running as installed desktop PWA app
  if (isStandalone) {
    return (
      <div className={`pwa-desktop-badge ${variant}`}>
        <span className="pwa-badge-icon">
          <Monitor size={14} />
        </span>
        <span className="pwa-badge-text">PC App</span>
        <span className={`pwa-status-dot ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Online' : 'Offline'} />
      </div>
    );
  }

  return (
    <>
      <button 
        className={`pwa-install-btn ${variant}`} 
        onClick={handleInstallClick}
        type="button"
        title="Install Codecraft Client Manager on your PC"
      >
        <Monitor size={15} strokeWidth={2.3} className="pwa-btn-icon" />
        <span className="pwa-btn-label">Install PC App</span>
        <span className="pwa-btn-badge"><Download size={11} strokeWidth={3} /></span>
      </button>

      {/* Manual Install Instruction Modal for Desktop Browsers */}
      {showGuideModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="pwa-guide-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-guide-header">
              <div className="pwa-guide-title-wrap">
                <div className="pwa-guide-icon">
                  <Monitor size={22} />
                </div>
                <div>
                  <h3 className="pwa-guide-title">Install PC Desktop App</h3>
                  <p className="pwa-guide-sub">Enjoy a native desktop experience with offline support</p>
                </div>
              </div>
              <button className="pwa-guide-close" onClick={() => setShowGuideModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="pwa-guide-body">
              <div className="pwa-feature-row">
                <div className="pwa-feat-item">
                  <Sparkles size={16} className="text-maroon" />
                  <span>Opens in its own clean window without browser tabs</span>
                </div>
                <div className="pwa-feat-item">
                  <CheckCircle size={16} className="text-maroon" />
                  <span>Fast desktop taskbar & start menu shortcut</span>
                </div>
                <div className="pwa-feat-item">
                  <Wifi size={16} className="text-maroon" />
                  <span>Works seamlessly offline with cached lead data</span>
                </div>
              </div>

              <div className="pwa-steps-box">
                <div className="pwa-step">
                  <span className="step-num">1</span>
                  <span>Look for the <strong>Install</strong> icon (computer/down arrow 📥) in your browser address bar (top right).</span>
                </div>
                <div className="pwa-step">
                  <span className="step-num">2</span>
                  <span>Or click browser menu (<strong>⋮</strong> or <strong>…</strong>) &gt; <strong>Install Codecraft Client Manager</strong>.</span>
                </div>
                <div className="pwa-step">
                  <span className="step-num">3</span>
                  <span>Click <strong>Install</strong> to add it to your Windows Desktop and Taskbar.</span>
                </div>
              </div>
            </div>

            <div className="pwa-guide-footer">
              <button className="pwa-guide-btn" onClick={() => setShowGuideModal(false)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
