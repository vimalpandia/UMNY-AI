const voiceController = {
  getVoiceStatus(req, res) {
    res.json({
      speechToText: {
        supportedLanguages: ['en-US', 'hi-IN'],
        engine: 'Web Speech API / Browser Native Synthesis',
        status: 'active',
      },
      textToSpeech: {
        supportedLanguages: ['en-US', 'hi-IN'],
        status: 'active',
      },
    });
  },
};

module.exports = voiceController;

