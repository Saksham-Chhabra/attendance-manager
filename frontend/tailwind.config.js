/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#2563EB', // Blue-600
          dark: '#3B82F6',  // Blue-500
        },
        bg: {
          light: '#F9FAFB', // Gray-50
          dark: '#0F172A',  // Slate-900
        },
        card: {
          light: '#FFFFFF',
          dark: '#1E293B',  // Slate-800
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          dark: '#F9FAFB',
          'dark-secondary': '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
