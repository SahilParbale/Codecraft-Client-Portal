import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PRODUCTS, getClients, addClient, updateClient } from '../store/DataStore';
import { 
  X, Check, Minus, Edit2, Search, Plus, Bell, Code, FileText, Building2, Download
} from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const downloadReport = (title, clientData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Add Centered Professional Header
    doc.setFontSize(22);
    doc.setTextColor(128, 0, 0); // Maroon
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${product.name}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });
    doc.text(`Total Clients: ${clientData.length}`, pageWidth / 2, 38, { align: 'center' });

    // Draw solid header line
    doc.setDrawColor(128, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 44, pageWidth - 20, 44);
    doc.setLineWidth(0.1); // reset

    let finalY = 55;

    if (product.isJourney) {
      clientData.forEach((c, index) => {
        const pageHeight = doc.internal.pageSize.height;
        // Estimate total height needed for this client block (Base 60px + ~15px per event)
        const estimatedHeight = 60 + (c.events && c.events.length > 0 ? c.events.length * 15 + 15 : 15);
        
        // If there isn't enough room for this client AND we aren't already at the top of a page, break to new page
        if (finalY + estimatedHeight > pageHeight - 20 && finalY > 40) {
          doc.addPage();
          finalY = 20;
        }

        // Draw a separator line between clients (if not at top of page)
        if (index !== 0 && finalY > 20) {
           doc.setDrawColor(220, 220, 220);
           doc.line(20, finalY, 190, finalY);
           finalY += 15;
        }

        // Client Name with Numbering
        doc.setFontSize(16);
        doc.setTextColor(128, 0, 0); // Maroon
        doc.setFont('helvetica', 'bold');
        doc.text(`Client ${index + 1}: ${c.name || 'Unnamed Lead'}`, 20, finalY);
        finalY += 4;

        // Client Details Table (Horizontal Grid)
        autoTable(doc, {
            startY: finalY,
            head: [['Party', 'Current Status', 'Date Added']],
            body: [
              [c.party || '-', c.finalStatus || 'Pending', new Date(c.createdAt).toLocaleDateString()]
            ],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' },
            styles: { cellPadding: 4, fontSize: 10, textColor: [50, 50, 50] },
            margin: { left: 20, right: 20 }
        });
        
        finalY = doc.lastAutoTable.finalY + 12;

        // Activity Logs Header
        doc.setFontSize(12);
        doc.setTextColor(128, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text("Activity Logs", 20, finalY);
        finalY += 6;

        if (!c.events || c.events.length === 0) {
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text("No activities logged yet.", 20, finalY);
            finalY += 15;
        } else {
            const eventData = c.events.map(evt => [
               new Date(evt.date).toLocaleString(),
               evt.type,
               (evt.details || '').replace(/\n/g, ' ')
            ]);

            autoTable(doc, {
               startY: finalY,
               head: [['Date & Time', 'Action', 'Notes']],
               body: eventData,
               theme: 'grid',
               headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255] },
               styles: { fontSize: 9, cellPadding: 5, textColor: [51, 65, 85], overflow: 'linebreak' },
               columnStyles: { 
                 0: { cellWidth: 40 },
                 1: { cellWidth: 35, fontStyle: 'bold' },
                 2: { cellWidth: 'auto' }
               },
               margin: { left: 20, right: 20 }
            });
            finalY = doc.lastAutoTable.finalY + 20;
        }
      });
    } else {
      const headers = product.schema.map(f => f.label);
      const tableData = clientData.map(c => {
        return product.schema.map(f => {
           let val = c[f.key] || '-';
           if (f.type === 'datetime-local' && val !== '-') {
             val = new Date(val).toLocaleString();
           }
           return val;
        });
      });

      autoTable(doc, {
        startY: finalY,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [128, 0, 0], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 5 },
        margin: { left: 20, right: 20 }
      });
    }

    // Add page numbers footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
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
        <div className="tracker-top-action" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '30px' }}>
          {!product.isJourney && clients.length > 0 && (
             <button 
                onClick={() => downloadReport(`${product.name} Leads`, clients)}
                style={{ background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Download size={16} /> Export Report
             </button>
          )}
          <button className="btn-add-lead" onClick={handleOpenAddModal}>
            <Plus size={16} strokeWidth={3} /> Add Lead
          </button>
        </div>

        {product.isJourney ? (
          ['Minister', 'Khasdar', 'Aamdar', 'Nagarsevak'].map((position, pIdx) => {
            const positionClients = clients.filter(c => c.position === position);
            
            return (
              <div key={position} className="lead-category">
                <div className="category-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="category-icon">
                      <Building2 size={16} strokeWidth={2} />
                    </div>
                    <span className="category-title">{position} Leads</span>
                  </div>
                  {positionClients.length > 0 && (
                    <button 
                      onClick={() => downloadReport(`${position} Leads`, positionClients)}
                      style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Download size={14} /> Report
                    </button>
                  )}
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
