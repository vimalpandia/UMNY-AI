import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import { useChat } from '../../context/ChatContext';
import { Loader2 } from 'lucide-react';

export default function MessageList() {
  const { messages, loadingMessages, isGenerating, activeToolExecution } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeToolExecution]);

  if (loadingMessages) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
        <span className="text-xs">Loading conversation history...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {messages.map((msg, index) => (
        <MessageItem key={msg._id || index} message={msg} index={index} />
      ))}

      {/* Active Tool Execution Indicator */}
      {activeToolExecution && (
        <div className="max-w-3xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-mono animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Agent executing: <strong>{activeToolExecution.tool || activeToolExecution.name}</strong>...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
