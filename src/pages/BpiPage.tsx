import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Backdrop,
  LinearProgress,
} from '@mui/material';
import { ungzip } from 'pako';
import FilterPanel, { FilterState } from '../components/FilterPanel';

// BPI計算の関数
const calculateBpi = (wr: number, avg: number, notes: number, ex: number, coef: number): number | null => {
  try {
    const maxScore = notes * 2;
    const powCoef = coef !== -1 ? coef : 1.175;
    
    const _s = pgf(ex, maxScore); // _pgf関数に相当
    const _k = pgf(avg, maxScore); // _pgf関数に相当
    const _z = pgf(wr, maxScore); // _pgf関数に相当
    
    const _s_ = _s / _k;
    const _z_ = _z / _k;
    
    const p = ex >= avg ? 1 : -1;
    
    const result = Math.round((p * 100.0) * Math.pow(p * Math.log(_s_) / Math.log(_z_), powCoef) * 100.0) / 100.0;
    
    return Math.max(-15, result);
  } catch (error) {
    return null;  // エラーが発生した場合はnullを返す
  }
};

// _pgf関数の実装
const pgf = (num: number, maxScore: number): number => {
  if (num === maxScore) {
    return maxScore * 0.8;
  } else {
    return 1.0 + (num / maxScore - 0.5) / (1.0 - num / maxScore);
  }
};

