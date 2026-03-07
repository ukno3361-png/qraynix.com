/**
 * client/src/components/AdminLayout.jsx
 * Main admin shell — sidebar navigation, topbar, and content area.
 * Redesigned: Option 6 with sidebar search, user popup menu, breadcrumb topbar.
 */
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_GROUPS = [
    {
        section: 'Main',
        items: [
            { path: '/admin/dashboard', label: 'Dashboard', icon: '⬡' },
            { path: '/admin/entries', label: 'Entries', icon: '✦' },
            { path: '/admin/entries/new', label: 'New Entry', icon: '✚' },
            { path: '/admin/db-tools', label: 'DB Tools', icon: '⛭' },
        ],
    },
    {
        section: 'Content',
        items: [
            { path: '/admin/timeline', label: 'Timeline', icon: '◇' },
            { path: '/admin/now', label: 'Now', icon: '◈' },
            { path: '/admin/future', label: 'Future', icon: '⟡' },
            { path: '/admin/thought-flash', label: 'Thought Flash', icon: 'ᛃ' },
        ],
    },
    {
        section: 'Media',
        items: [
            { path: '/admin/music', label: 'Music', icon: '♫' },
            { path: '/admin/entertainment', label: 'Entertainment', icon: 'ᛊ' },
            { path: '/admin/live-cam', label: 'Live Cam', icon: '◉' },
            { path: '/admin/media', label: 'Media Library', icon: '◻' },
        ],
    },
    {
        section: 'Track',
        items: [
            { path: '/admin/habits', label: 'Habit Tracker', icon: '▣' },
            { path: '/admin/health', label: 'Health', icon: '✧' },
        ],
    },
];

const POPUP_ITEMS = [
    { path: '/admin/analytics', label: 'Analytics', icon: '◆' },
    { path: '/admin/ai-bot', label: 'AI Bot', icon: '☲' },
    { path: '/admin/settings', label: 'Site Settings', icon: '⚙' },
    { path: '/admin/account', label: 'Account', icon: '◉' },
];

const BREADCRUMB_MAP = {
    '/admin': 'Dashboard',
    '/admin/dashboard': 'Dashboard',
    '/admin/entries': 'Entries',
    '/admin/entries/new': 'New Entry',
    '/admin/timeline': 'Timeline',
    '/admin/now': 'Now',
    '/admin/habits': 'Habit Tracker',
    '/admin/music': 'Music',
    '/admin/thought-flash': 'Thought Flash',
    '/admin/entertainment': 'Entertainment',
    '/admin/live-cam': 'Live Cam',
    '/admin/future': 'Future',
    '/admin/health': 'Health',
    '/admin/media': 'Media Library',
    '/admin/analytics': 'Analytics',
    '/admin/ai-bot': 'AI Bot',
    '/admin/settings': 'Site Settings',
    '/admin/account': 'Account',
    '/admin/db-tools': 'DB Tools',
};

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('nav-collapsed') || '{}');
        } catch { return {}; }
    });
    const popupRef = useRef(null);
    const location = useLocation();

    const toggleSection = (section) => {
        setCollapsed(prev => {
            const next = { ...prev, [section]: !prev[section] };
            localStorage.setItem('nav-collapsed', JSON.stringify(next));
            return next;
        });
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setPopupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setPopupOpen(false);
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const displayName = user?.display_name || user?.username || 'Admin';
    const initials = displayName.slice(0, 2).toUpperCase();

    const currentPage = BREADCRUMB_MAP[location.pathname]
        || (location.pathname.includes('/entries/') && location.pathname.includes('/edit') ? 'Edit Entry' : null)
        || 'Admin';
    const routeKey = `${location.pathname}${location.search}`;

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span className="sidebar-logo">Qraynix</span>
                </div>

                <div className="sidebar-search" tabIndex={0}>
                    <span className="search-icon">⌕</span>
                    <span className="search-text">Search...</span>
                    <span className="search-shortcut">⌘K</span>
                </div>

                <nav className="sidebar-nav">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.section} className="nav-group">
                            <button
                                className={`nav-section ${collapsed[group.section] ? 'collapsed' : ''}`}
                                onClick={() => toggleSection(group.section)}
                            >
                                <span>{group.section}</span>
                                <span className="nav-section-chevron">{collapsed[group.section] ? '›' : '‹'}</span>
                            </button>
                            {!collapsed[group.section] && group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" ref={popupRef}>
                    <a href="/" className="sidebar-footer-link">← View Site</a>

                    <div
                        className="sidebar-user"
                        onClick={() => setPopupOpen((v) => !v)}
                    >
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{displayName}</div>
                            <div className="sidebar-user-role">Admin</div>
                        </div>
                        <span className="sidebar-chevron">{popupOpen ? '▾' : '▴'}</span>
                    </div>

                    <div className={`user-popup ${popupOpen ? 'visible' : ''}`}>
                        {POPUP_ITEMS.map((item) => (
                            <NavLink key={item.path} to={item.path} className="popup-item" onClick={() => setSidebarOpen(false)}>
                                <span className="popup-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                        <div className="popup-sep" />
                        <button className="popup-item" onClick={logout} style={{ width: '100%', border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 'inherit' }}>
                            <span className="popup-icon">↪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="admin-main">
                <header className="admin-topbar">
                    <button
                        className="btn btn-ghost"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'none' }}
                        id="sidebar-toggle"
                    >
                        ☰
                    </button>
                    <div className="topbar-title">
                        <span>Qraynix</span>
                        <span className="topbar-crumb-sep">/</span>
                        <span className="topbar-crumb-current">{currentPage}</span>
                    </div>
                    <div className="topbar-actions">
                        <span className="autosave-indicator">
                            <span className="autosave-dot" />
                            Saved
                        </span>
                    </div>
                </header>

                <div className="admin-content" key={routeKey}>
                    <Outlet key={routeKey} />
                </div>
            </div>
        </div>
    );
}
