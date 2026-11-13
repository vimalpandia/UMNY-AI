import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { UploadCloud, FileText, Image, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { fileService } from '../../services/fileService';
import { useChat } from '../../context/ChatContext';

export default function AttachmentPicker({ isOpen, onClose }) {
  const { setAttachments } = useChat();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedPreview, setExtractedPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15MB limit.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setExtractedPreview(null);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      const result = await fileService.uploadFile(selectedFile);
      setExtractedPreview(result);

      // Add to attachments in ChatContext
      setAttachments((prev) => [
        ...prev,
        {
          id: result._id,
          name: result.originalName || selectedFile.name,
          mimeType: result.mimeType,
          size: result.size,
          textExtract: result.extractedText || '',
          storageKey: result.storageKey,
        },
      ]);

      // Close modal after a moment so user sees success
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setExtractedPreview(null);
      }, 800);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attach Document or Data File" maxWidth="max-w-lg">
      <div className="py-2 space-y-4">
        {/* Upload dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-brand-purple/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-dark-900/50 hover:bg-dark-850/60"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt,.docx,.csv,image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-slate-200">
            {selectedFile ? selectedFile.name : 'Click to browse or drop document'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Supports PDF, DOCX, TXT, CSV, and Images (max 15MB)
          </span>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-850 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-brand-cyan shrink-0" />
              <span className="truncate font-medium">{selectedFile.name}</span>
              <span className="text-slate-500">
                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-slate-400 hover:text-rose-400 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {extractedPreview && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Document processed and attached! Ready for prompt.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadAndAnalyze}
            disabled={!selectedFile || uploading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all ${
              selectedFile && !uploading
                ? 'bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-95 shadow-md shadow-brand-purple/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting Text & Indexing...</span>
              </>
            ) : (
              <span>Attach & Process</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
