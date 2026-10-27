// src/pages/Index.tsx
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Link as MuiLink,
  Stack,
} from '@mui/material';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { Link as RouterLink } from 'react-router-dom';

const updates: { date: string; text: string }[] = [
  { date: '2026/6/15', text: '主に表示に関する軽微な修正' },
  { date: '2026/5/21', text: 'フィルタ状態をlocalstrageに保存するように（提供：laskarina様）' },
  { date: '2025/10/20', text: 'リザルト手帳CSVに対応' },
  { date: '2025/10/2', text: 'BPI定義データの設定を追加' },
  { date: '2025/9/23', text: '譜面難易度のフィルタを追加（提供：leno3s様）' },
  { date: '2025/8/17', text: 'Google Driveへのエクスポート / インポート機能の追加' },
  { date: '2025/8/15', text: '楽曲一覧ページの追加、その他軽微な修正' },
  { date: '2025/8/13', text: 'ノーツレーダー計算不具合修正、ACとINFで譜面が異なる楽曲対応、その他軽微な修正' },
  { date: '2025/8/12', text: 'サイト公開' },
];

const Index: React.FC = () => {
  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      {/* 導入 */}
      <Box component="header" sx={{ maxWidth: 760, pb: { xs: 4, md: 5 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          INFINITAS Score Viewer
        </Typography>
        <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.625rem', md: '2.125rem' }, lineHeight: 1.35 }}>
          beatmania IIDXのスコア・ランプを可視化
        </Typography>
        <Typography sx={{ mt: 2, fontSize: { xs: 15, md: 17 }, color: 'text.secondary' }}>
          INFINITASデータや手動入力のデータも、ACと同様の指標で可視化します。
          ユーザ登録は不要で、データはお使いの端末のブラウザ（LocalStorage）に保存されます。
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Button component={RouterLink} to="/register" size="large" variant="contained" color="secondary">
            利用する（CSV読み込みへ）
          </Button>
          <Button
            href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer"
            target="_blank"
            rel="noreferrer"
            size="large"
            endIcon={<LaunchRoundedIcon fontSize="small" />}
          >
            GitHub
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          キャッシュ削除などでデータが消える可能性があるため、
          <MuiLink component={RouterLink} to="/settings">設定</MuiLink>
          から定期的なバックアップを推奨します。
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 6 }}>
        <Section title="こんな方におすすめ" wide>
          <Box component="ul" sx={listSx}>
            <li>INFINITASでもACと同様の指標（BPIなど）を使用したい</li>
            <li>ACとINFINITASをマージしたスコア状況が知りたい</li>
            <li>INFINITASに収録されている楽曲だとどのくらいランプが埋まっているのかを知りたい</li>
            <li>DPの難易度表に合わせたランプ状況を可視化したい</li>
          </Box>
        </Section>

        <Section title="対応しているデータ形式">
          <Box component="ul" sx={listSx}>
            <li><ItemLink href="https://github.com/olji/Reflux">Reflux TSV</ItemLink></li>
            <li><ItemLink href="https://github.com/dj-kata/inf_daken_counter_obsw">INFINITAS打鍵カウンタ CSV</ItemLink></li>
            <li><ItemLink href="https://github.com/kaktuswald/inf-notebook/wiki">INFINITASリザルト手帳 CSV</ItemLink></li>
            <li><ItemLink href="https://p.eagate.573.jp/game/2dx/">KONAMI 公式スコアCSV</ItemLink></li>
            <li>サイトでの手動入力</li>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            複数の形式のデータを読み込み、最も良い結果を残すことが可能です。
          </Typography>
        </Section>

        <Section title="対応している指標">
          <Box component="ul" sx={listSx}>
            <li><ItemLink href="https://iidx-sp12.github.io/">SP☆12 難易度表</ItemLink></li>
            <li>
              <ItemLink href="https://docs.google.com/spreadsheets/d/1e7gdUmBk3zUGSxVGC--8p6w2TIWMLBcLzOcmWoeOx6Y/edit?gid=649088745#gid=649088745">
                SP☆11 難易度表
              </ItemLink>
            </li>
            <li><ItemLink href="https://cpi.makecir.com/">Clear Power Indicator(CPI)</ItemLink></li>
            <li><ItemLink href="https://bpi.poyashi.me/">Beat Power Indicator(BPI)</ItemLink></li>
            <li><ItemLink href="https://bm2dx.com/IIDX/notes_radar/">ノーツレーダー</ItemLink></li>
            <li><ItemLink href="https://zasa.sakura.ne.jp/dp/">DP非公式難易度表</ItemLink></li>
            <li><ItemLink href="http://ereter.net/iidxsongs/analytics/combined/">ereter's dp laboratory</ItemLink></li>
          </Box>
        </Section>

        <Section title="更新履歴" wide>
          <Box
            component="dl"
            sx={{
              m: 0,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '7.5em 1fr' },
              columnGap: 2,
              rowGap: { xs: 0, sm: 0.75 },
              '& dt': { color: 'text.secondary', fontSize: 14 },
              '& dd': { m: 0, mb: { xs: 1.25, sm: 0 }, fontSize: 15 },
            }}
          >
            {updates.map((u) => (
              <React.Fragment key={u.date}>
                <dt>{u.date}</dt>
                <dd>{u.text}</dd>
              </React.Fragment>
            ))}
          </Box>
        </Section>

        <Section title="お問い合わせ">
          <Typography variant="body2">
            不具合報告等は
            <MuiLink href="https://x.com/ci_public" target="_blank" rel="noreferrer" sx={{ mx: 0.5 }}>@ci_public</MuiLink>
            や
            <MuiLink href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer/issues" target="_blank" rel="noreferrer" sx={{ mx: 0.5 }}>Issues</MuiLink>
            等にご連絡いただけますと幸いです。
          </Typography>
        </Section>

        <Section title="注意事項">
          <Typography variant="body2">
            本サイトは非公式であり、株式会社コナミアミューズメント様とは一切関係ありません。
            本サイトをご利用中に何かしらのトラブルが発生したとしても、運営者は一切の責任を負いません。
          </Typography>
        </Section>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 6 }}>
        © {new Date().getFullYear()} chinimuruhi
      </Typography>
    </Box>
  );
};

const listSx = {
  m: 0,
  pl: 2.5,
  '& li': { fontSize: 15, lineHeight: 1.8 },
} as const;

const Section: React.FC<{ title: string; wide?: boolean; children: React.ReactNode }> = ({ title, wide, children }) => (
  <Box
    component="section"
    sx={{
      gridColumn: wide ? '1 / -1' : undefined,
      py: { xs: 3, md: 3.5 },
      borderTop: (theme) => `1px solid ${theme.palette.divider}`,
    }}
  >
    <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>{title}</Typography>
    {children}
  </Box>
);

const ItemLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <MuiLink href={href} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
    {children}
    <LaunchRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} aria-label="外部サイト" />
  </MuiLink>
);

export default Index;
