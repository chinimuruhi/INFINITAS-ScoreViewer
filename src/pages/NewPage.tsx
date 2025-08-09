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
  StepIconClassKey,
} from '@mui/material';
import { ungzip } from 'pako';

const diffLabel: { [key: string]: string } = {
  B: 'BEGINNER',
  N: 'NORMAL',
  H: 'HYPER',
  A: 'ANOTHER',
  L: 'LEGGENDARIA'
};

const clearTypeLabel: { [key: number]: string } = {
  0: 'NO PLAY',
  1: 'FAILED',
  2: 'ASSIST CLEAR',
  3: 'EASY CLEAR',
  4: 'CLEAR',
  5: 'HARD CLEAR',
  6: 'EX HARD CLEAR',
  7: 'FULLCOMBO CLEAR'
};

const clearTypeColor: { [key: number]: string } = {
  0: '#FFFFFF',
  1: '#CCCCCC',
  2: '#FF66CC',
  3: '#99FF99',
  4: '#99CCFF',
  5: '#FF6666',
  6: '#FFFF99',
  7: '#FF9966'
};

const getGrade = (percentage: number): string => {
  if (percentage < 2 / 9) return 'F';
  if (percentage < 1 / 3) return 'E';
  if (percentage < 4 / 9) return 'D';
  if (percentage < 5 / 9) return 'C';
  if (percentage < 2 / 3) return 'B';
  if (percentage < 7 / 9) return 'A';
  if (percentage < 8 / 9) return 'AA';
  return 'AAA';
};

const getDetailGrade = (score: number, notes: number): string => {
  const percentage = (score || 0) / (notes * 2);
  if (percentage < 4 / 18) return 'E-' + (Math.ceil(notes * 4 / 9) - score).toString();
  if (percentage < 5 / 18) return 'E+' + (score - Math.ceil(notes * 4 / 9)).toString();
  if (percentage < 6 / 18) return 'D-' + (Math.ceil(notes * 6 / 9) - score).toString();
  if (percentage < 7 / 18) return 'D+' + (score - Math.ceil(notes * 6 / 9)).toString();
  if (percentage < 8 / 18) return 'C-' + (Math.ceil(notes * 8 / 9) - score).toString();
  if (percentage < 9 / 18) return 'C+' + (score - Math.ceil(notes * 8 / 9)).toString();
  if (percentage < 10 / 18) return 'B-' + (Math.ceil(notes * 10 / 9) - score).toString();
  if (percentage < 11 / 18) return 'B+' + (score - Math.ceil(notes * 10 / 9)).toString();
  if (percentage < 12 / 18) return 'A-' + (Math.ceil(notes * 12 / 9) - score).toString();
  if (percentage < 13 / 18) return 'A+' + (score - Math.ceil(notes * 12 / 9)).toString();
  if (percentage < 14 / 18) return 'AA-' + (Math.ceil(notes * 14 / 9) - score).toString();
  if (percentage < 15 / 18) return 'AA+' + (score - Math.ceil(notes * 14 / 9)).toString();
  if (percentage < 16 / 18) return 'AAA-' + (Math.ceil(notes * 16 / 9) - score).toString();
  if (percentage < 17 / 18) return 'AAA+' + (score - Math.ceil(notes * 16 / 9)).toString();
  return 'MAX-' + (notes * 2 - score).toString();
};

