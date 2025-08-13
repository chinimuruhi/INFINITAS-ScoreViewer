import React from 'react';
import { renderToString } from 'react-dom/server';
import IndexPrerender from './pages/IndexPrerender';

import helmetPkg from 'react-helmet-async';
const { Helmet, HelmetProvider } = helmetPkg as any;

const HeadMeta: React.FC = () => (
  <Helmet>
    <title>INFINITAS Score Viewer | IIDXスコア可視化ツール</title>
    <meta name="description" content="beatmania IIDXのスコア・ランプを可視化。INFINITASデータや手動入力のデータも、ACと同様の指標を使用可能に" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="https://chinimuruhi.github.io/INFINITAS-ScoreViewer/" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="INFINITAS Score Viewer" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:title" content="INFINITAS Score Viewer" />
    <meta property="og:description" content="beatmania IIDXのスコア・ランプを可視化。INFINITASデータや手動入力のデータも、ACと同様の指標を使用可能に" />
    <meta property="og:url" content="https://chinimuruhi.github.io/INFINITAS-ScoreViewer/" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="INFINITAS Score Viewer" />
    <meta
      name="twitter:description"
      content="beatmania IIDXのスコア・ランプを可視化。INFINITASデータや手動入力のデータも、ACと同様の指標を使用可能に。"
    />
  </Helmet>
);

const JsonLd: React.FC = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "INFINITAS Score Viewer",
        applicationCategory: "WebApplication",
        operatingSystem: "Web",
        inLanguage: "ja",
        url: "https://chinimuruhi.github.io/INFINITAS-ScoreViewer/",
        description: "beatmania IIDXのスコア・ランプを可視化。INFINITASデータや手動入力のデータも、ACと同様の指標を使用可能に",
        author: { "@type": "Person", name: "chinimuruhi" }
      })
    }}
  />
);

export async function render() {
  const helmetContext: any = {};
  const app = (
    <HelmetProvider context={helmetContext}>
      <HeadMeta />
      <IndexPrerender />
      <JsonLd />
    </HelmetProvider>
  );

  const html = renderToString(app);
  const { helmet } = helmetContext;
  const head =
    (helmet?.title?.toString?.() ?? '') +
    (helmet?.meta?.toString?.() ?? '') +
    (helmet?.link?.toString?.() ?? '');
  const jsonld = renderToString(<JsonLd />);

  return { html, head, jsonld };
}
