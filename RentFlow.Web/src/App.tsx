import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext';

import { CallOverlayModal } from './components/CallOverlayModal';
import { DashboardLayout } from './components/DashboardLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ExplorePage } from './pages/ExplorePage';
import { SearchPage } from './pages/SearchPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { AddPropertyPage } from './pages/AddPropertyPage';
import { EditPropertyPage } from './pages/EditPropertyPage';
import { ChatsPage } from './pages/ChatsPage';
import { SavedPage } from './pages/SavedPage';
import { CallHistoryPage } from './pages/CallHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

import { PersonalInfoPage } from './pages/profile/PersonalInfoPage';
import { SecurityPage } from './pages/profile/SecurityPage';
import { NotificationsPage } from './pages/profile/NotificationsPage';
import { MyListingsPage } from './pages/profile/MyListingsPage';
import { ManageListingPage } from './pages/profile/ManageListingPage';
import { MyReviewsPage } from './pages/profile/MyReviewsPage';

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <ChatProvider>
          <CallProvider>
            <BrowserRouter>
              <CallOverlayModal />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="/dashboard/explore" replace />} />
                  <Route path="explore" element={<ExplorePage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="add" element={<AddPropertyPage />} />
                  <Route path="chats" element={<ChatsPage />} />
                  <Route path="conversation/:id" element={<ChatsPage />} />
                  <Route path="saved" element={<SavedPage />} />
                  <Route path="call-history" element={<CallHistoryPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Property Detail & Edit */}
                  <Route path="property/:id" element={<PropertyDetailPage />} />
                  <Route path="property/edit/:id" element={<EditPropertyPage />} />

                  {/* Account / Profile Sub-Routes */}
                  <Route path="profile/personal-info" element={<PersonalInfoPage />} />
                  <Route path="profile/security" element={<SecurityPage />} />
                  <Route path="profile/notifications" element={<NotificationsPage />} />
                  <Route path="profile/my-listings" element={<MyListingsPage />} />
                  <Route path="profile/manage-listing/:id" element={<ManageListingPage />} />
                  <Route path="profile/edit-listing/:id" element={<EditPropertyPage />} />
                  <Route path="profile/my-reviews" element={<MyReviewsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard/explore" replace />} />
              </Routes>
            </BrowserRouter>
          </CallProvider>
        </ChatProvider>
      </AuthProvider>
    </AlertProvider>
  );
}
