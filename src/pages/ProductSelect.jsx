import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS, logout, getTotalClientsCount } from '../store/DataStore';
import { 
  LogOut, 
  ChevronRight, 
  LayoutGrid, 
  Users, 
  Building2, 
  Vote, 
  Share2, 
  Bot, 
  MoreHorizontal,
  BrainCircuit,
  Cpu,
  ChevronDown
} from 'lucide-react';
import './ProductSelect.css';

// Helper to get icon based on product name
const getProductIcon = (name) => {
  if (name.includes('ERP')) return <Building2 size={24} strokeWidth={2.5} />;
  if (name.includes('Election')) return <Vote size={24} strokeWidth={2.5} />;
  if (name.includes('SocialHub')) return <Users size={24} strokeWidth={2.5} />;
  if (name.includes('Interview')) return <BrainCircuit size={24} strokeWidth={2.5} />;
  if (name.includes('Builder')) return <Bot size={24} strokeWidth={2.5} />;
  return <LayoutGrid size={24} strokeWidth={2.5} />;
};

export default function ProductSelect() {
  const navigate = useNavigate();
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setTotalProducts(PRODUCTS.length);
      const clients = await getTotalClientsCount();
      setActiveClients(clients);
      setIsLoading(false);
    };
    
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="product-dash-body">
      
      {/* Decorative SVG Backgrounds */}
      <svg className="bg-wave-top" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
        <path fill="url(#wave-gradient)" fillOpacity="0.3" d="M0,160L48,149.3C96,139,192,117,288,112C384,107,480,117,576,144C672,171,768,213,864,208C960,203,1056,149,1152,133.3C1248,117,1344,139,1392,149.3L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        <path fill="url(#wave-gradient)" fillOpacity="0.2" d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,170.7C672,160,768,160,864,181.3C960,203,1056,245,1152,240C1248,235,1344,181,1392,154.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        <defs>
          <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fdf2f4" />
            <stop offset="50%" stopColor="#f8d7da" />
            <stop offset="100%" stopColor="#fdf2f4" />
          </linearGradient>
        </defs>
      </svg>

      <svg className="bg-wave-bottom" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <path fill="#800000" d="M300,600 C150,550 50,450 0,300 C-50,150 150,50 300,0 L800,0 L800,600 Z" opacity="0.9"/>
        <path fill="#a52a2a" d="M400,600 C250,550 150,450 100,300 C50,150 250,50 400,0 L800,0 L800,600 Z" opacity="0.7"/>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle fill="rgba(255,255,255,0.1)" cx="2" cy="2" r="2"></circle>
        </pattern>
        <path fill="url(#dots)" d="M400,600 C250,550 150,450 100,300 C50,150 250,50 400,0 L800,0 L800,600 Z"/>
      </svg>


      {/* Header */}
      <header className="modern-header">
        <div className="logo-container">
          <div className="brand-text">
            <span className="brand-name">CODECRAFT</span>
            <span className="brand-sub">SOLUTIONS</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} strokeWidth={2.5} /> Logout
          </button>
          <div className="user-avatar-wrap">
            <div className="user-avatar">K</div>
            <ChevronDown size={16} className="user-avatar-chevron" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-container">
        
        <div className="dash-hero">
          <div className="hero-text animate-fade-in">
            <h1 className="title">Product Dashboards</h1>
            <p className="subtitle">Manage and monitor all your products</p>
            <div className="underline"></div>
          </div>

          <div className="stats-pill animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-item">
              <div className="stat-icon">
                <LayoutGrid size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{isLoading ? '...' : totalProducts}</span>
                <span className="stat-label">Total Products</span>
              </div>
            </div>
            <div className="stat-divider"></div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <Users size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{isLoading ? '...' : activeClients}</span>
                <span className="stat-label">Active Clients</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modern-grid">
          {PRODUCTS.map((product, index) => (
            <div 
              key={product.id} 
              className="modern-card animate-fade-in"
              style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
              onClick={() => navigate(`/tracker/${product.id}`)}
            >
              <div className="card-body">
                <div className="card-header">
                  <div className="card-icon">
                    {getProductIcon(product.name)}
                  </div>
                  <MoreHorizontal size={24} className="card-menu" />
                </div>
                <h2 className="card-title">{product.name}</h2>
                <div className="card-line"></div>
                <p className="card-desc">{product.description}</p>
              </div>
              
              <div className="card-footer">
                Manage Clients <ChevronRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
