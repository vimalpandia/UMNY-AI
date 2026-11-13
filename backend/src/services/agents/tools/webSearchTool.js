const axios = require('axios');
const cheerio = require('cheerio');

const webSearchTool = {
  name: 'web_search',
  description: 'Search public web sources for real-time information, news, and factual references.',
  parameters: {
    query: { type: 'string', description: 'The search query string' },
  },

  async execute({ query }) {
    if (!query) throw new Error('Search query is required.');

    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.result__body').each((i, el) => {
        if (i >= 4) return false; // top 4 results
        const title = $(el).find('.result__title a').text().trim();
        const snippet = $(el).find('.result__snippet').text().trim();
        const link = $(el).find('.result__url').text().trim();

        if (title && snippet) {
          results.push({ title, snippet, link });
        }
      });

      if (!results.length) {
        return `Web search completed for "${query}", but no public snippets were found. Proceeding with foundational knowledge.`;
      }

      return JSON.stringify(results, null, 2);
    } catch (err) {
      console.warn('[WebSearchTool Warning]:', err.message);
      return `Web search query for "${query}" completed with partial availability: ${err.message}.`;
    }
  },
};

module.exports = webSearchTool;

