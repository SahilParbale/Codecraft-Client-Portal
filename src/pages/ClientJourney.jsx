import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getClients, updateClient, findProductById } from '../store/DataStore';

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
  const { t } = useTranslation();
  const location = useLocation();
  const product = findProductById(productId);
  
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
  const [isSavingLog, setIsSavingLog] = useState(false);

  const getTranslatedValue = (obj, fieldKey) => {
    if (!obj) return '';
    if (obj.translations && obj.translations[fieldKey] && obj.translations[fieldKey].en) {
      return obj.translations[fieldKey].en;
    }
    return obj[fieldKey] || '';
  };

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
    
    // Support comparing string and number ID representation so refresh never fails
    let found = clients.find(c => String(c.id) === String(clientId));
    
    // Fallback to offline cached clients if not yet synced
    if (!found) {
      try {
        const cached = JSON.parse(localStorage.getItem('codecraft_cached_clients_' + productId) || '[]');
        found = cached.find(c => String(c.id) === String(clientId));
      } catch {
        // Ignore cache read failures
      }
    }

    if (!found) {
      // If we already have client in memory, don't clear it
      if (client) {
        setLoading(false);
        return;
      }
      setLoading(false);
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
    setIsSavingLog(true);

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
    setIsSavingLog(false);
  };

  const handleDeleteEvent = async (eventId) => {
    const updatedEvents = client.events.filter(e => e.id !== eventId);
    const updatedClient = await updateClient(productId, client.id, { ...client, events: updatedEvents });
    if (updatedClient) setClient({ ...updatedClient, events: updatedEvents });
  };

  const handleEditEventSubmit = async (eventId) => {
    setIsSavingLog(true);
    const updatedEvents = client.events.map(e => e.id === eventId ? { ...e, details: editingContent } : e);
    const updatedClient = await updateClient(productId, client.id, { ...client, events: updatedEvents });
    if (updatedClient) {
      setClient({ ...updatedClient, events: updatedEvents });
      setEditingEventId(null);
      setEditingContent('');
    }
    setIsSavingLog(false);
  };

  const handleStageClick = async (stage) => {
    const updatedClient = await updateClient(productId, client.id, { ...client, finalStatus: stage });
    if (updatedClient) setClient({ ...updatedClient, finalStatus: stage });
  };

  if (loading && !client) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading client record...</div>;
  }

  if (!client && !loading) {
    return (
      <div className="journey-body animate-fade-in">
        <header className="journey-header">
          <button className="btn-back" onClick={() => navigate(`/tracker/${productId}`)}>
            <ArrowLeft size={16} strokeWidth={2.5} /> <span>{t('journey.back_to_leads')}</span>
          </button>
        </header>
        <main className="journey-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Lead Record Not Found</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            The requested client record could not be found or may have been removed.
          </p>
          <button className="btn-back" style={{ display: 'inline-flex' }} onClick={() => navigate(`/tracker/${productId}`)}>
            <ArrowLeft size={16} strokeWidth={2.5} /> {t('journey.back_to_leads')}
          </button>
        </main>
      </div>
    );
  }

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
          <ArrowLeft size={16} strokeWidth={2.5} /> <span>{t('journey.back_to_leads')}</span>
        </button>

        <div className="journey-header-actions">

        </div>
      </header>

      <main className="journey-container">
        
        {/* Title Section */}
        <div className="journey-title-section">
          <div className="journey-name-wrap">
            <h1 className="journey-name">{getTranslatedValue(client, 'name')}</h1>
            <div className="journey-badge">
              <Check size={14} strokeWidth={3} /> {t(`options.${client.finalStatus}`).toUpperCase()}
            </div>
          </div>
          <div className="journey-subtitle">
            <div className="subtitle-item"><Building2 size={14}/> {t(`options.${client.position}`)}</div>
            <div className="subtitle-item"><MapPin size={14}/> {getTranslatedValue(client, 'party')}</div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="progress-container-outer">
          <div className="progress-container">
            <div className="progress-line">
              <div className="progress-line-fill" style={{ width: progressFillWidth }}></div>
            </div>
            
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCompleted = idx < activeIndex;
              const isActive = idx === activeIndex;
              const isLast = idx === PIPELINE_STAGES.length - 1;
              
              let circleClass = "step-circle";
              if (isCompleted && !isLast) circleClass += " completed";
              else if (isActive && !isLast) circleClass += " active";
              else if (isLast && (isActive || isCompleted)) circleClass += " closed";

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
                  <div className={labelClass}>{t(`options.${stage}`)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="journey-grid">
          
          {/* Left Column */}
          <div className="journey-sidebar">
            <div className="info-card">
              <div className="info-card-header">
                <FileText size={16} className="text-muted" /> {t('journey.lead_info')}
              </div>
              
              <div className="info-field">
                <div className="info-label">{t('journey.full_name')}</div>
                <div className="info-val">{getTranslatedValue(client, 'name')}</div>
              </div>
              
              <div className="info-field">
                <div className="info-label">{t('journey.political_party')}</div>
                <div className="info-val">{getTranslatedValue(client, 'party')}</div>
              </div>

              <div className="info-field" style={{ marginBottom: 0 }}>
                <div className="info-label">{t('journey.position_title')}</div>
                <div className="info-val">{t(`options.${client.position}`)}</div>
              </div>

              <div className="info-divider"></div>

              <div className="info-bottom">
                <div className="info-bottom-item">
                  <Calendar size={14} color="#94a3b8" />
                  <span>{t('journey.created_on')} <br/> <strong style={{color: '#0f172a'}}>{new Date(client.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                </div>
                
                <div className="info-bottom-item" style={{ marginTop: '8px' }}>
                  <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>K</div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{t('journey.lead_owner')} <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>+2</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="journey-main-content">
            
            {/* Logger Box */}
            <div className="logger-card">
              <div className="logger-tabs">
                <button className={`logger-tab ${activeTab === 'NOTE' ? 'active' : ''}`} onClick={() => setActiveTab('NOTE')}>
                  <FileText size={16} /> <span>{t('journey.note')}</span>
                </button>
                <button className={`logger-tab ${activeTab === 'CALL' ? 'active' : ''}`} onClick={() => setActiveTab('CALL')}>
                  <Phone size={16} /> <span>{t('journey.call')}</span>
                </button>
                <button className={`logger-tab ${activeTab === 'DEMO' ? 'active' : ''}`} onClick={() => setActiveTab('DEMO')}>
                  <Calendar size={16} /> <span>{t('journey.demo')}</span>
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
                        customInput={<input className="logger-date-input" />}
                        required
                      />
                    </div>
                  )}

                  <div className="logger-input-wrap">
                    <textarea 
                      placeholder={t('journey.add_note_placeholder')}
                      value={formData.details}
                      onChange={e => setFormData({...formData, details: e.target.value})}
                      required
                    ></textarea>
                    
                    <div className="logger-toolbar">
                      <button type="button" title="Bold"><Bold size={14} strokeWidth={2.5} /></button>
                      <button type="button" title="Italic"><Italic size={14} strokeWidth={2.5} /></button>
                      <button type="button" title="List"><List size={14} strokeWidth={2.5} /></button>
                      <button type="button" title="Link"><Link size={14} strokeWidth={2.5} /></button>
                    </div>
                  </div>
                  
                  <div className="logger-footer">
                    <button type="submit" className="btn-log" disabled={isSavingLog}>
                      {isSavingLog ? t('tracker.saving') : t('journey.log_button', { type: t(`journey.${activeTab.toLowerCase()}`) })}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="feed-card">
              <h3 className="feed-header">{t('journey.recent_activity')}</h3>
              
              <div className="feed-list">
                {client.events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                    {t('journey.no_activity')}
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
                              {evt.type === 'NOTE' ? t('journey.note_added') : t('journey.logged', { type: t(`journey.${evt.type.toLowerCase()}`) })}
                              <span className="feed-badge">{t(`journey.${evt.type.toLowerCase()}`)}</span>
                            </div>
                            <div className="feed-meta">
                              <span className="feed-date">
                                {new Date(evt.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                              <div className="feed-actions">
                                <button onClick={() => { setEditingEventId(evt.id); setEditingContent(evt.details); }} title="Edit"><Edit2 size={14}/></button>
                                <button onClick={() => handleDeleteEvent(evt.id)} title="Delete"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          </div>
                          
                          {editingEventId === evt.id ? (
                            <div className="feed-edit-box">
                              <textarea 
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="feed-edit-textarea"
                              />
                              <div className="feed-edit-actions">
                                <button onClick={() => setEditingEventId(null)} className="btn-feed-cancel">{t('journey.cancel')}</button>
                                <button onClick={() => handleEditEventSubmit(evt.id)} className="btn-feed-save">{t('journey.save')}</button>
                              </div>
                            </div>
                          ) : (
                            <div className="feed-text">{getTranslatedValue(evt, 'details')}</div>
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
