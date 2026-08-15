import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PRODUCTS, getClients, addClient, updateClient } from '../store/DataStore';
import { ArrowLeft, UserPlus, X, Check, Minus, Edit2, Package, Search, Plus } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

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
    // Convert string ISO dates back to Date objects for the DatePicker
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
    
    // basic validation
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
        const updated = await updateClient(productId, editingClientId, formattedData);
        if (updated) {
          setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
        }
      } else {
        const added = await addClient(productId, formattedData);
        if (added) {
          setClients(prev => [...prev, added]);
        }
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTableCell = (field, value) => {
    if (field.type === 'checkbox') {
      return value ? <Check size={18} className="text-success" style={{ color: 'var(--success)' }}/> : <Minus size={18} className="text-muted" style={{ opacity: 0.3 }}/>;
    }
    if (field.type === 'datetime-local') {
      if (!value) return '-';
      return new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    }
    if (field.key === 'result') {
      const isWon = value?.includes('Won');
      const isLost = value?.includes('Lost');
      return (
        <span className="status-badge" style={{
          backgroundColor: isWon ? 'var(--success-bg)' : isLost ? 'var(--danger-bg)' : 'var(--bg-primary)',
          color: isWon ? 'var(--success)' : isLost ? 'var(--danger)' : 'var(--text-primary)',
          border: '1px solid var(--border-color)'
        }}>
          {value || '-'}
        </span>
      );
    }
    return value || '-';
  };

  if (!product) return null;

  return (
    <>
      <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
        <header className="app-header glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="header-content">
          <button onClick={() => navigate('/products')} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none', background: 'transparent' }} title="Back to Products">
            <ArrowLeft size={24} />
          </button>
          <div>
            <img src="/logo.jpeg" alt="Codecraft Solutions Logo" style={{ width: '90px', height: 'auto', display: 'block', borderRadius: '8px' }} />
          </div>
          <div>
            <h1 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} className="text-muted" />
              {product.name}
            </h1>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Track interactions and conversions</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <UserPlus size={18} /> Add Client
        </button>
      </header>

      <main className="container" style={{ marginTop: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '0' }}>
          <div className="data-table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sr No</th>
                  {product.schema.map(field => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={product.schema.length + 2} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No clients tracked for {product.name} yet. Click "Add Client" to get started.
                    </td>
                  </tr>
                ) : (
                  clients.map((client, index) => (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{index + 1}</td>
                      {product.schema.map(field => (
                        <td key={field.key}>
                          {renderTableCell(field, client[field.key])}
                        </td>
                      ))}
                      <td>
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.75rem' }} onClick={() => handleEditClient(client)}>
                          <Edit2 size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="h3">{editingClientId ? 'Edit Client' : 'Add New Client'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-grid">
              {product.schema.map(field => {
                if (field.type === 'checkbox') {
                  return (
                    <div key={field.key} className="input-group" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0, height: '100%', paddingBottom: '0.875rem' }}>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={formData[field.key] || false}
                          onChange={e => handleInputChange(field.key, e.target.checked)} 
                          style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-color)' }}
                        />
                        <span>{field.label}</span>
                      </label>
                    </div>
                  );
                }
                
                if (field.type === 'select') {
                  const selectStyles = {
                    control: (base, state) => ({
                      ...base,
                      padding: '0.375rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      borderColor: state.isFocused ? 'var(--accent-color)' : 'var(--border-color)',
                      borderWidth: '2px',
                      boxShadow: state.isFocused ? '0 0 0 4px var(--accent-light)' : 'none',
                      backgroundColor: 'var(--bg-tertiary)',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      '&:hover': {
                        borderColor: state.isFocused ? 'var(--accent-color)' : 'var(--border-color)'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--border-color)',
                      zIndex: 100
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected 
                        ? 'var(--accent-color)' 
                        : state.isFocused 
                          ? 'var(--bg-tertiary)' 
                          : 'transparent',
                      color: state.isSelected ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '0.75rem 1.25rem',
                      '&:active': {
                        backgroundColor: 'var(--accent-hover)'
                      }
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'var(--text-primary)'
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: 'var(--text-tertiary)'
                    })
                  };

                  return (
                    <div key={field.key} className="input-group" style={{ marginBottom: 0 }}>
                      <label>{field.label} {field.required && '*'}</label>
                      <Select
                        options={field.options.map(opt => ({ value: opt, label: opt }))}
                        value={formData[field.key] ? { value: formData[field.key], label: formData[field.key] } : null}
                        onChange={(selectedOption) => handleInputChange(field.key, selectedOption ? selectedOption.value : '')}
                        styles={selectStyles}
                        placeholder={`Select ${field.label.toLowerCase()}...`}
                        isClearable
                        menuPlacement="top"
                      />
                    </div>
                  );
                }

                if (field.type === 'datetime-local') {
                  return (
                    <div key={field.key} className="input-group" style={{ marginBottom: 0 }}>
                      <label>{field.label} {field.required && '*'}</label>
                      <DatePicker
                        selected={formData[field.key] ? new Date(formData[field.key]) : null}
                        onChange={(date) => handleInputChange(field.key, date ? date.toISOString() : '')}
                        showTimeSelect
                        dateFormat="Pp"
                        className="input-field"
                        placeholderText={`Select ${field.label.toLowerCase()}...`}
                        isClearable
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.key} className="input-group" style={{ marginBottom: 0 }}>
                    <label>{field.label} {field.required && '*'}</label>
                    <input 
                      type={field.type} 
                      className="input-field" 
                      value={formData[field.key] || ''} 
                      onChange={e => handleInputChange(field.key, e.target.value)} 
                      required={field.required} 
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  </div>
                );
              })}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingClientId ? 'Save Changes' : 'Add Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
