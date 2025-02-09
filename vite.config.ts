import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

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
    // index.html の場所
    root: 'src',
    // 静的ファイルの場所
    publicDir: 'public',
    // ビルドの出力先
    build: {
      outDir: 'dict'
    }
  };
})