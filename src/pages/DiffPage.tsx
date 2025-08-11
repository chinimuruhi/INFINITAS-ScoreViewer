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
  Button,
} from '@mui/material';
import { ungzip } from 'pako';
import { compressDiffData, decompressDiffData } from '../utils/encodeUtils'
import { useAppContext } from '../context/AppContext';
import { clearColorMap } from '../constants/colorConstrains';
import { simpleClearName } from '../constants/clearConstrains';
import { defaultMisscount } from '../constants/defaultValues';
import { getPercentage, getDetailGrade, getGrade } from '../utils/gradeUtils';

const urlLengthMax = 4088;

const DiffPage = () => {
  const { mode } = useAppContext();
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [diff, setDiff] = useState<any>({});
  const [user, setUser] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [excludeNewSongs, setExcludeNewSongs] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isUrldataValid, setIsUrldataValid] = useState(true);

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

      const urlParams = new URLSearchParams(window.location.search);
      const data = urlParams.get('data');
      if (data) {
        // URLパラメータにdataがある場合は、それをデコードして使用
        let inflatedData;
        try{
          inflatedData = decompressDiffData(data);
        } catch (error) {
          inflatedData = { 'diff': {}, 'user': {} };
          setIsUrldataValid(false);
        }
        setDiff(inflatedData['diff']);
        setUser(inflatedData['user'])
        setIsShared(true);
      } else {
        // dataがない場合はlocalStorageから読み込む
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

  const handleShare = () => {
    const data = { diff, user }
    const base64Data = compressDiffData(data);
    const topUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]+$/, '/');
    const currentUrl = window.location;
    const url = `${currentUrl}?data=${base64Data}`

    // ツイート文面を作成
    let tweetText = `${user.djname} さんの更新差分\n`
    if(processed.clearUpdatesCount['SP'] > 0){
      tweetText += `ランプ更新(SP)： ${processed.clearUpdatesCount['SP']}件\n`
    }
    if(processed.scoreUpdatesCount['SP'] > 0){
      tweetText += `スコア更新(SP)： ${processed.scoreUpdatesCount['SP']}件\n`
    }
    if(processed.missUpdatesCount['SP'] > 0){
      tweetText += `BP更新(SP)： ${processed.missUpdatesCount['SP']}件\n`
    }
    if(processed.clearUpdatesCount['DP'] > 0){
      tweetText += `ランプ更新(DP)： ${processed.clearUpdatesCount['DP']}件\n`
    }
    if(processed.scoreUpdatesCount['DP'] > 0){
      tweetText += `スコア更新(DP)： ${processed.scoreUpdatesCount['DP']}件\n`
    }
    if(processed.missUpdatesCount['DP'] > 0){
      tweetText += `BP更新(DP)： ${processed.missUpdatesCount['DP']}件\n`
    }

    tweetText += '\n'

    let twitterUrl;
    // TwitterのURLを生成
    if(url.length >= urlLengthMax){
      twitterUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(topUrl)}&hashtags=inf_sv&text=${encodeURIComponent(tweetText + '(更新データが多すぎるため共有URLの生成に失敗しました)\n\n')}`;
    }else{
      twitterUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&hashtags=inf_sv&text=${encodeURIComponent(tweetText)}\n`;
    }
    window.open(twitterUrl, '_blank');
  };

  const processed = useMemo(() => {
    const clearUpdates: any[] = [];
    const scoreUpdates: any[] = [];
    const missUpdates: any[] = [];
    const clearUpdatesCount = { 'SP': 0, 'DP': 0 };
    const scoreUpdatesCount = { 'SP': 0, 'DP': 0 };
    const missUpdatesCount = { 'SP': 0, 'DP': 0 };

    if (diff[mode]) {
      for (const id in diff[mode]) {
        for (const difficulty in diff[mode][id]) {
          const entry = diff[mode][id][difficulty];
          const lv = chartInfo[id]?.level?.[mode.toLowerCase()]?.[['B', 'N', 'H', 'A', 'L'].indexOf(difficulty)] || 'N/A';
          const notes = chartInfo[id]?.notes?.[mode.toLowerCase()]?.[['B', 'N', 'H', 'A', 'L'].indexOf(difficulty)] || 0;
          const title = titleMap[id] || id;

          // クリアタイプ更新
          if (entry?.cleartype?.new !== entry?.cleartype?.old && entry?.cleartype?.new > 1) {
            clearUpdatesCount[mode]++;
            if(excludeNewSongs && entry?.cleartype?.old === 0) continue;
            clearUpdates.push({
              id, title, difficulty, lv,
              before: entry.cleartype.old,
              after: entry.cleartype.new,
              colorBefore: clearColorMap[entry.cleartype.old],
              colorAfter: clearColorMap[entry.cleartype.new],
            });
          }

          // スコア更新
          if (entry?.score?.new !== entry?.score?.old) {
            scoreUpdatesCount[mode]++;
            if(excludeNewSongs && entry?.cleartype?.old === 0) continue;
            const pBefore = getPercentage(entry.score.old, notes);
            const pAfter = getPercentage(entry.score.new, notes);
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
            missUpdatesCount[mode]++;
            if(excludeNewSongs && entry?.misscount?.old === defaultMisscount) continue;
            missUpdates.push({
              id, title, difficulty, lv,
              beforeMisscount: entry.misscount.old === defaultMisscount ? '-' : entry.misscount.old,
              afterMisscount: entry.misscount.new === defaultMisscount ? '-' : entry.misscount.new,
              diff: entry.misscount.old === defaultMisscount ? defaultMisscount : entry.misscount.new - entry.misscount.old
            });
          }
        }
      }
    }

    return { clearUpdates: sortedData(clearUpdates, 'afterLamp', 'desc'), scoreUpdates: sortedData(scoreUpdates, 'grade', 'desc'), missUpdates: sortedData(missUpdates, 'bp', 'asc'), clearUpdatesCount, scoreUpdatesCount, missUpdatesCount };
  }, [diff, chartInfo, titleMap, mode, excludeNewSongs]);

  // データが存在しない場合の条件
  const hasUpdates = processed.clearUpdates.length > 0 || processed.scoreUpdates.length > 0 || processed.missUpdates.length > 0;

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 2, position: 'relative' }}>
      {isUrldataValid && <Typography variant="h5">{user.djname ? user.djname : '名無し'}さんの更新差分 {user.lastupdated ? `(${user.lastupdated})` :''}</Typography>}

      {hasUpdates && !isShared && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleShare}
          sx={{
            position: 'absolute',
            backgroundColor: 'black',
            color: 'white',
            top: 15, 
            right: 16,
            '&:hover': {
              backgroundColor: '#333333', // ホバー時の背景色を少し明るく
            },
          }}
        >
          𝕏でポスト
        </Button>
      )}
      
      {isUrldataValid && 
        <FormControlLabel
          control={<Checkbox checked={excludeNewSongs} onChange={(e) => setExcludeNewSongs(e.target.checked)} />}
          label="初プレー楽曲を除外する"
          sx={{ my: 2 }}
        />
      }

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
                    <TableCell sx={{ backgroundColor: row.colorBefore, textAlign: 'center' }}>{simpleClearName[row.before]}</TableCell>
                    <TableCell sx={{ paddingLeft: 0, paddingRight: 0, textAlign: 'center' }}>→</TableCell>
                    <TableCell sx={{ backgroundColor: row.colorAfter, textAlign: 'center' }}>{simpleClearName[row.after]}</TableCell>
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
                    <TableCell sx={{ textAlign: 'center' }}>{row.diff !== defaultMisscount ? row.diff : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {isShared && !isUrldataValid && <Typography variant="h6">共有データが破損しているため表示できませんでした。</Typography>}
      {!hasUpdates && isUrldataValid && <Typography variant="h6">更新がありません</Typography>}
    </Box>
  );
};

export default DiffPage;
