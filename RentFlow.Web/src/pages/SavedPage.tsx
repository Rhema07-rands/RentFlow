import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, MapPin, Bed, Bath, User, Video } from 'lucide-react';
import { API_BASE, MOCK_PROPERTIES } from '../config/api';
import { isVideoMedia } from '../utils/media';

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('rf_saved_ids');
      return s ? JSON.parse(s) : ['1', '5'];
    } catch {
      return ['1', '5'];
    }
  });
  const [allProperties, setAllProperties] = useState<any[]>(MOCK_PROPERTIES);

  useEffect(() => {
    fetch(`${API_BASE}/api/properties`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllProperties(data);
        }
      })
      .catch(() => {});
  }, []);

  const savedProperties = allProperties.filter((p) => savedIds.includes(String(p.id)));

  const removeSaved = (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    const strId = String(id);
    setSavedIds((prev) => {
      const next = prev.filter((item) => item !== strId);
      localStorage.setItem('rf_saved_ids', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Saved Properties</h1>
          <p className="text-xs text-[#94A3B8]">Your bookmarked apartments and homes</p>
        </div>
      </div>

      {savedProperties.length === 0 ? (
        <div className="text-center py-28 bg-[#1E293B]/50 border border-white/5 rounded-3xl">
          <Heart className="w-12 h-12 text-[#334155] mx-auto mb-3" />
          <p className="text-lg font-bold text-[#F8FAFC]">
            You haven&apos;t saved any properties yet.
          </p>
          <button
            onClick={() => navigate('/dashboard/explore')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#38BDF8] text-[#0F172A] font-bold text-xs"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProperties.map((item) => {
            const images =
              item.images && item.images.length > 0
                ? item.images.map((i: any) => (typeof i === 'string' ? i : i.url))
                : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'];

            return (
              <div
                key={item.id}
                onClick={() =>
                  navigate(`/dashboard/property/${item.id}`, { state: { property: item } })
                }
                className="bg-[#1E293B] rounded-3xl overflow-hidden border border-white/5 hover:border-[#38BDF8]/40 transition-all cursor-pointer group"
              >
                <div className="relative h-52 bg-[#334155] overflow-hidden">
                  {isVideoMedia(images[0]) ? (
                    <video
                      src={images[0]}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 flex-wrap">
                    {item.propertyType && (
                      <div className="bg-[#0F172A]/80 px-3 py-1 rounded-xl text-xs font-bold text-[#38BDF8]">
                        {item.propertyType}
                      </div>
                    )}
                    {images.some(isVideoMedia) && (
                      <div className="bg-[#0F172A]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1 text-[#38BDF8] text-xs font-bold">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Tour</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => removeSaved(e, item.id)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#0F172A]/80 flex items-center justify-center hover:scale-110 transition-transform"
                    title="Remove from Saved"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </button>
                </div>

                <div className="p-5">
                  <span className="text-2xl font-extrabold text-[#38BDF8]">
                    ₦{Number(item.price).toLocaleString()}/yr
                  </span>
                  <h3 className="text-lg font-bold text-[#F8FAFC] mt-1 truncate">{item.title}</h3>
                  <p className="text-sm text-[#94A3B8] flex items-center gap-1 mt-1 mb-4 truncate">
                    <MapPin className="w-4 h-4 shrink-0" /> {item.location}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#94A3B8] pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      {item.beds > 0 && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Bed className="w-3.5 h-3.5 text-[#38BDF8]" /> {item.beds} {item.beds === 1 ? 'Bed' : 'Beds'}
                        </span>
                      )}
                      {item.baths > 0 && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Bath className="w-3.5 h-3.5 text-[#38BDF8]" /> {item.baths} {item.baths === 1 ? 'Bath' : 'Baths'}
                        </span>
                      )}
                    </div>
                    {item.owner?.name && (
                      <span className="flex items-center gap-1 min-w-0 max-w-[140px] justify-end ml-auto truncate text-right">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.owner.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
