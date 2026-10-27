// src/pages/IndexPrerender.tsx
import React from 'react';

const BASE = '/INFINITAS-ScoreViewer'; // GitHub Pages のベースパス

// 配色は index.html の CSS 変数（--base / --ink / --main など）を参照する
const css = `
.pr { max-width: 1200px; margin: 0 auto; padding: 40px 16px 48px; line-height: 1.7; }
.pr a { color: var(--main); text-decoration: none; }
.pr a:hover { text-decoration: underline; }
.pr .eyebrow { color: var(--ink-sub); font-size: 14px; margin: 0 0 8px; }
.pr h1 { font-size: 1.75rem; line-height: 1.35; margin: 0 0 16px; font-weight: 700; }
.pr .lead { color: var(--ink-sub); font-size: 1.0625rem; max-width: 760px; margin: 0 0 24px; }
.pr .cta { display: inline-block; padding: 10px 20px; background: var(--accent); color: var(--accent-text); border-radius: 3px; font-weight: 600; }
.pr .cta:hover { text-decoration: none; }
.pr section { border-top: 1px solid var(--line); padding: 24px 0; }
.pr h2 { font-size: 1.0625rem; margin: 0 0 12px; }
.pr ul { margin: 0; padding-left: 20px; }
`;

const IndexPrerender: React.FC = () => {
  return (
    <div className="pr">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header style={{ paddingBottom: 32 }}>
        <h1>beatmania IIDXのスコア・ランプを可視化</h1>
        <p className="lead">INFINITASや手動入力のデータも、ACと同じ指標で。</p>
        <p>
          <a className="cta" href={`${BASE}/register`}>利用する（CSV読み込みへ）</a>
          <a href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer" target="_blank" rel="noreferrer" style={{ marginLeft: 16 }}>
            GitHub
          </a>
        </p>
      </header>

      <section>
        <h2>こんな方におすすめ</h2>
        <ul>
          <li>INFINITASでもACと同様の指標（BPIなど）を使用したい</li>
          <li>ACとINFINITASをマージしたスコア状況が知りたい</li>
          <li>INFINITAS収録曲のランプ埋め状況を知りたい</li>
          <li>DPの難易度表に合わせたランプ状況を可視化したい</li>
        </ul>
      </section>

      <section>
        <h2>対応しているデータ形式</h2>
        <ul>
          <li><a href="https://github.com/olji/Reflux" target="_blank" rel="noreferrer">Reflux TSV</a></li>
          <li><a href="https://github.com/dj-kata/inf_daken_counter_obsw" target="_blank" rel="noreferrer">INFINITAS打鍵カウンタ CSV</a></li>
          <li><a href="https://github.com/kaktuswald/inf-notebook/wiki" target="_blank" rel="noreferrer">INFINITASリザルト手帳 CSV</a></li>
          <li><a href="https://p.eagate.573.jp/game/2dx/" target="_blank" rel="noreferrer">KONAMI 公式スコアCSV</a></li>
          <li>サイトでの手動入力</li>
        </ul>
      </section>

      <section>
        <h2>対応している指標</h2>
        <ul>
          <li><a href="https://iidx-sp12.github.io/" target="_blank" rel="noreferrer">SP☆12 難易度表</a></li>
          <li><a href="https://docs.google.com/spreadsheets/d/1e7gdUmBk3zUGSxVGC--8p6w2TIWMLBcLzOcmWoeOx6Y/edit?gid=649088745#gid=649088745" target="_blank" rel="noreferrer">SP☆11 難易度表</a></li>
          <li><a href="https://cpi.makecir.com/" target="_blank" rel="noreferrer">CPI</a> / <a href="https://bpi.poyashi.me/" target="_blank" rel="noreferrer">BPI</a></li>
          <li><a href="https://bm2dx.com/IIDX/notes_radar/" target="_blank" rel="noreferrer">ノーツレーダー</a></li>
          <li><a href="https://zasa.sakura.ne.jp/dp/" target="_blank" rel="noreferrer">DP非公式難易度表</a></li>
          <li><a href="http://ereter.net/iidxsongs/analytics/combined/" target="_blank" rel="noreferrer">ereter's dp laboratory</a></li>
        </ul>
      </section>

      <section>
        <h2>お問い合わせ / 注意事項</h2>
        <p style={{ margin: '0 0 8px' }}>
          不具合報告: <a href="https://x.com/ci_public" target="_blank" rel="noreferrer">@ci_public</a> /{' '}
          <a href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer/issues" target="_blank" rel="noreferrer">Issues</a>
        </p>
        <p style={{ margin: 0 }}>
          本サイトは非公式であり、株式会社コナミアミューズメント様とは一切関係ありません。
        </p>
      </section>
    </div>
  );
};

export default IndexPrerender;
