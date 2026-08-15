// src/store/DataStore.js
import { supabase } from '../supabaseClient';

const PRODUCTS_KEY = 'codecraft_products';
const AUTH_KEY = 'codecraft_auth';

const politicalSchema = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'position', label: 'Position', type: 'text', required: true },
  { key: 'party', label: 'Party', type: 'text', required: true },
  { key: 'called', label: 'Called', type: 'checkbox' },
  { key: 'demoTime', label: 'Demo Time', type: 'datetime-local', required: true },
  { key: 'result', label: 'Final Result', type: 'select', options: ['Pending', 'Follow-up', 'Closed Won', 'Closed Lost'] }
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
  { id: 'prod-1', name: 'Krishnaniti ERP System', description: 'Comprehensive Enterprise Resource Planning', schema: politicalSchema },
  { id: 'prod-4', name: 'Election Management System', description: 'Complete Election Tracking & Management', schema: politicalSchema },
  { id: 'prod-3', name: 'SocialHub', description: 'Social Media Management Platform', schema: genericSchema },
  { id: 'prod-5', name: 'AI Interview', description: 'Automated AI Interview & Screening', schema: interviewSchema },
  { id: 'prod-2', name: 'Builder AI', description: 'AI-Powered App Builder', schema: builderSchema },
];

export const getClients = async (productId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    ...row.client_data,
    createdAt: row.created_at
  }));
};

export const addClient = async (productId, clientData) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([{ product_id: productId, client_data: clientData }])
    .select();

  if (error) {
    console.error('Error adding client:', error);
    alert('Supabase Error: ' + error.message + '\nDetails: ' + error.details);
    return null;
  }

  return {
    id: data[0].id,
    ...data[0].client_data,
    createdAt: data[0].created_at
  };
};

export const updateClient = async (productId, clientId, updatedData) => {
  const { data, error } = await supabase
    .from('clients')
    .update({ client_data: updatedData })
    .eq('id', clientId)
    .select();

  if (error) {
    console.error('Error updating client:', error);
    return null;
  }

  return {
    id: data[0].id,
    ...data[0].client_data,
    createdAt: data[0].created_at
  };
};

export const setAuth = (isLoggedIn) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn }));
};

export const getAuth = () => {
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{"isLoggedIn": false}');
  return auth.isLoggedIn;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};
