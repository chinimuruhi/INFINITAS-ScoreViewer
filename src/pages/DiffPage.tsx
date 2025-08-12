// src/pages/DiffPage.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ungzip } from 'pako';
import { compressDiffData, decompressDiffData } from '../utils/encodeUtils';
import { useAppContext } from '../context/AppContext';
import { clearColorMap } from '../constants/colorConstrains';
import { simpleClearName } from '../constants/clearConstrains';
import { defaultMisscount } from '../constants/defaultValues';
import { getPercentage, getDetailGrade, getGrade } from '../utils/gradeUtils';
import { Page, PageHeader } from '../components/Page';
import SectionCard from '../components/SectionCard';

const urlLengthMax = 4088;

const DiffPage = () => {
  const { mode } = useAppContext();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [diff, setDiff] = useState<any>({});
  const [user, setUser] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [excludeNewSongs, setExcludeNewSongs] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isUrldataValid, setIsUrldataValid] = useState(true);

  // ソート
  const [clearSortConfig, setClearSortConfig] = useState<{ key: string; direction: string }>({ key: 'lv', direction: 'desc' });
  const [scoreSortConfig, setScoreSortConfig] = useState<{ key: string; direction: string }>({ key: 'lv', direction: 'desc' });
  const [missSortConfig, setMissSortConfig] = useState<{ key: string; direction: string }>({ key: 'lv', direction: 'desc' });

  const fetchData = useCallback(async () => {
    try {
      const titleRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json');
      const titles = await titleRes.json();
      setTitleMap(titles);

      const chartRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz');
      const chartBuffer = await chartRes.arrayBuffer();
      const chartJson = JSON.parse(ungzip(new Uint8Array(chartBuffer), { to: 'string' }));
      setChartInfo(chartJson);

      const urlParams = new URLSearchParams(window.location.search);
      const data = urlParams.get('data');
      if (data) {
        let inflatedData;
        try {
          inflatedData = decompressDiffData(data);
        } catch {
          inflatedData = { diff: {}, user: {} };
          setIsUrldataValid(false);
        }
        setDiff(inflatedData.diff);
        setUser(inflatedData.user);
        setIsShared(true);
      } else {
        const storedDiff = JSON.parse(localStorage.getItem('diff') || '{}');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setDiff(storedDiff);
        setUser(storedUser);
        setIsShared(false);
      }
    } catch (error) {
      console.error('データの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (table: 'clear' | 'score' | 'miss', key: string) => {
    let direction = 'asc';
    const cfg = table === 'clear' ? clearSortConfig : table === 'score' ? scoreSortConfig : missSortConfig;
    if (cfg.key === key && cfg.direction === 'asc') direction = 'desc';
    (table === 'clear' ? setClearSortConfig : table === 'score' ? setScoreSortConfig : setMissSortConfig)({ key, direction });
  };

  const sortedData = (data: any[], key: string, direction: 'asc' | 'desc') =>
    data.sort((a, b) => {
      const cmp = (x: number, y: number) => (direction === 'asc' ? x - y : y - x);
      if (key === 'lv') return cmp(a.lv, b.lv);
      if (key === 'title') return direction === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      if (key === 'beforeLamp') return cmp(a.before, b.before);
      if (key === 'afterLamp') return cmp(a.after, b.after);
      if (key === 'grade') return cmp(a.afterRate, b.afterRate);
      if (key === 'score') return cmp(a.afterScore, b.afterScore);
      if (key === 'bp') return cmp(a.afterMisscount, b.afterMisscount);
      if (key === 'diff') return cmp(a.diff, b.diff);
      return 0;
    });

  const sortedDataWithState = (data: any[], table: 'clear' | 'score' | 'miss') => {
    const sortConfig = table === 'clear' ? clearSortConfig : table === 'score' ? scoreSortConfig : missSortConfig;
    return sortedData(data, sortConfig.key, sortConfig.direction as 'asc' | 'desc');
  };

  const handleShare = () => {
    const data = { diff, user };
    const base64Data = compressDiffData(data);
    const topUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]+$/, '/');
    const currentUrl = window.location;
    const url = `${currentUrl}?data=${base64Data}`;

    let tweetText = `${user.djname ? user.djname + 'さんの' : ''}更新差分\n`;
    if (processed.clearUpdatesCount['SP'] > 0) tweetText += `ランプ更新(SP)： ${processed.clearUpdatesCount['SP']}件\n`;
    if (processed.scoreUpdatesCount['SP'] > 0) tweetText += `スコア更新(SP)： ${processed.scoreUpdatesCount['SP']}件\n`;
    if (processed.missUpdatesCount['SP'] > 0) tweetText += `BP更新(SP)： ${processed.missUpdatesCount['SP']}件\n`;
    if (processed.clearUpdatesCount['DP'] > 0) tweetText += `ランプ更新(DP)： ${processed.clearUpdatesCount['DP']}件\n`;
    if (processed.scoreUpdatesCount['DP'] > 0) tweetText += `スコア更新(DP)： ${processed.scoreUpdatesCount['DP']}件\n`;
    if (processed.missUpdatesCount['DP'] > 0) tweetText += `BP更新(DP)： ${processed.missUpdatesCount['DP']}件\n`;
    tweetText += '\n';

    const twitterUrl = (url.length >= urlLengthMax)
      ? `https://x.com/intent/tweet?url=${encodeURIComponent(topUrl)}&hashtags=inf_sv&text=${encodeURIComponent(tweetText + '(更新データが多すぎるため共有URLの生成に失敗しました)\n\n')}`
      : `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&hashtags=inf_sv&text=${encodeURIComponent(tweetText)}\n`;
    window.open(twitterUrl, '_blank');
  };

  const processed = useMemo(() => {
    const clearUpdates: any[] = [];
    const scoreUpdates: any[] = [];
    const missUpdates: any[] = [];
    const clearUpdatesCount = { SP: 0, DP: 0 };
    const scoreUpdatesCount = { SP: 0, DP: 0 };
    const missUpdatesCount = { SP: 0, DP: 0 };

    if (diff[mode]) {
      for (const id in diff[mode]) {
        for (const difficulty in diff[mode][id]) {
          const entry = diff[mode][id][difficulty];
          const idx = ['B', 'N', 'H', 'A', 'L'].indexOf(difficulty);
          const lv = chartInfo[id]?.level?.[mode.toLowerCase()]?.[idx] ?? 'N/A';
          const notes = chartInfo[id]?.notes?.[mode.toLowerCase()]?.[idx] ?? 0;
          const title = titleMap[id] || id;

          if (entry?.cleartype?.new !== entry?.cleartype?.old && entry?.cleartype?.new > 1) {
            clearUpdatesCount[mode]++;
            if (excludeNewSongs && entry?.cleartype?.old === 0) continue;
            clearUpdates.push({
              id, title, difficulty, lv,
              before: entry.cleartype.old,
              after: entry.cleartype.new,
              colorBefore: clearColorMap[entry.cleartype.old],
              colorAfter: clearColorMap[entry.cleartype.new],
            });
          }

          if (entry?.score?.new !== entry?.score?.old) {
            scoreUpdatesCount[mode]++;
            if (excludeNewSongs && entry?.cleartype?.old === 0) continue;
            const pBefore = getPercentage(entry.score.old, notes);
            const pAfter = getPercentage(entry.score.new, notes);
            scoreUpdates.push({
              id, title, difficulty, lv, notes,
              beforeScore: entry.score.old,
              afterScore: entry.score.new,
              beforeRate: pBefore,
              afterRate: pAfter,
              diff: entry.score.new - entry.score.old,
            });
          }

          if (entry?.misscount?.new !== entry?.misscount?.old) {
            missUpdatesCount[mode]++;
            if (excludeNewSongs && entry?.misscount?.old === defaultMisscount) continue;
            missUpdates.push({
              id, title, difficulty, lv,
              afterMisscount: entry.misscount.new === defaultMisscount ? '-' : entry.misscount.new,
              diff: entry.misscount.old === defaultMisscount ? defaultMisscount : entry.misscount.new - entry.misscount.old,
            });
          }
        }
      }
    }

    return {
      clearUpdates: sortedData(clearUpdates, 'afterLamp', 'desc'),
      scoreUpdates: sortedData(scoreUpdates, 'grade', 'desc'),
      missUpdates: sortedData(missUpdates, 'bp', 'asc'),
      clearUpdatesCount, scoreUpdatesCount, missUpdatesCount
    };
  }, [diff, chartInfo, titleMap, mode, excludeNewSongs]);

  const hasUpdates = processed.clearUpdates.length > 0 || processed.scoreUpdates.length > 0 || processed.missUpdates.length > 0;

  if (loading) return <CircularProgress />;

  // PageHeader のタイトル（スマホで日付を改行）
  const headerTitle = isUrldataValid ? (
    <>
      {user.djname ? `${user.djname}さんの` : ''}更新差分
      {user.lastupdated && (
        <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
          {' '}({user.lastupdated})
        </Box>
      )}
    </>
  ) : '更新差分';

  // 𝕏でポスト（ヘッダー actions に設置：スマホはタイトルの下に表示）
  const headerActions = (!isShared && hasUpdates && isUrldataValid) ? (
    <Button
      variant="contained"
      onClick={handleShare}
      size={isXs ? 'small' : 'medium'}
      sx={{
        fontWeight: 700,
        bgcolor: 'common.black',
        color: 'common.white',
        '&:hover': { bgcolor: '#333' },
      }}
    >
      𝕏でポスト
    </Button>
  ) : null;

  return (
    <Page>
      <PageHeader compact title={headerTitle} actions={headerActions} />
      <SectionCard dense>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {isUrldataValid && (
            <FormControlLabel
              control={<Checkbox checked={excludeNewSongs} onChange={(e) => setExcludeNewSongs(e.target.checked)} />}
              label="初プレー楽曲を除外する"
              sx={{ my: 1.5, '& .MuiFormControlLabel-label': { fontSize: { xs: 13, sm: 14 } } }}
            />
          )}

          {/* ランプ更新 */}
          {processed.clearUpdates.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>ランプ更新</Typography>
              <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520, '& td, & th': { fontSize: { xs: 12, sm: 14 } } }}>
                  <TableHead>
                    <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                      <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('clear', 'lv')}>☆</TableCell>
                      <TableCell onClick={() => handleSort('clear', 'title')}>Title</TableCell>
                      <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('clear', 'beforeLamp')}>Before</TableCell>
                      <TableCell />
                      <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('clear', 'afterLamp')}>After</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDataWithState(processed.clearUpdates, 'clear').map((row) => (
                      <React.Fragment key={`${row.id}_${row.difficulty}`}>
                        {/* PC/Tablet */}
                        <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                          <TableCell>☆{row.lv}</TableCell>
                          <TableCell>{row.title} [{row.difficulty}]</TableCell>
                          <TableCell sx={{ backgroundColor: row.colorBefore, textAlign: 'center' }}>{simpleClearName[row.before]}</TableCell>
                          <TableCell sx={{ px: 0, textAlign: 'center' }}>→</TableCell>
                          <TableCell sx={{ backgroundColor: row.colorAfter, textAlign: 'center' }}>{simpleClearName[row.after]}</TableCell>
                        </TableRow>

                        {/* Mobile */}
                        <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }}>
                          <TableCell colSpan={5} sx={{ py: 1.25 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {row.title} [{row.difficulty}] ／ ☆{row.lv}
                            </Typography>
                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: 12 }}>
                              <Box sx={{ px: 1, borderRadius: 1, bgcolor: row.colorBefore }}>{simpleClearName[row.before]}</Box>
                              <Box sx={{ px: 0.5 }}>→</Box>
                              <Box sx={{ px: 1, borderRadius: 1, bgcolor: row.colorAfter }}>{simpleClearName[row.after]}</Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* スコア更新 */}
          {processed.scoreUpdates.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>スコア更新</Typography>
              <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520, '& td, & th': { fontSize: { xs: 12, sm: 14 } } }}>
                  <TableHead>
                    <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                      <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('score', 'lv')}>☆</TableCell>
                      <TableCell onClick={() => handleSort('score', 'title')}>Title</TableCell>
                      <TableCell onClick={() => handleSort('score', 'grade')}>Grade</TableCell>
                      <TableCell onClick={() => handleSort('score', 'score')}>Score</TableCell>
                      <TableCell onClick={() => handleSort('score', 'diff')}>Diff</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDataWithState(processed.scoreUpdates, 'score').map((row) => (
                      <React.Fragment key={`${row.id}_${row.difficulty}`}>
                        {/* PC/Tablet */}
                        <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                          <TableCell>☆{row.lv}</TableCell>
                          <TableCell>{row.title} [{row.difficulty}]</TableCell>
                          <TableCell>{getGrade(row.afterRate)} ({getDetailGrade(row.afterScore, row.notes)})</TableCell>
                          <TableCell>{row.afterScore} ({(row.afterRate * 100).toFixed(2)}%)</TableCell>
                          <TableCell>+{row.diff}</TableCell>
                        </TableRow>

                        {/* Mobile */}
                        <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }}>
                          <TableCell colSpan={5} sx={{ py: 1.25 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {row.title} [{row.difficulty}] ／ ☆{row.lv}
                            </Typography>
                            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1.25, color: 'text.secondary', fontSize: 12 }}>
                              <span>{getGrade(row.afterRate)} ({getDetailGrade(row.afterScore, row.notes)})</span>
                              <span>{row.afterScore} ({(row.afterRate * 100).toFixed(1)}%)</span>
                              <span>Diff: +{row.diff}</span>
                            </Box>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* BP更新 */}
          {processed.missUpdates.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>BP更新</Typography>
              <TableContainer component={Paper} sx={{ mb: 0, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520, '& td, & th': { fontSize: { xs: 12, sm: 14 } } }}>
                  <TableHead>
                    <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                      <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('miss', 'lv')}>☆</TableCell>
                      <TableCell onClick={() => handleSort('miss', 'title')}>Title</TableCell>
                      <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('miss', 'bp')}>BP</TableCell>
                      <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('miss', 'diff')}>Diff</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDataWithState(processed.missUpdates, 'miss').map((row) => (
                      <React.Fragment key={`${row.id}_${row.difficulty}`}>
                        {/* PC/Tablet */}
                        <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                          <TableCell>☆{row.lv}</TableCell>
                          <TableCell>{row.title} [{row.difficulty}]</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{row.afterMisscount}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{row.diff !== defaultMisscount ? row.diff : ''}</TableCell>
                        </TableRow>

                        {/* Mobile */}
                        <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }}>
                          <TableCell colSpan={4} sx={{ py: 1.25 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {row.title} [{row.difficulty}] ／ ☆{row.lv}
                            </Typography>
                            <Box sx={{ mt: 0.5, display: 'flex', gap: 1.25, color: 'text.secondary', fontSize: 12 }}>
                              <span>BP: {row.afterMisscount}</span>
                              <span>{row.diff !== defaultMisscount ? `Diff: ${row.diff}` : ''}</span>
                            </Box>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {isShared && !isUrldataValid && <Typography variant="h6">共有データが破損しているため表示できませんでした。</Typography>}
          {!hasUpdates && isUrldataValid && <Typography variant="h6">更新がありません</Typography>}
        </Box>
      </SectionCard>
    </Page>
  );
};

export default DiffPage;
