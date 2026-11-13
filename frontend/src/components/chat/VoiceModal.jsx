import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Send, Globe, Radio } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function VoiceModal({ isOpen, onClose }) {
  const { sendMessage, isGenerating, messages } = useChat();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-US'); // 'en-US' or 'hi-IN'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendVoiceMessage = () => {
    if (transcript.trim()) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      sendMessage(transcript.trim());
      onClose();
    }
  };

  // Speak last assistant message
  const handleSpeakLastResponse = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistantMsg || !lastAssistantMsg.content) return;

    // Strip markdown formatting for cleaner audio
    const plainText = lastAssistantMsg.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[*_~`#\[\]]/g, '');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = language;
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="UMNY Voice Assistant" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center py-4">
        {/* Language selector pill */}
        <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-dark-850 border border-slate-800 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <button
            onClick={() => setLanguage('en-US')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              language === 'en-US' ? 'bg-brand-purple text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            English (US)
          </button>
          <button
            onClick={() => setLanguage('hi-IN')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              language === 'hi-IN' ? 'bg-brand-purple text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hindi (हिंदी)
          </button>
        </div>

        {/* Animated Microphone button */}
        <div className="relative mb-6">
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-brand-cyan/20 animate-ping" />
          )}
          <button
            onClick={toggleListening}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-rose-500/30'
                : 'bg-gradient-to-tr from-brand-purple to-brand-blue text-white shadow-brand-purple/30 hover:opacity-95'
            }`}
          >
            {isListening ? <Mic className="w-10 h-10 animate-pulse" /> : <Mic className="w-10 h-10" />}
          </button>
        </div>

        {/* Audio Wave Visualizer Bars */}
        <div className="flex items-center justify-center gap-1.5 h-10 mb-4">
          {[40, 70, 30, 90, 60, 20, 80, 50, 95, 35].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isListening
                  ? 'bg-brand-cyan animate-pulse'
                  : 'bg-slate-700 h-2'
              }`}
              style={{
                height: isListening ? `${height}%` : '8px',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Transcript Box */}
        <div className="w-full min-h-[90px] p-3 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 mb-4 text-left font-sans leading-relaxed">
          {transcript || (
            <span className="text-slate-500 italic">
              {isListening
                ? `Listening in ${language === 'hi-IN' ? 'Hindi' : 'English'}... Speak now.`
                : 'Click the microphone button to begin speaking.'}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between w-full gap-3">
          <button
            onClick={handleSpeakLastResponse}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              isSpeaking
                ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'
                : 'bg-dark-850 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="Listen to last AI response"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Speak Last Reply'}</span>
          </button>

          <button
            onClick={handleSendVoiceMessage}
            disabled={!transcript.trim()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
              transcript.trim()
                ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white hover:opacity-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to Assistant</span>
          </button>
        </div>

        {!speechSupported && (
          <div className="mt-4 text-xs text-amber-400 bg-amber-400/10 p-2 rounded-lg border border-amber-400/20">
            Note: Speech recognition is using fallback mode. Use Chrome, Edge, or a Web Speech compliant browser.
          </div>
        )}
      </div>
    </Modal>
  );
}

