import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ISSO É O SEGREDO! Libera o acesso para todos na rede
    port: 5173,      // Garante que a porta seja sempre 5173
  }
})