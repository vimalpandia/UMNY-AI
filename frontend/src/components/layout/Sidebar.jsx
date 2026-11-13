import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  Trash2,
  Settings,
  Brain,
  Bot,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  FileText,
  Sparkles,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  isOpen,
  onToggle,
  onOpenSettings,
  onOpenMemory,
  onOpenAgentTools,
  onOpenAdmin,
}) {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewChat,
    deleteConversation,
    updateConversationTitle,
    selectedModel,
  } = useChat();

  const { user, logout, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    (c.title || 'Untitled Chat').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (conv, e) => {
    e.stopPropagation();
    setEditingConvId(conv._id);
    setEditTitle(conv.title || 'New Chat');
  };

  const handleSaveEdit = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      updateConversationTitle(convId, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingConvId(null);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-dark-900 border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 md:w-80 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/70">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => createNewChat()}>
            <img src="/logo.svg" alt="UMNY AI" className="w-9 h-9 min-w-9 shrink-0 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
            {isOpen && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-brand-purple via-blue-400 to-brand-cyan bg-clip-text text-transparent">
                  UMNY AI
                </span>
                <span className="text-[10px] text-slate-400 truncate">Your Intelligence. Your Assistant.</span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => createNewChat()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple via-brand-purple-dark to-brand-blue hover:opacity-95 text-white font-medium text-sm shadow-lg shadow-brand-purple/20 transition-all active:scale-[0.99]"
          >
            <MessageSquarePlus className="w-4 h-4" />
            {isOpen && <span>New Chat</span>}
          </button>
        </div>

        {/* Search input (visible when open) */}
        {isOpen && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-dark-850 border border-slate-800 focus:border-brand-purple/60 text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {isOpen && (
            <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Recent Conversations
            </div>
          )}

          {filteredConversations.length === 0 ? (
            isOpen ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                {searchTerm ? 'No matching conversations' : 'No conversations yet'}
              </div>
            ) : null
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversationId === conv._id;
              const isEditing = editingConvId === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversationId(conv._id)}
                  className={`group relative flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-brand-purple/20 text-white border border-brand-purple/40 shadow-sm'
                      : 'text-slate-300 hover:bg-dark-850 hover:text-white'
                  }`}
                  title={conv.title || 'Untitled Chat'}
                >
                  <div className="flex items-center gap-2.5 truncate w-full">
                    <Sparkles
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-brand-cyan' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(conv._id, e)}
                          className="bg-dark-950 border border-brand-purple px-1.5 py-0.5 rounded text-xs text-white w-full focus:outline-none"
                          autoFocus
                        />
                        <button onClick={(e) => handleSaveEdit(conv._id, e)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={handleCancelEdit} className="p-0.5 text-rose-400 hover:text-rose-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      isOpen && <span className="truncate">{conv.title || 'New Conversation'}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {isOpen && !isEditing && (
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
                      <button
                        onClick={(e) => handleStartEdit(conv, e)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60"
                        title="Rename chat"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv._id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700/60"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Feature quick links */}
        <div className="p-2 border-t border-slate-800/70 space-y-1">
          <button
            onClick={onOpenAgentTools}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-dark-850 hover:text-brand-cyan transition-colors"
          >
            <Bot className="w-4 h-4 text-brand-cyan" />
            {isOpen && <span>Agent & Tools</span>}
          </button>

          <button
            onClick={onOpenMemory}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-dark-850 hover:text-brand-purple-light transition-colors"
          >
            <Brain className="w-4 h-4 text-brand-purple-light" />
            {isOpen && <span>Long-Term Memory</span>}
          </button>

          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-400/10 transition-colors"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              {isOpen && <span>Admin Dashboard</span>}
            </button>
          )}
        </div>

        {/* User profile & settings footer */}
        <div className="p-3 border-t border-slate-800/80 bg-dark-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate cursor-pointer" onClick={onOpenSettings}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            {isOpen && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Guest User'}</span>
                <span className="text-[10px] text-slate-400 truncate">{user?.email || 'Logged in'}</span>
              </div>
            )}
          </div>

          {isOpen && (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

