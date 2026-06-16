import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta cálida / beige
        sand: '#f5efe6', // fondo base
        cream: '#fbf8f3', // tarjetas / superficies claras
        latte: '#ece2d0', // bordes / divisores suaves
        clay: '#c08552', // acento principal (acciones)
        terracotta: '#b5512f', // alertas cálidas / "salida"
        olive: '#7d8b5a', // éxito / "entrada"
        espresso: '#3b2f23', // texto fuerte / marca
        gold: '#d9a441', // acento (horas extra / avisos)
        'camp-green-light': '#8bc34a',
        'camp-green-dark': '#558b2f',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(59,47,35,0.06), 0 8px 24px -6px rgba(59,47,35,0.10)',
        'card-hover':
          '0 1px 3px rgba(59,47,35,0.08), 0 16px 32px -8px rgba(59,47,35,0.16)',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease-out forwards',
        shake: 'shake 0.4s ease-in-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
