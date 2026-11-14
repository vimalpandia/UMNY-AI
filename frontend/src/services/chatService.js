import api, { getApiBaseUrl } from './api';

export const chatService = {
  async getConversations(search = '') {
    const params = search ? { search } : {};
    const res = await api.get('/conversations', { params });
    return res.data;
  },

  async createConversation(title = 'New Chat', selectedModel = 'llama-3.3-70b-versatile') {
    const res = await api.post('/conversations', { title, selectedModel });
    return res.data;
  },

  async getConversation(id) {
    const res = await api.get(`/conversations/${id}`);
    return res.data;
  },

  async updateConversation(id, updates) {
    const res = await api.put(`/conversations/${id}`, updates);
    return res.data;
  },

  async deleteConversation(id) {
    const res = await api.delete(`/conversations/${id}`);
    return res.data;
  },

  async getMessages(conversationId) {
    const res = await api.get(`/messages/${conversationId}`);
    return res.data;
  },

  /**
   * Send a message and stream the response via Fetch + ReadableStream
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.content
   * @param {string} params.model
   * @param {Array} [params.attachments]
   * @param {boolean} [params.agentMode]
   * @param {Function} onChunk - callback for incoming text chunks
   * @param {Function} onToolCall - callback when agent calls a tool
   * @param {Function} onDone - callback on completion with full message object
   * @param {Function} onError - callback on error
   * @param {AbortSignal} signal - signal to cancel generation
   */
  async streamMessage({ conversationId, content, model, attachments = [], agentMode = false }, { onChunk, onToolCall, onDone, onError, signal }) {
    const token = localStorage.getItem('umny_token');
    const baseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          conversationId,
          content,
          model,
          attachments,
          agentMode
        }),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete part in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') {
              continue;
            }
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'chunk' && onChunk) {
                onChunk(data.text);
              } else if (data.type === 'tool' && onToolCall) {
                onToolCall(data);
              } else if (data.type === 'complete' && onDone) {
                onDone(data.message);
              } else if (data.type === 'error' && onError) {
                onError(new Error(data.message));
              }
            } catch (err) {
              console.error('Failed to parse SSE line:', jsonStr, err);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        onError?.(err);
      }
    }
  }
};

