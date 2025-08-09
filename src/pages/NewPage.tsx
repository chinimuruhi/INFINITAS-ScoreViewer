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

const NewPage = ({ mode }: { mode: 'SP' | 'DP' }) => {
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [diff, setDiff] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [excludeNewSongs, setExcludeNewSongs] = useState(false); // 初プレー楽曲を除外するチェックボックス

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

          // 初プレー楽曲を除外するチェックボックスがオンの場合、条件に一致するものを除外
          if (excludeNewSongs) {
            if (entry?.cleartype?.old === 0 || entry?.score?.old === 0 || entry?.misscount?.old === 99999) {
              continue;
            }
          }

          // クリアタイプ更新
          if (entry?.cleartype?.new !== entry?.cleartype?.old && entry?.cleartype?.new > 1) {
            clearUpdates.push({
              id, title, difficulty, lv,
              before: clearTypeLabel[entry.cleartype.old],
              after: clearTypeLabel[entry.cleartype.new],
              colorBefore: clearTypeColor[entry.cleartype.old],
              colorAfter: clearTypeColor[entry.cleartype.new],
            });
          }

          // スコア更新
          if (entry?.score?.new !== entry?.score?.old) {
            const pBefore = entry.score.old / (notes * 2);
            const pAfter = entry.score.new / (notes * 2);
            scoreUpdates.push({
              id, title, difficulty, lv,
              beforeScore: entry.score.old,
              afterScore: entry.score.new,
              beforeRate: pBefore,
              afterRate: pAfter
            });
          }

          // ミスカウント更新
          if (entry?.misscount?.new !== entry?.misscount?.old) {
            missUpdates.push({
              id, title, difficulty, lv,
              before: entry.misscount.old === 99999 ? '-' : entry.misscount.old,
              after: entry.misscount.new === 99999 ? '-' : entry.misscount.new
            });
          }
        }
      }
    }

    return { clearUpdates, scoreUpdates, missUpdates };
  }, [diff, chartInfo, titleMap, mode, excludeNewSongs]);

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">更新情報</Typography>

      {/* 「初プレー楽曲を除外する」チェックボックス */}
      <FormControlLabel
        control={<Checkbox checked={excludeNewSongs} onChange={(e) => setExcludeNewSongs(e.target.checked)} />}
        label="初プレー楽曲を除外する"
        sx={{ my: 2 }}
      />

      <Typography variant="h6">ランプ更新</Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>☆</TableCell>
              <TableCell>Title</TableCell>
              <TableCell></TableCell>
              <TableCell sx={{textAlign: 'center' }}>Lamp</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processed.clearUpdates.map((row) => (
              <TableRow key={row.id}>
                <TableCell>☆{row.lv}</TableCell>
                <TableCell>{row.title} [{row.difficulty}]</TableCell>
                <TableCell sx={{ backgroundColor: row.colorBefore, textAlign: 'center' }}>{row.before}</TableCell>
                <TableCell sx={{ paddingLeft: 0, paddingRight: 0, textAlign: 'center' }}>→</TableCell>
                <TableCell sx={{ backgroundColor: row.colorAfter, textAlign: 'center' }}>{row.after}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6">スコア更新</Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>☆</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>diff</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processed.scoreUpdates.map((row) => (
              <TableRow key={row.id}>
                <TableCell>☆{row.lv}</TableCell>
                <TableCell>{row.title} [{row.difficulty}]</TableCell>
                <TableCell>{getGrade(row.afterRate)} </TableCell>
                <TableCell>{row.afterScore}({(row.afterRate * 100).toFixed(2)}%)</TableCell>
                <TableCell>+{row.afterScore - row.beforeScore}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6">BP更新</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>☆</TableCell>
              <TableCell>Title</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>Score</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>diff</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processed.missUpdates.map((row) => (
              <TableRow key={row.id}>
                <TableCell>☆{row.lv}</TableCell>
                <TableCell>{row.title} [{row.difficulty}]</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{row.before !== '-' ? `${row.before} → ${row.after}`: row.after}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{row.before !== '-' ? row.after - row.before : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default NewPage;
