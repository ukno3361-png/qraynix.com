/**
 * client/src/pages/AccountPage.jsx
 * User profile and password management.
 */
import React, { useState, useEffect } from 'react';
import { account as accountApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AutocompleteTextarea from '../components/AutocompleteTextarea.jsx';

export default function AccountPage() {
    const [profile, setProfile] = useState({ display_name: '', email: '', bio: '' });
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const { refreshAuth } = useAuth();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await accountApi.get();
                setProfile({ display_name: data.display_name || '', email: data.email || '', bio: data.bio || '' });
            } catch (err) { toast.error(err.message); }
            finally { setLoading(false); }
        };
        load();
    }, [toast]);

    const handleProfileSave = async () => {
        setSaving(true);
        try {
            await accountApi.update(profile);
            await refreshAuth();
            toast.success('Profile updated');
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    const handlePasswordChange = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        if (passwords.newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        try {
            await accountApi.changePassword(passwords.currentPassword, passwords.newPassword);
            toast.success('Password changed');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) { toast.error(err.message); }
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Account</h1></div>

            <div className="settings-grid">
                {/* Profile */}
                <div className="card">
                    <h3 className="card-title">Profile</h3>
                    <div className="form-group">
                        <label className="form-label">Display Name</label>
                        <input className="form-input" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bio</label>
                        <AutocompleteTextarea className="form-textarea" rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
                    </div>
                    <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                </div>

                {/* Password */}
                <div className="card">
                    <h3 className="card-title">Change Password</h3>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input className="form-input" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input className="form-input" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input className="form-input" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                    </div>
                    <button className="btn btn-primary" onClick={handlePasswordChange}>Change Password</button>
                </div>
            </div>
        </div>
    );
}
