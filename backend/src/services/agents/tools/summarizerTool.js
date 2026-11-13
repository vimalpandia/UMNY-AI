const summarizerTool = {
  name: 'document_summarizer',
  description: 'Produce high-density executive summaries, key bullet takeaways, and action items from text.',
  parameters: {
    text: { type: 'string', description: 'The text content to summarize' },
  },

  async execute({ text }) {
    if (!text || text.trim().length === 0) {
      return 'No text provided to summarize.';
    }

    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const keyPoints = sentences.slice(0, 4);

    return JSON.stringify(
      {
        summaryType: 'Executive Summary Excerpt',
        pointsExtracted: keyPoints.length,
        highlights: keyPoints,
      },
      null,
      2
    );
  },
};

module.exports = summarizerTool;

