import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PRODUCTS, getClients, updateClient } from '../store/DataStore';
import { 
  ArrowLeft, Check, Lock, Building2, MapPin, Calendar, 
  FileText, Phone, Bold, Italic, List, Link, Trash2, Edit2 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './ClientJourney.css';

const PIPELINE_STAGES = [
  'Pending',
  'Contacted',
  'Demo Scheduled',
  'Demo Completed',
  'Negotiation',
  'Closed'
];

export default function ClientJourney() {
  const { productId, clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const product = PRODUCTS.find(p => p.id === productId);
  
  const getInitialClient = () => {
    if (!location.state?.client) return null;
    const c = { ...location.state.client };
    if (!c.events) c.events = [];
    if (!c.finalStatus) c.finalStatus = 'Pending';
    if (c.finalStatus === 'Closed Won' || c.finalStatus === 'Closed Lost') c.finalStatus = 'Closed';
    if (c.finalStatus === 'Follow-up') c.finalStatus = 'Contacted';
    return c;
  };

  const [client, setClient] = useState(getInitialClient());
  const [loading, setLoading] = useState(!location.state?.client);

  const [activeTab, setActiveTab] = useState('NOTE');
  const [formData, setFormData] = useState({ date: new Date().toISOString(), details: '' });

  const [editingEventId, setEditingEventId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (!product) {
      navigate('/products');
      return;
    }
    loadClient();
  }, [productId, clientId, product]);

  const loadClient = async () => {
    if (!client) setLoading(true);
    const clients = await getClients(productId);
    const found = clients.find(c => c.id === clientId);
    if (!found) {
      navigate(`/tracker/${productId}`);
      return;
    }
    if (!found.events) found.events = [];
    if (!found.finalStatus) found.finalStatus = 'Pending';
    if (found.finalStatus === 'Closed Won' || found.finalStatus === 'Closed Lost') found.finalStatus = 'Closed';
    if (found.finalStatus === 'Follow-up') found.finalStatus = 'Contacted';
    
    setClient(found);
    setLoading(false);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!formData.details) return;

    const eventDate = activeTab === 'DEMO' ? formData.date : new Date().toISOString();
    const newEvent = { 
      id: Date.now(),
      type: activeTab, 
      date: eventDate, 
      details: formData.details 
    };

    const updatedEvents = [newEvent, ...client.events];
    const updatedClient = await updateClient(productId, client.id, { ...client, events: updatedEvents });
    
    if (updatedClient) {
      setClient({ ...updatedClient, events: updatedEvents });
      setFormData({ date: new Date().toISOString(), details: '' });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const updatedEvents = client.events.filter(e => e.id !== eventId);
    const updatedClient = await updateClient(productId, client.id, { ...client, events: updatedEvents });
    if (updatedClient) setClient({ ...updatedClient, events: updatedEvents });
  };

  const handleEditEventSubmit = async (eventId) => {
    const updatedEvents = client.events.map(e => e.id === eventId ? { ...e, details: editingContent } : e);
    const updatedClient = await updateClient(productId, client.id, { ...client, events: updatedEvents });
    if (updatedClient) {
      setClient({ ...updatedClient, events: updatedEvents });
      setEditingEventId(null);
      setEditingContent('');
    }
  };

  const handleStageClick = async (stage) => {
    const updatedClient = await updateClient(productId, client.id, { ...client, finalStatus: stage });
    if (updatedClient) setClient({ ...updatedClient, finalStatus: stage });
  };

  if (loading || !client) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading client record...</div>;

  const currentStageIndex = PIPELINE_STAGES.indexOf(client.finalStatus);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
  
  // Calculate width for the progress fill line
  const progressFillWidth = `${(activeIndex / (PIPELINE_STAGES.length - 1)) * 100}%`;

  const getEventIcon = (type) => {
    if (type === 'CALL') return <Phone size={14} />;
    if (type === 'DEMO') return <Calendar size={14} />;
    return <FileText size={14} />;
  };

  return (
    <div className="journey-body animate-fade-in">
      
      <header className="journey-header">
        <button className="btn-back" onClick={() => navigate(`/tracker/${productId}`)}>
          <ArrowLeft size={16} strokeWidth={2.5} /> Back to Leads
        </button>
      </header>

      <main className="journey-container">
        
        {/* Title Section */}
        <div className="journey-title-section">
          <div className="journey-name-wrap">
            <h1 className="journey-name">{client.name}</h1>
            <div className="journey-badge">
              <Check size={14} strokeWidth={3} /> {client.finalStatus.toUpperCase()}
            </div>
          </div>
          <div className="journey-subtitle">
            <div className="subtitle-item"><Building2 size={14}/> {client.position}</div>
            <div className="subtitle-item"><MapPin size={14}/> {client.party}</div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="progress-container">
          <div className="progress-line">
            <div className="progress-line-fill" style={{ width: progressFillWidth }}></div>
          </div>
          
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isLast = idx === PIPELINE_STAGES.length - 1;
            
            let circleClass = "step-circle";
            if (isCompleted) circleClass += " completed";
            else if (isActive && !isLast) circleClass += " active";
            else if (isLast && isActive) circleClass += " closed";
            else if (isLast && isCompleted) circleClass += " closed"; // If somehow past closed

            let labelClass = "step-label";
            if (isActive && !isLast) labelClass += " active";
            else if (isLast && (isActive || isCompleted)) labelClass += " closed";

            return (
              <div key={stage} className="progress-step" onClick={() => handleStageClick(stage)}>
                <div className={circleClass}>
                  {isCompleted && !isLast && <Check size={16} strokeWidth={3} />}
                  {isLast && (isActive || isCompleted) && <Lock size={14} strokeWidth={2.5} />}
                  {isLast && !isActive && !isCompleted && <Lock size={14} strokeWidth={2.5} color="#cbd5e1" />}
                </div>
                <div className={labelClass}>{stage}</div>
              </div>
            );
          })}
        </div>

        <div className="journey-grid">
          
          {/* Left Column */}
          <div>
            <div className="info-card">
              <div className="info-card-header">
                <FileText size={16} className="text-muted" /> Lead Information
              </div>
              
              <div className="info-field">
                <div className="info-label">Full Name</div>
                <div className="info-val">{client.name}</div>
              </div>
              
              <div className="info-field">
                <div className="info-label">Political Party</div>
                <div className="info-val">{client.party}</div>
              </div>

              <div className="info-field" style={{ marginBottom: 0 }}>
                <div className="info-label">Position / Title</div>
                <div className="info-val">{client.position}</div>
              </div>

              <div className="info-divider"></div>

              <div className="info-bottom">
                <div className="info-bottom-item">
                  <Calendar size={14} color="#94a3b8" />
                  <span>Created On <br/> <strong style={{color: '#0f172a'}}>{new Date(client.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                </div>
                
                <div className="info-bottom-item" style={{ marginTop: '8px' }}>
                  <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>K</div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Lead Owner <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>+2</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            
            {/* Logger Box */}
            <div className="logger-card">
              <div className="logger-tabs">
                <button className={`logger-tab ${activeTab === 'NOTE' ? 'active' : ''}`} onClick={() => setActiveTab('NOTE')}>
                  <FileText size={16} /> Note
                </button>
                <button className={`logger-tab ${activeTab === 'CALL' ? 'active' : ''}`} onClick={() => setActiveTab('CALL')}>
                  <Phone size={16} /> Call
                </button>
                <button className={`logger-tab ${activeTab === 'DEMO' ? 'active' : ''}`} onClick={() => setActiveTab('DEMO')}>
                  <Calendar size={16} /> Demo
                </button>
              </div>

              <div className="logger-body">
                <form onSubmit={handleSaveActivity}>
                  
                  {activeTab === 'DEMO' && (
                    <div style={{ marginBottom: '16px' }}>
                      <DatePicker 
                        selected={formData.date ? new Date(formData.date) : new Date()}
                        onChange={date => setFormData({...formData, date: date ? date.toISOString() : ''})}
                        showTimeSelect
                        dateFormat="Pp"
                        customInput={<input style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />}
                        required
                      />
                    </div>
                  )}

                  <div className="logger-input-wrap">
                    <textarea 
                      placeholder="Add a note..."
                      value={formData.details}
                      onChange={e => setFormData({...formData, details: e.target.value})}
                      required
                    ></textarea>
                    
                    <div className="logger-toolbar">
                      <button type="button"><Bold size={14} strokeWidth={2.5} /></button>
                      <button type="button"><Italic size={14} strokeWidth={2.5} /></button>
                      <button type="button"><List size={14} strokeWidth={2.5} /></button>
                      <button type="button"><Link size={14} strokeWidth={2.5} /></button>
                    </div>
                  </div>
                  
                  <div style={{ overflow: 'hidden' }}>
                    <button type="submit" className="btn-log">Log {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}</button>
                  </div>
                </form>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="feed-card">
              <h3 className="feed-header">Recent Activity</h3>
              
              <div className="feed-list">
                {client.events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                    No activity logged yet.
                  </div>
                ) : (
                  client.events.map((evt) => {
                    return (
                      <div key={evt.id} className="feed-item">
                        <div className="feed-icon">
                          {getEventIcon(evt.type)}
                        </div>
                        
                        <div className="feed-content">
                          <div className="feed-top">
                            <div className="feed-title">
                              {evt.type === 'NOTE' ? 'Note Added' : `${evt.type.charAt(0) + evt.type.slice(1).toLowerCase()} Logged`}
                              <span className="feed-badge">{evt.type.charAt(0) + evt.type.slice(1).toLowerCase()}</span>
                            </div>
                            <div className="feed-meta">
                              {new Date(evt.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              <div className="feed-actions">
                                <button onClick={() => { setEditingEventId(evt.id); setEditingContent(evt.details); }}><Edit2 size={14}/></button>
                                <button onClick={() => handleDeleteEvent(evt.id)}><Trash2 size={14}/></button>
                              </div>
                            </div>
                          </div>
                          
                          {editingEventId === evt.id ? (
                            <div style={{ marginTop: '8px' }}>
                              <textarea 
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', marginBottom: '8px' }}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditingEventId(null)} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={() => handleEditEventSubmit(evt.id)} style={{ background: '#800000', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div className="feed-text">{evt.details}</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