// BpiPageコンポーネント
const BpiPage = ({ mode }: { mode: 'SP' }) => {
  const [gradeType, setGradeType] = useState<'aaa_bpi' | 'max_minus_bpi'>('aaa_bpi');
  const [level, setLevel] = useState<11 | 12>(12);
  const [songs, setSongs] = useState<any[]>([]);
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [scoreData, setScoreData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [songInfo, setSongInfo] = useState<any>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [versionMap, setVersionMap] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          songsRes,
          titleRes,
          songInfoRes,
          chartGz,
          songInfoGz
        ] = await Promise.all([
          fetch(`https://chinimuruhi.github.io/IIDX-Data-Table/bpi/${mode.toLowerCase()}_list.json`).then((res) => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then((res) => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then((res) => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then((res) => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer())
        ]);

        setSongs(songsRes);
        setTitleMap(titleRes);
        setSongInfo(songInfoRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));
        setVersionMap(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const score: { [key: string]: number } = {};
        const clear: { [key: string]: number } = {};
        const unlocked: { [key: string]: boolean } = {};
        for (const id in local[mode]) {
          for (const diff in local[mode][id]) {
            score[`${id}_${diff}`] = local[mode][id][diff].score;
            clear[`${id}_${diff}`] = local[mode][id][diff].cleartype;
            unlocked[`${id}_${diff}`] = local[mode][id][diff].unlocked;
          }
        }
        setScoreData(score);
        setClearData(clear);
        setUnlockedData(unlocked);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode]);

  const getPercentage = (score: number, notes: number) => (score || 0) / (notes * 2);

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
    const percentage = getPercentage(score, notes);
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

  const getGap = (type: string, notes: number, score: number) => {
    return type === 'aaa_bpi' ? (notes * 2 * 8 / 9) - score : (notes * 2 * 17 / 18) - score;
  };

  // 進捗バーの色を決定する関数
  const getProgressBarColor = (grade: string) => {
    const colorMap: { [key: string]: string } = {
      'AAA': '#4caf50',
      'AA': '#ffeb3b',
      'A': '#ff9800',
      'MAX-': '#f44336'
    };
    return colorMap[grade] || '#2196f3'; // default blue
  };

  // BPIを10刻みのセクションでグループ化
  const groupByBpiRange = (songs: any[]) => {
    const sections: { [key: string]: any[] } = {};

    songs.forEach((song) => {
      const bpi = song[gradeType];
      const range = Math.floor(bpi / 10) * 10; // 10の幅で区切る

      if (!sections[range]) {
        sections[range] = [];
      }
      sections[range].push(song);
    });

    // セクション内でBPIが高い順に並べ替え
    Object.keys(sections).forEach((range) => {
      sections[range] = sections[range].sort((a, b) => b[gradeType] - a[gradeType]);
    });

    // BPI範囲を大きい順に並べ替え
    const sortedRanges = Object.keys(sections).sort((a, b) => parseInt(b) - parseInt(a));

    return { sortedRanges, sections };
  };

  // フィルターの処理
const filteredSongs = useMemo(() => {
  return songs
    .filter((song) => song.level === level) // レベルでフィルタリング
    .filter((song) => {
      const key = `${song.id}_${song.difficulty}`;
      const lamp = clearData[key] ?? 0;
      const info = songInfo[song.id] || {};
      const unlocked = unlockedData[key] ?? false;
      const chart = chartInfo[song.id] || {};

      // フィルター条件に基づいて絞り込み
      if (filters.cleartype && filters.cleartype.length > 0 && !filters.cleartype.includes(lamp)) return false;
      if (filters.unlocked !== undefined && filters.unlocked !== unlocked) return false;
      if (filters.releaseType) {
      if (filters.releaseType === 'ac' && !chart?.in_ac) return false;
      if (filters.releaseType === 'inf' && (!chart?.in_inf || (song.difficulty === 'L' && !info?.in_leggendaria))) return false;
      if (filters.releaseType === 'both' && (!chart?.in_ac || !chart?.in_inf || (song.difficulty === 'L' && !info?.in_leggendaria))) return false;
      }
    if (filters.version?.length && !filters.version.includes(versionMap[song.id]?.version)) return false;
    if (filters.label?.length && !filters.label.includes(songInfo[song.id]?.label)) return false;

      return true;
    })
    .map((song) => {
      const key = `${song.id}_${song.difficulty}`;
      const score = scoreData[key] ?? 0;

      const notes = song.notes ?? 0;
      const wr = song.wr ?? 0;
      const avg = song.avg ?? 0;
      const coef = song.coef ?? 1.175;

      const gap = getGap(gradeType, notes, score);
      const bpi = calculateBpi(wr, avg, notes, score, coef);
      const percentage = getPercentage(score, notes);
      const bpm = song.bpm;

      return {
        ...song,
        gap,
        bpi: bpi ?? 0,
        percentage: percentage ?? 0,
        grade: getGrade(percentage),
        detailGrade: getDetailGrade(score, notes),
        bpm,
        score,
      };
    })
    .sort((a, b) => b[gradeType] - a[gradeType]); // gradeTypeに基づいて並べ替え
}, [songs, scoreData, level, gradeType, filters, songInfo, chartInfo]);

  const { sortedRanges, sections } = useMemo(() => {
    return groupByBpiRange(filteredSongs);
  }, [filteredSongs]);
  
const totalBpi = useMemo(() => {
  const calculateLevelBpi = (level: number) => {
    const filteredLevelSongs = songs.filter(song => song.level === level);
    const n = filteredLevelSongs.length;
    if (n === 0) return -15;

    // 累乗係数 k = log2(n)
    const k = Math.log2(n);

    // 各曲のBPIを計算し、累積する
    const totalBpiValue = filteredLevelSongs.reduce((sum, song) => {
      const key = `${song.id}_${song.difficulty}`;
      const score = scoreData[key] ?? 0;

      const notes = song.notes ?? 0;
      const wr = song.wr ?? 0;
      const avg = song.avg ?? 0;
      const coef = song.coef ?? 1.175;

      const bpi = calculateBpi(wr, avg, notes, score, coef);
      if (bpi != null) {
        if(bpi >= 0){
          return sum + Math.pow(bpi, k);
        }else{
          return sum - Math.pow(Math.abs(bpi), k);
        }
      }
      return sum;
    }, 0);

    // 総合BPIの計算
    if(totalBpiValue >=0){
      return Math.pow(totalBpiValue / n, 1 / k);
    }else{
      return -Math.pow(Math.abs(totalBpiValue) / n, 1 / k);
    }
  };

  const selectedLevelBpi = calculateLevelBpi(level); // 現在選択されている難易度で総合BPIを計算

  return selectedLevelBpi;
}, [songs, scoreData, level]); // levelが変更されるたびに再計算


  // gapに応じて背景色を決める
  const getColor = (gap: number, isBg: boolean): string => {
    let alpha = "1";
    if (isBg) alpha = "0.5";
    if (gap < -20) return "rgba(255, 49, 49, " + alpha + ")"; 
    if (gap < -15) return "rgba(255, 78, 78, " + alpha + ")";
    if (gap < -10) return "rgba(255, 140, 140, " + alpha + ")";
    if (gap < -5) return "rgba(255, 180, 180, " + alpha + ")";
    if (gap < 0) return "rgba(255, 233, 153, " + alpha + ")";
    if (gap <= 5) return "rgba(234, 239, 249, " + alpha + ")";
    if (gap <= 10) return "rgba(108, 155, 210, " + alpha + ")";
    if (gap <= 15) return "rgba(24, 127, 196, " + alpha + ")";
    if (gap <= 20) return "rgba(0, 104, 183, " + alpha + ")";
    if (gap <= 30) return "rgba(0, 98, 172, " + alpha + ")";
    if (gap <= 40) return "rgba(0, 82, 147, " + alpha + ")";
    if (gap <= 50) return "rgba(0, 64, 119, " + alpha + ")";
    return "rgba(0, 53, 103, " + alpha + ")";
  };

  // 各グレードの達成率を計算する関数（難易度ごとに計算）
const achievementRates = useMemo(() => {
  const gradeCounts = { "AAA": 0, "AA": 0, "A": 0, "MAX-": 0, total: filteredSongs.length };

  filteredSongs.forEach((song) => {
    const key = `${song.id}_${song.difficulty}`;
    const score = scoreData[key] ?? 0;
    const percentage = getPercentage(score, song.notes);

    if (percentage >= 8 / 9) gradeCounts["AAA"]++;
    else if (percentage >= 7 / 9) gradeCounts["AA"]++;
    else if (percentage >= 6 / 9) gradeCounts["A"]++;
    else if (percentage >= 17 / 18) gradeCounts["MAX-"]++;
  });

  return gradeCounts;
}, [filteredSongs, scoreData]);


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">BPIページ</Typography>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* 総合BPIの表示 */}
    <Typography variant="h6">
      {`総合BPI（☆${level}）: ${totalBpi.toFixed(2)}`}
    </Typography>

      {/* 達成率の表示 */}
      {['MAX-', 'AAA', 'AA', 'A'].map((grade) => (
        <Box key={grade} sx={{ my: 2 }}>
          <Typography variant="h6">
            {grade}達成率: {achievementRates.total > 0 ? `${((achievementRates[grade] / achievementRates.total) * 100).toFixed(1)}% (${achievementRates[grade]}/${achievementRates.total})` : '0.0% (0/0)'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={achievementRates.total > 0 ? (achievementRates[grade] / achievementRates.total) * 100 : 0}
            sx={{
              backgroundColor: '#eee',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getProgressBarColor(grade),
              },
            }}
          />
        </Box>
      ))}

      <FilterPanel filters={filters} onChange={setFilters} />

      <Box sx={{ my: 2 }}>
        <ToggleButtonGroup value={gradeType} exclusive onChange={(e, v) => v && setGradeType(v)} sx={{ ml: 2 }}>
          <ToggleButton value="aaa_bpi">AAA難易度表</ToggleButton>
          <ToggleButton value="max_minus_bpi">MAX-難易度表</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup value={level} exclusive onChange={(e, v) => v && setLevel(v)} sx={{ ml: 2 }}>
          <ToggleButton value={11}>☆11</ToggleButton>
          <ToggleButton value={12}>☆12</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* BPIセクションを表示 */}
      {sortedRanges.map((range) => (
        <Box key={range} sx={{ my: 2 }}>
          <Typography variant="h6">{gradeType === 'aaa_bpi' ? 'AAA難易度' : 'MAX-難易度'} BPI{range}〜{parseInt(range) + 10}</Typography>
          <Grid container spacing={2}>
            {sections[range].map((song) => {
              const key = `${song.id}_${song.difficulty}`;
              return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Box sx={song.score === 0 ? { p: 1, border: '1px solid #ccc', borderRadius: 2, backgroundColor: 'white' } : { p: 1, border: `3px solid ${getColor(song.gap, false)}`, borderRadius: 2, backgroundColor: getColor(song.gap, true) }}>
                    <Typography variant="body2" fontWeight="bold">
                      {titleMap[song.id]}{`[${song.difficulty}]`}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">難{song[gradeType].toFixed(2)}</Typography>
                    <Typography variant="body2">
                      Grade: {song.grade} ({song.detailGrade})
                    </Typography>
                    <Typography variant="body2">EX Score: {song.score} ({(song.percentage * 100).toFixed(2)}%, BPI{song.bpi})</Typography>
                    
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default BpiPage;
