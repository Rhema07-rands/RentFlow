import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, User, Heart, RefreshCw, Loader2, Eye, Video, Sparkles } from 'lucide-react';
import { API_BASE } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { isVideoMedia } from '../utils/media';
import { AdBanner } from '../components/AdBanner';
import { ProUpgradeModal } from '../components/ProUpgradeModal';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rf_saved_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/properties`);
      if (response.ok) {
        const data = await response.json();
        setProperties(Array.isArray(data) ? data : []);
      } else {
        setProperties([]);
      }
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const toggleSave = (e: React.MouseEvent, prop: any) => {
    e.stopPropagation();
    const strId = String(prop.id);
    setSavedIds((prev) => {
      const next = prev.includes(strId) ? prev.filter((id) => id !== strId) : [...prev, strId];
      localStorage.setItem('rf_saved_ids', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-base font-medium text-[#94A3B8]">
            Welcome back, <span className="text-[#38BDF8] font-bold">{user?.name?.split(' ')[0] || 'there'}</span>
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
            Discover Properties
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {user?.isPremium ? (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-yellow-500/40 text-yellow-400 font-extrabold text-xs shadow-sm shadow-yellow-500/10 animate-pulse">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>PRO ACTIVE</span>
            </div>
          ) : (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#38BDF8]/10 hover:bg-[#38BDF8] text-[#38BDF8] hover:text-[#0F172A] border border-[#38BDF8]/30 font-extrabold text-xs transition-all duration-200 btn-press hover:shadow-md hover:shadow-[#38BDF8]/20"
              title="Remove ads & unlock Pro features"
            >
              <Sparkles className="w-4 h-4" />
              <span>Go Pro</span>
            </button>
          )}

          <button
            onClick={() => {
              setRefreshing(true);
              fetchProperties();
            }}
            className="p-3 rounded-2xl bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/20 transition-all btn-press"
            title="Refresh listings"
          >
            <RefreshCw className={`w-5 h-5 transition-transform duration-300 ${refreshing ? 'animate-spin text-[#38BDF8]' : 'hover:rotate-180'}`} />
          </button>

          <button
            onClick={() => navigate('/dashboard/saved')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#1E293B] border border-white/10 text-[#F8FAFC] font-bold text-sm hover:border-[#38BDF8]/50 transition-all btn-press group"
          >
            <Heart className="w-4 h-4 text-red-400 fill-red-400 group-hover:scale-125 transition-transform duration-200" />
            <span>Saved ({savedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div key={k} className="bg-[#1E293B] rounded-3xl overflow-hidden border border-white/5 shadow-xl flex flex-col">
              <div className="h-56 shimmer-placeholder w-full" />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-6 w-32 rounded-lg shimmer-placeholder" />
                    <div className="h-6 w-14 rounded-xl shimmer-placeholder" />
                  </div>
                  <div className="h-5 w-4/5 rounded-lg shimmer-placeholder mb-2" />
                  <div className="h-4 w-3/5 rounded-lg shimmer-placeholder" />
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="h-4 w-24 rounded-lg shimmer-placeholder" />
                  <div className="h-4 w-20 rounded-lg shimmer-placeholder" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-28 bg-[#1E293B]/40 rounded-3xl border border-white/5 animate-fade-in">
          <p className="text-lg font-bold text-[#F8FAFC]">No properties found</p>
          <p className="text-sm text-[#94A3B8] mt-1">Be the first to list a property on RentFlow!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((item, idx) => {
            const images = item.images && item.images.length > 0
              ? item.images.map((i: any) => (typeof i === 'string' ? i : i.url))
              : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'];
            const mainImage = images[0];
            const isMainVideo = isVideoMedia(mainImage);
            const hasVideo = images.some(isVideoMedia);
            const isSaved = savedIds.includes(String(item.id));

            return (
              <React.Fragment key={item.id}>
                <div
                  onClick={() => navigate(`/dashboard/property/${item.id}`, { state: { property: item } })}
                  style={{ animationDelay: `${Math.min(idx * 70, 420)}ms` }}
                  className="group card-hover bg-[#1E293B] rounded-3xl overflow-hidden border border-white/5 hover:border-[#38BDF8]/40 shadow-xl cursor-pointer flex flex-col animate-fade-in-up"
                >
                  {/* Image Header */}
                  <div className="relative h-56 overflow-hidden bg-[#334155]">
                    {isMainVideo ? (
                      <video
                        src={mainImage}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={mainImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    )}

                    <div className="absolute top-4 left-4 flex items-center gap-1.5 flex-wrap">
                      {item.isSponsored && !user?.isPremium && (
                        <div className="bg-amber-500/25 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" />
                          <span>Sponsored</span>
                        </div>
                      )}
                      {item.propertyType && (
                        <div className="bg-[#0F172A]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                          <span className="text-[#38BDF8] text-xs font-bold">{item.propertyType}</span>
                        </div>
                      )}
                      {hasVideo && (
                        <div className="bg-[#0F172A]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1 text-[#38BDF8] text-xs font-bold shadow-sm">
                          <Video className="w-3.5 h-3.5 animate-pulse" />
                          <span>Video Tour</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => toggleSave(e, item)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#0F172A]/75 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-75 transition-all duration-200 border border-white/10"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors duration-200 ${
                          isSaved ? 'text-red-500 fill-red-500' : 'text-[#F8FAFC]'
                        }`}
                      />
                    </button>

                    {item.views !== undefined && (
                      <div className="absolute bottom-3 right-3 bg-[#0F172A]/75 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] text-[#94A3B8] border border-white/5">
                        <Eye className="w-3 h-3 text-[#38BDF8]" />
                        <span>{item.views}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0">
                        <span className="text-lg sm:text-xl font-extrabold text-[#38BDF8] tracking-tight truncate min-w-0">
                          ₦{Number(item.price).toLocaleString()}
                          <span className="text-xs font-semibold text-[#94A3B8]">/yr</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/property/${item.id}`, { state: { property: item } });
                          }}
                          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0F172A] text-xs font-extrabold shadow-sm shadow-[#38BDF8]/20 group-hover:scale-105 active:scale-95 transition-all duration-200 btn-press"
                        >
                          View
                        </button>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] line-clamp-1 group-hover:text-[#38BDF8] transition-colors duration-200">
                        {item.title}
                      </h3>

                      <p className="flex items-center gap-1.5 text-sm text-[#94A3B8] mt-1 line-clamp-1">
                        <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                    </div>

                    {/* Specs Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mt-5 pt-4 border-t border-white/5 text-xs font-semibold text-[#94A3B8]">
                      <div className="flex items-center gap-3 shrink-0">
                        {item.beds > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Bed className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>{item.beds} {item.beds === 1 ? 'Bed' : 'Beds'}</span>
                          </div>
                        )}
                        {item.baths > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Bath className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>{item.baths} {item.baths === 1 ? 'Bath' : 'Baths'}</span>
                          </div>
                        )}
                      </div>
                      {item.owner?.name && (
                        <div className="flex items-center gap-1.5 min-w-0 max-w-full sm:max-w-[150px] ml-auto">
                          <User className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="truncate">{item.owner.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Native In-Feed Sponsor Ad (automatically hidden if user is Pro) */}
                {idx === 2 && (
                  <div className="col-span-full animate-fade-in-up">
                    <AdBanner placement="feed" onUpgradeClick={() => setShowUpgradeModal(true)} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Pro Upgrade & Ad Removal Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};
