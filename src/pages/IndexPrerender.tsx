// src/pages/IndexPrerender.tsx
import React from 'react';

const BASE = '/INFINITAS-ScoreViewer'; // GitHub Pages のベースパス

const IndexPrerender: React.FC = () => {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '64px 16px',
          background:
            'radial-gradient(1200px 600px at 10% -10%, rgba(99,102,241,.22), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(56,189,248,.18), transparent 55%)',
          maxWidth: 1120, margin: '0 auto'
        }}
      >
        <div style={{ display: 'inline-block', border: '1px solid #1976d2', color: '#1976d2', padding: '4px 10px', borderRadius: 20, fontWeight: 600, marginBottom: 10 }}>
          INFINITAS ScoreViewer
        </div>
        <h1 style={{ fontSize: '2rem', lineHeight: 1.3, margin: '0 0 12px', fontWeight: 800 }}>
          beatmania IIDXの <span style={{ color:'#1976d2' }}>スコア・ランプを可視化</span>
        </h1>
        <p style={{ fontSize: '1.125rem', opacity: .9, marginBottom: 20 }}>
          INFINITASデータや手動入力のデータも、ACと同様の指標で可視化。
        </p>
        <p>
          <a href={`${BASE}/register`} style={{ display:'inline-block', padding:'12px 20px', background:'#1976d2', color:'#fff', borderRadius:12, fontWeight:700, textDecoration:'none' }}>
            利用する（CSV読み込みへ）
          </a>
          <a href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer" target="_blank" rel="noreferrer" style={{ marginLeft:12 }}>
            GitHub
          </a>
        </p>
      </section>

      {/* おすすめ */}
      <section style={{ maxWidth:1120, margin:'24px auto', padding:'0 16px' }}>
        <div style={{ border:'1px solid #e0e0e0', borderRadius:12, padding:16 }}>
          <h2 style={{ marginTop:0 }}>こんな方におすすめ！</h2>
          <ul style={{ margin:'8px 0', paddingLeft:20, opacity:.9 }}>
            <li>INFINITASでもACと同様の指標（BPIなど）を使用したい</li>
            <li>ACとINFINITASをマージしたスコア状況が知りたい</li>
            <li>INFINITAS収録曲のランプ埋め状況を知りたい</li>
            <li>DPの難易度表に合わせたランプ状況を可視化したい</li>
          </ul>
        </div>
      </section>

      {/* 対応フォーマット / 指標 */}
      <section style={{ maxWidth:1120, margin:'24px auto', padding:'0 16px', display:'grid', gap:16, gridTemplateColumns:'1fr' }}>
        <div style={{ border:'1px solid #e0e0e0', borderRadius:12, padding:16 }}>
          <h3 style={{ marginTop:0 }}>対応しているデータ形式</h3>
          <ul style={{ margin:'8px 0', paddingLeft:20 }}>
            <li><a href="https://github.com/olji/Reflux" target="_blank" rel="noreferrer">Reflux TSV</a></li>
            <li><a href="https://github.com/dj-kata/inf_daken_counter_obsw" target="_blank" rel="noreferrer">INFINITAS打鍵カウンタ CSV</a></li>
            <li><a href="https://p.eagate.573.jp/game/2dx/" target="_blank" rel="noreferrer">KONAMI 公式スコアCSV</a></li>
            <li>サイトでの手動入力</li>
          </ul>
          <p style={{ opacity:.9 }}>複数形式を読み込み、最も良い結果を残せます。</p>
        </div>

        <div style={{ border:'1px solid #e0e0e0', borderRadius:12, padding:16 }}>
          <h3 style={{ marginTop:0 }}>対応している指標</h3>
          <ul style={{ margin:'8px 0', paddingLeft:20 }}>
            <li><a href="https://iidx-sp12.github.io/" target="_blank" rel="noreferrer">SP⭐︎12 難易度表</a></li>
            <li><a href="https://docs.google.com/spreadsheets/d/1e7gdUmBk3zUGSxVGC--8p6w2TIWMLBcLzOcmWoeOx6Y/edit?gid=649088745#gid=649088745" target="_blank" rel="noreferrer">SP⭐︎11 難易度表</a></li>
            <li><a href="https://cpi.makecir.com/" target="_blank" rel="noreferrer">CPI</a> / <a href="https://bpi.poyashi.me/" target="_blank" rel="noreferrer">BPI</a></li>
            <li><a href="https://bm2dx.com/IIDX/notes_radar/" target="_blank" rel="noreferrer">ノーツレーダー</a></li>
            <li><a href="https://zasa.sakura.ne.jp/dp/" target="_blank" rel="noreferrer">DP非公式難易度表</a></li>
            <li><a href="http://ereter.net/iidxsongs/analytics/combined/" target="_blank" rel="noreferrer">ereter's dp laboratory</a></li>
          </ul>
        </div>
      </section>

      {/* 利用する */}
      <section style={{ maxWidth:1120, margin:'24px auto', padding:'0 16px' }}>
        <div style={{
          marginTop:24, borderRadius:16, padding:'24px 24px',
          background:'linear-gradient(135deg, rgba(99,102,241,.1), rgba(56,189,248,.08))',
          border:'1px solid #e0e0e0'
        }}>
          <h2 style={{ marginTop:0 }}>利用する</h2>
          <p style={{ opacity:.9 }}>
            ユーザ登録不要。データはブラウザ(LocalStorage)に保存。定期的なバックアップを推奨します。
          </p>
          <p><a href={`${BASE}/register`} style={{ display:'inline-block', padding:'12px 20px', background:'#1976d2', color:'#fff', borderRadius:12, fontWeight:700, textDecoration:'none' }}>利用する（CSV読み込みへ）</a></p>
        </div>
      </section>

      {/* お問い合わせ / 注意事項 */}
      <section style={{ maxWidth:1120, margin:'24px auto', padding:'0 16px' }}>
        <div style={{ border:'1px solid #e0e0e0', borderRadius:12, padding:16 }}>
          <h2 style={{ marginTop:0 }}>お問い合わせ / 注意事項</h2>
          <p style={{ opacity:.9 }}>
            不具合報告: <a href="https://x.com/ci_public" target="_blank" rel="noreferrer">@ci_public</a> /
            <a href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer/issues" target="_blank" rel="noreferrer">Issues</a>
          </p>
          <p style={{ opacity:.9 }}>
            本サイトは非公式であり、株式会社コナミアミューズメント様とは一切関係ありません。
          </p>
        </div>
      </section>
    </div>
  );
};

export default IndexPrerender;
