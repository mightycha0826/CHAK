import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 실기기(안드로이드)에서 LAN으로 접속해 콜드 탭 경로를 검증하기 위함.
    host: true,
  },
})
