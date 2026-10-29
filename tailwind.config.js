/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFBF7',
          100: '#FAF8F5',
          200: '#F5EFEB',
          300: '#EFE8DE',
          400: '#DFD5C4',
          500: '#C7B9A3',
        },
        plum: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#581C87',
          900: '#4A154B',
          950: '#2A0B2C',
        },
        coral: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#FF6B6B',
          600: '#F43F5E',
          700: '#E11D48',
          800: '#BE123C',
          900: '#881337',
        },
        champagne: {
          100: '#F9F5EA',
          200: '#F2E8D2',
          300: '#E4D3AB',
          400: '#D4BC83',
          500: '#C2A35C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(74, 21, 75, 0.06), 0 2px 6px -1px rgba(74, 21, 75, 0.04)',
        'elevated': '0 10px 30px -4px rgba(74, 21, 75, 0.12), 0 4px 12px -2px rgba(74, 21, 75, 0.06)',
      }
    },
  },
  plugins: [],
}

