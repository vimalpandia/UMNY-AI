import React from 'react';
import Modal from '../common/Modal';
import { Bot, Wrench, ShieldAlert, CheckCircle2, Globe, FileText, Calculator, FileCheck2, Cpu } from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import { useChat } from '../../context/ChatContext';

export default function AgentSettingsModal({ isOpen, onClose }) {
  const { tools, toggleTool } = useAgent();
  const { agentMode, setAgentMode } = useChat();

  const getToolIcon = (id) => {
    switch (id) {
      case 'web_search':
        return Globe;
      case 'file_analysis':
        return FileText;
      case 'calculator':
        return Calculator;
      case 'document_summarizer':
        return FileCheck2;
      default:
        return Wrench;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Autonomous Agent & Tool Engine" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Master Agent Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-brand-cyan-dark/20 to-brand-purple/20 border border-brand-cyan/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan shadow">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Autonomous Agent Pipeline</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${agentMode ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-slate-800 text-slate-400'}`}>
                  {agentMode ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                When active, UMNY AI decomposes complex queries, plans execution steps, invokes tools, verifies results, and synthesizes answers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAgentMode(!agentMode)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow transition-all ${
              agentMode
                ? 'bg-brand-cyan hover:bg-brand-cyan-light text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {agentMode ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        {/* Enabled Tools List */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Available Modular Agent Tools
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((tool) => {
              const Icon = getToolIcon(tool.id);
              return (
                <div
                  key={tool.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    tool.enabled
                      ? 'bg-dark-850/80 border-slate-700 hover:border-brand-purple/60 shadow-sm'
                      : 'bg-dark-900/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-brand-cyan" />
                      <span className="text-xs font-semibold text-slate-200">{tool.name}</span>
                    </div>
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                        tool.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tool.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Safety Guardrails */}
        <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800/80 text-xs text-slate-400 space-y-1.5 font-sans">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Strict Agent Guardrails & Safety Architecture</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>Execution timeout of 60 seconds per agent cycle to prevent runaways.</li>
            <li>Maximum tool calling depth limited to 5 recursive steps per turn.</li>
            <li>No arbitrary shell, terminal, or OS host executions are permitted.</li>
            <li>Side effects (destructive changes, external email/purchases) require interactive prompt confirmation.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}

