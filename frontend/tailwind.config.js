/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090e',
          900: '#0b0f17',
          850: '#111726',
          800: '#172033',
          750: '#1e2942',
          700: '#253352',
          600: '#384970',
        },
        brand: {
          purple: '#8b5cf6',
          'purple-dark': '#6d28d9',
          'purple-light': '#a78bfa',
          blue: '#3b82f6',
          'blue-dark': '#1d4ed8',
          'blue-light': '#60a5fa',
          cyan: '#06b6d4',
          'cyan-dark': '#0e7490',
          'cyan-light': '#22d3ee',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)' },
        }
      }
    },
  },
  plugins: [],
};

