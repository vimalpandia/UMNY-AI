import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import SettingsModal from '../settings/SettingsModal';
import MemoryModal from '../memory/MemoryModal';
import AgentSettingsModal from '../agent/AgentSettingsModal';
import AdminDashboard from '../admin/AdminDashboard';
import VoiceModal from '../chat/VoiceModal';
import AttachmentPicker from '../chat/AttachmentPicker';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isAgentToolsOpen, setIsAgentToolsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-950 font-sans text-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenAgentTools={() => setIsAgentToolsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAgentTools={() => setIsAgentToolsOpen(true)}
        />

        <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden relative">
          {React.cloneElement(children, {
            onOpenVoice: () => setIsVoiceOpen(true),
            onOpenAttachment: () => setIsAttachmentOpen(true),
          })}
        </main>
      </div>

      {/* Global Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <MemoryModal isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
      <AgentSettingsModal isOpen={isAgentToolsOpen} onClose={() => setIsAgentToolsOpen(false)} />
      <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <VoiceModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
      <AttachmentPicker isOpen={isAttachmentOpen} onClose={() => setIsAttachmentOpen(false)} />
    </div>
  );
}

