import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  Camera,
  Video,
  X,
  RefreshCw,
  CheckCircle2,
  Save,
  Loader2
} from 'lucide-react';
import { API_BASE, MOCK_PROPERTIES, PROPERTY_TYPES, AMENITY_OPTIONS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';
import { isVideoMedia } from '../utils/media';

export const EditPropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { showAlert } = useCustomAlert();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [propLocation, setPropLocation] = useState('');
  const [description, setDescription] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<{ id?: number; url: string; file?: File }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const typesList = PROPERTY_TYPES.filter((t) => t !== 'All');

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/properties/${id}`);
        if (res.ok) {
          const data = await res.json();
          populateForm(data);
          return;
        }
      } catch {
        // Fallback to state or mock
      }
      const fallback =
        location.state?.property ||
        MOCK_PROPERTIES.find((p) => String(p.id) === String(id)) ||
        MOCK_PROPERTIES[0];
      populateForm(fallback);
    };

    const populateForm = (data: any) => {
      setTitle(data.title || '');
      setPrice(String(data.price || ''));
      setPropLocation(data.location || '');
      setDescription(data.description || '');
      setBeds(String(data.beds ?? data.bedrooms ?? ''));
      setBaths(String(data.baths ?? data.bathrooms ?? ''));
      setSqft(String(data.sqft ?? ''));
      setSelectedType(data.propertyType || 'Apartment');
      setSelectedAmenities(Array.isArray(data.amenities) ? data.amenities : []);
      if (Array.isArray(data.images)) {
        setImages(
          data.images.map((img: any) =>
            typeof img === 'string' ? { url: img } : { id: img.id, url: img.url }
          )
        );
      }
    };

    loadProperty();
  }, [id, location.state]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const added = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null) return;

    setImages((prev) => {
      const next = [...prev];
      const existing = next[replaceIndex];
      next[replaceIndex] = {
        id: existing?.id,
        url: URL.createObjectURL(file),
        file,
      };
      return next;
    });
    setReplaceIndex(null);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    const target = images[idx];
    if (target?.id) {
      setDeletedImageIds((prev) => [...prev, target.id!]);
    }
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !propLocation || !selectedType) {
      showAlert('Missing Info', 'Please fill in the title, price, location, and property type.');
      return;
    }

    setIsSaving(true);
    try {
      if (token) {
        const res = await fetch(`${API_BASE}/api/properties/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            price: parseFloat(price) || 0,
            location: propLocation,
            beds: parseInt(beds) || 0,
            baths: parseInt(baths) || 0,
            sqft: parseInt(sqft) || 0,
            propertyType: selectedType,
            amenities: selectedAmenities,
          }),
        });

        if (res.ok) {
          // Process deleted images
          for (const delId of deletedImageIds) {
            await fetch(`${API_BASE}/api/properties/${id}/images/${delId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
          }

          // Process replaced or newly added images
          for (const img of images) {
            if (img.file) {
              const formData = new FormData();
              formData.append('file', img.file);
              if (img.id) {
                await fetch(`${API_BASE}/api/properties/${id}/images/${img.id}`, {
                  method: 'PUT',
                  headers: { Authorization: `Bearer ${token}` },
                  body: formData,
                });
              } else {
                await fetch(`${API_BASE}/api/properties/${id}/images`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                  body: formData,
                });
              }
            }
          }
        }
      }

      showAlert('Updated!', 'Your property changes have been saved.', () => {
        navigate(-1);
      });
    } catch (err: any) {
      showAlert('Error', err.message || 'Could not update listing.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Edit Property</h1>
          <p className="text-xs text-[#94A3B8]">Update photos, pricing, and property specifications</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Photos & Videos */}
        <section className="bg-[#1E293B] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#F8FAFC]">Property Photos & Videos</h2>
            <span className="text-xs text-[#94A3B8]">Supports Photos & Video Tours</span>
          </div>

          {images.length > 0 && (
            <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-4">
              {images.map((img, idx) => {
                const isVideo = isVideoMedia(img.file || img.url);
                return (
                  <div
                    key={idx}
                    className="relative w-36 h-28 rounded-2xl overflow-hidden bg-[#0F172A] border border-white/10 shrink-0 group"
                  >
                    {isVideo ? (
                      <video
                        src={img.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
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
            className="h-36 rounded-2xl bg-[#0F172A] border-2 border-dashed border-[#38BDF8]/30 hover:border-[#38BDF8] flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Camera className="w-7 h-7 text-[#38BDF8] group-hover:scale-110 transition-transform" />
              <Video className="w-7 h-7 text-[#38BDF8] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-bold text-[#38BDF8]">Tap to add photos or videos</span>
            <span className="text-xs text-[#64748B] mt-1">Upload JPG, PNG, MP4, WebM up to 100MB</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleAddFiles}
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
                    : 'bg-[#0F172A] border-white/5 text-[#94A3B8]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">
                Price (₦ per year)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Location</label>
            <input
              type="text"
              value={propLocation}
              onChange={(e) => setPropLocation(e.target.value)}
              className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Beds</label>
              <input
                type="number"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Baths</label>
              <input
                type="number"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2">Sq ft</label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0F172A] text-[#F8FAFC] p-4 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
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
                      : 'bg-[#0F172A] border-white/5 text-[#94A3B8]'
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

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-[#38BDF8]/25"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
