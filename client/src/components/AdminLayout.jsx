/**
 * client/src/components/AdminLayout.jsx
 * Main admin shell — sidebar navigation, topbar, and content area.
 */
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
    { section: 'Main' },
    { path: '/admin', label: 'Dashboard', icon: '⬡', end: true },
    { path: '/admin/entries', label: 'Entries', icon: '✦' },
    { path: '/admin/entries/new', label: 'New Entry', icon: '✚' },
    { section: 'Content' },
    { path: '/admin/timeline', label: 'Timeline', icon: '◇' },
    { path: '/admin/now', label: 'Now', icon: '◈' },
    { path: '/admin/media', label: 'Media', icon: '◻' },
    { section: 'System' },
    { path: '/admin/analytics', label: 'Analytics', icon: '◆' },
    { path: '/admin/settings', label: 'Site Settings', icon: '⚙' },
    { path: '/admin/account', label: 'Account', icon: '◉' },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span className="sidebar-rune">◈</span>
                    <span className="sidebar-logo">Qraynix</span>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item, i) => {
                        if (item.section) {
                            return <div key={i} className="nav-section">{item.section}</div>;
                        }
                        return (
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
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <a href="/" style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>← View Site</a>
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
                    <div className="topbar-title"></div>
                    <div className="topbar-actions">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {user?.display_name || user?.username}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
