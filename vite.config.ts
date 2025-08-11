import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // baseプロパティに設定する値
  let base = "/"

  // 本番時に適用させるbaseの値
  if (mode === "production") {
    base = "/INFINITAS-ScoreViewer/"
  }

  return {
    plugins: [react()],
    // アセットなどのパスを変換するベースとなるパス
    base: base,
    // ビルドの出力先
    build: {
      outDir: 'dict'
    },
    server: {
      port: 3000
    }
  };
})