/**
 * Zatanna Design System - Tailwind CSS Configuration
 * 
 * Use this configuration in your tailwind.config.js to match the Zatanna product UI.
 * 
 * Installation:
 * 1. Copy this into your tailwind.config.js
 * 2. Ensure you have the Crimson Pro font loaded (from Google Fonts or local)
 * 3. Make sure your CSS file imports the GLOBAL_STYLES.css variables
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // Zatanna Brand Colors
        'moss-green': {
          DEFAULT: 'hsl(var(--moss-green))',
          50: 'hsl(var(--moss-green-50))',
          100: 'hsl(var(--moss-green-100))',
          200: 'hsl(var(--moss-green-200))',
          300: 'hsl(var(--moss-green-300))',
          400: 'hsl(var(--moss-green-400))',
          500: 'hsl(var(--moss-green-500))',
          900: 'hsl(var(--moss-green-900))'
        },
        'gray-cream': {
          25: 'hsl(var(--gray-cream-25))',
          50: 'hsl(var(--gray-cream-50))',
          100: 'hsl(var(--gray-cream-100))',
          200: 'hsl(var(--gray-cream-200))',
          300: 'hsl(var(--gray-cream-300))',
          400: 'hsl(var(--gray-cream-400))',
          500: 'hsl(var(--gray-cream-500))',
          900: 'hsl(var(--gray-cream-900))'
        },
        // Semantic colors for accept/reject, success/error
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          bg: 'hsl(var(--success-bg))',
          border: 'hsl(var(--success-border))'
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
          bg: 'hsl(var(--error-bg))',
          border: 'hsl(var(--error-border))'
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))'
        }
      },
      fontFamily: {
        serif: [
          'var(--font-crimson-pro)',
          'Crimson Pro',
          'serif'
        ],
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      fontSize: {
        hero: [
          '48px',
          '56px'
        ],
        section: [
          '32px',
          '40px'
        ],
        subhead: [
          '24px',
          '32px'
        ],
        body: [
          '16px',
          '24px'
        ],
        ui: [
          '14px',
          '20px'
        ],
        caption: [
          '12px',
          '16px'
        ]
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'slide-in': {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '100%': {
            transform: 'translateX(0)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out'
      }
    }
  },
  plugins: [],
}

