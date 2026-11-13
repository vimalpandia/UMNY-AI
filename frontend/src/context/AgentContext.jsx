import React, { createContext, useContext, useState, useEffect } from 'react';
import { agentService } from '../services/agentService';
import { useAuth } from './AuthContext';

const AgentContext = createContext();

export const AgentProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [tools, setTools] = useState([
    {
      id: 'web_search',
      name: 'Web Intelligence Search',
      description: 'Search public web resources for current real-time data and news.',
      enabled: true,
      requiresConfirmation: false,
    },
    {
      id: 'file_analysis',
      name: 'Document & Data Parser',
      description: 'Extract and analyze text, statistics, and structured patterns from PDF/DOCX/CSV.',
      enabled: true,
      requiresConfirmation: false,
    },
    {
      id: 'calculator',
      name: 'Scientific Math Engine',
      description: 'Solve complex equations, statistical calculations, and algorithmic verification.',
      enabled: true,
      requiresConfirmation: false,
    },
    {
      id: 'document_summarizer',
      name: 'Executive Synthesis',
      description: 'Generate high-density bullet summaries and key takeaways from documents.',
      enabled: true,
      requiresConfirmation: false,
    },
  ]);

  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
    }
  }, [isAuthenticated]);

  const loadConfig = async () => {
    try {
      const data = await agentService.getConfiguration();
      if (data?.enabledTools) {
        setTools((prev) =>
          prev.map((t) => ({
            ...t,
            enabled: data.enabledTools.includes(t.id),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load agent configuration:', err);
    }
  };

  const toggleTool = async (toolId) => {
    const updated = tools.map((t) =>
      t.id === toolId ? { ...t, enabled: !t.enabled } : t
    );
    setTools(updated);

    try {
      const enabledList = updated.filter((t) => t.enabled).map((t) => t.id);
      await agentService.updateConfiguration({ enabledTools: enabledList });
    } catch (err) {
      console.error('Failed to persist tool toggle:', err);
    }
  };

  const confirmToolAction = (confirmed) => {
    if (pendingConfirmation?.resolve) {
      pendingConfirmation.resolve(confirmed);
    }
    setPendingConfirmation(null);
  };

  return (
    <AgentContext.Provider
      value={{
        tools,
        toggleTool,
        pendingConfirmation,
        setPendingConfirmation,
        confirmToolAction,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

