/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./.storybook/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DSFR Color tokens
        'blue-france': {
          DEFAULT: '#000091',
          975: '#1212ff',
          950: '#2323ff',
          925: '#3030ff',
          850: '#5e5eff',
          sun: {
            DEFAULT: '#000091',
            113: '#e3e3fd',
            425: '#8585f6',
            625: '#6a6af4',
          }
        },
        'red-marianne': {
          DEFAULT: '#e1000f',
          850: '#f95c5e',
          425: '#f93f42',
        },
        'grey': {
          DEFAULT: '#6a6a6a',
          975: '#f6f6f6',
          950: '#ececec',
          925: '#e5e5e5',
          850: '#cecece',
          200: '#3a3a3a',
          425: '#666666',
        },
      },
      spacing: {
        // DSFR spacing tokens
        '0v': '0',
        '0-5v': '0.125rem',
        '1v': '0.25rem',
        '1-5v': '0.375rem',
        '2v': '0.5rem',
        '3v': '0.75rem',
        '4v': '1rem',
        '5v': '1.25rem',
        '6v': '1.5rem',
        '7v': '1.75rem',
        '8v': '2rem',
        '9v': '2.25rem',
        '10v': '2.5rem',
        '12v': '3rem',
        '14v': '3.5rem',
        '16v': '4rem',
        '18v': '4.5rem',
        '20v': '5rem',
        '24v': '6rem',
        '28v': '7rem',
        '32v': '8rem',
      },
      fontFamily: {
        'marianne': ['Marianne', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.25rem' }],
        'sm': ['0.875rem', { lineHeight: '1.5rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      }
    },
  },
  plugins: [],
  // Important: Use a prefix or configure carefully to avoid conflicts with DSFR
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to preserve DSFR styles
  },
}
