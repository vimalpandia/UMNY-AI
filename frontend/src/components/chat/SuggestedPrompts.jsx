import React from 'react';
import { Cpu, Code2, FileSpreadsheet, Globe2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function SuggestedPrompts() {
  const { sendMessage } = useChat();

  const prompts = [
    {
      icon: Cpu,
      title: 'Deep Architecture & Design',
      prompt: 'Design an event-driven microservices architecture with Kafka, resilient caching, and distributed tracing.',
      color: 'from-purple-500/20 to-blue-500/10 border-purple-500/30 text-purple-400',
    },
    {
      icon: Code2,
      title: 'Algorithmic Optimization',
      prompt: 'Review a high-throughput concurrency pipeline in Node.js and suggest optimizations to eliminate bottlenecks.',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    },
    {
      icon: FileSpreadsheet,
      title: 'Document & Data Analysis',
      prompt: 'Analyze structured enterprise records, identify statistical anomalies, and summarize executive findings.',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      icon: Globe2,
      title: 'Autonomous Web Research',
      prompt: 'Perform an in-depth web intelligence search on recent breakthroughs in autonomous multi-agent systems.',
      color: 'from-cyan-500/20 to-indigo-500/10 border-cyan-500/30 text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mx-auto px-4 mt-6">
      {prompts.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            onClick={() => sendMessage(item.prompt)}
            className={`flex flex-col text-left p-3.5 rounded-2xl bg-gradient-to-br ${item.color} border hover:border-slate-500/60 glass-panel hover:bg-dark-850/80 transition-all duration-200 group active:scale-[0.99]`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="font-semibold text-xs text-slate-100 group-hover:text-white">
                {item.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
              {item.prompt}
            </p>
          </button>
        );
      })}
    </div>
  );
}
