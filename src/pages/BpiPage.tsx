import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Backdrop,
  LinearProgress,
  Container
} from '@mui/material';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';
import FilterPanel from '../components/FilterPanel';
import { calculateBpi } from '../utils/bpiUtils';
import { convertDataToIdDiffKey } from '../utils/scoreDataUtils';
import { getPercentage, getDetailGrade, getGrade } from '../utils/gradeUtils';
import { isMatchSong } from '../utils/filterUtils';
import { bpiGapColor, scoreColorMap } from '../constants/colorConstrains';

// BpiPageコンポーネント
const BpiPage = () => {
  const { mode, filters, setFilters } = useAppContext();
  const [gradeType, setGradeType] = useState<'aaa_bpi' | 'max_minus_bpi'>('aaa_bpi');
  const [level, setLevel] = useState<11 | 12>(12);
  const [songs, setSongs] = useState<any[]>([]);
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [scoreData, setScoreData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [konamiInfInfo, setKonamiInfInfo] = useState<any>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [songInfo, setSongInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          songsRes,
          titleRes,
          konamiInfInfoRes,
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
        setKonamiInfInfo(konamiInfInfoRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));
        setSongInfo(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { score, clear, unlocked } = convertDataToIdDiffKey(local, mode);
        setClearData(clear);
        setScoreData(score);
        setUnlockedData(unlocked);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode]);

  const getGap = (type: string, notes: number, score: number) => {
    return type === 'aaa_bpi' ? (notes * 2 * 8 / 9) - score : (notes * 2 * 17 / 18) - score;
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
      .filter((song) => song.level === level)
      .filter((song) => {
        const key = `${song.id}_${song.difficulty}`;
        const lamp = clearData[key] ?? 0;
        const konami = konamiInfInfo[song.id] || {};
        const chart = chartInfo[song.id] || {};
        const unlocked = unlockedData[key] ?? false;
        const version = songInfo[song.id]?.version;
        const label = konamiInfInfo[song.id]?.label;

        return isMatchSong(filters, lamp, song.difficulty, konami, chart, unlocked, version, label);
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
      .sort((a, b) => b[gradeType] - a[gradeType]);
  }, [songs, scoreData, level, gradeType, filters, konamiInfInfo, chartInfo]);

  const { sortedRanges, sections } = useMemo(() => {
    return groupByBpiRange(filteredSongs);
  }, [filteredSongs]);

  const totalBpi = useMemo(() => {
    const calculateLevelBpi = (level: number) => {
      const filteredLevelSongs = songs.filter(song => song.level === level);
      const n = filteredLevelSongs.length;
      if (n === 0) return -15;

      // 累乗係数 k = log2(n)
      let k = Math.log2(n);
      if (k === 0) k = 1;

      // 各曲のBPIを計算し、累積する
      const totalBpiValue = filteredLevelSongs.reduce((sum, song) => {
        const key = `${song.id}_${song.difficulty}`;
        const score = scoreData[key] ?? 0;

        const notes = song.notes ?? 0;
        const wr = song.wr ?? 0;
        const avg = song.avg ?? 0;
        const coef = song.coef ?? 1.175;

        if (score !== 0 && score <= notes * 2 ) {
          const bpi = calculateBpi(wr, avg, notes, score, coef) || -15;
          const m = Math.pow(Math.abs(bpi), k) / n;
          sum += bpi > 0 ? m : -m;
        } else {
          //未プレイと不正データの楽曲を-15で埋める
          const bpi = -15;
          const m = Math.pow(Math.abs(bpi), k) / n;
          sum += bpi > 0 ? m : -m;
        }
        return sum;
      }, 0);

      const res = Math.round(Math.pow(Math.abs(totalBpiValue), 1 / k) * 100) / 100;
      return totalBpiValue > 0 ? res : -res;
    };

    const selectedLevelBpi = calculateLevelBpi(level);

    return selectedLevelBpi;
  }, [songs, scoreData, level]);

  // 各グレードの達成率を計算する関数（難易度ごとに計算）
  const totalCount = filteredSongs.length;
  const achievementRates = useMemo(() => {
    const gradeCounts: Record<string, number> = { "A": 0, "AA": 0, "AAA": 0, "MAX-": 0 };

    filteredSongs.forEach((song) => {
      const key = `${song.id}_${song.difficulty}`;
      const score = scoreData[key] ?? 0;
      const percentage = getPercentage(score, song.notes);

      if (percentage >= 8 / 9) gradeCounts["AAA"]++;
      if (percentage >= 7 / 9) gradeCounts["AA"]++;
      if (percentage >= 6 / 9) gradeCounts["A"]++;
      if (percentage >= 17 / 18) gradeCounts["MAX-"]++;
    });

    return gradeCounts;
  }, [filteredSongs, scoreData]);


  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Beat Power Indicator(BPI)</Typography>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* 総合BPIの表示 */}
      <Typography variant="h6" gutterBottom>
        {`総合BPI(☆${level}): ${totalBpi.toFixed(2)}`}
      </Typography>

      {/* 達成率の表示 */}
      {Object.keys(achievementRates)
        .map((grade) => (
          <Box key={grade} sx={{ mb: 1 }}>
            <Typography variant="body1">
              {grade}達成率: {totalCount > 0
                ? `${((achievementRates[grade] / totalCount) * 100).toFixed(1)}% (${achievementRates[grade]}/${totalCount})`
                : '0.0% (0/0)'}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={totalCount > 0 ? (achievementRates[grade] / totalCount) * 100 : 0}
              sx={{
                backgroundColor: '#eee',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: scoreColorMap[grade],
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
                  <Box sx={song.score === 0 ? { p: 1, border: '1px solid #ccc', borderRadius: 2, backgroundColor: 'white' } : { p: 1, border: `3px solid ${bpiGapColor(song.gap, false)}`, borderRadius: 2, backgroundColor: bpiGapColor(song.gap, true) }}>
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
    </Container>
  );
};

export default BpiPage;
