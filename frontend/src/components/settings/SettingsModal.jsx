import React, { useState } from 'react';
import Modal from '../common/Modal';
import { User, Sliders, Shield, Key, Moon, Sun, LogOut, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { AVAILABLE_MODELS } from '../chat/ModelSelector';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { selectedModel, setSelectedModel } = useChat();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [customInstructions, setCustomInstructions] = useState(user?.preferences?.customInstructions || '');
  const [temperature, setTemperature] = useState(user?.preferences?.temperature ?? 0.7);
  const [statusMessage, setStatusMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        name,
        preferences: {
          ...user?.preferences,
          customInstructions,
          temperature: parseFloat(temperature),
          defaultModel: selectedModel,
        },
      });
      setStatusMessage({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="UMNY AI Settings & Preferences" maxWidth="max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-4 min-h-[380px]">
        {/* Navigation Sidebar Tabs */}
        <div className="sm:w-48 flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-slate-800 pb-2 sm:pb-0 sm:pr-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>AI Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Account Security</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 py-1">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-850 border border-slate-700 focus:border-brand-purple text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500">Contact admin to modify registered email.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">User Role</label>
                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-medium uppercase bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30">
                  {user?.role || 'user'}
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-semibold transition-colors"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab === 'ai' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-850 border border-slate-700 text-slate-200 focus:outline-none"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider}) — {m.badge}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Temperature (Creativity): {temperature}</span>
                  <span className="text-[10px] text-slate-500">0.0 (Precise) → 1.0 (Creative)</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full accent-brand-purple cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom System Instructions & Personality
                </label>
                <textarea
                  rows={4}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always format code using clean functional architecture, avoid fluff, and act as an expert computer science researcher."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-850 border border-slate-700 focus:border-brand-purple text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-semibold transition-colors"
              >
                {saving ? 'Saving...' : 'Save AI Preferences'}
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 mb-2">Theme Selection</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border text-left flex flex-col items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-dark-850 border-brand-purple ring-2 ring-brand-purple/40 text-white'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-6 h-6 text-brand-purple-light" />
                  <span className="text-xs font-semibold">Dark Charcoal (Default)</span>
                  <span className="text-[10px] text-slate-400">Deep blacks & futuristic purple neon</span>
                </button>

                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border text-left flex flex-col items-center gap-2 transition-all ${
                    !isDark
                      ? 'bg-slate-100 border-brand-blue ring-2 ring-brand-blue/40 text-slate-900'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-semibold">Light Clean</span>
                  <span className="text-[10px] text-slate-500">Soft slate & daylight high contrast</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-200 mb-1">Session Security</div>
                <div className="text-slate-400 mb-3">
                  Your session is protected with secure JWT authentication and bcrypt password hashing.
                </div>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of All Devices</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
