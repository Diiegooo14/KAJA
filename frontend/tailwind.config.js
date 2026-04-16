/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'kaja-blue': '#B8D4F8',
                'kaja-amber': '#D4770B',
                'kaja-navy': '#2C3E50',
                'kaja-light': '#F0F6FF',
            },
            keyframes: {
                'fade-in': {
                    '0%':   { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.2s ease-out',
            },
        },
    },
    plugins: [],
}