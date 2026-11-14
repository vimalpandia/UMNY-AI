import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedModel, setSelectedModelState] = useState(() => {
    const saved = localStorage.getItem('umny_selected_model');
    const deprecated = ['llama-3.3-70b-versatile', 'gemini-2.5-flash', 'gemini-2.5-pro', 'groq/compound'];
    if (saved && !deprecated.includes(saved)) {
      return saved;
    }
    return 'llama-3.1-8b-instant';
  });

  const setSelectedModel = (model) => {
    const deprecated = ['llama-3.3-70b-versatile', 'groq/compound'];
    const safeModel = deprecated.includes(model) ? 'llama-3.1-8b-instant' : model;
    setSelectedModelState(safeModel);
    try {
      localStorage.setItem('umny_selected_model', safeModel);
    } catch {}
  };
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeToolExecution, setActiveToolExecution] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentMode, setAgentMode] = useState(false);

  const abortControllerRef = useRef(null);

  // Load conversations on auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const loadConversations = async (search = '') => {
    try {
      setLoadingConversations(true);
      const data = await chatService.getConversations(search);
      setConversations(data);
      // If we don't have an active conversation, select the most recent one if available
      if (!activeConversationId && data.length > 0) {
        setActiveConversationId(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const createNewChat = async (model = selectedModel) => {
    try {
      const newConv = await chatService.createConversation('New Chat', model);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv._id);
      setMessages([]);
      return newConv;
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const deleteConversation = async (id) => {
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c._id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0]._id : null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const updateConversationTitle = async (id, title) => {
    try {
      const updated = await chatService.updateConversation(id, { title });
      setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, title } : c)));
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const sendMessage = async (content, fileAttachments = attachments) => {
    if (!content.trim() && fileAttachments.length === 0) return;
    if (isGenerating) return;

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      // Auto-create conversation if none exists
      const newConv = await createNewChat(selectedModel);
      if (!newConv) return;
      targetConvId = newConv._id;
    }

    // Temporary optimistic user message
    const tempUserMsg = {
      _id: 'temp-user-' + Date.now(),
      conversationId: targetConvId,
      role: 'user',
      content,
      attachments: fileAttachments,
      model: selectedModel,
      createdAt: new Date().toISOString(),
    };

    // Placeholder assistant message for streaming
    const tempAssistantMsgId = 'temp-assistant-' + Date.now();
    const tempAssistantMsg = {
      _id: tempAssistantMsgId,
      conversationId: targetConvId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      createdAt: new Date().toISOString(),
      isStreaming: true,
      toolCalls: [],
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setAttachments([]); // Clear input attachments
    setIsGenerating(true);
    setActiveToolExecution(null);

    abortControllerRef.current = new AbortController();

    try {
      await chatService.streamMessage(
        {
          conversationId: targetConvId,
          content,
          model: selectedModel,
          attachments: fileAttachments,
          agentMode,
        },
        {
          signal: abortControllerRef.current.signal,
          onChunk: (chunkText) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantMsgId
                  ? { ...msg, content: msg.content + chunkText }
                  : msg
              )
            );
          },
          onToolCall: (toolData) => {
            setActiveToolExecution(toolData);
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantMsgId
                  ? {
                      ...msg,
                      toolCalls: [...(msg.toolCalls || []), toolData],
                    }
                  : msg
              )
            );
          },
          onDone: (finalMessage) => {
            setActiveToolExecution(null);
            setIsGenerating(false);
            if (finalMessage) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempAssistantMsgId ? finalMessage : msg
                )
              );
            } else {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempAssistantMsgId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
            }
            // Update conversation list in case title was auto-generated
            loadConversations();
          },
          onError: (err) => {
            setActiveToolExecution(null);
            setIsGenerating(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantMsgId
                  ? {
                      ...msg,
                      isStreaming: false,
                      error: true,
                      content:
                        msg.content ||
                        `An error occurred while generating the response: ${err.message}`,
                    }
                  : msg
              )
            );
          },
        }
      );
    } catch (err) {
      console.error('Error during send message stream:', err);
      setIsGenerating(false);
      setActiveToolExecution(null);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setActiveToolExecution(null);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  const regenerateResponse = async (messageIndex) => {
    if (isGenerating) return;
    // Find preceding user message
    let precedingUserMsg = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        precedingUserMsg = messages[i];
        break;
      }
    }
    if (precedingUserMsg) {
      // Remove assistant message and re-send
      setMessages((prev) => prev.slice(0, messageIndex));
      await sendMessage(precedingUserMsg.content, precedingUserMsg.attachments);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        loadingConversations,
        loadingMessages,
        selectedModel,
        setSelectedModel,
        isGenerating,
        activeToolExecution,
        attachments,
        setAttachments,
        searchQuery,
        setSearchQuery,
        agentMode,
        setAgentMode,
        createNewChat,
        deleteConversation,
        updateConversationTitle,
        sendMessage,
        stopGeneration,
        regenerateResponse,
        loadConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

