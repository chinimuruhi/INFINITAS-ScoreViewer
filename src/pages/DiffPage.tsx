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
import { acInfDiffMap } from '../constants/titleConstrains';
import { useNavigate } from 'react-router-dom';
import { difficultyKey } from '../constants/difficultyConstrains';
import { calculateBpi } from '../utils/bpiUtils';

const urlLengthMax = 4088;

const DiffPage = () => {
  const { mode, setMode } = useAppContext();
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
  const [bpiInfo, setBpiInfo] = useState<any>({});

  // ソート
  const [clearSortConfig, setClearSortConfig] = useState<{ key: string; direction: string }>({ key: 'lv', direction: 'desc' });
  const [scoreSortConfig, setScoreSortConfig] = useState<{ key: string; direction: string }>({ key: 'lv', direction: 'desc' });
  const [missSortConfig, setMissSortConfig] = useState<{ key: string; direction: string }>({ key: 'lv', direction: 'desc' });
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [
          titleRes,
          chartGz,
          bpiSpInfo,
          bpiDpInfo,
        ] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then((res) => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then((res) => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/bpi/sp_dict.json').then((res) => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/bpi/dp_dict.json').then((res) => res.json()),
        ]);
      setTitleMap(titleRes);
      setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));
      setBpiInfo({
        'SP': bpiSpInfo,
        'DP': bpiDpInfo
      });

      const urlParams = new URLSearchParams(window.location.search);
      const data = urlParams.get('data');
      let spUpdateCount = 0;
      let dpUpdateCount = 0;
      if (data) {
        let inflatedData;
        try {
          inflatedData = decompressDiffData(data);
        } catch {
          inflatedData = { diff: {}, user: {} };
          setIsUrldataValid(false);
        }
        spUpdateCount = inflatedData?.diff?.['SP'] ? Object.keys(inflatedData.diff['SP']).length : 0;
        dpUpdateCount = inflatedData?.diff?.['DP'] ? Object.keys(inflatedData.diff['DP']).length : 0;
        setDiff(inflatedData.diff);
        setUser(inflatedData.user);
        setIsShared(true);
      } else {
        const storedDiff = JSON.parse(localStorage.getItem('diff') || '{}');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        spUpdateCount = storedDiff['SP'] ? Object.keys(storedDiff['SP']).length : 0;
        dpUpdateCount = storedDiff['DP'] ? Object.keys(storedDiff['DP']).length : 0;
        setDiff(storedDiff);
        setUser(storedUser);
        setIsShared(false);
      }
      if (spUpdateCount >= dpUpdateCount) {
        setMode('SP');
      } else {
        setMode('DP');
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
      if (key === 'bpi'){
        const aBpi = Number.isNaN(a.bpi) ? -99 : a.bpi;
        const bBpi = Number.isNaN(b.bpi) ? -99 : b.bpi;
        return cmp(aBpi, bBpi);
      } 
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
    const clearUpdates: { [key: string]: any } = { 'SP': [], 'DP': [] };
    const scoreUpdates: { [key: string]: any } = { 'SP': [], 'DP': [] };
    const missUpdates: { [key: string]: any } = { 'SP': [], 'DP': [] };
    const clearUpdatesCount: { [key: string]: number } = { 'SP': 0, 'DP': 0 };
    const scoreUpdatesCount: { [key: string]: number } = { 'SP': 0, 'DP': 0 };
    const missUpdatesCount: { [key: string]: number } = { 'SP': 0, 'DP': 0 };
    const isContainBpi: { [key: string]: boolean } = { 'SP': false, 'DP': false };

    for (const m of Object.keys(clearUpdatesCount)) {
      if (diff[m]) {
        for (const id in diff[m]) {
          for (const difficulty in diff[m][id]) {
            const entry = diff[m][id][difficulty];
            const idx = ['B', 'N', 'H', 'A', 'L'].indexOf(difficulty);
            const lv = chartInfo[id]?.level?.[m.toLowerCase()]?.[idx] ?? 'N/A';
            const notes = chartInfo[id]?.notes?.[m.toLowerCase()]?.[idx] ?? 0;
            const title = titleMap[id] || id;

            if (entry?.cleartype?.new !== entry?.cleartype?.old && entry?.cleartype?.new > 1) {
              clearUpdatesCount[m]++;
              if (excludeNewSongs && entry?.cleartype?.old === 0) continue;
              clearUpdates[m].push({
                id, title, difficulty, lv,
                before: entry.cleartype.old,
                after: entry.cleartype.new,
                colorBefore: clearColorMap[entry.cleartype.old],
                colorAfter: clearColorMap[entry.cleartype.new],
              });
            }

            if (entry?.score?.new !== entry?.score?.old) {
              scoreUpdatesCount[m]++;
              if (excludeNewSongs && entry?.cleartype?.old === 0) continue;
              const pBefore = getPercentage(entry.score.old, notes);
              const pAfter = getPercentage(entry.score.new, notes);
              const bpiInfoEntry = bpiInfo?.[m]?.[id]?.[difficulty];
              const bpi = bpiInfoEntry ? calculateBpi(bpiInfoEntry.wr, bpiInfoEntry.avg, bpiInfoEntry.notes, entry.score.new, bpiInfoEntry.coef) : NaN;
              if(!Number.isNaN(bpi)){
                isContainBpi[m] = true;
              }
              scoreUpdates[m].push({
                id, title, difficulty, lv, notes, bpi,
                beforeScore: entry.score.old,
                afterScore: entry.score.new,
                beforeRate: pBefore,
                afterRate: pAfter,
                diff: entry.score.new - entry.score.old,
              });
            }

            if (entry?.misscount?.new !== entry?.misscount?.old) {
              missUpdatesCount[m]++;
              if (excludeNewSongs && entry?.misscount?.old === defaultMisscount) continue;
              missUpdates[m].push({
                id, title, difficulty, lv,
                afterMisscount: entry.misscount.new === defaultMisscount ? '-' : entry.misscount.new,
                diff: entry.misscount.old === defaultMisscount ? defaultMisscount : entry.misscount.new - entry.misscount.old,
              });
            }
          }
        }
      }
    }

    return {
      clearUpdates: {
        'SP': sortedData(clearUpdates['SP'], 'afterLamp', 'desc'),
        'DP': sortedData(clearUpdates['DP'], 'afterLamp', 'desc')
      },
      scoreUpdates: {
        'SP': sortedData(scoreUpdates['SP'], 'bpi', 'desc'),
        'DP': sortedData(scoreUpdates['DP'], 'bpi', 'desc')
      },
      missUpdates: {
        'SP': sortedData(missUpdates['SP'], 'bp', 'asc'),
        'DP': sortedData(missUpdates['DP'], 'bp', 'desc')
      },
      clearUpdatesCount, scoreUpdatesCount, missUpdatesCount, isContainBpi
    };
  }, [diff, chartInfo, titleMap, excludeNewSongs]);

  const hasUpdates = processed.clearUpdates[mode].length > 0 || processed.scoreUpdates[mode].length > 0 || processed.missUpdates[mode].length > 0;

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

  const handleSelectSong = (songId: string, difficultyNumber: number) => {
    if(!isShared){
      navigate(`/edit/${songId}/${difficultyNumber}`);
    }
  };

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
          {processed.clearUpdates[mode].length > 0 && (
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
                    {sortedDataWithState(processed.clearUpdates[mode], 'clear').map((row) => (
                      <React.Fragment key={`${row.id}_${row.difficulty}`}>
                        {/* PC/Tablet */}
                        <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }} onClick={() => handleSelectSong(row.id, difficultyKey.indexOf(row.difficulty))}>
                          <TableCell>☆{row.lv}</TableCell>
                          <TableCell>{row.title} [{row.difficulty}]{acInfDiffMap[Number(row.id)] ? ' (INFINITAS)': ''}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}><Box sx={{ px: 1, borderRadius: 1, display: 'inline-block', backgroundColor: row.colorBefore }}>{simpleClearName[row.before]}</Box></TableCell>
                          <TableCell sx={{ px: 0, textAlign: 'center' }}>→</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}><Box sx={{ px: 1, borderRadius: 1, display: 'inline-block', backgroundColor: row.colorAfter }}>{simpleClearName[row.after]}</Box></TableCell>
                        </TableRow>

                        {/* Mobile */}
                        <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }} onClick={() => handleSelectSong(row.id, difficultyKey.indexOf(row.difficulty))}>
                          <TableCell colSpan={5} sx={{ py: 1.25 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {row.title} [{row.difficulty}]{acInfDiffMap[Number(row.id)] ? ' (INFINITAS)': ''} ／ ☆{row.lv}
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
          {processed.scoreUpdates[mode].length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>スコア更新</Typography>
              <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520, '& td, & th': { fontSize: { xs: 12, sm: 14 } } }}>
                  <TableHead>
                    <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                      <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('score', 'lv')}>☆</TableCell>
                      <TableCell onClick={() => handleSort('score', 'title')}>Title</TableCell>
                      {processed.isContainBpi[mode] && <TableCell onClick={() => handleSort('score', 'bpi')}>BPI</TableCell>}
                      <TableCell onClick={() => handleSort('score', 'grade')}>Grade</TableCell>
                      <TableCell onClick={() => handleSort('score', 'score')}>Score</TableCell>
                      <TableCell onClick={() => handleSort('score', 'diff')}>Diff</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDataWithState(processed.scoreUpdates[mode], 'score').map((row) => (
                      <React.Fragment key={`${row.id}_${row.difficulty}`}>
                        {/* PC/Tablet */}
                        <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }} onClick={() => handleSelectSong(row.id, difficultyKey.indexOf(row.difficulty))}>
                          <TableCell>☆{row.lv}</TableCell>
                          <TableCell>{row.title} [{row.difficulty}]{acInfDiffMap[Number(row.id)] ? ' (INFINITAS)': ''}</TableCell>
                          {processed.isContainBpi[mode] && <TableCell>{Number.isNaN(row.bpi) ? '' : row.bpi}</TableCell>}
                          <TableCell>{getGrade(row.afterRate)} ({getDetailGrade(row.afterScore, row.notes)})</TableCell>
                          <TableCell>{row.afterScore} ({(row.afterRate * 100).toFixed(2)}%)</TableCell>
                          <TableCell>+{row.diff}</TableCell>
                        </TableRow>

                        {/* Mobile */}
                        <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }} onClick={() => handleSelectSong(row.id, difficultyKey.indexOf(row.difficulty))}>
                          <TableCell colSpan={5} sx={{ py: 1.25 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {row.title} [{row.difficulty}]{acInfDiffMap[Number(row.id)] ? ' (INFINITAS)': ''} ／ ☆{row.lv}
                            </Typography>
                            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1.25, color: 'text.secondary', fontSize: 12 }}>
                              {!Number.isNaN(row.bpi) && <span>BPI: {row.bpi}</span>}
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
          {processed.missUpdates[mode].length > 0 && (
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
                    {sortedDataWithState(processed.missUpdates[mode], 'miss').map((row) => (
                      <React.Fragment key={`${row.id}_${row.difficulty}`}>
                        {/* PC/Tablet */}
                        <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }} onClick={() => handleSelectSong(row.id, difficultyKey.indexOf(row.difficulty))}>
                          <TableCell>☆{row.lv}</TableCell>
                          <TableCell>{row.title} [{row.difficulty}]{acInfDiffMap[Number(row.id)] ? ' (INFINITAS)': ''}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{row.afterMisscount}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{row.diff !== defaultMisscount ? row.diff : ''}</TableCell>
                        </TableRow>

                        {/* Mobile */}
                        <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }} onClick={() => handleSelectSong(row.id, difficultyKey.indexOf(row.difficulty))}>
                          <TableCell colSpan={4} sx={{ py: 1.25 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {row.title} [{row.difficulty}]{acInfDiffMap[Number(row.id)] ? ' (INFINITAS)': ''} ／ ☆{row.lv}
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
