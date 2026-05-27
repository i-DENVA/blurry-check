/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        skeuo: '4px 4px 0px 0px #000',
        'skeuo-sm': '2px 2px 0px 0px #000',
        'skeuo-lg': '6px 6px 0px 0px #000',
        'skeuo-xl': '8px 8px 0px 0px #000',
        'skeuo-inset': 'inset 2px 2px 6px rgba(0,0,0,0.12)',
        'skeuo-btn': '2px 2px 0px 0px #000',
        'skeuo-dark': '4px 4px 0px 0px rgba(255,255,255,0.9)',
        'skeuo-dark-sm': '2px 2px 0px 0px rgba(255,255,255,0.9)',
        'skeuo-dark-lg': '6px 6px 0px 0px rgba(255,255,255,0.9)',
        'skeuo-dark-inset': 'inset 2px 2px 6px rgba(255,255,255,0.08)',
        'skeuo-dark-btn': '2px 2px 0px 0px rgba(255,255,255,0.9)',
      },
      borderWidth: {
        3: '3px',
        4: '4px',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
