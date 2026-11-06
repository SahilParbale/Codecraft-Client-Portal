import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Select from 'react-select';
import { 
  getClients, addClient, updateClient, deleteClient, findProductById 
} from '../store/DataStore';

import { 
  ArrowLeft, Search, Download, Plus, Edit2, Trash2, 
  FileSpreadsheet, FileText, ChevronRight, ChevronLeft, 
  X, CheckCircle2, Clock, Building2, Users, 
  Layers, Activity, RefreshCw, AlertCircle
} from 'lucide-react';

import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ClientTableView.css';

const JOURNEY_POSITIONS = ['Minister', 'Khasdar', 'Aamdar', 'Nagarsevak'];

const STATUS_OPTIONS = [
  'All Statuses',
  'Pending',
  'Contacted',
  'Demo Scheduled',
  'Demo Completed',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
];

const PARTY_OPTIONS = [
  'All Parties',
  'BJP',
  'NCP',
  'NCP-SP',
  'Shiv Sena',
  'Shiv Sena (UBT)',
  'Congress',
  'MNS',
  'Other'
];

const themedSelectStyles = {
  control: (base, state) => ({
    ...base,
    padding: '2px 4px',
    borderRadius: '6px',
    borderColor: state.isFocused ? '#800000' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(128, 0, 0, 0.12)' : 'none',
    minHeight: '38px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    '&:hover': { borderColor: '#800000' }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '8px',
    boxShadow: '0 10px 25px -5px rgba(128, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
    border: '1px solid #fecdd3',
    overflow: 'hidden',
    zIndex: 9999
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? '#800000' 
      : state.isFocused 
      ? '#fff1f2' 
      : 'transparent',
    color: state.isSelected 
      ? '#ffffff' 
      : state.isFocused 
      ? '#800000' 
      : '#0f172a',
    fontWeight: state.isSelected ? 600 : 500,
    fontSize: '13px',
    borderRadius: '4px',
    margin: '2px 0',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease'
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? '#800000' : '#800000',
    transition: 'color 0.15s ease',
    '&:hover': { color: '#650019' }
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: '#f1f5f9'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#0f172a',
    fontWeight: 600,
    fontSize: '13px'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontSize: '13px'
  })
};

