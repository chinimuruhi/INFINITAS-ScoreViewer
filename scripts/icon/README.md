# アプリアイコン

`icon.svg`（アプリアイコン）と `favicon.svg`（タブ用・棒グラフのみ）が元データです。変更したら以下で `public/icons/` の PNG を作り直してください。

1. Chrome で `render.html` を 1024×1024 でスクリーンショットする
   ```
   chrome --headless=new --allow-file-access-from-files --window-size=1024,1024 --screenshot=icon-1024.png scripts/icon/render.html
   ```
2. `icon-1024.png` を次のサイズに縮小して `public/icons/` に置く
   - `icon-512.png`（512px、マニフェスト・マスカブル兼用）
   - `icon-192.png`（192px）
   - `apple-touch-icon.png`（180px、iPhone のホーム画面）
3. `render-favicon.html` も同様に書き出し、32px に縮小して `public/icons/favicon-32.png` に置く

文字は中央 80% の範囲に収めてください（Android で丸く切り抜かれても欠けないように）。
