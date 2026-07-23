import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    // 실기기(안드로이드)에서 LAN으로 붙어 착 읽기를 검증하기 위함.
    // 단 LAN의 http는 보안 컨텍스트가 아니라 Web NFC가 거부된다 —
    // 실물 착을 읽으려면 HTTPS 배포나 Chrome의 보안 오리진 예외가 필요하다.
    host: true,
  },
})