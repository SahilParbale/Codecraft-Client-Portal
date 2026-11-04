// src/store/DataStore.js
import { supabase } from '../supabaseClient';

const AUTH_KEY = 'codecraft_auth';
const CACHE_PREFIX = 'codecraft_cached_clients_';
const TOTAL_CLIENTS_CACHE_KEY = 'codecraft_total_clients_count';

const krishnanitiSchema = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'position', label: 'Position', type: 'select', options: ['Minister', 'Khasdar', 'Aamdar', 'Nagarsevak'], required: true },
  { key: 'party', label: 'Party', type: 'select', options: ['BJP', 'NCP', 'NCP-SP', 'Shiv Sena', 'Shiv Sena (UBT)', 'Congress', 'MNS', 'Other'], required: true }
];

const genericSchema = [
  { key: 'name', label: 'Client Name', type: 'text', required: true },
  { key: 'called', label: 'Called', type: 'checkbox' },
  { key: 'demoRequested', label: 'Demo Requested', type: 'checkbox' },
  { key: 'dateTime', label: 'Date & Time', type: 'datetime-local', required: true },
  { key: 'result', label: 'Result', type: 'select', options: ['Pending', 'Follow-up', 'Demo Scheduled', 'Closed Won', 'Closed Lost'] }
];

const builderSchema = [
  { key: 'name', label: 'Builder Name', type: 'text', required: true },
  { key: 'company', label: 'Company Name', type: 'text', required: true },
  { key: 'called', label: 'Called', type: 'checkbox' },
  { key: 'demoTime', label: 'Demo Time', type: 'datetime-local', required: true },
  { key: 'result', label: 'Final Result', type: 'select', options: ['Pending', 'Follow-up', 'Closed Won', 'Closed Lost'] }
];

const interviewSchema = [
  { key: 'name', label: 'College Representative', type: 'text', required: true },
  { key: 'company', label: 'College Name', type: 'text', required: true },
  { key: 'called', label: 'Called', type: 'checkbox' },
  { key: 'demoTime', label: 'Demo Time', type: 'datetime-local', required: true },
  { key: 'result', label: 'Final Result', type: 'select', options: ['Pending', 'Follow-up', 'Closed Won', 'Closed Lost'] }
];

export const PRODUCTS = [
  { id: 'prod-1', name: 'Krishnaniti ERP System', description: 'Comprehensive Enterprise Resource Planning', schema: krishnanitiSchema, isJourney: true },
  { id: 'prod-4', name: 'Election Management System', description: 'Complete Election Tracking & Management', schema: krishnanitiSchema, isJourney: true },
  { id: 'prod-3', name: 'SocialHub', description: 'Social Media Management Platform', schema: genericSchema, isJourney: false },
  { id: 'prod-5', name: 'AI Interview', description: 'Automated AI Interview & Screening', schema: interviewSchema, isJourney: false },
  { id: 'prod-2', name: 'Builder AI', description: 'Builder line project which gives 3d walkthrough then vr ar', schema: builderSchema, isJourney: false },
];

// Helper to resolve product from ID, partial ID, or slug
export const findProductById = (id) => {
  if (!id) return null;
  const strId = String(id).trim().toLowerCase();
  return PRODUCTS.find(p => 
    p.id.toLowerCase() === strId || 
    p.id.toLowerCase() === `prod-${strId}` ||
    strId === p.id.replace('prod-', '') ||
    p.name.toLowerCase().includes(strId)
  ) || null;
};

export const getClients = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const formatted = data.map(row => ({
        id: row.id,
        ...row.client_data,
        createdAt: row.created_at
      }));
      // Cache in localStorage for offline PWA support
      try {
        localStorage.setItem(CACHE_PREFIX + productId, JSON.stringify(formatted));
      } catch (e) {
        console.warn('Could not cache clients locally:', e);
      }
      return formatted;
    }
  } catch (err) {
    console.warn('Network issue fetching clients, falling back to local cache:', err);
  }

  // Fallback to offline cache
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + productId);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Error reading offline cache:', e);
  }

  return [];
};