export default function ClientTableView() {
  const { productId, category } = useParams();
  const navigate = useNavigate();
  const product = findProductById(productId);

  // Core Data
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState(category || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedParty, setSelectedParty] = useState('All Parties');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync category param if URL changes
  useEffect(() => {
    if (category) {
      setActiveCategory(category);
    } else {
      setActiveCategory('all');
    }
  }, [category]);

  // Fetch Clients
  const loadData = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await getClients(productId);
      setClients(data || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!product) {
      navigate('/products');
      return;
    }
    loadData();
  }, [productId, product, navigate, loadData]);

  const getTranslatedValue = (client, fieldKey) => {
    if (!client) return '';
    if (client.translations && client.translations[fieldKey] && client.translations[fieldKey].en) {
      return client.translations[fieldKey].en;
    }
    return client[fieldKey] || '';
  };

  // Switch category tab
  const handleCategoryChange = (newCat) => {
    setActiveCategory(newCat);
    setCurrentPage(1);
    if (newCat === 'all') {
      navigate(`/tracker/${productId}/view-all`, { replace: true });
    } else {
      navigate(`/tracker/${productId}/view-all/${newCat}`, { replace: true });
    }
  };

  // Filtered & Sorted Clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // 1. Category Filter (for Journey products)
    if (product?.isJourney && activeCategory !== 'all') {
      result = result.filter(c => c.position === activeCategory);
    }

    // 2. Status Filter
    if (selectedStatus !== 'All Statuses') {
      result = result.filter(c => {
        const status = c.finalStatus || c.result || 'Pending';
        return status.toLowerCase() === selectedStatus.toLowerCase();
      });
    }

    // 3. Party Filter
    if (product?.isJourney && selectedParty !== 'All Parties') {
      result = result.filter(c => c.party === selectedParty);
    }

    // 4. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const name = (getTranslatedValue(c, 'name') || '').toLowerCase();
        const party = (c.party || '').toLowerCase();
        const position = (c.position || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        const status = (c.finalStatus || c.result || '').toLowerCase();
        return name.includes(q) || party.includes(q) || position.includes(q) || company.includes(q) || status.includes(q);
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id - a.id);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0) || (a.id - b.id);
      }
      if (sortBy === 'name_asc') {
        return (getTranslatedValue(a, 'name') || '').localeCompare(getTranslatedValue(b, 'name') || '');
      }
      if (sortBy === 'name_desc') {
        return (getTranslatedValue(b, 'name') || '').localeCompare(getTranslatedValue(a, 'name') || '');
      }
      if (sortBy === 'events_desc') {
        const eventsA = a.events ? a.events.length : 0;
        const eventsB = b.events ? b.events.length : 0;
        return eventsB - eventsA;
      }
      return 0;
    });

    return result;
  }, [clients, product, activeCategory, selectedStatus, selectedParty, searchQuery, sortBy]);

  // Pagination calculation
  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  // Category Metrics (calculated based on current category slice)
  const categoryMetrics = useMemo(() => {
    const catPool = product?.isJourney && activeCategory !== 'all'
      ? clients.filter(c => c.position === activeCategory)
      : clients;

    const total = catPool.length;
    let activePipeline = 0;
    let closedWon = 0;
    let totalEvents = 0;

    catPool.forEach(c => {
      const s = (c.finalStatus || c.result || 'Pending').toLowerCase();
      if (s.includes('won') || s === 'closed') {
        closedWon += 1;
      } else if (s.includes('contacted') || s.includes('demo') || s.includes('negotiation') || s.includes('follow-up')) {
        activePipeline += 1;
      }
      if (c.events && Array.isArray(c.events)) {
        totalEvents += c.events.length;
      }
    });

    const winRate = total > 0 ? Math.round((closedWon / total) * 100) : 0;

    return { total, activePipeline, closedWon, winRate, totalEvents };
  }, [clients, product, activeCategory]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingClient(null);
    if (!product) return;
    const initialData = {};
    product.schema.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.key] = false;
      } else if (field.type === 'select') {
        // Pre-select position if we are in a category view
        if (field.key === 'position' && activeCategory !== 'all') {
          initialData[field.key] = activeCategory;
        } else {
          initialData[field.key] = field.options[0];
        }
      } else if (field.type === 'datetime-local') {
        initialData[field.key] = new Date();
      } else {
        initialData[field.key] = '';
      }
    });
    setFormData(initialData);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (client, e) => {
    e.stopPropagation();
    setEditingClient(client);
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

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const clientPayload = {
      ...formData,
      productId
    };

    try {
      if (editingClient) {
        await updateClient(productId, editingClient.id, clientPayload);
      } else {
        await addClient(productId, clientPayload);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save client:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Lead
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClient(productId, clientToDelete.id);
      await loadData();
      setClientToDelete(null);
    } catch (err) {
      console.error('Failed to delete client:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredClients.length === 0) return;

    let headers = ['#', 'Name'];
    if (product.isJourney) {
      headers.push('Party', 'Position', 'Status', 'Total Events', 'Created At');
    } else {
      product.schema.forEach(f => headers.push(f.label));
      headers.push('Created At');
    }

    const rows = filteredClients.map((client, idx) => {
      const name = getTranslatedValue(client, 'name');
      if (product.isJourney) {
        return [
          idx + 1,
          `"${name.replace(/"/g, '""')}"`,
          `"${(client.party || '-').replace(/"/g, '""')}"`,
          `"${(client.position || '-').replace(/"/g, '""')}"`,
          `"${(client.finalStatus || 'Pending').replace(/"/g, '""')}"`,
          client.events ? client.events.length : 0,
          `"${new Date(client.createdAt || Date.now()).toLocaleDateString()}"`
        ];
      } else {
        const fieldVals = product.schema.map(f => {
          let val = getTranslatedValue(client, f.key) || '-';
          if (f.type === 'datetime-local' && val !== '-') {
            val = new Date(val).toLocaleDateString();
          }
          if (f.type === 'checkbox') {
            val = val === true ? 'Yes' : 'No';
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        return [
          idx + 1,
          `"${name.replace(/"/g, '""')}"`,
          ...fieldVals.slice(1),
          `"${new Date(client.createdAt || Date.now()).toLocaleDateString()}"`
        ];
      }
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${product.name}_${activeCategory}_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredClients.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    doc.setFont('helvetica');

    // Title banner
    doc.setFontSize(20);
    doc.setTextColor(128, 0, 0); // Maroon
    const titleText = `${product.name} - ${activeCategory === 'all' ? 'All Leads' : activeCategory + ' Leads'}`.toUpperCase();
    doc.text(titleText, pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Total Records: ${filteredClients.length}`, pageWidth / 2, 28, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);

    let head = [];
    let body = [];

    if (product.isJourney) {
      head = [['#', 'Lead Name', 'Party', 'Position', 'Total Events', 'Status', 'Created Date']];
      body = filteredClients.map((client, idx) => [
        idx + 1,
        getTranslatedValue(client, 'name'),
        client.party || '-',
        client.position || '-',
        `${client.events ? client.events.length : 0} Events`,
        client.finalStatus || 'Pending',
        new Date(client.createdAt || Date.now()).toLocaleDateString()
      ]);
    } else {
      head = [['#', ...product.schema.map(f => f.label.toUpperCase()), 'Date']];
      body = filteredClients.map((client, idx) => [
        idx + 1,
        ...product.schema.map(f => {
          let val = getTranslatedValue(client, f.key) || '-';
          if (f.type === 'datetime-local' && val !== '-') {
            val = new Date(val).toLocaleDateString();
          }
          if (f.type === 'checkbox') {
            val = val === true ? 'Yes' : 'No';
          }
          return String(val);
        }),
        new Date(client.createdAt || Date.now()).toLocaleDateString()
      ]);
    }

    autoTable(doc, {
      startY: 38,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [128, 0, 0], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3.5, font: 'helvetica' },
      alternateRowStyles: { fillColor: [250, 248, 248] },
      margin: { left: 14, right: 14 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount} | Codecraft Client Manager`, pageWidth / 2, doc.internal.pageSize.height - 8, { align: 'center' });
    }

    doc.save(`${product.name.replace(/\s+/g, '_')}_${activeCategory}_Table.pdf`);
  };

  const renderBadge = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    let badgeClass = 'badge-pending';

    if (s.includes('won') || s === 'closed') badgeClass = 'badge-won';
    else if (s.includes('demo')) badgeClass = 'badge-demo';
    else if (s.includes('contacted') || s.includes('negotiation')) badgeClass = 'badge-active';
    else if (s.includes('lost')) badgeClass = 'badge-lost';

    return (
      <span className={`status-pill ${badgeClass}`}>
        <span className="status-dot"></span>
        <span className="status-text">{status || 'Pending'}</span>
      </span>
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All Statuses');
    setSelectedParty('All Parties');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedStatus !== 'All Statuses' || selectedParty !== 'All Parties';

  if (!product) return null;

  return (
    <div className="tableview-root">
      {/* =========================================
           TOP APPLICATION HEADER
      ========================================== */}
      <header className="tableview-header">
        <div className="tableview-header-left">
          <button 
            className="tableview-back-btn" 
            onClick={() => navigate(`/tracker/${productId}`)}
            title="Return to Product Tracker"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Back to Dashboard</span>
          </button>

          <div className="tableview-header-divider"></div>

          {/* Breadcrumb Path */}
          <nav className="tableview-breadcrumbs">
            <Link to="/products" className="breadcrumb-link">Products</Link>
            <ChevronRight size={14} className="breadcrumb-arrow" />
            <Link to={`/tracker/${productId}`} className="breadcrumb-link">{product.name}</Link>
            <ChevronRight size={14} className="breadcrumb-arrow" />
            <span className="breadcrumb-current">
              {activeCategory === 'all' ? 'All Leads' : `${activeCategory} Leads`}
            </span>
          </nav>
        </div>

        <div className="tableview-header-right">
          <button 
            className="btn-header-action btn-refresh" 
            onClick={() => loadData(true)} 
            disabled={isRefreshing}
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
            <span className="hide-mobile">Refresh</span>
          </button>

          <button 
            className="btn-header-action btn-export-csv" 
            onClick={handleExportCSV}
            disabled={filteredClients.length === 0}
            title="Export CSV"
          >
            <FileSpreadsheet size={15} />
            <span className="hide-mobile">CSV</span>
          </button>

          <button 
            className="btn-header-action btn-export-pdf" 
            onClick={handleExportPDF}
            disabled={filteredClients.length === 0}
            title="Export PDF"
          >
            <Download size={15} />
            <span className="hide-mobile">PDF Report</span>
          </button>

          <button className="btn-header-action btn-primary-add" onClick={handleOpenAddModal}>
            <Plus size={16} strokeWidth={3} />
            <span>Add Lead</span>
          </button>
        </div>
      </header>

      {/* =========================================
           MAIN CONTAINER
      ========================================== */}
      <main className="tableview-main animate-fade-in">

        {/* Title Bar & Subtitle */}
        <section className="tableview-title-section">
          <div>
            <div className="title-row">
              <h1 className="tableview-title">
                {activeCategory === 'all' ? `${product.name} — All Leads` : `${activeCategory} Leads`}
              </h1>
              <span className="tableview-count-pill">
                {totalItems} {totalItems === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="tableview-subtitle">
              Live directory with real-time filtering, journey touchpoints, and export tools.
            </p>
          </div>
        </section>

        {/* =========================================
             CATEGORY TABS (For Journey products)
        ========================================== */}
        {product.isJourney && (
          <nav className="tableview-category-tabs">
            <button 
              className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('all')}
            >
              <Layers size={14} />
              <span>All Categories</span>
              <span className="tab-badge">{clients.length}</span>
            </button>
            {JOURNEY_POSITIONS.map(pos => {
              const count = clients.filter(c => c.position === pos).length;
              return (
                <button
                  key={pos}
                  className={`cat-tab ${activeCategory === pos ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(pos)}
                >
                  <Building2 size={14} />
                  <span>{pos} Leads</span>
                  <span className="tab-badge">{count}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* =========================================
             KPI SUMMARY METRIC CARDS
        ========================================== */}
        <section className="tableview-metrics-grid">
          <div className="kpi-card">
            <div className="kpi-icon-wrap">
              <Users size={17} />
            </div>
            <div className="kpi-details">
              <div className="kpi-value">{isLoading ? '...' : categoryMetrics.total}</div>
              <div className="kpi-label">Total Leads</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap">
              <Activity size={17} />
            </div>
            <div className="kpi-details">
              <div className="kpi-value">{isLoading ? '...' : categoryMetrics.activePipeline}</div>
              <div className="kpi-label">Active Pipeline</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap">
              <CheckCircle2 size={17} />
            </div>
            <div className="kpi-details">
              <div className="kpi-value">
                {isLoading ? '...' : categoryMetrics.closedWon}
                <span className="kpi-sub-rate">({categoryMetrics.winRate}%)</span>
              </div>
              <div className="kpi-label">Closed Won</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap">
              <Clock size={17} />
            </div>
            <div className="kpi-details">
              <div className="kpi-value">{isLoading ? '...' : categoryMetrics.totalEvents}</div>
              <div className="kpi-label">Total Touchpoints</div>
            </div>
          </div>
        </section>

        {/* =========================================
             TOOLBAR: SEARCH, FILTERS & SORT
        ========================================== */}
        <section className="tableview-toolbar-card">
          <div className="toolbar-search-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="toolbar-search-input" 
              placeholder="Search leads by name, party, position, or company..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-controls-row">
            {/* Status Filter */}
            <div className="control-group">
              <span className="control-label">Status:</span>
              <select 
                className="toolbar-select"
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              >
                {STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Party Filter (For Journey) */}
            {product.isJourney && (
              <div className="control-group">
                <span className="control-label">Party:</span>
                <select 
                  className="toolbar-select"
                  value={selectedParty}
                  onChange={e => { setSelectedParty(e.target.value); setCurrentPage(1); }}
                >
                  {PARTY_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Selector */}
            <div className="control-group">
              <span className="control-label">Sort:</span>
              <select 
                className="toolbar-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Added</option>
                <option value="oldest">Oldest Added</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                {product.isJourney && <option value="events_desc">Most Interactions</option>}
              </select>
            </div>

            {hasActiveFilters && (
              <button className="btn-clear-filters" onClick={clearAllFilters} title="Reset all filters">
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </section>

        {/* =========================================
             ENTERPRISE DATA TABLE
        ========================================== */}
        <section className="tableview-table-card">
          <div className="tableview-scroll-container">
            <table className="tableview-grid-table">
              <thead>
                <tr>
                  <th className="th-sr">#</th>
                  <th className="th-name">Lead Profile</th>
                  {product.isJourney ? (
                    <>
                      <th className="th-party">Party</th>
                      <th className="th-pos">Designation</th>
                      <th className="th-events">Interactions</th>
                    </>
                  ) : (
                    product.schema.map(f => (
                      <th key={f.key} className="th-custom">{f.label}</th>
                    ))
                  )}
                  <th className="th-status">Pipeline Status</th>
                  <th className="th-date">Created</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={product.isJourney ? 7 : product.schema.length + 4}>
                      <div className="table-loader-state">
                        <RefreshCw size={24} className="spin-icon" />
                        <span>Loading enterprise client directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={product.isJourney ? 7 : product.schema.length + 4}>
                      <div className="table-empty-state">
                        <div className="empty-icon-box">
                          <FileText size={28} />
                        </div>
                        <h3 className="empty-head">
                          {hasActiveFilters ? 'No Matching Records Found' : 'No Leads Recorded Yet'}
                        </h3>
                        <p className="empty-sub">
                          {hasActiveFilters 
                            ? 'Try clearing search keywords or loosening status filters.' 
                            : `Start tracking prospects by adding a new lead to ${activeCategory === 'all' ? product.name : activeCategory}.`}
                        </p>
                        {hasActiveFilters ? (
                          <button className="btn-empty-action" onClick={clearAllFilters}>
                            <X size={14} /> Clear Search & Filters
                          </button>
                        ) : (
                          <button className="btn-empty-action" onClick={handleOpenAddModal}>
                            <Plus size={14} /> Add First Lead
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    const clientName = getTranslatedValue(client, 'name') || 'Unnamed Lead';
                    const initials = clientName.slice(0, 2).toUpperCase();
                    const createdDate = client.createdAt 
                      ? new Date(client.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : '-';

                    return (
                      <tr 
                        key={client.id}
                        className="table-row-hover"
                        onClick={() => {
                          if (product.isJourney) {
                            navigate(`/tracker/${productId}/client/${client.id}`, { state: { client } });
                          }
                        }}
                        style={{ cursor: product.isJourney ? 'pointer' : 'default' }}
                      >
                        {/* Row Index */}
                        <td className="td-sr">
                          <span className="row-index-pill">{rowNumber}</span>
                        </td>

                        {/* Name Column with Avatar */}
                        <td className="td-name">
                          <div className="lead-avatar-cell">
                            <div className="lead-avatar-bubble">{initials}</div>
                            <div className="lead-name-meta">
                              <span className="lead-main-name">{clientName}</span>
                              {client.company && (
                                <span className="lead-sub-org">{client.company}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Journey-specific Columns */}
                        {product.isJourney ? (
                          <>
                            <td className="td-party">
                              <span className="party-badge">
                                {client.party || '-'}
                              </span>
                            </td>

                            <td className="td-pos">
                              <span className="position-pill">{client.position || '-'}</span>
                            </td>

                            <td className="td-events">
                              <div className="touchpoint-chip" title="Click row to open client journey">
                                <Clock size={13} />
                                <span>{client.events ? client.events.length : 0} logged</span>
                              </div>
                            </td>
                          </>
                        ) : (
                          /* Non-journey custom schema columns */
                          product.schema.map(f => {
                            let val = getTranslatedValue(client, f.key) || '-';
                            if (f.type === 'datetime-local' && val !== '-') {
                              val = new Date(val).toLocaleDateString();
                            }
                            if (f.type === 'checkbox') {
                              val = val === true ? 'Yes' : 'No';
                            }
                            return (
                              <td key={f.key} className="td-custom">
                                {f.key === 'result' ? renderBadge(val) : val}
                              </td>
                            );
                          })
                        )}

                        {/* Status Column */}
                        <td className="td-status">
                          {renderBadge(client.finalStatus || client.result)}
                        </td>

                        {/* Creation Date */}
                        <td className="td-date">
                          <span className="date-text">{createdDate}</span>
                        </td>

                        {/* Actions Column */}
                        <td className="td-actions" onClick={e => e.stopPropagation()}>
                          <div className="action-button-group">
                            {product.isJourney && (
                              <button 
                                className="action-btn action-journey" 
                                onClick={() => navigate(`/tracker/${productId}/client/${client.id}`, { state: { client } })}
                                title="Open Journey Timeline"
                              >
                                <Clock size={14} />
                              </button>
                            )}

                            <button 
                              className="action-btn action-edit" 
                              onClick={(e) => handleOpenEditModal(client, e)}
                              title="Edit Lead Details"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button 
                              className="action-btn action-delete" 
                              onClick={() => setClientToDelete(client)}
                              title="Delete Lead"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* =========================================
               TABLE FOOTER & PAGINATION CONTROLS
          ========================================== */}
          <footer className="tableview-footer">
            <div className="footer-info">
              <span>Showing </span>
              <strong>{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong>
              <span> to </span>
              <strong>{Math.min(currentPage * pageSize, totalItems)}</strong>
              <span> of </span>
              <strong>{totalItems}</strong>
              <span> entries</span>
            </div>

            <div className="footer-controls">
              {/* Rows Per Page */}
              <div className="page-size-picker">
                <span>Rows per page:</span>
                <select 
                  value={pageSize} 
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div className="pagination-buttons">
                <button 
                  className="page-nav-btn" 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="page-indicator">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </div>

                <button 
                  className="page-nav-btn" 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </footer>
        </section>

      </main>

      {/* =========================================
           ADD / EDIT LEAD MODAL
      ========================================== */}
      {isModalOpen && (
        <div className="tableview-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="tableview-modal-card animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  {editingClient ? <Edit2 size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h2 className="modal-title-text">
                    {editingClient ? 'Edit Lead Profile' : 'Add New Lead'}
                  </h2>
                  <p className="modal-sub-text">
                    {editingClient ? 'Update prospect information and pipeline status' : `Register prospect under ${product.name}`}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="modal-body-form">
              <div className="modal-fields-grid">
                {product.schema.map(field => {
                  if (field.type === 'checkbox') {
                    return (
                      <div key={field.key} className="form-checkbox-row">
                        <input 
                          type="checkbox"
                          id={`input-${field.key}`}
                          checked={formData[field.key] || false}
                          onChange={e => handleInputChange(field.key, e.target.checked)}
                          className="modern-checkbox"
                        />
                        <label htmlFor={`input-${field.key}`} className="checkbox-label-text">
                          {field.label}
                        </label>
                      </div>
                    );
                  }

                  if (field.type === 'select') {
                    const currentVal = formData[field.key];
                    const selectedOption = currentVal ? { value: currentVal, label: currentVal } : null;
                    return (
                      <div key={field.key} className="form-group-item">
                        <label className="form-field-label">
                          {field.label} {field.required && <span className="req">*</span>}
                        </label>
                        <Select
                          options={field.options.map(opt => ({ value: opt, label: opt }))}
                          value={selectedOption}
                          onChange={opt => handleInputChange(field.key, opt ? opt.value : '')}
                          styles={themedSelectStyles}
                          placeholder="Select..."
                        />
                      </div>
                    );
                  }

                  if (field.type === 'datetime-local') {
                    return (
                      <div key={field.key} className="form-group-item">
                        <label className="form-field-label">
                          {field.label} {field.required && <span className="req">*</span>}
                        </label>
                        <DatePicker
                          selected={formData[field.key] ? new Date(formData[field.key]) : new Date()}
                          onChange={date => handleInputChange(field.key, date)}
                          showTimeSelect
                          dateFormat="Pp"
                          className="form-input-field"
                          required={field.required}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className="form-group-item">
                      <label className="form-field-label">
                        {field.label} {field.required && <span className="req">*</span>}
                      </label>
                      <input 
                        type="text"
                        className="form-input-field"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        value={formData[field.key] || ''}
                        onChange={e => handleInputChange(field.key, e.target.value)}
                        required={field.required}
                      />
                    </div>
                  );
                })}

                {/* If editing a journey client, allow updating finalStatus */}
                {editingClient && product.isJourney && (
                  <div className="form-group-item">
                    <label className="form-field-label">Pipeline Stage</label>
                    <Select
                      options={STATUS_OPTIONS.filter(s => s !== 'All Statuses').map(s => ({ value: s, label: s }))}
                      value={{ value: formData.finalStatus || 'Pending', label: formData.finalStatus || 'Pending' }}
                      onChange={opt => handleInputChange('finalStatus', opt ? opt.value : 'Pending')}
                      styles={themedSelectStyles}
                      placeholder="Select Stage..."
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions-bar">
                <button 
                  type="button" 
                  className="btn-modal-cancel" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-save" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingClient ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
           DELETE CONFIRMATION MODAL
      ========================================== */}
      {clientToDelete && (
        <div className="tableview-modal-backdrop" onClick={() => setClientToDelete(null)}>
          <div className="tableview-delete-dialog animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="delete-dialog-icon">
              <AlertCircle size={28} />
            </div>
            <h3 className="delete-dialog-title">Delete Lead Record?</h3>
            <p className="delete-dialog-msg">
              Are you sure you want to permanently delete <strong>{getTranslatedValue(clientToDelete, 'name')}</strong>? 
              This action cannot be undone.
            </p>
            <div className="delete-dialog-actions">
              <button 
                className="btn-modal-cancel" 
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn-delete-confirm" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
