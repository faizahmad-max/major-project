/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          950: '#080b11', // Deepest background
          900: '#0d111a', // Panel base
          850: '#121722', // Sub-panel / card
          800: '#181f2e', // Elevated cards / hover
          750: '#1f283c', // Border active
          700: '#28344d', // Border primary
          600: '#3d4d70', // Border secondary / muted
          500: '#5a6e99',
        },
        cyber: {
          blue: '#0284c7',
          cyan: '#0ea5e9',
          teal: '#14b8a6',
          green: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          red: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace']
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.9rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.2rem' }],
      }
    },
  },
  plugins: [],
}