export const getTotalClientsCount = async () => {
  try {
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
      
    if (!error && count !== null) {
      localStorage.setItem(TOTAL_CLIENTS_CACHE_KEY, String(count));
      return count;
    }
  } catch (err) {
    console.warn('Network issue fetching total clients count, checking cache:', err);
  }

  // Fallback to cache
  const cached = localStorage.getItem(TOTAL_CLIENTS_CACHE_KEY);
  if (cached) return parseInt(cached, 10);

  // Or calculate from cached product lists
  let total = 0;
  PRODUCTS.forEach(p => {
    try {
      const data = localStorage.getItem(CACHE_PREFIX + p.id);
      if (data) total += JSON.parse(data).length;
    } catch {
      // Ignore cache read failures
    }
  });

  return total;
};

export const addClient = async (productIdOrClient, maybeClientData) => {
  let prodId = productIdOrClient;
  let clientData = maybeClientData;

  // Handle call as addClient(clientObj) where clientObj has .productId
  if (typeof productIdOrClient === 'object' && productIdOrClient !== null) {
    prodId = productIdOrClient.productId;
    clientData = productIdOrClient;
  }

  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ product_id: prodId, client_data: clientData }])
      .select();

    if (!error && data && data.length > 0) {
      const newRecord = {
        id: data[0].id,
        ...data[0].client_data,
        createdAt: data[0].created_at
      };

      // Update offline cache
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + prodId) || '[]');
        cached.push(newRecord);
        localStorage.setItem(CACHE_PREFIX + prodId, JSON.stringify(cached));
      } catch {
        // Ignore cache write failures
      }

      return newRecord;
    }

    if (error) {
      console.error('Error adding client:', error);
      alert('Supabase Error: ' + error.message + '\nDetails: ' + error.details);
    }
  } catch (err) {
    console.error('Network exception adding client:', err);
    // Offline local creation
    const offlineRecord = {
      id: 'offline-' + Date.now(),
      ...clientData,
      createdAt: new Date().toISOString()
    };
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + prodId) || '[]');
      cached.push(offlineRecord);
      localStorage.setItem(CACHE_PREFIX + prodId, JSON.stringify(cached));
    } catch {
      // Ignore cache write failures
    }
    return offlineRecord;
  }

  return null;
};

export const updateClient = async (productId, clientId, updatedData) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ client_data: updatedData })
      .eq('id', clientId)
      .select();

    if (!error && data && data.length > 0) {
      const record = {
        id: data[0].id,
        ...data[0].client_data,
        createdAt: data[0].created_at
      };

      // Update offline cache
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + productId) || '[]');
        const updated = cached.map(c => String(c.id) === String(clientId) ? record : c);
        localStorage.setItem(CACHE_PREFIX + productId, JSON.stringify(updated));
      } catch {
        // Ignore cache write failures
      }

      return record;
    }

    if (error) {
      console.error('Error updating client:', error);
    }
  } catch (err) {
    console.warn('Network issue updating client, saving offline locally:', err);
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + productId) || '[]');
      const record = { id: clientId, ...updatedData };
      const updated = cached.map(c => String(c.id) === String(clientId) ? { ...c, ...record } : c);
      localStorage.setItem(CACHE_PREFIX + productId, JSON.stringify(updated));
      return record;
    } catch {
      // Ignore cache write failures
    }
  }

  return null;
};

// Persist auth in both localStorage and sessionStorage so refresh/new window never loses session
export const setAuth = (isLoggedIn) => {
  const payload = JSON.stringify({ isLoggedIn: Boolean(isLoggedIn) });
  if (isLoggedIn) {
    localStorage.setItem(AUTH_KEY, payload);
    sessionStorage.setItem(AUTH_KEY, payload);
  } else {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  }
};

export const getAuth = () => {
  try {
    const local = localStorage.getItem(AUTH_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.isLoggedIn) return true;
    }
  } catch {
    // Ignore storage read error
  }

  try {
    const session = sessionStorage.getItem(AUTH_KEY);
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.isLoggedIn) return true;
    }
  } catch {
    // Ignore storage read error
  }

  return false;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
};
