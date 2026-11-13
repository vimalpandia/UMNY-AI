import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Edit2,
  AlertTriangle,
  Bot,
  User,
  Wrench,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { useChat } from '../../context/ChatContext';

export default function MessageItem({ message, index }) {
  const { regenerateResponse, sendMessage, isGenerating } = useChat();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const [showToolDetails, setShowToolDetails] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.content) {
      setIsEditing(false);
      sendMessage(editText.trim());
    } else {
      setIsEditing(false);
    }
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`group w-full py-4 px-3 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-dark-900/40 border-y border-slate-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-md shadow-brand-purple/20">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple via-brand-blue to-brand-cyan flex items-center justify-center text-white shadow-md shadow-brand-cyan/20 ring-1 ring-brand-purple/40">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-slate-200">
                {isUser ? 'You' : 'UMNY AI'}
              </span>
              {!isUser && message.model && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {message.model}
                </span>
              )}
              {formattedTime && (
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formattedTime}
                </span>
              )}
            </div>
          </div>

          {/* Attached Files if present */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-850 border border-slate-700/60 text-xs text-brand-cyan"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[160px]">{file.name || file.filename || 'Document'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tool execution badge / accordion if present */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mb-3 rounded-xl border border-brand-cyan/30 bg-dark-900/90 overflow-hidden text-xs">
              <button
                onClick={() => setShowToolDetails(!showToolDetails)}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-brand-cyan/10 hover:bg-brand-cyan/15 transition-colors text-brand-cyan font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Agent executed {message.toolCalls.length} tool(s)</span>
                </div>
                {showToolDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showToolDetails && (
                <div className="p-3 space-y-2 border-t border-slate-800 bg-dark-950 font-mono text-[11px] text-slate-300">
                  {message.toolCalls.map((tc, idx) => (
                    <div key={idx} className="p-2 rounded bg-dark-900 border border-slate-800">
                      <div className="font-semibold text-brand-cyan-light mb-1">Tool: {tc.tool || tc.name}</div>
                      {tc.input && (
                        <div className="text-slate-400 mb-1">
                          <span className="text-slate-500">Query / Input: </span>
                          {typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input)}
                        </div>
                      )}
                      {tc.output && (
                        <div className="text-slate-300">
                          <span className="text-slate-500">Output Summary: </span>
                          <span className="text-emerald-400">{typeof tc.output === 'string' ? tc.output : JSON.stringify(tc.output)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message Body */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-dark-850 border border-brand-purple focus:outline-none text-sm text-slate-100"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded-lg bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-medium"
                >
                  Save & Resend
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-100">
              {message.error ? (
                <div className="flex items-center gap-2 text-rose-400 text-sm p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{message.content}</span>
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}

              {/* Streaming Cursor */}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-brand-cyan animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Action Toolbar on Hover */}
          {!message.isStreaming && (
            <div className="flex items-center gap-2 mt-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-xs">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 p-1 hover:text-white rounded hover:bg-slate-800/60"
                title="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {isUser && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 p-1 hover:text-white rounded hover:bg-slate-800/60"
                  title="Edit message"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Edit</span>
                </button>
              )}

              {isAssistant && !isGenerating && (
                <button
                  onClick={() => regenerateResponse(index)}
                  className="flex items-center gap-1 p-1 hover:text-white rounded hover:bg-slate-800/60"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

