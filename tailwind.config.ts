import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        panel: '#172033',
        slatePanel: '#172033',
        bronze: '#b78642',
        champagne: '#f4ead8',
        mint: '#dff7e8'
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.14)'
      }
    }
  },
  plugins: []
};

export default config;
