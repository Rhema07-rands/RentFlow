import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Star,
  CheckCircle2,
  MessageSquare,
  Edit3,
  Phone,
  Video,
  Play,
  Clock,
  Loader2,
  Send,
  Sparkles
} from 'lucide-react';
import { API_BASE, MOCK_PROPERTIES, getInitials } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';
import { useCall } from '../contexts/CallContext';
import { isVideoMedia, getVideoPoster } from '../utils/media';
import { AdBanner } from '../components/AdBanner';
import { ProUpgradeModal } from '../components/ProUpgradeModal';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { showAlert } = useCustomAlert();
  const { startCall } = useCall();

  const [property, setProperty] = useState<any>(location.state?.property || null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(!location.state?.property);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('rf_saved_ids');
      return s ? JSON.parse(s) : ['1', '5'];
    } catch {
      return ['1', '5'];
    }
  });

  const isSaved = savedIds.includes(String(id));

  const toggleSave = () => {
    const strId = String(id);
    setSavedIds((prev) => {
      const next = prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId];
      localStorage.setItem('rf_saved_ids', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propRes = await fetch(`${API_BASE}/api/properties/${id}`);
        if (propRes.ok) {
          const data = await propRes.json();
          setProperty(data);
        } else if (!property) {
          const found = MOCK_PROPERTIES.find((p) => String(p.id) === String(id));
          if (found) setProperty(found);
        }

        const revRes = await fetch(`${API_BASE}/api/reviews/property/${id}`);
        if (revRes.ok) {
          setReviews(await revRes.json());
        }
      } catch {
        if (!property) {
          const found = MOCK_PROPERTIES.find((p) => String(p.id) === String(id));
          if (found) setProperty(found);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#38BDF8] animate-spin mb-4" />
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-[#1E293B] text-sm font-bold text-[#F8FAFC]"
        >
          Go Back
        </button>
      </div>
    );
  }

  const rawImages = property.images && property.images.length > 0
    ? property.images.map((img: any) => (typeof img === 'string' ? img : img.url))
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'];

  const hasVideo = rawImages.some((img: string) => isVideoMedia(img));

  const sellerName = property.owner?.name || 'Verified Landlord';
  const ownerId = property.owner?.id || property.ownerId || null;
  const isOwnProperty = Boolean(user && ownerId && String(ownerId).toLowerCase() === String(user.id).toLowerCase());

  const beds = property.bedrooms ?? property.beds ?? 0;
  const baths = property.bathrooms ?? property.baths ?? 0;
  const sqft = property.sqft || '--';
  const amenities =
    Array.isArray(property.amenities) && property.amenities.length > 0
      ? property.amenities
      : ['Parking', 'Security', 'Generator'];

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showAlert('Not Logged In', 'Please log in to leave a review.');
      return;
    }
    if (!newReviewText.trim()) {
      showAlert('Empty Review', 'Please write your experience before submitting.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: Number(id),
          rating: newReviewRating,
          text: newReviewText.trim(),
        }),
      });

      if (res.ok) {
        showAlert('Success', 'Your review has been posted!');
        setNewReviewText('');
        setNewReviewRating(5);
        setShowReviewForm(false);
        const revRes = await fetch(`${API_BASE}/api/reviews/property/${id}`);
        if (revRes.ok) setReviews(await revRes.json());
      } else {
        const err = await res.text();
        showAlert('Error', err || 'Failed to submit review.');
      }
    } catch {
      showAlert('Error', 'Could not connect to server.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleContactOwner = () => {
    if (!token) {
      showAlert('Not Logged In', 'Please log in to message or apply with the landlord.');
      navigate('/login');
      return;
    }
    if (ownerId) {
      navigate(`/dashboard/conversation/${ownerId}?name=${encodeURIComponent(sellerName)}`);
    } else {
      showAlert('Error', 'Owner contact information is unavailable.');
    }
  };

  const handleCallOwner = (type: 'audio' | 'video') => {
    if (!token) {
      showAlert('Not Logged In', 'Please log in to start a call with the landlord.');
      navigate('/login');
      return;
    }
    if (ownerId) {
      startCall(String(ownerId), sellerName, type);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl w-full mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1E293B] border border-white/10 text-[#F8FAFC] font-bold text-sm hover:border-[#38BDF8] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Listings</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSave}
            className="p-3 rounded-2xl bg-[#1E293B] border border-white/10 hover:border-red-400/50 transition-all"
            title="Save Property"
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'text-red-500 fill-red-500' : 'text-[#F8FAFC]'}`} />
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showAlert('Link Copied', 'Property link copied to clipboard!');
            }}
            className="p-3 rounded-2xl bg-[#1E293B] border border-white/10 hover:border-[#38BDF8]/50 transition-all"
            title="Share Property"
          >
            <Share2 className="w-5 h-5 text-[#F8FAFC]" />
          </button>
        </div>
      </div>

      {/* Hero Media Gallery */}
      <div className="relative rounded-3xl overflow-hidden bg-[#1E293B] border border-white/10 h-[360px] sm:h-[480px] mb-4 shadow-2xl flex items-center justify-center">
        {isVideoMedia(rawImages[activeImageIndex]) ? (
          <video
            key={rawImages[activeImageIndex]}
            src={rawImages[activeImageIndex]}
            controls
            playsInline
            poster={getVideoPoster(rawImages[activeImageIndex])}
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <img
            src={rawImages[activeImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        )}

        {rawImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveImageIndex((prev) => (prev === 0 ? rawImages.length - 1 : prev - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0F172A]/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#38BDF8] hover:text-[#0F172A] transition-colors shadow-lg z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() =>
                setActiveImageIndex((prev) => (prev === rawImages.length - 1 ? 0 : prev + 1))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0F172A]/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#38BDF8] hover:text-[#0F172A] transition-colors shadow-lg z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-[#0F172A]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#94A3B8] border border-white/10">
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Verified Listing • {property.views || 1} views</span>
          </div>
          {hasVideo && (
            <div className="flex items-center gap-1.5 bg-[#38BDF8]/20 border border-[#38BDF8]/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#38BDF8]">
              <Video className="w-3.5 h-3.5" />
              <span>Video Tour</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 right-4 bg-[#0F172A]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-[#F8FAFC] border border-white/10 z-10 pointer-events-none">
          {activeImageIndex + 1} / {rawImages.length} {isVideoMedia(rawImages[activeImageIndex]) ? 'Video' : 'Photos'}
        </div>
      </div>

      {/* Thumbnails Bar */}
      {rawImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8">
          {rawImages.map((mediaUrl: string, idx: number) => {
            const isVid = isVideoMedia(mediaUrl);
            const isActive = activeImageIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all bg-[#0F172A] ${
                  isActive
                    ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/30 scale-105'
                    : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                }`}
              >
                {isVid ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover pointer-events-none"
                    muted
                    playsInline
                  />
                ) : (
                  <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                )}
                {isVid && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-[#38BDF8] text-[#0F172A] flex items-center justify-center shadow">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Two-Column Desktop Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Details, Description, Amenities, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            {property.propertyType && (
              <span className="inline-block px-3.5 py-1 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8] text-xs font-bold mb-3">
                {property.propertyType}
              </span>
            )}
            <h1 className="text-3xl font-extrabold text-[#F8FAFC]">{property.title}</h1>
            <p className="flex items-center gap-1.5 text-[#94A3B8] text-base mt-2">
              <MapPin className="w-4 h-4 text-[#38BDF8]" />
              <span>{property.location}</span>
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 bg-[#1E293B] border border-white/5 rounded-3xl p-5 text-center">
            <div className="flex flex-col items-center">
              <Bed className="w-6 h-6 text-[#38BDF8] mb-1.5" />
              <span className="text-xl font-extrabold text-[#F8FAFC]">{beds || '--'}</span>
              <span className="text-xs text-[#94A3B8]">Bedrooms</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/5">
              <Bath className="w-6 h-6 text-[#38BDF8] mb-1.5" />
              <span className="text-xl font-extrabold text-[#F8FAFC]">{baths || '--'}</span>
              <span className="text-xs text-[#94A3B8]">Bathrooms</span>
            </div>
            <div className="flex flex-col items-center">
              <Maximize2 className="w-6 h-6 text-[#38BDF8] mb-1.5" />
              <span className="text-xl font-extrabold text-[#F8FAFC]">{sqft}</span>
              <span className="text-xs text-[#94A3B8]">Sq Ft</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#1E293B]/60 border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-3">Description</h2>
            <p className="text-[#94A3B8] leading-relaxed text-sm sm:text-base">
              {property.description || 'No description provided by the landlord.'}
            </p>
          </div>

          {/* Amenities */}
          <div className="bg-[#1E293B]/60 border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-4">Amenities & Facilities</h2>
            <div className="flex flex-wrap gap-3">
              {amenities.map((amenity: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[#0F172A] border border-white/5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#F8FAFC]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsored Ad Banner */}
          <AdBanner placement="detail_footer" onUpgradeClick={() => setShowUpgradeModal(true)} />

          {/* Reviews Section */}
          <div className="bg-[#1E293B]/60 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#F8FAFC]">Tenant Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(Number(avgRating)) ? 'fill-amber-400' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#94A3B8]">
                    {avgRating} • {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8] text-xs font-bold hover:bg-[#38BDF8]/20 transition-all"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            </div>

            {showReviewForm && (
              <form
                onSubmit={submitReview}
                className="bg-[#0F172A] border border-white/10 rounded-2xl p-5 mb-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-2">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-[#475569]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Share your honest experience with this property..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  className="w-full bg-[#1E293B] text-[#F8FAFC] placeholder-[#64748B] p-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8] text-sm"
                />

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-3 rounded-xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-xs flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4">
                No reviews written for this property yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center font-bold text-xs">
                          {getInitials(rev.reviewer?.name || 'U')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#F8FAFC]">
                            {rev.reviewer?.name || 'Verified Tenant'}
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-[#475569]'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-[#64748B]">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-[#1E293B] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                Annual Rent
              </span>
              <div className="text-3xl font-extrabold text-[#38BDF8] mt-1">
                ₦{Number(property.price).toLocaleString()}<span className="text-sm font-normal text-[#94A3B8]">/yr</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Approx. ₦{Math.round(Number(property.price) / 12).toLocaleString()}/month
              </p>
            </div>

            {/* Landlord Info */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0F172A] border border-white/5">
              <div className="w-12 h-12 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center font-extrabold text-base shrink-0">
                {getInitials(sellerName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#F8FAFC] truncate">{sellerName}</p>
                <p className="text-xs text-[#94A3B8]">Listed by Property Owner</p>
              </div>
            </div>

            {isOwnProperty ? (
              <button
                onClick={() =>
                  navigate(`/dashboard/property/edit/${property.id}`, {
                    state: { property },
                  })
                }
                className="w-full py-4 rounded-2xl bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] font-extrabold text-base flex items-center justify-center gap-2 hover:bg-[#38BDF8]/25 transition-all"
              >
                <Edit3 className="w-5 h-5" />
                <span>Edit My Listing</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleContactOwner}
                  className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#38BDF8]/25 hover:bg-[#38BDF8]/90 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Apply / Chat with Owner</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCallOwner('audio')}
                    className="py-3 rounded-2xl bg-[#0F172A] border border-white/10 hover:border-[#38BDF8] text-[#F8FAFC] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Phone className="w-4 h-4 text-[#38BDF8]" />
                    <span>Audio Call</span>
                  </button>

                  <button
                    onClick={() => handleCallOwner('video')}
                    className="py-3 rounded-2xl bg-[#0F172A] border border-white/10 hover:border-[#38BDF8] text-[#F8FAFC] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Video className="w-4 h-4 text-[#38BDF8]" />
                    <span>Video Tour</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pro Upgrade & Ad Removal Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};
