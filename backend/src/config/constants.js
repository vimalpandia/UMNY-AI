module.exports = {
  MODELS: {
    GROQ_LLAMA_70B: 'llama-3.3-70b-versatile',
    GROQ_LLAMA_8B: 'llama-3.1-8b-instant',
    GROQ_MIXTRAL: 'mixtral-8x7b-32768',
    GEMINI_FLASH: 'gemini-2.5-flash',
    GEMINI_PRO: 'gemini-2.5-pro',
    GPT_4O: 'gpt-4o',
    GPT_4O_MINI: 'gpt-4o-mini',
    CLAUDE_SONNET: 'claude-3-5-sonnet',
    CLAUDE_HAIKU: 'claude-3-5-haiku',
  },
  PROVIDERS: {
    GROQ: 'groq',
    GOOGLE: 'google',
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
  },
  DEFAULT_MODEL: 'llama-3.3-70b-versatile',
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },
  FILE_LIMITS: {
    MAX_FILE_SIZE_BYTES: 15 * 1024 * 1024, // 15MB
    ALLOWED_MIME_TYPES: [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'image/png',
      'image/jpeg',
      'image/webp',
    ],
  },
};

