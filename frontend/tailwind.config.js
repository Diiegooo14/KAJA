/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'kaja-blue': '#2C3E50',
                'kaja-orange': '#D4770B',
                'kaja-light': '#B4D4FB'
            }
        },
    },
    plugins: [],
}