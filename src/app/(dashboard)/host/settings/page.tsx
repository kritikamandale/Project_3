'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, Bell, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { id: 'profile',   label: 'Profile',        icon: User },
  { id: 'security',  label: 'Security',        icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const;

type Tab = typeof TABS[number]['id'];

export default function HostSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setTab] = useState<Tab>('profile');

  const [profile, setProfile] = useState({
    name:  user?.name  ?? '',
    email: user?.email ?? '',
    phone: '',
    city:  '',
  });
  const [passwords, setPasswords]   = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving]         = useState(false);
  const [savedMsg, setSavedMsg]     = useState('');

  const [notifs, setNotifs] = useState({
    emailInvites:   true,
    emailReminders: true,
    smsRsvp:        false,
    whatsappAlerts: true,
  });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // TODO: call PATCH /api/users/me
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSavedMsg('Profile updated!');
    setTimeout(() => setSavedMsg(''), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { alert('Passwords do not match'); return; }
    setSaving(true);
    // TODO: call POST /api/auth/change-password
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setPasswords({ current: '', next: '', confirm: '' });
    setSavedMsg('Password updated!');
    setTimeout(() => setSavedMsg(''), 3000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Settings</h1>
        <p className="text-sm text-[var(--muted-fg)] mt-1">Manage your account and preferences.</p>
      </div>

      {/* Success banner */}
      {savedMsg && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          ✓ {savedMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-[var(--border)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2',
                  activeTab === tab.id
                    ? 'border-[var(--pichwai-gold)] text-[var(--pichwai-gold-deep)]'
                    : 'border-transparent text-[var(--muted-fg)] hover:text-[var(--foreground)]'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Profile tab */}
          {activeTab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9933A] to-[#E8C06B] flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                  {(user?.name ?? 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{user?.name}</p>
                  <p className="text-sm text-[var(--muted-fg)] capitalize">{user?.role}</p>
                </div>
              </div>

              {[
                { key: 'name',  label: 'Full Name',    type: 'text',  placeholder: 'Your full name' },
                { key: 'email', label: 'Email',         type: 'email', placeholder: 'you@example.com' },
                { key: 'phone', label: 'Phone',         type: 'tel',   placeholder: '9876543210' },
                { key: 'city',  label: 'City',          type: 'text',  placeholder: 'Mumbai' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-[var(--muted-fg)] mb-1 block">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(profile as Record<string, string>)[f.key]}
                    onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <form onSubmit={changePassword} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-[var(--pichwai-gold)]" />
                <h2 className="font-semibold text-[var(--pichwai-mid-brown)]">Change Password</h2>
              </div>
              {[
                { key: 'current', label: 'Current Password',  placeholder: '••••••••' },
                { key: 'next',    label: 'New Password',       placeholder: 'Min 8 chars, 1 upper, 1 number' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-[var(--muted-fg)] mb-1 block">{f.label}</label>
                  <input
                    type="password"
                    placeholder={f.placeholder}
                    value={(passwords as Record<string, string>)[f.key]}
                    onChange={(e) => setPasswords((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={saving || !passwords.current || !passwords.next}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-[var(--pichwai-gold)]" />
                <h2 className="font-semibold text-[var(--pichwai-mid-brown)]">Notification Preferences</h2>
              </div>
              {[
                { key: 'emailInvites',   label: 'Email: Guest invitations',    desc: 'Get notified when guests RSVP' },
                { key: 'emailReminders', label: 'Email: Event reminders',       desc: 'Upcoming event alerts' },
                { key: 'smsRsvp',        label: 'SMS: RSVP updates',            desc: 'SMS when guests respond' },
                { key: 'whatsappAlerts', label: 'WhatsApp: Important alerts',   desc: 'Vendor confirmations & payments' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between p-4 border border-[var(--border)] rounded-xl hover:border-[var(--pichwai-gold)] transition">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{n.label}</p>
                    <p className="text-xs text-[var(--muted-fg)]">{n.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifs((p) => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors shrink-0',
                      notifs[n.key as keyof typeof notifs]
                        ? 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B]'
                        : 'bg-[var(--muted)] border border-[var(--border)]'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      notifs[n.key as keyof typeof notifs] ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
