import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PRODUCTS, getClients, addClient, updateClient } from '../store/DataStore';
import { 
  X, Check, Minus, Edit2, Search, Plus, Bell, Code, FileText, Building2
} from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './ClientTracker.css';

export default function ClientTracker() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = PRODUCTS.find(p => p.id === productId);
  
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dynamic Form State
  const [formData, setFormData] = useState({});
  const [editingClientId, setEditingClientId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!product) {
      navigate('/products');
      return;
    }
    const fetchClients = async () => {
      const data = await getClients(productId);
      setClients(data);
    };
    fetchClients();
  }, [productId, product, navigate]);

  const handleOpenAddModal = () => {
    setEditingClientId(null);
    if (!product) return;
    const initialData = {};
    product.schema.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.key] = false;
      } else if (field.type === 'select') {
        initialData[field.key] = field.options[0];
      } else if (field.type === 'datetime-local') {
        initialData[field.key] = new Date();
      } else {
        initialData[field.key] = '';
      }
    });
    setFormData(initialData);
    setIsModalOpen(true);
  };

  const handleEditClient = (client) => {
    setEditingClientId(client.id);
    const editData = { ...client };
    product.schema.forEach(field => {
      if (field.type === 'datetime-local' && editData[field.key]) {
        editData[field.key] = new Date(editData[field.key]);
      }
    });
    setFormData(editData);
    setIsModalOpen(true);
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missingRequired = product.schema.some(f => f.required && !formData[f.key]);
    if (missingRequired) return;

    const formattedData = { ...formData };
    product.schema.forEach(field => {
      if (field.type === 'datetime-local' && formattedData[field.key] instanceof Date) {
        formattedData[field.key] = formattedData[field.key].toISOString();
      }
    });

    setIsSubmitting(true);
    try {
      if (editingClientId) {
        const updatedClient = await updateClient(productId, editingClientId, formattedData);
        if (updatedClient) {
          setClients(clients.map(c => c.id === editingClientId ? updatedClient : c));
        }
      } else {
        if (product.isJourney) {
          formattedData.events = [];
          formattedData.finalStatus = 'Pending';
        }
        const newClient = await addClient(productId, formattedData);
        if (newClient) {
          setClients([...clients, newClient]);
        }
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  const renderBadge = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    if (s.includes('closed') || s.includes('won')) return <span className="badge badge-closed">{status}</span>;
    if (s.includes('demo')) return <span className="badge badge-demo">{status}</span>;
    return <span className="badge badge-pending">{status || 'PENDING'}</span>;
  };

  return (
    <div className="tracker-body">
      <header className="tracker-header">
        <div className="tracker-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
          <div className="tracker-logo">
            <Code size={20} strokeWidth={2.5} />
          </div>
          <div className="brand-text-container">
            <span className="tracker-title">Krishnaniti ERP System</span>
            <span className="tracker-subtitle">Track interactions and conversions</span>
          </div>
        </div>
      </header>

      <main className="tracker-container animate-fade-in">
        <div className="tracker-top-action">
          <button className="btn-add-lead" onClick={handleOpenAddModal}>
            <Plus size={16} strokeWidth={3} /> Add Lead
          </button>
        </div>

        {product.isJourney ? (
          ['Minister', 'Khasdar', 'Aamdar', 'Nagarsevak'].map((position, pIdx) => {
            const positionClients = clients.filter(c => c.position === position);
            
            return (
              <div key={position} className="lead-category">
                <div className="category-header">
                  <div className="category-icon">
                    <Building2 size={16} strokeWidth={2} />
                  </div>
                  <span className="category-title">{position} Leads</span>
                </div>
                
                <div className="table-card">
                  <div className="table-scroll-wrap">
                    <table className="leads-table">
                    <thead>
                      <tr>
                        <th className="col-sr">SR NO</th>
                        <th className="col-name">NAME</th>
                        <th className="col-party">PARTY</th>
                        <th className="col-events">TOTAL EVENTS</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positionClients.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: 0 }}>
                            <div className="empty-state">
                              <div className="empty-icon-wrap">
                                <FileText size={24} strokeWidth={1.5} />
                              </div>
                              <div className="empty-title">No {position} leads tracked yet.</div>
                              <div className="empty-subtitle">Start by adding a new lead to track interactions and conversions.</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        positionClients.map((client, index) => (
                          <tr 
                            key={client.id} 
                            onClick={() => navigate(`/tracker/${productId}/client/${client.id}`, { state: { client } })}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="col-sr">{index + 1}</td>
                            <td className="col-name">{client.name}</td>
                            <td className="col-party">{client.party}</td>
                            <td className="col-events">{client.events ? client.events.length : 0} Interactions</td>
                            <td>{renderBadge(client.finalStatus)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>
                  {positionClients.length > 0 && (
                    <div className="table-footer">
                      <span className="view-all-link">View All {'>'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="lead-category">
            <div className="table-card">
              <div className="table-scroll-wrap">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th className="col-sr">SR NO</th>
                    {product.schema.map(field => <th key={field.key} className="col-name">{field.label.toUpperCase()}</th>)}
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={product.schema.length + 2} style={{ padding: 0 }}>
                        <div className="empty-state">
                          <div className="empty-icon-wrap">
                            <FileText size={24} strokeWidth={1.5} />
                          </div>
                          <div className="empty-title">No clients tracked for {product.name} yet.</div>
                          <div className="empty-subtitle">Click "Add Lead" to get started.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clients.map((client, index) => (
                      <tr key={client.id}>
                        <td className="col-sr">{index + 1}</td>
                        {product.schema.map(field => {
                           let val = client[field.key] || '-';
                           if (field.type === 'datetime-local' && val !== '-') {
                             val = new Date(val).toLocaleDateString();
                           }
                           if (field.key === 'result') {
                             return <td key={field.key}>{renderBadge(val)}</td>;
                           }
                           return <td key={field.key}>{val}</td>;
                        })}
                        <td>
                          <button className="icon-btn" onClick={() => handleEditClient(client)}>
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="h3" style={{ margin: 0 }}>{editingClientId ? 'Edit Client' : 'Add New Lead'}</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {product.schema.map(field => {
                if (field.type === 'checkbox') {
                  return (
                    <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={formData[field.key] || false}
                        onChange={e => handleInputChange(field.key, e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: '#800000' }}
                      />
                      <label style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{field.label}</label>
                    </div>
                  );
                }
                
                if (field.type === 'select') {
                  const selectStyles = {
                    control: (base) => ({
                      ...base, padding: '4px', borderRadius: '6px', borderColor: '#e2e8f0', boxShadow: 'none',
                      '&:hover': { borderColor: '#cbd5e1' }
                    }),
                    option: (base, state) => ({
                      ...base, backgroundColor: state.isSelected ? '#800000' : state.isFocused ? '#f8fafc' : 'transparent',
                      color: state.isSelected ? 'white' : '#0f172a'
                    })
                  };

                  return (
                    <div key={field.key}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>{field.label} {field.required && '*'}</label>
                      <Select
                        options={field.options.map(opt => ({ value: opt, label: opt }))}
                        value={formData[field.key] ? { value: formData[field.key], label: formData[field.key] } : null}
                        onChange={(selectedOption) => handleInputChange(field.key, selectedOption ? selectedOption.value : '')}
                        styles={selectStyles}
                        placeholder={`Select...`}
                      />
                    </div>
                  );
                }

                if (field.type === 'datetime-local') {
                  return (
                    <div key={field.key}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>{field.label} {field.required && '*'}</label>
                      <DatePicker
                        selected={formData[field.key] ? new Date(formData[field.key]) : null}
                        onChange={(date) => handleInputChange(field.key, date ? date.toISOString() : '')}
                        showTimeSelect
                        dateFormat="Pp"
                        customInput={<input style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>{field.label} {field.required && '*'}</label>
                    <input 
                      type={field.type} 
                      value={formData[field.key] || ''} 
                      onChange={e => handleInputChange(field.key, e.target.value)} 
                      required={field.required} 
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                );
              })}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 20px', background: '#800000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  {isSubmitting ? 'Saving...' : (editingClientId ? 'Save Changes' : 'Add Lead')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
