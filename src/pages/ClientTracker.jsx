import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getClients, addClient, updateClient, findProductById } from '../store/DataStore';
import PWAInstallButton from '../components/PWAInstallButton';
import { 
  X, Edit2, Plus, Code, FileText, Building2, Download, ArrowLeft
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
  const { t } = useTranslation();
  const product = findProductById(productId);
  
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dynamic Form State
  const [formData, setFormData] = useState({});
  const [editingClientId, setEditingClientId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTranslatedValue = (client, fieldKey) => {
    if (client.translations && client.translations[fieldKey] && client.translations[fieldKey].en) {
      return client.translations[fieldKey].en;
    }
    return client[fieldKey] || '';
  };

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

  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newClient = {
      ...formData,
      productId
    };

    if (editingClientId) {
      await updateClient(productId, editingClientId, newClient);
    } else {
      await addClient(productId, newClient);
    }
    
    setClients(await getClients(productId));
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const downloadReport = async (title, clientData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    doc.setFont('helvetica');
    const tableStyles = { font: 'helvetica' };
    
    // Centered Professional Header
    doc.setFontSize(22);
    doc.setTextColor(128, 0, 0); // Maroon
    doc.text(title.toUpperCase(), pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate Gray
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 29, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 34, pageWidth - 14, 34);

    let finalY = 40;

    if (product.isJourney) {
      clientData.forEach((client, index) => {
        if (finalY > 230) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        const clientName = getTranslatedValue(client, 'name');
        const clientParty = client.party ? (t(`options.${client.party}`) !== `options.${client.party}` ? t(`options.${client.party}`) : client.party) : '-';
        const clientPosition = client.position ? (t(`options.${client.position}`) !== `options.${client.position}` ? t(`options.${client.position}`) : client.position) : '-';
        doc.text(`${index + 1}. ${clientName} (${clientParty} - ${clientPosition})`, 14, finalY);
        finalY += 4;

        const infoHeaders = [t('pdf.field'), t('pdf.details')];
        const infoData = [
          [t('pdf.full_name'), clientName],
          [t('pdf.party'), clientParty],
          [t('pdf.position'), clientPosition],
          [t('pdf.current_status'), client.finalStatus ? (t(`options.${client.finalStatus}`) !== `options.${client.finalStatus}` ? t(`options.${client.finalStatus}`) : client.finalStatus) : t('options.Pending')],
          [t('pdf.total_interactions'), `${client.events ? client.events.length : 0} ${t('pdf.interactions_recorded')}`],
          [t('pdf.created_date'), new Date(client.createdAt).toLocaleDateString()]
        ];

        autoTable(doc, {
          startY: finalY,
          head: [infoHeaders],
          body: infoData,
          theme: 'striped',
          headStyles: { fillColor: [128, 0, 0], textColor: 255, ...tableStyles },
          styles: { fontSize: 9, cellPadding: 4, ...tableStyles },
          margin: { left: 14, right: 14 }
        });

        finalY = doc.lastAutoTable.finalY + 6;

        if (client.events && client.events.length > 0) {
          if (finalY > 230) {
            doc.addPage();
            finalY = 20;
          }

          doc.setFontSize(11);
          doc.setTextColor(51, 65, 85);
          doc.text(`   ${t('pdf.timeline_events')}`, 14, finalY);
          finalY += 3;

          const eventHeaders = [t('pdf.event_type'), t('pdf.date'), t('pdf.details')];
          const eventData = client.events.map(e => [
            t(`journey.${e.type.toLowerCase()}`),
            new Date(e.date).toLocaleDateString(),
            getTranslatedValue(e, 'details')
          ]);

          autoTable(doc, {
            startY: finalY,
            head: [eventHeaders],
            body: eventData,
            theme: 'grid',
            headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], lineWidth: 0.1, lineColor: [226, 232, 240], ...tableStyles },
            styles: { fontSize: 8, cellPadding: 3, ...tableStyles },
            margin: { left: 20, right: 14 }
          });

          finalY = doc.lastAutoTable.finalY + 12;
        } else {
          finalY += 6;
        }
      });
    } else {
      const headers = [t('tracker.sr_no'), ...product.schema.map(f => t(`schema.${f.label}`).toUpperCase())];
      const tableData = clientData.map((client, index) => {
        return [
          index + 1,
          ...product.schema.map(field => {
            let val = getTranslatedValue(client, field.key);
            if (field.type === 'datetime-local' && val) {
              return new Date(val).toLocaleDateString();
            }
            if (field.type === 'checkbox') {
              return val ? t('options.Yes') : t('options.No');
            }
            if (field.key === 'result' && val) {
              return t(`options.${val}`) !== `options.${val}` ? t(`options.${val}`) : val;
            }
            return val || '-';
          })
        ];
      });

      autoTable(doc, {
        startY: finalY,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [128, 0, 0], textColor: 255, ...tableStyles },
        styles: { fontSize: 9, cellPadding: 5, ...tableStyles },
        margin: { left: 14, right: 14 }
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`${t('pdf.page')} ${i} ${t('pdf.of')} ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
  };

  if (!product) return null;

  const renderBadge = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    let translatedStatus = status ? (t(`options.${status}`) !== `options.${status}` ? t(`options.${status}`) : status) : t('options.Pending');
    
    if (s.includes('closed') || s.includes('won')) return <span className="badge badge-closed">{translatedStatus}</span>;
    if (s.includes('demo')) return <span className="badge badge-demo">{translatedStatus}</span>;
    return <span className="badge badge-pending">{translatedStatus.toUpperCase()}</span>;
  };

  return (
    <div className="tracker-body">
      <header className="tracker-header">
        <div className="tracker-header-left">
          <button className="tracker-back-btn" onClick={() => navigate('/products')} title="Back to Products">
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span className="tracker-back-text">Products</span>
          </button>
          
          <div className="tracker-divider-v"></div>

          <div className="tracker-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
            <div className="tracker-logo">
              <Code size={20} strokeWidth={2.5} />
            </div>
            <div className="brand-text-container">
              <span className="tracker-title">{t(`products.${product.id}.name`)}</span>
              <span className="tracker-subtitle">{t('tracker.subtitle')}</span>
            </div>
          </div>
        </div>

        <div className="tracker-header-actions">
          <PWAInstallButton />
        </div>
      </header>

      <main className="tracker-container animate-fade-in">
        <div className="tracker-top-action">
          {!product.isJourney && clients.length > 0 && (
             <button 
                onClick={() => downloadReport(`${t(`products.${product.id}.name`)} ${t('tracker.report')}`, clients)}
                className="btn-export-report"
              >
                <Download size={16} /> <span>{t('tracker.export_report')}</span>
             </button>
          )}
          <button className="btn-add-lead" onClick={handleOpenAddModal}>
            <Plus size={16} strokeWidth={3} /> <span>{t('tracker.add_lead')}</span>
          </button>
        </div>

        {product.isJourney ? (
          ['Minister', 'Khasdar', 'Aamdar', 'Nagarsevak'].map((position) => {
            const positionClients = clients.filter(c => c.position === position);
            
            return (
              <div key={position} className="lead-category">
                <div className="category-header">
                  <div className="category-title-wrap">
                    <div className="category-icon">
                      <Building2 size={16} strokeWidth={2} />
                    </div>
                    <span className="category-title">{t('tracker.leads_title', { position: t(`options.${position}`) })}</span>
                    <span className="category-count">({positionClients.length})</span>
                  </div>
                  {positionClients.length > 0 && (
                    <button 
                      onClick={() => downloadReport(`${position} Leads`, positionClients)}
                      className="category-report-btn"
                    >
                      <Download size={14} /> <span>{t('tracker.report')}</span>
                    </button>
                  )}
                </div>
                
                <div className="table-card">
                  <div className="table-scroll-wrap">
                    <table className="leads-table">
                    <thead>
                      <tr>
                        <th className="col-sr">{t('tracker.sr_no')}</th>
                        <th className="col-name">{t('tracker.name')}</th>
                        <th className="col-party">{t('tracker.party')}</th>
                        <th className="col-events">{t('tracker.total_events')}</th>
                        <th>{t('tracker.status')}</th>
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
                              <div className="empty-title">{t('tracker.no_journey_leads', { position: t(`options.${position}`) })}</div>
                              <div className="empty-subtitle">{t('tracker.start_tracking')}</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        positionClients.map((client, index) => (
                          <tr key={client.id} onClick={() => navigate(`/tracker/${productId}/client/${client.id}`, { state: { client } })} style={{ cursor: 'pointer' }}>
                            <td className="col-sr">{index + 1}</td>
                            <td className="col-name">{getTranslatedValue(client, 'name')}</td>
                            <td className="col-party">{client.party ? (t(`options.${client.party}`) !== `options.${client.party}` ? t(`options.${client.party}`) : client.party) : '-'}</td>
                            <td className="col-events">{t('tracker.interactions', { count: client.events ? client.events.length : 0 })}</td>
                            <td>{renderBadge(client.finalStatus)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>
                  {positionClients.length > 0 && (
                    <div className="table-footer">
                      <span className="view-all-link">{t('tracker.view_all')}</span>
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
                    <th className="col-sr">{t('tracker.sr_no')}</th>
                    {product.schema.map(field => <th key={field.key} className="col-name">{t(`schema.${field.label}`).toUpperCase()}</th>)}
                    <th>{t('tracker.actions')}</th>
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
                          <div className="empty-title">{t('tracker.no_clients', { productName: t(`products.${product.id}.name`) })}</div>
                          <div className="empty-subtitle">{t('tracker.click_add')}</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clients.map((client, index) => (
                      <tr key={client.id}>
                        <td className="col-sr">{index + 1}</td>
                        {product.schema.map(field => {
                           let val = getTranslatedValue(client, field.key) || '-';
                           if (field.type === 'datetime-local' && val !== '-') {
                             val = new Date(val).toLocaleDateString();
                           }
                           if (field.type === 'checkbox') {
                             val = val === true ? t('options.Yes') : t('options.No');
                           }
                           if (field.key === 'result') {
                             return <td key={field.key}>{renderBadge(val)}</td>;
                           }
                           return <td key={field.key}>{val}</td>;
                        })}
                        <td>
                          <button className="icon-btn edit-lead-btn" onClick={() => handleEditClient(client)} title="Edit lead">
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

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingClientId ? t('tracker.edit_client') : t('tracker.add_new_lead')}</h2>
              <button className="modal-close-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddLeadSubmit}>
              <div className="modal-grid">
              {product.schema.map(field => {
                if (field.type === 'checkbox') {
                  return (
                    <div key={field.key} className="modal-field-checkbox">
                      <input 
                        type="checkbox" 
                        id={`check-${field.key}`}
                        checked={formData[field.key] || false}
                        onChange={e => handleInputChange(field.key, e.target.checked)} 
                        className="custom-checkbox"
                      />
                      <label htmlFor={`check-${field.key}`} className="checkbox-text">
                        {t(`schema.${field.label}`)}
                      </label>
                    </div>
                  );
                }
                
                if (field.type === 'select') {
                  const selectStyles = {
                    control: (base) => ({
                      ...base, padding: '2px', borderRadius: '8px', borderColor: '#e2e8f0', boxShadow: 'none',
                      minHeight: '44px',
                      '&:hover': { borderColor: '#cbd5e1' }
                    }),
                    option: (base, state) => ({
                      ...base, backgroundColor: state.isSelected ? '#800000' : state.isFocused ? '#f8fafc' : 'transparent',
                      color: state.isSelected ? 'white' : '#0f172a',
                      padding: '10px 14px'
                    })
                  };

                  return (
                    <div key={field.key} className="modal-field-group">
                      <label className="modal-field-label">
                        {t(`schema.${field.label}`)} {field.required && <span className="req">*</span>}
                      </label>
                      <Select
                        options={field.options.map(opt => ({ value: opt, label: t(`options.${opt}`) !== `options.${opt}` ? t(`options.${opt}`) : opt }))}
                        value={formData[field.key] ? { value: formData[field.key], label: t(`options.${formData[field.key]}`) !== `options.${formData[field.key]}` ? t(`options.${formData[field.key]}`) : formData[field.key] } : null}
                        onChange={(selectedOption) => handleInputChange(field.key, selectedOption ? selectedOption.value : '')}
                        styles={selectStyles}
                        placeholder={t('tracker.select_placeholder')}
                      />
                    </div>
                  );
                }

                if (field.type === 'datetime-local') {
                  return (
                    <div key={field.key} className="modal-field-group">
                      <label className="modal-field-label">
                        {t(`schema.${field.label}`)} {field.required && <span className="req">*</span>}
                      </label>
                      <DatePicker
                        selected={formData[field.key] ? new Date(formData[field.key]) : null}
                        onChange={(date) => handleInputChange(field.key, date ? date.toISOString() : '')}
                        showTimeSelect
                        dateFormat="Pp"
                        customInput={<input className="modal-input" />}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.key} className="modal-field-group">
                    <label className="modal-field-label">
                      {t(`schema.${field.label}`)} {field.required && <span className="req">*</span>}
                    </label>
                    <input 
                      type={field.type} 
                      value={formData[field.key] || ''} 
                      onChange={e => handleInputChange(field.key, e.target.value)} 
                      required={field.required} 
                      placeholder={t('tracker.enter_placeholder', { label: t(`schema.${field.label}`).toLowerCase() })}
                      className="modal-input"
                    />
                  </div>
                );
              })}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-modal-cancel">
                  {t('tracker.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-modal-save">
                  {isSubmitting ? t('tracker.saving') : (editingClientId ? t('tracker.save_changes') : t('tracker.add_lead'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
