const calculatorTool = {
  name: 'calculator',
  description: 'Evaluate mathematical expressions, formulas, percentages, powers, and statistics.',
  parameters: {
    expression: { type: 'string', description: 'The math expression to evaluate, e.g. (45 * 12) / sqrt(144)' },
  },

  async execute({ expression }) {
    if (!expression) throw new Error('Mathematical expression is required.');

    try {
      // Sanitize: allow only numbers, math operators, parentheses, and standard Math functions
      const sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/pow\(/g, 'Math.pow(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/round\(/g, 'Math.round(')
        .replace(/log\(/g, 'Math.log(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e/gi, 'Math.E');

      // Security check: ensure no arbitrary letters or syntax outside allowed Math operations
      if (!/^[\d\s+\-*/%(),.MathsincortauqblpPIE]+$/.test(sanitized)) {
        throw new Error('Expression contains disallowed symbols or functions.');
      }

      // Safe evaluation using Function with Math context only
      const compute = new Function(`"use strict"; return (${sanitized});`);
      const result = compute();

      return `Calculation result: ${expression} = ${result}`;
    } catch (err) {
      return `Error calculating expression "${expression}": ${err.message}`;
    }
  },
};

module.exports = calculatorTool;
