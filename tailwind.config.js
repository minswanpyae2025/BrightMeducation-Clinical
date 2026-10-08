/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ios: {
          blue: '#007AFF',
          'blue-light': '#EBF5FF',
          'blue-soft': '#D9EDFF',
          'blue-accent': '#38B6FF',
          'blue-dark': '#0051B3',
          'bg-canvas': '#F8FAFC',
          'bg-card': '#FFFFFF',
          'card-subtle': '#F1F5F9',
          'border': '#E2E8F0',
          'border-light': '#EDF2F7',
          'text-main': '#0F172A',
          'text-secondary': '#64748B',
          'text-muted': '#94A3B8',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          purple: '#AF52DE',
          teal: '#30B0C7',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'ios-md': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'ios-lg': '0 12px 28px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'ios-sheet': '0 -8px 30px rgba(0, 0, 0, 0.08)',
        'ios-glow': '0 0 24px rgba(0, 122, 255, 0.22)',
      },
      borderRadius: {
        'ios-sm': '10px',
        'ios-md': '14px',
        'ios-lg': '20px',
        'ios-xl': '28px',
        'ios-pill': '9999px',
      },
      screens: {
        'tablet': '768px',
        'ipad': '834px',
        'ipad-pro': '1024px',
      }
    },
  },
  plugins: [],
}
