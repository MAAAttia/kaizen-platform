/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F6F4',
        ink: '#1B2421',
        evergreen: {
          DEFAULT: '#1F4D3D',
          dark: '#163829',
          light: '#2E6B55',
        },
        spark: {
          DEFAULT: '#D97B29',
          light: '#F0A35C',
        },
        mist: '#DCE3DD',
        steel: '#2D6E8E',
        brick: '#B23A34',
        slate: {
          50: '#F7F8F7',
          400: '#8A938C',
          500: '#6B7570',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
