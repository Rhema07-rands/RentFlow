import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useCustomAlert } from '../../../contexts/AlertContext';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'http://10.231.149.52:5004/api';

export default function PropertyDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // State for fetched data
  const [property, setProperty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const { token } = useAuth(); // Need token for submitting reviews

  // Fetch real property (increments views) and reviews
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Property details (this automatically adds +1 to Views on backend)
        const propRes = await fetch(`${API_BASE_URL}/properties/${id}`);
        if (propRes.ok) {
          setProperty(await propRes.json());
        }

        // 2. Fetch Reviews for this property
        const revRes = await fetch(`${API_BASE_URL}/reviews/property/${id}`);
        if (revRes.ok) {
          setReviews(await revRes.json());
        }
      } catch (e) {
        console.error("Failed to load property data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !property) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <TouchableOpacity style={{ marginTop: 20, padding: 8, backgroundColor: '#1E293B', borderRadius: 22 }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
      </View>
    );
  }

  // Fallbacks if some data is missing
  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'];
    
  const sellerName = property.owner?.name || 'Unknown Owner';
  const sellerAvatar = sellerName.substring(0, 2).toUpperCase();
  const beds = property.bedrooms || property.beds || 0;
  const baths = property.bathrooms || property.baths || 0;
  const propertyType = property.propertyType || '';
  const amenities = property.amenities || ['Parking', 'Security', 'Generator'];

  // Check if the current user is the owner of this property
  const ownerId = property.owner?.id || property.ownerId || null;
  const isOwnProperty = user && ownerId === user.id;

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveImageIndex(Math.round(index));
  };

  const submitReview = async () => {
    if (!token) {
      showAlert('Not Logged In', 'Please log in to leave a review.');
      return;
    }
    if (!newReviewText.trim()) {
      showAlert('Empty Review', 'Please write something before submitting.');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: parseInt(id as string),
          rating: newReviewRating,
          text: newReviewText.trim()
        })
      });

      if (res.ok) {
        showAlert('Success', 'Your review has been posted!');
        setNewReviewText('');
        setNewReviewRating(5);
        setShowReviewForm(false);
        // Refresh reviews list
        const revRes = await fetch(`${API_BASE_URL}/reviews/property/${id}`);
        if (revRes.ok) setReviews(await revRes.json());
      } else {
        const err = await res.text();
        showAlert('Error', err || 'Failed to submit review.');
      }
    } catch (e) {
      showAlert('Error', 'Could not connect to server.');
    }
  };

  const renderStars = (rating: number, size = 14) => {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={size}
            color="#FBBF24"
          />
        ))}
      </View>
    );
  };

  const renderSelectableStars = () => {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setNewReviewRating(star)}>
            <Ionicons
              name={star <= newReviewRating ? 'star' : 'star-outline'}
              size={28}
              color="#FBBF24"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Sticky top actions — plain View with inset padding, no background strip */}
      <View style={[styles.stickyTopActions, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
          <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.topRightActions}>
          <TouchableOpacity style={styles.topButton} onPress={() => setSaved(!saved)}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={24} color={saved ? "#EF4444" : "#F8FAFC"} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.topButton, { marginLeft: 12 }]}>
            <Ionicons name="share-outline" size={24} color="#F8FAFC" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {images.map((img: string, idx: number) => (
              <Image key={idx} source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
            ))}
          </ScrollView>
          
          {/* Pagination dots */}
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_: any, idx: number) => (
                <View 
                  key={idx} 
                  style={[styles.dot, activeImageIndex === idx ? styles.activeDot : null]} 
                />
              ))}
            </View>
          )}

          {/* Image count badge */}
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={14} color="#F8FAFC" />
            <Text style={styles.imageCountText}>{activeImageIndex + 1}/{images.length}</Text>
          </View>


          {/* Posted Badge */}
          <View style={styles.postedBadge}>
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.postedText}>Just listed</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Property Type + Price */}
          {propertyType ? (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{propertyType}</Text>
            </View>
          ) : null}

          <View style={styles.priceSection}>
            <View>
              <Text style={styles.price}>₦{Number(property.price).toLocaleString()}/yr</Text>
              <Text style={styles.priceMonthly}>₦{Math.round(Number(property.price) / 12).toLocaleString()}/mo</Text>
            </View>
            {/* Rating summary */}
            <TouchableOpacity style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.ratingText}>{avgRating}</Text>
              <Text style={styles.reviewCount}>({reviews.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Title & Location */}
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#94A3B8" />
            <Text style={styles.location}>{property.location}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="bed-outline" size={20} color="#38BDF8" />
              <Text style={styles.statValue}>{beds || '--'}</Text>
              <Text style={styles.statLabel}>Beds</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={20} color="#38BDF8" />
              <Text style={styles.statValue}>{baths || '--'}</Text>
              <Text style={styles.statLabel}>Baths</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={20} color="#38BDF8" />
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Sq ft</Text>
            </View>
          </View>

          {/* Seller — no message button here */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{sellerAvatar}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{sellerName}</Text>
              <Text style={styles.sellerRole}>Listed by owner</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description || 'No description provided.'}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityTag}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 }}>
                  {renderStars(parseFloat(avgRating as string), 16)}
                  <Text style={styles.reviewSummary}>{avgRating} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.addReviewBtn} 
                onPress={() => setShowReviewForm(!showReviewForm)}
              >
                <Ionicons name={showReviewForm ? "close" : "create-outline"} size={18} color="#38BDF8" />
                <Text style={styles.addReviewText}>{showReviewForm ? 'Cancel' : 'Write'}</Text>
              </TouchableOpacity>
            </View>

            {/* Add Review Form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormLabel}>Your Rating</Text>
                {renderSelectableStars()}
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={newReviewText}
                  onChangeText={setNewReviewText}
                />
                <TouchableOpacity style={styles.submitReviewBtn} onPress={submitReview}>
                  <Text style={styles.submitReviewText}>Submit Review</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Review List */}
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerAvatarText}>
                      {review.reviewer?.name ? review.reviewer.name.substring(0, 1).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{review.reviewer?.name || 'Unknown User'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {renderStars(review.rating)}
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>

          {/* Spacer for bottom actions */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {isOwnProperty ? (
          <TouchableOpacity 
            style={styles.ownPropertyBanner}
            onPress={() => router.push({ pathname: `/dashboard/property/edit/${id}` as any, params: { data: JSON.stringify(property) } })}
          >
            <Ionicons name="create-outline" size={22} color="#38BDF8" />
            <Text style={styles.ownPropertyText}>Edit Listing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => {
              if (!token) {
                showAlert('Not Logged In', 'Please log in to contact the owner.');
                return;
              }
              if (ownerId) {
                router.push(`/dashboard/conversation/${ownerId}` as any);
              } else {
                showAlert('Error', 'Owner contact information is unavailable.');
              }
            }}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#0F172A" />
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  // Hero Image
  imageContainer: { position: 'relative', height: 360 },
  heroImage: { width, height: 360, backgroundColor: '#334155' },
  stickyTopActions: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.3)' },
  topRightActions: { flexDirection: 'row' },
  topButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(15, 23, 42, 0.6)', alignItems: 'center', justifyContent: 'center' },
  postedBadge: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  postedText: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  imageCountBadge: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  imageCountText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },

  // Content
  content: { padding: 24, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#0F172A' },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  typeBadgeText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  priceSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  price: { fontSize: 28, fontWeight: '800', color: '#38BDF8' },
  priceMonthly: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  ratingText: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  reviewCount: { color: '#94A3B8', fontSize: 13 },
  title: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  location: { fontSize: 14, color: '#94A3B8', marginLeft: 4 },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.05)' },

  // Seller
  sellerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 24 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(56, 189, 248, 0.15)', alignItems: 'center', justifyContent: 'center' },
  sellerAvatarText: { color: '#38BDF8', fontSize: 16, fontWeight: '700' },
  sellerInfo: { flex: 1, marginLeft: 12 },
  sellerName: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  sellerRole: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  description: { fontSize: 15, color: '#94A3B8', lineHeight: 24 },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  amenityText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600', marginLeft: 6 },

  // Reviews
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  reviewSummary: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  addReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  addReviewText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },

  reviewForm: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  reviewFormLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  reviewInput: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 14, borderRadius: 12, fontSize: 15, minHeight: 80, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  submitReviewBtn: { backgroundColor: '#38BDF8', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitReviewText: { color: '#0F172A', fontSize: 15, fontWeight: '700' },

  reviewCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(56, 189, 248, 0.15)', alignItems: 'center', justifyContent: 'center' },
  reviewerAvatarText: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },
  reviewerName: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  reviewDate: { color: '#64748B', fontSize: 11, fontWeight: '500' },
  reviewText: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 36, backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  applyButton: { flexDirection: 'row', gap: 10, backgroundColor: '#38BDF8', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  applyButtonText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },

  // Own Property Banner
  ownPropertyBanner: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  ownPropertyText: { color: '#38BDF8', fontSize: 16, fontWeight: '700' },

  // Helpers
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 32, alignSelf: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 16, backgroundColor: '#38BDF8' }
});
