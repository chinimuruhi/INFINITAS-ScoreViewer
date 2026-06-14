import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

export default defineConfig(({ mode, isSsrBuild }) => {
  // baseプロパティに設定する値
  let base = "/"

  // 本番時に適用させるbaseの値
  if (mode === "production") {
    base = "/INFINITAS-ScoreViewer/"
  }

  return {
    plugins: [
      react(),
      sitemap({
        hostname: 'https://chinimuruhi.github.io/INFINITAS-ScoreViewer',
        outDir: 'dist',
        basePath: "/INFINITAS-ScoreViewer",
        exclude: ['/404', '/google9de41a3cfb1f4454'],
      }),
    ],
    // アセットなどのパスを変換するベースとなるパス
    base,
    // ビルドの出力先
    build: {
      outDir: 'dist',
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: isSsrBuild ? undefined : {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'vendor-recharts': ['recharts'],
            'vendor-pako': ['pako'],
          },
        },
      },
    },
    define: {
      'process.env.BASE_URL': JSON.stringify(base),
    },
    server: {
      port: 3000
    }
  };
})