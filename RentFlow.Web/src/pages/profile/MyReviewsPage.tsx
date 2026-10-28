import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomAlert } from '../../contexts/AlertContext';

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

export const MyReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showAlert } = useCustomAlert();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/reviews/my-reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setReviews(await res.json());
        }
      } catch {
        showAlert('Error', 'Could not load your reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [token]);

  return (
    <div className="p-6 lg:p-10 max-w-3xl w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-[#F8FAFC]">My Reviews</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-9 h-9 text-[#38BDF8] animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-24 bg-[#1E293B]/50 border border-white/5 rounded-3xl">
          <MessageSquare className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F8FAFC]">No reviews yet</h3>
          <p className="text-sm text-[#94A3B8] mt-1">
            When you review properties, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                item.property?.id && navigate(`/dashboard/property/${item.property.id}`)
              }
              className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-[#38BDF8]/40 transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={
                    item.property?.image ||
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=200'
                  }
                  alt={item.property?.title}
                  className="w-16 h-16 rounded-xl object-cover bg-[#334155]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-[#F8FAFC] truncate">
                    {item.property?.title || 'Property'}
                  </h4>
                  <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> {item.property?.location}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= item.rating
                              ? 'text-[#38BDF8] fill-[#38BDF8]'
                              : 'text-[#475569]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#94A3B8]">
                      {getRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              {item.text && <p className="text-sm text-[#F8FAFC] leading-relaxed">{item.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
