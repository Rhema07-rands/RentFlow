// Priority:
// 1. VITE_API_URL environment variable (configured in Render / production)
// 2. Local network IP or localhost:5004 for local dev
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:5004`;
  }
  return 'http://localhost:5004';
};

export const API_BASE = getBaseUrl();

export const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Luxury 3-Bedroom Apartment',
    description: 'Spacious apartment with modern finishes, fitted kitchen, and 24/7 power supply. Gated estate with round-the-clock armed security and clean treated water.',
    price: 3500000,
    location: 'Lekki Phase 1, Lagos',
    beds: 3,
    baths: 2,
    sqft: 1850,
    propertyType: 'Apartment',
    status: 'Available',
    views: 428,
    isSponsored: true,
    amenities: ['Pool', 'Gym', 'Parking', 'Security', 'Generator', 'Balcony'],
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000'
    ],
    owner: { id: '00000000-0000-0000-0000-000000000001', name: 'Adeola Properties' },
  },
  {
    id: 2,
    title: 'Cozy Self Contain in Yaba',
    description: 'Well-ventilated self-contained studio room with tiled floors, POP ceiling, private bathroom, kitchen cabinet, and personal prepaid meter.',
    price: 650000,
    location: 'Yaba, Lagos',
    beds: 1,
    baths: 1,
    sqft: 520,
    propertyType: 'Self Contain',
    status: 'Available',
    views: 215,
    amenities: ['Security', 'Parking', 'Generator'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000'],
    owner: { id: '00000000-0000-0000-0000-000000000002', name: 'ChiChi Homes' },
  },
  {
    id: 3,
    title: 'Executive 4-Bed Detached Duplex',
    description: 'Fully detached duplex in a serene neighborhood. Comes with BQ, CCTV surveillance, private swimming pool, smart home automation, and treated water.',
    price: 8000000,
    location: 'Ikeja GRA, Lagos',
    beds: 4,
    baths: 4,
    sqft: 3200,
    propertyType: 'Duplex',
    status: 'Available',
    views: 592,
    amenities: ['Pool', 'Gym', 'Parking', 'Security', 'Generator', 'Concierge', 'Balcony'],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000'],
    owner: { id: '00000000-0000-0000-0000-000000000003', name: 'Lagos Luxury Living' },
  },
  {
    id: 4,
    title: 'Modern Mini Flat in Surulere',
    description: 'Clean mini flat with separate bedroom and living room. Running water and estate security included. Close to major transport hubs.',
    price: 900000,
    location: 'Surulere, Lagos',
    beds: 1,
    baths: 1,
    sqft: 750,
    propertyType: 'Mini Flat',
    status: 'Available',
    views: 184,
    amenities: ['Parking', 'Security', 'Laundry'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000'],
    owner: { id: '00000000-0000-0000-0000-000000000004', name: 'Emeka Realtors' },
  },
  {
    id: 5,
    title: 'Contemporary 2-Bed Terrace',
    description: 'Brand new terrace house in a well-planned estate. Smart home features, fitted kitchen with microwave & oven, and dedicated parking for 2 cars.',
    price: 4200000,
    location: 'Ajah, Lagos',
    beds: 2,
    baths: 2,
    sqft: 1450,
    propertyType: 'Terrace',
    status: 'Available',
    views: 310,
    amenities: ['Parking', 'Security', 'Generator', 'Pet Friendly'],
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'],
    owner: { id: '00000000-0000-0000-0000-000000000005', name: 'Prime Estate NG' },
  },
  {
    id: 6,
    title: 'Skyline Penthouse with Ocean View',
    description: 'Stunning penthouse on Victoria Island with panoramic Atlantic ocean views, private elevator access, rooftop terrace, and 24/7 concierge service.',
    price: 15000000,
    location: 'Victoria Island, Lagos',
    beds: 3,
    baths: 3,
    sqft: 2900,
    propertyType: 'Penthouse',
    status: 'Available',
    views: 840,
    amenities: ['Pool', 'Gym', 'Elevator', 'Rooftop', 'Concierge', 'Security', 'Generator'],
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000'],
    owner: { id: '00000000-0000-0000-0000-000000000006', name: 'VI Premium Homes' },
  },
];

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


