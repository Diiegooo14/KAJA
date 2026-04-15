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
            }
        },
    },
    plugins: [],
}