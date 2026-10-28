import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Modern Loft in Downtown',
    price: 2500000,
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=400'],
    views: 342,
  },
  {
    id: '2',
    title: 'Cozy Studio near Campus',
    price: 1200000,
    status: 'Pending',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400'],
    views: 89,
  },
];

export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [listings, setListings] = useState<any[]>(MOCK_LISTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/properties/my-listings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setListings(data);
          }
        }
      } catch {
        // Fallback to mock listings
      } finally {
        setLoading(false);
      }
    };
    fetchMyListings();
  }, [token]);

  return (
    <div className="p-6 lg:p-10 max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">My Listings</h1>
            <p className="text-xs text-[#94A3B8]">Manage and track performance of your properties</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/add')}
          className="px-5 py-3 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#38BDF8]/25"
        >
          <Plus className="w-4 h-4" />
          <span>Add Listing</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-9 h-9 text-[#38BDF8] animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const img =
              listing.images?.[0] ||
              listing.image ||
              'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=400';
            const isActive =
              listing.status === 'Available' || listing.status === 'Active';

            return (
              <div
                key={listing.id}
                onClick={() =>
                  navigate(`/dashboard/profile/manage-listing/${listing.id}`, {
                    state: { listing },
                  })
                }
                className="flex items-center bg-[#1E293B] border border-white/5 hover:border-[#38BDF8]/40 p-4 rounded-2xl cursor-pointer transition-all group"
              >
                <img
                  src={img}
                  alt={listing.title}
                  className="w-24 h-24 rounded-xl object-cover bg-[#334155] shrink-0"
                />

                <div className="flex-1 ml-4 min-w-0">
                  <h3 className="text-lg font-bold text-[#F8FAFC] truncate">{listing.title}</h3>
                  <p className="text-sm text-[#38BDF8] font-bold mt-0.5">
                    {typeof listing.price === 'number'
                      ? `₦${listing.price.toLocaleString()}/yr`
                      : listing.price}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {isActive ? 'Active' : 'Paused / Pending'}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#475569] group-hover:text-[#38BDF8]" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
