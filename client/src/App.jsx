/**
 * client/src/App.jsx
 * Root app component with React Router.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import AdminLayout from './components/AdminLayout.jsx';

// Lazy-load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'));
const EntriesList = React.lazy(() => import('./pages/EntriesList.jsx'));
const EntryEditor = React.lazy(() => import('./pages/EntryEditor.jsx'));
const TimelineManager = React.lazy(() => import('./pages/TimelineManager.jsx'));
const NowEditor = React.lazy(() => import('./pages/NowEditor.jsx'));
const HabitTracker = React.lazy(() => import('./pages/HabitTracker.jsx'));
const MusicManager = React.lazy(() => import('./pages/MusicManager.jsx'));
const ThoughtFlashManager = React.lazy(() => import('./pages/ThoughtFlashManager.jsx'));
const EntertainmentManager = React.lazy(() => import('./pages/EntertainmentManager.jsx'));
const LiveCamSettings = React.lazy(() => import('./pages/LiveCamSettings.jsx'));
const FutureEditor = React.lazy(() => import('./pages/FutureEditor.jsx'));
const HealthEditor = React.lazy(() => import('./pages/HealthEditor.jsx'));
const MediaLibrary = React.lazy(() => import('./pages/MediaLibrary.jsx'));
const SiteSettings = React.lazy(() => import('./pages/SiteSettings.jsx'));
const AIBotSettings = React.lazy(() => import('./pages/AIBotSettings.jsx'));
const AccountPage = React.lazy(() => import('./pages/AccountPage.jsx'));
const Analytics = React.lazy(() => import('./pages/Analytics.jsx'));
const DatabaseTools = React.lazy(() => import('./pages/DatabaseTools.jsx'));
const PageManager = React.lazy(() => import('./pages/PageManager.jsx'));

function AppContent() {
    const { user, loading, refreshAuth } = useAuth();
    const location = useLocation();

    React.useEffect(() => {
        refreshAuth();
    }, [location.pathname, refreshAuth]);

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner spinner-lg"></div>
                <span>Loading...</span>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <React.Suspense fallback={<div className="page-loader"><div className="spinner spinner-lg"></div></div>}>
            <Routes>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="entries" element={<EntriesList />} />
                    <Route path="entries/new" element={<EntryEditor />} />
                    <Route path="entries/:id/edit" element={<EntryEditor />} />
                    <Route path="timeline" element={<TimelineManager />} />
                    <Route path="now" element={<NowEditor />} />
                    <Route path="habits" element={<HabitTracker />} />
                    <Route path="music" element={<MusicManager />} />
                    <Route path="thought-flash" element={<ThoughtFlashManager />} />
                    <Route path="entertainment" element={<EntertainmentManager />} />
                    <Route path="live-cam" element={<LiveCamSettings />} />
                    <Route path="future" element={<FutureEditor />} />
                    <Route path="health" element={<HealthEditor />} />
                    <Route path="media" element={<MediaLibrary />} />
                    <Route path="settings" element={<SiteSettings />} />
                    <Route path="ai-bot" element={<AIBotSettings />} />
                    <Route path="account" element={<AccountPage />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="db-tools" element={<DatabaseTools />} />
                    <Route path="pages" element={<PageManager />} />
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
