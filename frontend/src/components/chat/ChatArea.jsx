import React from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import SuggestedPrompts from './SuggestedPrompts';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Bot, ShieldCheck, Zap } from 'lucide-react';

export default function ChatArea({ onOpenVoice, onOpenAttachment }) {
  const { messages, loadingMessages, selectedModel, agentMode } = useChat();
  const { user } = useAuth();

  const isEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-dark-950 relative">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-brand-purple/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[250px] bg-brand-cyan/10 blur-[120px] rounded-full pointer-events-none" />

      {isEmpty ? (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl p-1 bg-gradient-to-tr from-brand-purple via-brand-blue to-brand-cyan shadow-2xl shadow-brand-purple/30 animate-pulse-slow">
              <div className="w-full h-full rounded-[22px] bg-dark-900 flex items-center justify-center">
                <img src="/logo.svg" alt="UMNY AI" className="w-12 h-12" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-dark-850 border border-brand-purple/50 text-[10px] text-brand-purple-light font-mono flex items-center gap-1 shadow">
              <Zap className="w-3 h-3 text-brand-cyan" />
              <span>v1.0 Ready</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Hello, {user?.name || 'Explorer'}.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mb-6 leading-relaxed">
            I am <strong className="text-slate-200">UMNY AI</strong>. Your Intelligence. Your Assistant. Your World.
            How can I assist your workflows today?
          </p>

          {/* Quick status pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-xs text-slate-400">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-dark-850 border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Model: <strong className="text-slate-200">{selectedModel}</strong></span>
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-dark-850 border border-slate-800">
              <Bot className="w-3.5 h-3.5 text-brand-purple-light" />
              <span>Agent Mode: <strong className="text-slate-200">{agentMode ? 'Enabled' : 'Standard'}</strong></span>
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-dark-850 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated User Sandbox</span>
            </span>
          </div>

          {/* Suggested Prompts Cards */}
          <SuggestedPrompts />
        </div>
      ) : (
        <MessageList />
      )}

      {/* Persistent Input Box */}
      <InputBox
        onOpenVoice={onOpenVoice}
        onOpenAttachment={onOpenAttachment}
      />
    </div>
  );
}

