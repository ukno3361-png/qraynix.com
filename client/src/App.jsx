/**
 * client/src/App.jsx
 * Root app component with React Router.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import AdminLayout from './components/AdminLayout.jsx';

// Lazy-load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'));
const EntriesList = React.lazy(() => import('./pages/EntriesList.jsx'));
const EntryEditor = React.lazy(() => import('./pages/EntryEditor.jsx'));
const TimelineManager = React.lazy(() => import('./pages/TimelineManager.jsx'));
const NowEditor = React.lazy(() => import('./pages/NowEditor.jsx'));
const MediaLibrary = React.lazy(() => import('./pages/MediaLibrary.jsx'));
const SiteSettings = React.lazy(() => import('./pages/SiteSettings.jsx'));
const AccountPage = React.lazy(() => import('./pages/AccountPage.jsx'));
const Analytics = React.lazy(() => import('./pages/Analytics.jsx'));

function AppContent() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner spinner-lg"></div>
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <React.Suspense fallback={<div className="page-loader"><div className="spinner spinner-lg"></div></div>}>
            <Routes>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="entries" element={<EntriesList />} />
                    <Route path="entries/new" element={<EntryEditor />} />
                    <Route path="entries/:id/edit" element={<EntryEditor />} />
                    <Route path="timeline" element={<TimelineManager />} />
                    <Route path="now" element={<NowEditor />} />
                    <Route path="media" element={<MediaLibrary />} />
                    <Route path="settings" element={<SiteSettings />} />
                    <Route path="account" element={<AccountPage />} />
                    <Route path="analytics" element={<Analytics />} />
                </Route>
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </React.Suspense>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
