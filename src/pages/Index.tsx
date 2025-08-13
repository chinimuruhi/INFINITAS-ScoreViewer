// src/pages/Index.tsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Link as MuiLink,
  Stack,
  Divider,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import NoAccountsIcon from '@mui/icons-material/NoAccounts';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ReportRoundedIcon from '@mui/icons-material/ReportRounded';
import { InfoRounded } from '@mui/icons-material';
import { CheckCircleRounded } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const Index: React.FC = () => {
  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 10, md: 14 },
          background:
            'radial-gradient(1200px 600px at 10% -10%, rgba(99,102,241,.22), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(56,189,248,.18), transparent 55%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="INFINITAS ScoreViewer"
                color="primary"
                variant="outlined"
                sx={{ mb: 2, fontWeight: 600, letterSpacing: .4 }}
              />
              <Typography variant="h5" component="h1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                beatmania IIDXの
                <Box component="span" sx={{ color: 'primary.main' }}>
                  スコア・ランプを可視化
                </Box>
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, opacity: 0.9 }}>
                INFINITASデータや手動入力のデータも、ACと同様の指標で可視化。
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button
                  component={RouterLink}
                  to="/register"
                  size="large"
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{ px: 3, py: 1.2, borderRadius: 3, fontWeight: 700 }}
                >
                  利用する（CSV読み込みへ）
                </Button>
                <Button
                  href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer"
                  target="_blank"
                  rel="noreferrer"
                  size="large"
                  variant="text"
                  endIcon={<LaunchRoundedIcon />}
                  sx={{ px: 2, py: 1.2, borderRadius: 3 }}
                >
                  GitHub
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  p: 2,
                  backdropFilter: 'blur(6px)',
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.04))',
                  border: theme => `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CloudUploadRoundedIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={700}>
                        はじめに
                      </Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      INFINITAS ScoreViewerへようこそ！当サイトはINFINITASや手動入力のスコアデータでも、
                      ACと同様の指標で可視化することを目指しております。
                    </Typography>
                    <Divider flexItem />
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <NoAccountsIcon color="primary" />
                      <Typography variant="subtitle2" fontWeight={700}>ユーザ登録不要</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      端末のブラウザ（LocalStorage）に保存します。キャッシュ削除で消える可能性があるため、
                      <MuiLink component={RouterLink} to="/settings" sx={{ fontWeight: 700 }}>
                        設定
                      </MuiLink>
                      から定期的なバックアップを推奨します。
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* こんな方におすすめ！ */}
      <Container maxWidth="lg" sx={{ py: 0 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  こんな方におすすめ！
                </Typography>
                <div style={{ opacity: 0.9 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleRounded fontSize="small" sx={{ color: 'success.main' }} />
                    <span>INFINITASでもACと同様の指標（BPIなど）を使用したい</span>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleRounded fontSize="small" sx={{ color: 'success.main' }} />
                    <span>ACとINFINITASをマージしたスコア状況が知りたい</span>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleRounded fontSize="small" sx={{ color: 'success.main' }} />
                    <span>INFINITASに収録されている楽曲だとどのくらいランプが埋まっているのかを知りたい</span>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleRounded fontSize="small" sx={{ color: 'success.main' }} />
                    <span>DPの難易度表に合わせたランプ状況を可視化したい</span>
                  </Stack>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* 対応フォーマット / 指標 */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <CloudUploadRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>対応しているデータ形式</Typography>
                </Stack>
                <Stack spacing={1} sx={{ pl: 0.5 }}>
                  <ItemLink href="https://github.com/olji/Reflux">Reflux TSV</ItemLink>
                  <ItemLink href="https://github.com/dj-kata/inf_daken_counter_obsw">INFINITAS打鍵カウンタ CSV</ItemLink>
                  <ItemLink href="https://p.eagate.573.jp/game/2dx/">KONAMI 公式スコアCSV</ItemLink>
                  <Typography variant="body2">サイトでの手動入力</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5, mb: 1 }}>
                  <InfoRounded color="primary" />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    複数の形式のデータを読み込み、最も良い結果を残すことが可能です。
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <InsightsRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>対応している指標</Typography>
                </Stack>
                <Stack spacing={1} sx={{ pl: 0.5 }}>
                  <ItemLink href="https://iidx-sp12.github.io/">SP⭐︎12 難易度表</ItemLink>
                  <ItemLink href="https://docs.google.com/spreadsheets/d/1e7gdUmBk3zUGSxVGC--8p6w2TIWMLBcLzOcmWoeOx6Y/edit?gid=649088745#gid=649088745">
                    SP⭐︎11 難易度表
                  </ItemLink>
                  <ItemLink href="https://cpi.makecir.com/">Clear Power Indicator(CPI)</ItemLink>
                  <ItemLink href="https://bpi.poyashi.me/">Beat Power Indicator(BPI)</ItemLink>
                  <ItemLink href="https://bm2dx.com/IIDX/notes_radar/">ノーツレーダー</ItemLink>
                  <ItemLink href="https://zasa.sakura.ne.jp/dp/">DP非公式難易度表</ItemLink>
                  <ItemLink href="http://ereter.net/iidxsongs/analytics/combined/">ereter's dp laboratory</ItemLink>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 利用する */}
        <Card
          elevation={0}
          sx={{
            mt: 6,
            borderRadius: 4,
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 5 },
            background:
              'linear-gradient(135deg, rgba(99,102,241,.1), rgba(56,189,248,.08))',
            border: theme => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="h5" fontWeight={800}>利用する</Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              ユーザ登録不要で機能を利用可能です。データは端末のブラウザ(LocalStorage)に保存されます。
              キャッシュ削除等で消える可能性があるため、設定画面から定期的なバックアップを推奨します。
            </Typography>
            <Box>
              <Button
                component={RouterLink}
                to="/register"
                size="large"
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ px: 3, py: 1.2, borderRadius: 3, fontWeight: 700, mt: 1 }}
              >
                利用する（CSV読み込みへ）
              </Button>
            </Box>
          </Stack>
        </Card>
      </Container>

      {/* 更新履歴 */}
      <Box sx={{ py: 6, bgcolor: 'background.paper', borderTop: theme => `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
            <HistoryRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>更新履歴</Typography>
          </Stack>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">2025/8/13</Typography>
                <Typography variant="body1">ノーツレーダー計算不具合修正、ACとINFで譜面が異なる楽曲対応(※1)、その他軽微な修正</Typography>
                <Typography variant="body1">※1 該当楽曲を修正前にインポートされた方は手動修正をお願いいたします。</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">2025/8/12</Typography>
                <Typography variant="body1">サイト公開</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* お問い合わせ / 注意事項 */}
      <Container maxWidth="lg" sx={{ py: 0 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <ReportRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>お問い合わせ</Typography>
                </Stack>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  不具合報告等は
                  <MuiLink href="https://x.com/ci_public" target="_blank" rel="noreferrer" sx={{ fontWeight: 700 }}>
                    @ci_public
                  </MuiLink>
                  や
                  <MuiLink href="https://github.com/chinimuruhi/INFINITAS-ScoreViewer/issues" target="_blank" rel="noreferrer" sx={{ fontWeight: 700, ml: .5 }}>
                    Issues
                  </MuiLink>
                  等にご連絡いただけますと幸いです。
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  注意事項
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  本サイトは非公式であり、株式会社コナミアミューズメント様とは一切関係ありません。
                  本サイトをご利用中に何かしらのトラブルが発生したとしても、運営者は一切の責任を負いません。
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 6 }}>
          © {new Date().getFullYear()} chinimuruhi
        </Typography>
      </Container>
    </Box>
  );
};

const ItemLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Typography variant="body2">
    <MuiLink href={href} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: .5 }}>
      {children}
      <LaunchRoundedIcon fontSize="small" sx={{ ml: .25 }} />
    </MuiLink>
  </Typography>
);

export default Index;
