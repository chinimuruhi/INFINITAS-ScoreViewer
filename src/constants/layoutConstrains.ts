// 画面下のナビゲーションバーの高さ（本文の下余白・通知の位置にも使う）
export const bottomNavHeight = 56;

// 下部ナビを出す条件（いずれかに当てはまれば出す）
//   - ホーム画面から起動している（アプリとしてインストール済み）
//   - 主な操作が指（スマホ・タブレット）。画面の大きいスマホも拾えるよう、幅だけでは判定しない
//   - 画面幅が 960px 未満（PC のブラウザを細くしたとき）
export const bottomNavQuery = '(display-mode: standalone), (pointer: coarse), (max-width: 959.95px)';
export const bottomNavMedia = `@media ${bottomNavQuery}`;
