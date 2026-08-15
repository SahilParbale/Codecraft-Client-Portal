import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS, logout } from '../store/DataStore';
import { Package, LogOut, ChevronRight } from 'lucide-react';

export default function ProductSelect() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <header className="app-header glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="header-content">
          <div><img src="/logo.jpeg" alt="Codecraft Solutions Logo" style={{ width: '90px', height: 'auto', display: 'block', borderRadius: '8px' }} /></div>
          <h1 className="h3">Product Dashboards</h1>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <main className="container" style={{ marginTop: '2rem' }}>
        <div className="product-grid">
          {PRODUCTS.map((product, index) => (
            <div 
              key={product.id} 
              className="product-card"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/tracker/${product.id}`)}
            >
              <h2 className="h2" style={{ fontSize: '1.5rem' }}>{product.name}</h2>
              <p className="text-muted" style={{ lineHeight: '1.6' }}>{product.description}</p>
              
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.9375rem' }}>
                Manage Clients <ChevronRight size={18} style={{ marginLeft: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
