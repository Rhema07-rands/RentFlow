// Priority:
// 1. VITE_API_URL environment variable (configured in Render / production build)
// 2. If hosted on Render (*.onrender.com) or custom HTTPS domain, default to live Render backend
// 3. Local network IP or localhost:5004 for local dev
const RENDER_API_URL = 'https://rentflow-api-yj5q.onrender.com';

const getBaseUrl = () => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_API_URL) {
    const url = (metaEnv.VITE_API_URL as string).trim().replace(/\/$/, '');
    if (url !== 'https://rentflow-api.onrender.com') {
      return url.startsWith('http') ? url : `https://${url}`;
    }
  }
  if (typeof window !== 'undefined') {
    // If hosted on Render (e.g. rentflow-web-xxxx.onrender.com)
    if (window.location.hostname.includes('onrender.com')) {
      return RENDER_API_URL;
    }
    // If served over HTTPS on a production domain
    if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
      return RENDER_API_URL;
    }
    // Local dev: accessing from another machine on local network
    if (window.location.hostname && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:5004`;
    }
  }
  return 'http://localhost:5004';
};

export const API_BASE = getBaseUrl();

export const MOCK_PROPERTIES: any[] = [];

export const PROPERTY_TYPES = [
  'All',
  'Self Contain',
  'Mini Flat',
  'Apartment',
  'Duplex',
  'Bungalow',
  'Terrace',
  'Penthouse',
  'Shop',
  'Office Space',
  'Land'
];

export const AMENITY_OPTIONS = [
  'Pool',
  'Gym',
  'Parking',
  'Security',
  'Elevator',
  'Balcony',
  'Laundry',
  'Pet Friendly',
  'Storage',
  'Concierge',
  'Rooftop',
  'Generator'
];

export const getInitials = (name?: string) => {
  if (!name) return 'RF';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Set your Paystack public key here (starts with pk_test_ or pk_live_)
export const PAYSTACK_PUBLIC_KEY = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_e397d340917a03d2818924f283ee356174f13457';

// Google AdSense Configuration
export const GOOGLE_ADSENSE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_ADSENSE_CLIENT_ID || 'ca-pub-0000000000000000';
export const GOOGLE_ADSENSE_SLOT_ID = (import.meta as any).env?.VITE_GOOGLE_ADSENSE_SLOT_ID || '1234567890';


