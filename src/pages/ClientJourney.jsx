import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PRODUCTS, getClients, updateClient } from '../store/DataStore';
import { ArrowLeft, Phone, Calendar, FileText, Check, Clock, User, Briefcase, MapPin, Trash2, Edit2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Pipeline Stages for the Chevron Bar
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

  // Form State - Tabbed "Log Activity" Box
  const [activeTab, setActiveTab] = useState('NOTE'); // NOTE, CALL, DEMO
  const [formData, setFormData] = useState({ date: new Date().toISOString(), outcome: '', details: '' });

  // Event Edit State
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [eventToDelete, setEventToDelete] = useState(null);

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
    
    // Auto-map legacy statuses to pipeline if needed
    if (found.finalStatus === 'Closed Won' || found.finalStatus === 'Closed Lost') found.finalStatus = 'Closed';
    if (found.finalStatus === 'Follow-up') found.finalStatus = 'Contacted';
    
    setClient(found);
    setLoading(false);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!formData.details) return;

    // Determine outcome based on tab if not provided
    let finalOutcome = formData.outcome;
    if (!finalOutcome) {
      if (activeTab === 'CALL') finalOutcome = 'Call Logged';
      if (activeTab === 'DEMO') finalOutcome = 'Demo Logged';
      if (activeTab === 'NOTE') finalOutcome = 'Note Added';
    }

    const eventDate = activeTab === 'DEMO' ? formData.date : new Date().toISOString();

    const newEvent = { 
      id: Date.now(),
      type: activeTab, 
      date: eventDate, 
      outcome: finalOutcome,
      details: formData.details 
    };

    const updatedEvents = [newEvent, ...client.events]; // Prepend so newest is top
    const updatedClient = await updateClient(productId, client.id, { ...client, events: updatedEvents });
    
    if (updatedClient) {
      setClient({ ...updatedClient, events: updatedEvents });
      setFormData({ date: new Date().toISOString(), outcome: '', details: '' });
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const updatedEvents = client.events.filter(e => e.id !== eventToDelete);
    const updatedClient = await updateClient(productId, client.id, { ...client, events: updatedEvents });
    if (updatedClient) {
      setClient({ ...updatedClient, events: updatedEvents });
      setEventToDelete(null);
    }
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
    if (updatedClient) {
      setClient({ ...updatedClient, finalStatus: stage });
    }
  };

  if (loading || !client) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading client record...</div>;

  // Chevron Pipeline Logic
  const currentStageIndex = PIPELINE_STAGES.indexOf(client.finalStatus);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  const getEventIcon = (type) => {
    if (type === 'CALL') return <Phone size={14} />;
    if (type === 'DEMO') return <Calendar size={14} />;
    return <FileText size={14} />;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <header style={{ flexShrink: 0, background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 2rem', zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(`/tracker/${productId}`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back to {product.name} Leads
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '2rem', overflow: 'hidden' }}>
        
        <div style={{ flexShrink: 0 }}>
          {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>{client.name}</h1>
            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={14}/> {client.position}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14}/> {client.party}</span>
            </div>
          </div>
        </div>

        {/* Pipeline Chevron Bar (Salesforce Style) */}
        <div style={{ display: 'flex', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '2rem' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            let bgColor = '#ffffff';
            let textColor = '#64748b';
            
            if (isActive) { bgColor = '#fdf5f5'; textColor = '#800000'; }
            else if (isCompleted) { bgColor = '#f8fafc'; textColor = '#10b981'; }

            return (
              <div 
                key={stage}
                onClick={() => handleStageClick(stage)}
                style={{
                  flex: 1, padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
                  background: bgColor, color: textColor, borderRight: idx < PIPELINE_STAGES.length - 1 ? '1px solid #e2e8f0' : 'none',
                  cursor: 'pointer', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { if(!isActive) e.currentTarget.style.background = '#f1f5f9' }}
                onMouseOut={(e) => { if(!isActive) e.currentTarget.style.background = bgColor }}
              >
                {isCompleted && <Check size={14} />}
                {stage}
              </div>
            );
          })}
        </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', minHeight: 0 }}>
          
          {/* Left Column: Client Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>About this Lead</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Full Name</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{client.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Political Party</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{client.party}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Position / Title</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{client.position}</div>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Creation Date</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{new Date(client.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Activity Logger & Feed */}
          <div style={{ overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2rem' }}>
            
            {/* Activity Logger (HubSpot Style) */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '2rem' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <button onClick={() => setActiveTab('NOTE')} style={{ flex: 1, padding: '0.75rem', background: activeTab === 'NOTE' ? '#ffffff' : 'transparent', border: 'none', borderBottom: activeTab === 'NOTE' ? '2px solid #800000' : '2px solid transparent', color: activeTab === 'NOTE' ? '#800000' : '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} /> Note
                </button>
                <button onClick={() => setActiveTab('CALL')} style={{ flex: 1, padding: '0.75rem', background: activeTab === 'CALL' ? '#ffffff' : 'transparent', border: 'none', borderBottom: activeTab === 'CALL' ? '2px solid #800000' : '2px solid transparent', color: activeTab === 'CALL' ? '#800000' : '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} /> Call
                </button>
                <button onClick={() => setActiveTab('DEMO')} style={{ flex: 1, padding: '0.75rem', background: activeTab === 'DEMO' ? '#ffffff' : 'transparent', border: 'none', borderBottom: activeTab === 'DEMO' ? '2px solid #800000' : '2px solid transparent', color: activeTab === 'DEMO' ? '#800000' : '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} /> Demo
                </button>
              </div>

              {/* Form Area */}
              <div style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSaveActivity}>
                  
                  {activeTab !== 'NOTE' && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Outcome / Result</label>
                        <input type="text" placeholder={activeTab === 'CALL' ? 'e.g. Connected, Left Voicemail' : 'e.g. Completed, Rescheduled'} value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }} />
                      </div>
                      {activeTab === 'DEMO' && (
                        <div style={{ width: '200px' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Date & Time</label>
                          <DatePicker 
                            selected={formData.date ? new Date(formData.date) : new Date()}
                            onChange={date => setFormData({...formData, date: date ? date.toISOString() : ''})}
                            showTimeSelect
                            dateFormat="Pp"
                            customInput={<input style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }} />}
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <textarea 
                    placeholder={`Start typing your ${activeTab.toLowerCase()} notes here...`}
                    value={formData.details}
                    onChange={e => setFormData({...formData, details: e.target.value})}
                    style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }}
                    required
                  ></textarea>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="submit" style={{ background: '#800000', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                      Log {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Timeline Feed */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Recent Activity</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {client.events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    No activity logged yet. Use the box above to add a note or call.
                  </div>
                ) : (
                  client.events.map((evt) => (
                    <div key={evt.id} style={{ display: 'flex', gap: '1rem', background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {getEventIcon(evt.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem', marginRight: '0.5rem' }}>{evt.type === 'NOTE' ? 'Note Added' : `${evt.type.charAt(0) + evt.type.slice(1).toLowerCase()} Logged`}</span>
                            {evt.outcome && <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>{evt.outcome}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> {new Date(evt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                            <button onClick={() => { setEditingEventId(evt.id); setEditingContent(evt.details); }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }} title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setEventToDelete(evt.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {editingEventId === evt.id ? (
                          <div style={{ marginTop: '0.5rem' }}>
                            <textarea 
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => setEditingEventId(null)} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
                              <button onClick={() => handleEditEventSubmit(evt.id)} style={{ background: '#800000', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                            {evt.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="modal-overlay" onClick={() => setEventToDelete(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 className="h3" style={{ marginBottom: '1rem' }}>Confirm Deletion</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Are you sure you want to delete this activity? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEventToDelete(null)} className="btn btn-outline">Cancel</button>
              <button onClick={confirmDeleteEvent} className="btn btn-primary">Delete Activity</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
