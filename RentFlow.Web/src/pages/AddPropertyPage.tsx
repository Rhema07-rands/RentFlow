import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, X, RefreshCw, CheckCircle2, UploadCloud, Loader2 } from 'lucide-react';
import { API_BASE, PROPERTY_TYPES, AMENITY_OPTIONS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';
import { isVideoMedia } from '../utils/media';

interface ImagePreviewItem {
  file: File;
  previewUrl: string;
}

export const AddPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showAlert } = useCustomAlert();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<ImagePreviewItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const typesList = PROPERTY_TYPES.filter((t) => t !== 'All');

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems: ImagePreviewItem[] = files.slice(0, 10 - images.length).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null) return;

    setImages((prev) => {
      const next = [...prev];
      if (next[replaceIndex]) {
        URL.revokeObjectURL(next[replaceIndex].previewUrl);
        next[replaceIndex] = {
          file,
          previewUrl: URL.createObjectURL(file),
        };
      }
      return next;
    });
    setReplaceIndex(null);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const item = prev[idx];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showAlert('Not Logged In', 'Please log in before listing a property.');
      navigate('/login');
      return;
    }

    if (!title || !price || !location || !selectedType) {
      showAlert('Missing Info', 'Please fill in the title, price, location, and property type.');
      return;
    }

    setIsPublishing(true);

    try {
      // 1. Create Property record
      const response = await fetch(`${API_BASE}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price) || 0,
          location,
          beds: parseInt(beds) || 0,
          baths: parseInt(baths) || 0,
          sqft: parseInt(sqft) || 0,
          propertyType: selectedType,
          amenities: selectedAmenities,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to create property');
      }

      const property = await response.json();

      // 2. Upload Images to Cloudinary via backend
      for (const item of images) {
        const formData = new FormData();
        formData.append('file', item.file);

        await fetch(`${API_BASE}/api/properties/${property.id}/images`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      showAlert('Listed!', 'Your property and photos have been published to RentFlow.', () => {
        navigate('/dashboard/explore');
      });
    } catch (error: any) {
      console.error(error);
      showAlert('Error', error.message || 'Failed to publish listing.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">List a Property</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Publish your apartment, house, or commercial space to thousands of verified tenants.
        </p>
      </div>

      <form onSubmit={handlePublish} className="space-y-8">
        {/* Photos & Videos Section */}
        <section className="bg-[#1E293B] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#F8FAFC]">Property Photos & Videos</h2>
            <span className="text-xs text-[#94A3B8]">Supports Photos & Video Tours</span>
          </div>

          {images.length > 0 && (
            <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-4">
              {images.map((item, idx) => {
                const isVideo = isVideoMedia(item.file);
                return (
                  <div
                    key={idx}
                    className="relative w-36 h-28 rounded-2xl overflow-hidden bg-[#0F172A] border border-white/10 shrink-0 group"
                  >
                    {isVideo ? (
                      <video
                        src={item.previewUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={item.previewUrl}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {isVideo && (
                      <div className="absolute top-1.5 left-1.5 bg-[#0F172A]/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-[#38BDF8] flex items-center gap-1 border border-white/10">
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      title="Remove Media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceIndex(idx);
                        replaceInputRef.current?.click();
                      }}
                      className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-[#0F172A]/85 text-[#38BDF8] flex items-center justify-center hover:bg-[#38BDF8] hover:text-[#0F172A] transition-colors shadow-md"
                      title="Replace Media"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-44 rounded-2xl bg-[#0F172A] border-2 border-dashed border-[#38BDF8]/30 hover:border-[#38BDF8] flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-8 h-8 text-[#38BDF8] group-hover:scale-110 transition-transform" />
              <Video className="w-8 h-8 text-[#38BDF8] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[#38BDF8] font-bold text-base">Click to upload photos or videos</span>
            <span className="text-xs text-[#64748B] mt-1">
              Add up to 10 high-resolution photos or video walkthroughs (JPG, PNG, MP4, WebM)
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleSelectFiles}
            className="hidden"
          />
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleReplaceFile}
            className="hidden"
          />
        </section>

        {/* Property Type */}
        <section className="bg-[#1E293B] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-[#F8FAFC] mb-4">Property Type</h2>
          <div className="flex flex-wrap gap-2.5">
            {typesList.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                  selectedType === type
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                    : 'bg-[#0F172A] border-white/5 text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#F8FAFC]">Property Details</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Listing Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Modern 2-Bedroom Apartment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">
                Annual Price (₦ per year)
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 2400000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Full Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Lekki Phase 1, Lagos"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Bedrooms</label>
              <input
                type="number"
                placeholder="0"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Bathrooms</label>
              <input
                type="number"
                placeholder="0"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Square Feet</label>
              <input
                type="number"
                placeholder="0"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Describe key features, power supply, neighborhood security, and inspection terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] p-4 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
        </section>

        {/* Amenities */}
        <section className="bg-[#1E293B] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-[#F8FAFC] mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-3">
            {AMENITY_OPTIONS.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-[#0F172A] border-white/5 text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-[#475569]'}`}
                  />
                  <span>{amenity}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPublishing}
          className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base shadow-xl shadow-[#38BDF8]/25 hover:bg-[#38BDF8]/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2.5"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Publishing Property...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              <span>Publish Listing</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
