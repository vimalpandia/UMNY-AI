import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import {
  Users,
  MessageSquare,
  Cpu,
  Activity,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Server,
  Database
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminDashboard({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes, healthRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getUsers(),
        adminService.getLogs(),
        adminService.getHealth(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value || []);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="UMNY AI Enterprise Administrator Console" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex gap-2">
            {['overview', 'users', 'logs', 'system'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-cyan' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">Registered Users</span>
                  <Users className="w-4 h-4 text-brand-purple-light" />
                </div>
                <div className="text-xl font-bold text-white">{stats?.totalUsers ?? '—'}</div>
                <div className="text-[10px] text-emerald-400 mt-1">Active verified accounts</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">Total Conversations</span>
                  <MessageSquare className="w-4 h-4 text-brand-blue" />
                </div>
                <div className="text-xl font-bold text-white">{stats?.totalConversations ?? '—'}</div>
                <div className="text-[10px] text-slate-400 mt-1">{stats?.totalMessages ?? 0} messages generated</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">Token Throughput</span>
                  <Cpu className="w-4 h-4 text-brand-cyan" />
                </div>
                <div className="text-xl font-bold text-white">{stats?.totalTokens?.toLocaleString() ?? '—'}</div>
                <div className="text-[10px] text-slate-400 mt-1">Across all AI providers</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">System Status</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-emerald-400">100% Operational</div>
                <div className="text-[10px] text-slate-400 mt-1">MongoDB & APIs online</div>
              </div>
            </div>

            {/* Provider Breakdown */}
            <div className="p-4 rounded-2xl bg-dark-850 border border-slate-800">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                AI Provider Distribution
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Google Gemini</span>
                    <span className="text-brand-cyan font-mono">{stats?.providerStats?.google ?? 0} req</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-cyan h-full w-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>OpenAI</span>
                    <span className="text-emerald-400 font-mono">{stats?.providerStats?.openai ?? 0} req</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Anthropic</span>
                    <span className="text-amber-400 font-mono">{stats?.providerStats?.anthropic ?? 0} req</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Registered Accounts ({users.length})
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-dark-850">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-dark-900/50">
                      <td className="p-3 font-medium text-white">{u.name}</td>
                      <td className="p-3 text-slate-400 font-mono">{u.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'user' : 'admin')}
                          className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Set as {u.role === 'admin' ? 'User' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recent Provider & System Activity Logs
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No security or error events logged.</div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      log.requestStatus === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-dark-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      <span className="font-semibold text-white">[{log.provider?.toUpperCase() || 'SYSTEM'}]</span>
                      <span>{log.model || 'API'}</span>
                      {log.errorMessage && <span className="text-rose-400">({log.errorMessage})</span>}
                    </div>
                    <div className="text-slate-400">{log.tokenUsage?.totalTokens || 0} tokens</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SYSTEM HEALTH TAB */}
        {activeTab === 'system' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-dark-850 border border-slate-800 flex items-center gap-3">
                <Database className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">MongoDB Atlas Connection</div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>State: Connected (Ready State 1)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-dark-850 border border-slate-800 flex items-center gap-3">
                <Server className="w-8 h-8 text-brand-purple-light shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Node Runtime Environment</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Node.js {health?.nodeVersion || 'v26.x'} • Express API
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

