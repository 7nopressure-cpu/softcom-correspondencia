/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agramont: {
          blue: '#0f4c81',     // Azul Hospitalario Primario
          navy: '#0a2e52',     // Azul Marino Oscuro
          teal: '#0d9488',     // Verde Quirúrgico / Clínico
          cyan: '#0284c7',     // Azul Acento Médico
          light: '#f8fafc',    // Fondo Clínico Suave
          accent: '#38bdf8',   // Acento Celeste
        },
        gob: {
          blue: '#0f4c81',     // Alias retrocompatible
          gold: '#0284c7',     // Alias para elementos destacados
          red: '#dc2626',      // Alertas / Urgencias
          green: '#0d9488',    // Aprobados / Atendidos
          light: '#f8fafc',
        }
      }
    },
  },
  plugins: [],
}
