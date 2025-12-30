/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#101922",
        "primary-light": "#1a2a3a",
        "primary-lighter": "#243a4a",
        "primary-pale": "#2d4a5a",
        "primary-lightest": "#365a6a",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "text-light-primary": "#2D3748",
        "text-light-secondary": "#A0AEC0",
        "text-dark-primary": "#E2E8F0",
        "text-dark-secondary": "#A0AEC0",
        "border-light": "#E2E8F0",
        "border-dark": "#2D3748",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1A202C",
        "status-green": "#48BB78",
        "status-yellow": "#F6AD55",
        "status-red": "#E53E3E"
      },
      fontFamily: {
        "display": ["Public Sans", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
