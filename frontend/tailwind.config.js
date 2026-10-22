/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#F4F1EA',
          forest: '#102A1E',
          forestDark: '#0A1C14',
          orange: '#EF5313',
          orangeDark: '#D4440B',
          pastelYellow: '#F4E77E',
          pastelPink: '#FFAAA5',
          vibrantCyan: '#6FE3EF',
          charcoal: '#0B130E',
          line: '#18241D',
          surfaceLight: '#FAF8F4',
        },
        surface: {
          DEFAULT: '#FCF9F2',
          dim: '#DCDAD3',
          bright: '#FCF9F2',
          container: '#F1EEE7',
          'container-low': '#F6F3EC',
          'container-high': '#EBE8E1',
          'container-highest': '#E5E2DB',
        },
        'on-surface': '#1C1C18',
        'on-surface-variant': '#424844',
        outline: '#727973',
        'outline-variant': '#C2C8C2',
        primary: {
          DEFAULT: '#00140A',
          container: '#102A1E',
          'on-container': '#779382',
        },
        'on-primary': '#FFFFFF',
        secondary: {
          DEFAULT: '#A93800',
          container: '#FE6422',
          'on-container': '#581900',
        },
        'tertiary-fixed': '#F2E57A',
        'on-tertiary-fixed': '#1F1C00',
        error: {
          DEFAULT: '#BA1A1A',
          container: '#FFDAD6',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Syne', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        display: ['Syne', 'Space Grotesk', 'sans-serif'],
        body: ['Chivo', 'Space Grotesk', 'sans-serif'],
      },
      borderWidth: {
        '1': '1px',
        '1.5': '1.5px',
        '2': '2px',
        '3': '3px',
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.75rem',
        'space-xl': '3rem',
        'margin': '2.5rem',
      },
    },
  },
  plugins: [],
}
