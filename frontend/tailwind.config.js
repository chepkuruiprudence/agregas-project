cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AGREGAS Brand Colors
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#c7dffd',
          300: '#a3cbfc',
          400: '#7eb3f9',
          500: '#0066ff',  // Bright Blue (main)
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001f3f',  // Dark Navy
        },
        accent: {
          light: '#00ccff',   // Light Cyan
          bright: '#0066ff',  // Bright Blue
          dark: '#001f3f',    // Dark Navy
        },
        teal: {
          50: '#f0fffe',
          500: '#00d4d4',
          600: '#00a8a8',
          700: '#007c7c',
        },
        violet: {
          50: '#f8f5ff',
          500: '#7f77dd',
          600: '#6b63d1',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-violet-teal': 'linear-gradient(135deg, #7f77dd 0%, #00d4d4 100%)',
        'gradient-blue-navy': 'linear-gradient(135deg, #0066ff 0%, #001f3f 100%)',
      },
    },
  },
  plugins: [],
}
EOF