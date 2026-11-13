import React from 'react';
import { Menu, Sun, Moon, Sparkles, Bot, Zap, Cpu } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import ModelSelector from '../chat/ModelSelector';

export default function Header({ onToggleSidebar, onOpenSettings, onOpenAgentTools }) {
  const { isDark, toggleTheme } = useTheme();
  const { agentMode, setAgentMode, selectedModel } = useChat();

  return (
    <header className="h-14 border-b border-slate-800/80 bg-dark-900/60 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector in Header */}
        <ModelSelector />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Agent Mode Toggle Pill */}
        <button
          onClick={() => setAgentMode(!agentMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
            agentMode
              ? 'bg-gradient-to-r from-brand-cyan-dark to-brand-cyan text-white shadow-brand-cyan/20 ring-1 ring-brand-cyan'
              : 'bg-dark-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
          }`}
          title="Toggle autonomous agent workflow & tool execution"
        >
          <Bot className={`w-3.5 h-3.5 ${agentMode ? 'text-white animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Agent Mode</span>
          <span className={`text-[10px] px-1 rounded ${agentMode ? 'bg-black/30' : 'bg-slate-800'}`}>
            {agentMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
}
