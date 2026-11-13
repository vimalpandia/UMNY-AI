const webSearchTool = require('./tools/webSearchTool');
const calculatorTool = require('./tools/calculatorTool');
const fileAnalysisTool = require('./tools/fileAnalysisTool');
const summarizerTool = require('./tools/summarizerTool');

class AgentService {
  constructor() {
    this.tools = new Map();
    this.registerTool(webSearchTool);
    this.registerTool(calculatorTool);
    this.registerTool(fileAnalysisTool);
    this.registerTool(summarizerTool);
  }

  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  getAvailableTools() {
    return Array.from(this.tools.values()).map((t) => ({
      id: t.name,
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  /**
   * Detects intent and selects candidate tools based on prompt content
   */
  detectToolsNeeded(prompt = '', attachments = []) {
    const needed = [];
    const lower = prompt.toLowerCase();

    // Check for web search triggers
    if (
      lower.includes('search') ||
      lower.includes('news') ||
      lower.includes('latest') ||
      lower.includes('who is') ||
      lower.includes('what is the price') ||
      lower.includes('current') ||
      lower.includes('weather') ||
      lower.includes('look up')
    ) {
      needed.push({
        tool: 'web_search',
        input: { query: prompt.replace(/search for|look up|search/gi, '').trim() || prompt },
      });
    }

    // Check for math / calculation triggers
    if (
      lower.includes('calculate') ||
      lower.includes('sqrt') ||
      lower.includes('compute') ||
      lower.includes('% of') ||
      /(\d+\s*[\+\-\*\/]\s*\d+)/.test(prompt)
    ) {
      const match = prompt.match(/([0-9\.\s\+\-\*\/\(\)\^%sqrt]+)/);
      needed.push({
        tool: 'calculator',
        input: { expression: match ? match[0].trim() : prompt },
      });
    }

    // Check for file analysis triggers
    if (attachments && attachments.length > 0) {
      const doc = attachments[0];
      if (lower.includes('summar') || lower.includes('key points') || lower.includes('takeaway')) {
        needed.push({
          tool: 'document_summarizer',
          input: { text: doc.textExtract || doc.name },
        });
      } else {
        needed.push({
          tool: 'file_analysis',
          input: { query: prompt, documentContent: doc.textExtract || '' },
        });
      }
    }

    return needed;
  }

  /**
   * Executes tools safely with timeouts and guardrails
   */
  async executePlan(plannedTools = [], onToolProgress) {
    const results = [];
    const maxSteps = 5;
    const toolsToRun = plannedTools.slice(0, maxSteps);

    for (const item of toolsToRun) {
      const toolInstance = this.tools.get(item.tool);
      if (!toolInstance) continue;

      if (onToolProgress) {
        onToolProgress({
          type: 'tool',
          name: item.tool,
          tool: item.tool,
          status: 'running',
          input: item.input,
        });
      }

      try {
        // Enforce 15 second execution timeout per tool
        const output = await Promise.race([
          toolInstance.execute(item.input),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tool execution timed out (15s)')), 15000)
          ),
        ]);

        const record = {
          tool: item.tool,
          name: item.tool,
          input: item.input,
          output,
          status: 'completed',
          executedAt: new Date(),
        };

        results.push(record);

        if (onToolProgress) {
          onToolProgress({
            type: 'tool',
            name: item.tool,
            tool: item.tool,
            status: 'completed',
            input: item.input,
            output,
          });
        }
      } catch (err) {
        const errorRecord = {
          tool: item.tool,
          name: item.tool,
          input: item.input,
          output: `Execution error: ${err.message}`,
          status: 'failed',
          executedAt: new Date(),
        };
        results.push(errorRecord);

        if (onToolProgress) {
          onToolProgress({
            type: 'tool',
            name: item.tool,
            tool: item.tool,
            status: 'failed',
            input: item.input,
            output: errorRecord.output,
          });
        }
      }
    }

    return results;
  }

  formatToolOutputsForContext(toolResults = []) {
    if (!toolResults.length) return '';

    const blocks = toolResults.map((r, idx) => {
      return `[TOOL ${idx + 1}: ${r.tool.toUpperCase()}]\nInput: ${JSON.stringify(r.input)}\nResult:\n${typeof r.output === 'string' ? r.output : JSON.stringify(r.output, null, 2)}`;
    });

    return `\n\n[VERIFIED AGENT TOOL RESULTS]:\n${blocks.join('\n\n')}\n(Use these tool results to formulate your factual, insightful answer.)\n`;
  }
}

module.exports = new AgentService();

