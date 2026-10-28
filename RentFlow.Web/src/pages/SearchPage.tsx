import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Bed, Bath, MapPin, Loader2, Video, Sparkles } from 'lucide-react';
import { API_BASE, MOCK_PROPERTIES, PROPERTY_TYPES } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { isVideoMedia } from '../utils/media';
import { AdBanner } from '../components/AdBanner';
import { ProUpgradeModal } from '../components/ProUpgradeModal';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [selectedType, setSelectedType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/properties?`;
      if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;
      if (selectedType !== 'All') url += `propertyType=${encodeURIComponent(selectedType)}&`;
      if (maxPrice) url += `maxPrice=${maxPrice}&`;
      if (minBeds > 0) url += `beds=${minBeds}&`;
      if (minBaths > 0) url += `baths=${minBaths}&`;

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(t);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to filtering local MOCK_PROPERTIES if API is unreachable
    }

    const filteredMock = MOCK_PROPERTIES.filter((p) => {
      if (
        searchQuery &&
        !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.location.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (selectedType !== 'All' && p.propertyType !== selectedType) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (minBeds > 0 && p.beds < minBeds) return false;
      if (minBaths > 0 && p.baths < minBaths) return false;
      return true;
    });

    setResults(filteredMock);
    setLoading(false);
  }, [searchQuery, selectedType, maxPrice, minBeds, minBaths]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchResults]);

  const clearFilters = () => {
    setMaxPrice('');
    setMinBeds(0);
    setMinBaths(0);
    setSelectedType('All');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(maxPrice || minBeds > 0 || minBaths > 0);

  return (
    <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight mb-4">
          Search & Filter Properties
        </h1>

        {/* Search Input & Filter Toggle Row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 flex items-center bg-[#1E293B] border border-white/10 focus-within:border-[#38BDF8] rounded-2xl px-4 h-14 transition-colors">
            <Search className="w-5 h-5 text-[#94A3B8] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search properties by title, neighborhood, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[#F8FAFC] placeholder-[#64748B] focus:outline-none text-base font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-[#64748B] hover:text-[#F8FAFC]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative h-14 px-5 rounded-2xl border flex items-center gap-2.5 font-bold text-sm transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                : 'bg-[#1E293B] border-white/10 text-[#F8FAFC] hover:border-white/20'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Advanced Filters</span>
            {hasActiveFilters && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
            )}
          </button>
        </div>

        {/* Property Type Horizontal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                selectedType === type
                  ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                  : 'bg-[#1E293B] border-white/5 text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 bg-[#1E293B] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#F8FAFC] mb-2">
                  Max Price (₦/yr)
                </label>
                <input
                  type="number"
                  placeholder="Any price (e.g. 5000000)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#F8FAFC] mb-2">Bedrooms</label>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={`bed-${num}`}
                      onClick={() => setMinBeds(num)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        minBeds === num
                          ? 'bg-[#38BDF8] border-[#38BDF8] text-[#0F172A]'
                          : 'bg-[#0F172A] border-white/10 text-[#94A3B8]'
                      }`}
                    >
                      {num === 0 ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#F8FAFC] mb-2">Bathrooms</label>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={`bath-${num}`}
                      onClick={() => setMinBaths(num)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        minBaths === num
                          ? 'bg-[#38BDF8] border-[#38BDF8] text-[#0F172A]'
                          : 'bg-[#0F172A] border-white/10 text-[#94A3B8]'
                      }`}
                    >
                      {num === 0 ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-[#94A3B8] hover:text-[#F8FAFC] font-bold text-xs"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2.5 rounded-xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sponsored Ad Banner */}
      <AdBanner placement="search" onUpgradeClick={() => setShowUpgradeModal(true)} />

      {/* Results List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-9 h-9 text-[#38BDF8] animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-24 bg-[#1E293B]/50 rounded-3xl border border-white/5">
          <Search className="w-14 h-14 text-[#334155] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-[#F8FAFC]">No properties found</h3>
          <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filters or search area</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {results.map((item) => {
            const images = item.images && item.images.length > 0
              ? item.images.map((i: any) => (typeof i === 'string' ? i : i.url))
              : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'];

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/dashboard/property/${item.id}`, { state: { property: item } })}
                className="flex bg-[#1E293B] rounded-2xl overflow-hidden border border-white/5 hover:border-[#38BDF8]/40 transition-all cursor-pointer group"
              >
                <div className="relative w-36 sm:w-44 shrink-0 bg-[#334155] overflow-hidden">
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
                  {images.some(isVideoMedia) && (
                    <div className="absolute bottom-2 left-2 bg-[#0F172A]/90 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#38BDF8] flex items-center gap-1 border border-white/10">
                      <Video className="w-3 h-3" />
                      <span>Video</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-extrabold text-[#38BDF8]">
                      ₦{Number(item.price).toLocaleString()}/yr
                    </span>
                    {item.isSponsored && !user?.isPremium && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Sponsored
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC] truncate mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] flex items-center gap-1 truncate mt-0.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </p>

                  <div className="flex items-center flex-wrap gap-2">
                    {item.beds > 0 && (
                      <span className="flex items-center gap-1 bg-[#0F172A] px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#94A3B8]">
                        <Bed className="w-3.5 h-3.5 text-[#38BDF8]" /> {item.beds}
                      </span>
                    )}
                    {item.baths > 0 && (
                      <span className="flex items-center gap-1 bg-[#0F172A] px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#94A3B8]">
                        <Bath className="w-3.5 h-3.5 text-[#38BDF8]" /> {item.baths}
                      </span>
                    )}
                    {item.propertyType && (
                      <span className="bg-[#0F172A] px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#38BDF8]">
                        {item.propertyType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
