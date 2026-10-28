import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  Eye,
  Edit3,
  Pause,
  Play,
  BarChart3,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

export const ManageListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const listing = location.state?.listing || {
    id: id || '1',
    title: 'Modern Loft in Downtown',
    price: 2500000,
    status: 'Available',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800'],
    views: 342,
    inquiries: 12,
  };

  const [currentStatus, setCurrentStatus] = useState(
    listing.status === 'Pending' ? 'Pending' : 'Active'
  );

  const toggleStatus = async () => {
    const nextStatus = currentStatus === 'Active' ? 'Pending' : 'Active';
    setCurrentStatus(nextStatus);
    if (token) {
      try {
        await fetch(`${API_BASE}/api/properties/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus === 'Active' ? 'Available' : 'Pending',
          }),
        });
      } catch {
        // Ignore offline error
      }
    }
  };

  const heroImg =
    listing.images?.[0] ||
    listing.image ||
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800';

  return (
    <div className="p-6 lg:p-10 max-w-4xl w-full mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Manage Listing</h1>
      </div>

      {/* Hero Banner */}
      <div className="relative h-64 rounded-3xl overflow-hidden bg-[#1E293B] mb-6 border border-white/10">
        <img src={heroImg} alt={listing.title} className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4">
          <span
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold ${
              currentStatus === 'Active'
                ? 'bg-emerald-400 text-[#0F172A]'
                : 'bg-amber-400 text-[#0F172A]'
            }`}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">{listing.title}</h2>
        <p className="text-lg text-[#38BDF8] font-bold mt-1">
          {typeof listing.price === 'number'
            ? `₦${listing.price.toLocaleString()}/yr`
            : listing.price}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button
          onClick={() =>
            navigate(`/dashboard/property/${listing.id}`, {
              state: { property: listing },
            })
          }
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1E293B] border border-white/5 hover:border-[#38BDF8] text-[#F8FAFC] font-bold text-sm"
        >
          <Eye className="w-4 h-4 text-[#38BDF8]" />
          <span>Preview</span>
        </button>

        <button
          onClick={() =>
            navigate(`/dashboard/property/edit/${listing.id}`, {
              state: { property: listing },
            })
          }
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1E293B] border border-white/5 hover:border-[#38BDF8] text-[#F8FAFC] font-bold text-sm"
        >
          <Edit3 className="w-4 h-4 text-[#38BDF8]" />
          <span>Edit</span>
        </button>

        {currentStatus === 'Active' ? (
          <button
            onClick={toggleStatus}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={toggleStatus}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm"
          >
            <Play className="w-4 h-4" />
            <span>Activate</span>
          </button>
        )}
      </div>

      {/* Performance Stats */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-[#F8FAFC] mb-4">Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <BarChart3 className="w-6 h-6 text-[#38BDF8] mb-2" />
            <div className="text-2xl font-extrabold text-[#F8FAFC]">{listing.views || 342}</div>
            <div className="text-xs text-[#94A3B8]">Total Views</div>
          </div>
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <MessageSquare className="w-6 h-6 text-[#38BDF8] mb-2" />
            <div className="text-2xl font-extrabold text-[#F8FAFC]">{listing.inquiries || 12}</div>
            <div className="text-xs text-[#94A3B8]">Direct Inquiries</div>
          </div>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div>
        <h3 className="text-lg font-bold text-[#F8FAFC] mb-4">Recent Inquiries</h3>
        <div className="space-y-3">
          {[
            {
              id: '00000000-0000-0000-0000-000000000010',
              initials: 'SA',
              name: 'Sarah Anderson',
              msg: 'Is this property still available for inspection this weekend?',
            },
            {
              id: '00000000-0000-0000-0000-000000000011',
              initials: 'MJ',
              name: 'Michael Johnson',
              msg: 'I would like to schedule a live video tour.',
            },
          ].map((inq) => (
            <div
              key={inq.id}
              onClick={() =>
                navigate(
                  `/dashboard/conversation/${inq.id}?name=${encodeURIComponent(inq.name)}`
                )
              }
              className="flex items-center bg-[#1E293B] border border-white/5 hover:border-[#38BDF8]/40 p-4 rounded-2xl cursor-pointer transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] font-bold text-sm flex items-center justify-center shrink-0">
                {inq.initials}
              </div>
              <div className="flex-1 mx-4 min-w-0">
                <h4 className="text-sm font-bold text-[#F8FAFC]">{inq.name}</h4>
                <p className="text-xs text-[#94A3B8] truncate">{inq.msg}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#475569]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
