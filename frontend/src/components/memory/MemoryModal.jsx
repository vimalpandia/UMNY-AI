import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Brain, Plus, Trash2, Search, Shield, ToggleLeft, ToggleRight, Loader2, Sparkles } from 'lucide-react';
import { memoryService } from '../../services/memoryService';
import { useAuth } from '../../context/AuthContext';

export default function MemoryModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('preference');
  const [isAdding, setIsAdding] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(user?.preferences?.memoryEnabled ?? true);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const data = await memoryService.getMemories();
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMemory = async () => {
    const nextState = !memoryEnabled;
    setMemoryEnabled(nextState);
    try {
      await memoryService.toggleMemorySetting(nextState);
      await updateProfile({ preferences: { ...user?.preferences, memoryEnabled: nextState } });
    } catch (err) {
      console.error('Failed to toggle memory:', err);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setIsAdding(true);
      const created = await memoryService.addMemory(newContent.trim(), newCategory, 4);
      setMemories((prev) => [created, ...prev]);
      setNewContent('');
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await memoryService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="UMNY Long-Term Memory System" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Memory Toggle & Privacy Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-dark-850 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Assistant Memory Engine</div>
              <div className="text-xs text-slate-400">
                {memoryEnabled
                  ? 'Active: UMNY recalls approved preferences and contextual facts across chats.'
                  : 'Inactive: Memory retrieval is paused.'}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleMemory}
            className="text-slate-300 hover:text-white transition-colors"
          >
            {memoryEnabled ? (
              <ToggleRight className="w-8 h-8 text-brand-cyan" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-500" />
            )}
          </button>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAddMemory} className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Teach UMNY A Fact or Preference
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g., 'Prefer concise TypeScript responses without extra explanations.'"
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-dark-850 border border-slate-700/80 focus:border-brand-purple text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-2 py-2 text-xs rounded-xl bg-dark-850 border border-slate-700/80 text-slate-300 focus:outline-none"
            >
              <option value="preference">Preference</option>
              <option value="fact">Fact</option>
              <option value="coding">Coding</option>
              <option value="project">Project</option>
            </select>
            <button
              type="submit"
              disabled={!newContent.trim() || isAdding}
              className={`px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1 transition-all ${
                newContent.trim() && !isAdding
                  ? 'bg-brand-purple hover:bg-brand-purple-dark shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Remember</span>
            </button>
          </div>
        </form>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stored memories..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-dark-850 border border-slate-800 focus:border-brand-purple text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Memories list */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
              <span>Loading memories...</span>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {search ? 'No matching memories found.' : 'No memories saved yet. Add a preference above or instruct UMNY during chat.'}
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem._id}
                className="flex items-start justify-between p-3 rounded-xl bg-dark-850 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30">
                      {mem.category}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(mem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans">{mem.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteMemory(mem._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                  title="Forget memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Every memory is strictly private to your account and never used to train public foundational weights.</span>
        </div>
      </div>
    </Modal>
  );
}

