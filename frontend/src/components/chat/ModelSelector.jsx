import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Cpu, Zap, Flame } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    badge: 'Fast & Smart',
    iconColor: 'text-brand-cyan',
    description: 'High-speed multimodal intelligence with large context support.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    badge: 'Deep Reasoning',
    iconColor: 'text-brand-purple',
    description: 'Deep mathematical analysis and multifaceted problem solving.',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'Flagship',
    iconColor: 'text-emerald-400',
    description: 'Omni-model reasoning with versatile text and multimodal fluency.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    badge: 'Lightweight',
    iconColor: 'text-emerald-300',
    description: 'Affordable, low-latency conversational powerhouse.',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Expert Code & Logic',
    iconColor: 'text-amber-400',
    description: 'Premier coding, architectural planning, and articulate prose.',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: 'Rapid',
    iconColor: 'text-orange-400',
    description: 'Super-fast lightweight intelligence for instant workflows.',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    provider: 'Groq',
    badge: 'Ultra-Fast & Free',
    iconColor: 'text-rose-400',
    description: 'High-speed reasoning and deep coding on Groq LPU free developer tier.',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'Groq',
    badge: 'Instant Speed',
    iconColor: 'text-pink-400',
    description: 'Ultra-low-latency real-time responses on Groq free developer tier.',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (32k)',
    provider: 'Groq',
    badge: 'High Context',
    iconColor: 'text-violet-400',
    description: 'Mixture-of-Experts architecture with 32,768 token window on Groq.',
  },
];

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const current = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-200 transition-all shadow-sm"
      >
        <Sparkles className={`w-3.5 h-3.5 ${current.iconColor}`} />
        <span className="font-semibold">{current.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal hidden sm:inline">
          {current.provider}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 md:w-80 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
            Select Active AI Provider
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-start justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-purple/20 border border-brand-purple/40 text-white'
                      : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">{model.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-400">
                        {model.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      {model.description}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5 ml-2" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

