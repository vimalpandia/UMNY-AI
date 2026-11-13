import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  X,
  FileText,
  Sparkles,
  Bot
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function InputBox({ onOpenVoice, onOpenAttachment }) {
  const { sendMessage, isGenerating, stopGeneration, attachments, setAttachments, agentMode } = useChat();
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [content]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!content.trim() && attachments.length === 0) || isGenerating) return;

    sendMessage(content);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attachments preview tray */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-dark-850 border border-slate-800">
          {attachments.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-900 border border-brand-purple/40 text-xs text-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="truncate max-w-[140px]">{file.name || file.filename}</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-slate-400 hover:text-rose-400 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container with gradient glow border on focus */}
      <div className="relative rounded-2xl glass-panel border border-slate-700/80 focus-within:border-brand-purple/80 focus-within:ring-2 focus-within:ring-brand-purple/30 transition-all shadow-xl bg-dark-900/80">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            agentMode
              ? 'Instruct UMNY AI Agent (Web search, documents, calculations)...'
              : 'Message UMNY AI (Enter to send, Shift+Enter for newline)...'
          }
          rows={1}
          className="w-full pl-4 pr-24 pt-3.5 pb-12 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-44 min-h-[52px]"
        />

        {/* Action icons bar inside input container */}
        <div className="absolute left-3 bottom-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenAttachment}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-purple-light hover:bg-slate-800/80 transition-colors"
            title="Attach document or file (PDF, TXT, DOCX, CSV)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenVoice}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-cyan hover:bg-slate-800/80 transition-colors"
            title="Voice Assistant (Speech-to-Text & Text-to-Speech)"
          >
            <Mic className="w-4 h-4" />
          </button>

          {agentMode && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-cyan/15 text-[10px] text-brand-cyan font-mono border border-brand-cyan/30">
              <Bot className="w-3 h-3" />
              <span>Agent</span>
            </span>
          )}
        </div>

        {/* Right send/stop button */}
        <div className="absolute right-3 bottom-2.5">
          {isGenerating ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() && attachments.length === 0}
              className={`p-2 rounded-xl text-white transition-all active:scale-95 flex items-center justify-center ${
                content.trim() || attachments.length > 0
                  ? 'bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-95 shadow-md shadow-brand-purple/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-2 text-[11px] text-slate-500">
        UMNY AI can make mistakes. Verify critical facts and research output.
      </div>
    </div>
  );
}
