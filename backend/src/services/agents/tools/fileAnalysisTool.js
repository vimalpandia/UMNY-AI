const fileAnalysisTool = {
  name: 'file_analysis',
  description: 'Analyze extracted document text, search for data patterns, keywords, or structure.',
  parameters: {
    query: { type: 'string', description: 'What to extract or search for in the document' },
    documentContent: { type: 'string', description: 'The text content to analyze' },
  },

  async execute({ query, documentContent }) {
    if (!documentContent) {
      return 'No document text was provided for analysis.';
    }

    const words = (documentContent || '').split(/\s+/).length;
    const lines = (documentContent || '').split('\n').length;

    // Search for occurrences of query in document
    const queryLower = (query || '').toLowerCase();
    const matchingLines = (documentContent || '')
      .split('\n')
      .filter((line) => line.toLowerCase().includes(queryLower))
      .slice(0, 5);

    return JSON.stringify(
      {
        documentMetrics: { wordCount: words, lineCount: lines },
        searchQuery: query,
        matchesFound: matchingLines.length,
        relevantExcerpts: matchingLines,
      },
      null,
      2
    );
  },
};

module.exports = fileAnalysisTool;