const NewPage = ({ mode }: { mode: 'SP' | 'DP' }) => {
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [diff, setDiff] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [excludeNewSongs, setExcludeNewSongs] = useState(false);
  const [firstSortFinished, setfirstSortFinished] = useState(false);

  // ソートの状態をそれぞれ分けて管理
  const [clearSortConfig, setClearSortConfig] = useState<{ key: string; direction: string }>({
    key: 'lv',
    direction: 'desc',
  });
  const [scoreSortConfig, setScoreSortConfig] = useState<{ key: string; direction: string }>({
    key: 'lv',
    direction: 'desc',
  });
  const [missSortConfig, setMissSortConfig] = useState<{ key: string; direction: string }>({
    key: 'lv',
    direction: 'desc',
  });

  const fetchData = useCallback(async () => {
    try {
      const titleRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json');
      const titles = await titleRes.json();
      setTitleMap(titles);

      const chartRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz');
      const chartBuffer = await chartRes.arrayBuffer();
      const chartJson = JSON.parse(ungzip(new Uint8Array(chartBuffer), { to: 'string' }));
      setChartInfo(chartJson);

      const stored = JSON.parse(localStorage.getItem('diff') || '{}');
      setDiff(stored);
    } catch (error) {
      console.error('データの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ソート処理
  const handleSort = (table: string, key: string) => {
    let direction = 'asc';
    let setSortConfig;
    if (table === 'clear') {
      setSortConfig = setClearSortConfig;
      if (clearSortConfig.key === key && clearSortConfig.direction === 'asc') {
        direction = 'desc';
      }
    } else if (table === 'score') {
      setSortConfig = setScoreSortConfig;
      if (scoreSortConfig.key === key && scoreSortConfig.direction === 'asc') {
        direction = 'desc';
      }
    } else{
      setSortConfig = setMissSortConfig;
      if (missSortConfig.key === key && missSortConfig.direction === 'asc') {
        direction = 'desc';
      }
    }

    setSortConfig({ key, direction });
  };

  const sortedDataWithState = (data: any[], table: string) => {
    const sortConfig =
    table === 'clear' ? clearSortConfig :
    table === 'score' ? scoreSortConfig : missSortConfig;
    return sortedData(data, sortConfig.key, sortConfig.direction);
  }

  const sortedData = (data: any[], key: string, direction: string) => {
    return data.sort((a, b) => {
      if (key === 'lv') {
        return direction === 'asc' ? a.lv - b.lv : b.lv - a.lv;
      }else if (key === 'title') {
        return direction === 'asc' ? a.title.localeCompare(b.title)  : b.title.localeCompare(a.title);
      }else if (key === 'beforeLamp'){
        return direction === 'asc' ? a.before - b.before : b.before - a.before;
      }else if (key === 'afterLamp'){
        return direction === 'asc' ? a.after - b.after : b.after - a.after;
      }else if (key === 'grade'){
        return direction === 'asc' ? a.afterRate - b.afterRate : b.afterRate - a.afterRate;
      }else if (key === 'score'){
        return direction === 'asc' ? a.afterScore - b.afterScore : b.afterScore - a.afterScore;
      }else if (key === 'bp'){
        return direction === 'asc' ? a.afterMisscount - b.afterMisscount : b.afterMisscount - a.afterMisscount;
      }else if (key === 'diff'){
        return direction === 'asc' ? a.diff - b.diff : b.diff - a.diff;
      }
      return 0;
    });
  };

  const processed = useMemo(() => {
    const clearUpdates: any[] = [];
    const scoreUpdates: any[] = [];
    const missUpdates: any[] = [];

    if (diff[mode]) {
      for (const id in diff[mode]) {
        for (const difficulty in diff[mode][id]) {
          const entry = diff[mode][id][difficulty];
          const lv = chartInfo[id]?.level?.[mode.toLowerCase()]?.[['B', 'N', 'H', 'A', 'L'].indexOf(difficulty)] || 'N/A';
          const notes = chartInfo[id]?.notes?.[mode.toLowerCase()]?.[['B', 'N', 'H', 'A', 'L'].indexOf(difficulty)] || 0;
          const title = titleMap[id] || id;

          if (excludeNewSongs) {
            if (entry?.cleartype?.old === 0 || entry?.score?.old === 0 || entry?.misscount?.old === 99999) {
              continue;
            }
          }

          // クリアタイプ更新
          if (entry?.cleartype?.new !== entry?.cleartype?.old && entry?.cleartype?.new > 1) {
            clearUpdates.push({
              id, title, difficulty, lv,
              before: entry.cleartype.old,
              after: entry.cleartype.new,
              colorBefore: clearTypeColor[entry.cleartype.old],
              colorAfter: clearTypeColor[entry.cleartype.new],
            });
          }

          // スコア更新
          if (entry?.score?.new !== entry?.score?.old) {
            const pBefore = entry.score.old / (notes * 2);
            const pAfter = entry.score.new / (notes * 2);
            scoreUpdates.push({
              id, title, difficulty, lv, notes,
              beforeScore: entry.score.old,
              afterScore: entry.score.new,
              beforeRate: pBefore,
              afterRate: pAfter,
              diff: entry.score.new - entry.score.old
            });
          }

          // ミスカウント更新
          if (entry?.misscount?.new !== entry?.misscount?.old) {
            missUpdates.push({
              id, title, difficulty, lv,
              beforeMisscount: entry.misscount.old === 99999 ? '-' : entry.misscount.old,
              afterMisscount: entry.misscount.new === 99999 ? '-' : entry.misscount.new,
              diff: entry.misscount.old === 99999 ? 99999 : entry.misscount.new - entry.misscount.old
            });
          }
        }
      }
    }

    return { clearUpdates: sortedData(clearUpdates, 'afterLamp', 'desc'), scoreUpdates: sortedData(scoreUpdates, 'grade', 'desc'), missUpdates: sortedData(missUpdates, 'bp', 'asc') };
  }, [diff, chartInfo, titleMap, mode, excludeNewSongs]);

  // データが存在しない場合の条件
  const hasUpdates = processed.clearUpdates.length > 0 || processed.scoreUpdates.length > 0 || processed.missUpdates.length > 0;

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">更新情報</Typography>

      <FormControlLabel
        control={<Checkbox checked={excludeNewSongs} onChange={(e) => setExcludeNewSongs(e.target.checked)} />}
        label="初プレー楽曲を除外する"
        sx={{ my: 2 }}
      />

      {processed.clearUpdates.length > 0 && (
        <>
          <Typography variant="h6">ランプ更新</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('clear', 'lv')}>☆</TableCell>
                  <TableCell onClick={() => handleSort('clear', 'title')}>Title</TableCell>
                  <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('clear', 'beforeLamp')}>Before</TableCell>
                  <TableCell></TableCell>
                  <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('clear', 'afterLamp')}>After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedDataWithState(processed.clearUpdates, 'clear').map((row) => (
                  <TableRow key={`${row.id}_${row.difficulty}`}>
                    <TableCell>☆{row.lv}</TableCell>
                    <TableCell>{row.title} [{row.difficulty}]</TableCell>
                    <TableCell sx={{ backgroundColor: row.colorBefore, textAlign: 'center' }}>{clearTypeLabel[row.before]}</TableCell>
                    <TableCell sx={{ paddingLeft: 0, paddingRight: 0, textAlign: 'center' }}>→</TableCell>
                    <TableCell sx={{ backgroundColor: row.colorAfter, textAlign: 'center' }}>{clearTypeLabel[row.after]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {processed.scoreUpdates.length > 0 && (
        <>
          <Typography variant="h6">スコア更新</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('score', 'lv')}>☆</TableCell>
                  <TableCell onClick={() => handleSort('score', 'title')}>Title</TableCell>
                  <TableCell onClick={() => handleSort('score', 'grade')}>Grade</TableCell>
                  <TableCell onClick={() => handleSort('score', 'score')}>Score</TableCell>
                  <TableCell onClick={() => handleSort('score', 'diff')}>Diff</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedDataWithState(processed.scoreUpdates, 'score').map((row) => (
                  <TableRow key={`${row.id}_${row.difficulty}`}>
                    <TableCell>☆{row.lv}</TableCell>
                    <TableCell>{row.title} [{row.difficulty}]</TableCell>
                    <TableCell>{getGrade(row.afterRate)} ({getDetailGrade(row.afterScore, row.notes)})</TableCell>
                    <TableCell>{row.afterScore} ({(row.afterRate * 100).toFixed(2)}%)</TableCell>
                    <TableCell>+{row.diff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {processed.missUpdates.length > 0 && (
        <>
          <Typography variant="h6">BP更新</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('miss', 'lv')}>☆</TableCell>
                  <TableCell onClick={() => handleSort('miss', 'title')}>Title</TableCell>
                  <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('miss', 'bp')}>BP</TableCell>
                  <TableCell sx={{ textAlign: 'center' }} onClick={() => handleSort('miss', 'diff')}>Diff</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedDataWithState(processed.missUpdates, 'miss').map((row) => (
                  <TableRow key={`${row.id}_${row.difficulty}`}>
                    <TableCell>☆{row.lv}</TableCell>
                    <TableCell>{row.title} [{row.difficulty}]</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {row.afterMisscount}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.diff !== 99999 ? row.diff : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {!hasUpdates && <Typography variant="h6">更新がありません</Typography>}
    </Box>
  );
};

export default NewPage;
