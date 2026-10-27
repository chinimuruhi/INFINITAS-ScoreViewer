import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Backdrop,
  Container
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMode } from '../context/ModeContext';
import { useFilters } from '../context/FilterContext';
import { useDataContext } from '../context/DataContext';
import FilterPanel from '../components/FilterPanel';
import { calculateBpim2, calculateTotalBpim2 } from '../utils/bpim2Utils';
import { convertDataToIdDiffKey, songKey } from '../utils/scoreDataUtils';
import { getPercentage, getDetailGrade, getGrade } from '../utils/gradeUtils';
import { isMatchSong } from '../utils/filterUtils';
import { getTitleFontSize } from '../utils/uiUtils';
import { bpiGapColor, scoreColorMap } from '../constants/colorConstrains';
import { Page, PageHeader } from '../components/Page';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import { Note } from '../components/Notes';
import AchieveBars from '../components/AchieveBars';
import { tileTone } from '../utils/colorUtils';
import { difficultyKey } from '../constants/difficultyConstrains';

const Bpim2Page = () => {
  const { mode } = useMode();
  const theme = useTheme();
  const { filters, setFilters } = useFilters();
  const { titleMap, chartInfo, songInfo, konamiInfInfo, spCategory, dpCategory, commonLoading } = useDataContext();

  const [gradeType, setGradeType] = useState<'aaa_bpi' | 'max_minus_bpi'>('aaa_bpi');
  const [level, setLevel] = useState<11 | 12>(12);
  const [songs, setSongs] = useState<any[]>([]);
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [scoreData, setScoreData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const songsRes = await fetch(`https://chinimuruhi.github.io/IIDX-Data-Table/bpim2/${mode.toLowerCase()}_list.json`).then(res => res.json());
        setSongs(songsRes);

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { score, clear, unlocked } = convertDataToIdDiffKey(local, mode);
        setClearData(clear);
        setScoreData(score);
        setUnlockedData(unlocked);
      } catch (error) {
        console.error('Error fetching BPIM2 data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mode]);

  const getGap = (type: string, notes: number, score: number) => {
    return type === 'aaa_bpi' ? (notes * 2 * 8 / 9) - score : (notes * 2 * 17 / 18) - score;
  };

  const groupByBpiRange = (songs: any[]) => {
    const sections: { [key: string]: any[] } = {};
    songs.forEach((song) => {
      const bpi = song[gradeType];
      const range = Math.floor(bpi / 10) * 10;
      if (!sections[range]) sections[range] = [];
      sections[range].push(song);
    });
    Object.keys(sections).forEach((range) => {
      sections[range] = sections[range].slice().sort((a, b) => b[gradeType] - a[gradeType]);
    });
    const sortedRanges = Object.keys(sections).sort((a, b) => parseInt(b) - parseInt(a));
    return { sortedRanges, sections };
  };

  const filteredSongs = useMemo(() => {
    return songs
      .filter((song) => song.level === level)
      .filter((song) => {
        const key = songKey(song.id, song.difficulty);
        const lamp = clearData[key] ?? 0;
        const konami = konamiInfInfo[song.id] || {};
        const chart = chartInfo[song.id] || {};
        const unlocked = unlockedData[key] ?? false;
        const version = songInfo[song.id]?.version;
        const label = konamiInfInfo[song.id]?.label;
        const category = (mode === 'DP' ? dpCategory : spCategory)[song.id]?.[song.difficulty];
        return isMatchSong(filters, lamp, song.difficulty, konami, chart, unlocked, version, label, category);
      })
      .map((song) => {
        const key = songKey(song.id, song.difficulty);
        const score = scoreData[key] ?? 0;
        const notes = song.notes ?? 0;
        const gap = getGap(gradeType, notes, score);
        const bpi = calculateBpim2(song, score);
        const percentage = getPercentage(score, notes);
        return {
          ...song,
          gap,
          bpi: bpi ?? 0,
          percentage: percentage ?? 0,
          grade: getGrade(percentage),
          detailGrade: getDetailGrade(score, notes),
          bpm: song.bpm,
          score,
        };
      })
      .sort((a, b) => b[gradeType] - a[gradeType]);
  }, [songs, scoreData, level, gradeType, filters, konamiInfInfo, chartInfo, mode, spCategory, dpCategory]);

  const { sortedRanges, sections } = useMemo(() => groupByBpiRange(filteredSongs), [filteredSongs]);

  const totalBpi = useMemo(() => {
    const withScore = songs.map((song) => {
      const score = scoreData[songKey(song.id, song.difficulty)] ?? 0;
      // ノーツ数を超えるスコアは未プレイ扱い
      return { chart: song, score: score <= (song.notes ?? 0) * 2 ? score : 0 };
    });
    // 潜在スキルは全レベルのプレイ済み譜面から推定し、集計は選択レベルのみ
    const played = withScore.filter(({ score }) => score > 0);
    const scope = withScore.filter(({ chart }) => chart.level === level);
    return calculateTotalBpim2(scope, played) ?? -15;
  }, [songs, scoreData, level]);

  const totalCount = filteredSongs.length;
  const achievementRates = useMemo(() => {
    const gradeCounts: Record<string, number> = { 'A': 0, 'AA': 0, 'AAA': 0, 'MAX-': 0 };
    filteredSongs.forEach((song) => {
      const key = songKey(song.id, song.difficulty);
      const score = scoreData[key] ?? 0;
      const percentage = getPercentage(score, song.notes);
      if (percentage >= 8 / 9) gradeCounts['AAA']++;
      if (percentage >= 7 / 9) gradeCounts['AA']++;
      if (percentage >= 6 / 9) gradeCounts['A']++;
      if (percentage >= 17 / 18) gradeCounts['MAX-']++;
    });
    return gradeCounts;
  }, [filteredSongs, scoreData]);

  return (
    <Page>
      <PageHeader compact title="Beat Power Indicator(BPIM2)" />
      <SectionCard>
        <Container maxWidth={false} disableGutters>
          <Backdrop open={loading || commonLoading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">総合BPI（☆{level}）</Typography>
            <Typography sx={{ fontSize: { xs: 26, sm: 30 }, fontWeight: 700, lineHeight: 1.2 }}>{totalBpi.toFixed(2)}</Typography>
          </Box>
          <Note>BPIM2の定義データ・算出式（BPI V2）を使用しています。未プレイ譜面は推定値として総合BPIに反映されます。</Note>

          <AchieveBars
            totalCount={totalCount}
            items={Object.keys(achievementRates).map((grade) => ({ key: grade, label: grade, count: achievementRates[grade], color: scoreColorMap[grade] }))}
          />

          <FilterPanel filters={filters} onChange={setFilters} />

          <Box sx={{ my: 2, display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, WebkitOverflowScrolling: 'touch', '&::-webkit-scrollbar': { display: 'none' } }}>
            <ToggleButtonGroup value={gradeType} exclusive onChange={(e, v) => v && setGradeType(v)} size="small" sx={{ flexWrap: 'nowrap', '& .MuiToggleButton-root': { px: { xs: 1.25, sm: 1.5 }, py: { xs: 0.5, sm: 0.75 }, fontSize: { xs: 12, sm: 13 }, whiteSpace: 'nowrap' } }}>
              <ToggleButton value="aaa_bpi">
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>AAA</Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>AAA難易度表</Box>
              </ToggleButton>
              <ToggleButton value="max_minus_bpi">
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>MAX-</Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>MAX-難易度表</Box>
              </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup value={level} exclusive onChange={(e, v) => v && setLevel(v)} size="small" sx={{ flexWrap: 'nowrap', '& .MuiToggleButton-root': { px: { xs: 1.25, sm: 1.5 }, py: { xs: 0.5, sm: 0.75 }, fontSize: { xs: 12, sm: 13 }, whiteSpace: 'nowrap' } }}>
              <ToggleButton value={11}>☆11</ToggleButton>
              <ToggleButton value={12}>☆12</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {sortedRanges.map((range) => (
            <Box key={range} sx={{ my: 2 }}>
              <Typography variant="h6" sx={{ fontSize: { xs: 15, sm: 18, md: 20 }, lineHeight: 1.25, mb: 1 }}>
                {gradeType === 'aaa_bpi' ? 'AAA難易度' : 'MAX-難易度'}{' '}
                <Box component="span" sx={{ display: 'inline' }}>
                  BPI{range}〜{parseInt(range, 10) + 10}
                </Box>
              </Typography>
              <Grid container spacing={{ xs: 0.75, sm: 1 }} columns={{ xs: 3, sm: 12, md: 12 }}>
                {sections[range].map((song) => {
                  const key = songKey(song.id, song.difficulty);
                  const title = titleMap[song.id];
                  const displayTitle = `${title}[${song.difficulty}]`;
                  const colorGrade = song.percentage >= 17 / 18 ? 'MAX-' : song.grade;
                  const tone = tileTone(song.score === 0 ? undefined : scoreColorMap[colorGrade], theme);
                  const boxSx = {
                    p: { xs: 0.75, sm: 1 },
                    height: '100%',
                    cursor: 'pointer',
                    borderRadius: 0.5,
                    bgcolor: tone.bg,
                    color: tone.fg,
                    border: song.score === 0 ? `1px solid ${theme.palette.divider}` : `3px solid ${bpiGapColor(song.gap, false)}`,
                  };
                  return (
                    <Grid item xs={1} sm={6} md={4} key={key} sx={{ minWidth: 0 }}>
                      <Box sx={boxSx} onClick={() => navigate(`/edit/${song.id}/${difficultyKey.indexOf(song.difficulty)}`)}>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            fontSize: getTitleFontSize(displayTitle, true),
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            lineHeight: 1.35,
                          }}
                        >
                          {displayTitle}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: 9, sm: 13, md: 14 } }}>
                          難{song[gradeType].toFixed(2)}
                        </Typography>
                        <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: { sm: 13, md: 14 }, lineHeight: 1.3 }}>
                          Grade: {song.grade} ({song.detailGrade})
                        </Typography>
                        <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 9, lineHeight: 1.3, color: 'text.secondary' }}>
                          {song.grade} ({song.detailGrade})
                        </Typography>
                        <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: { sm: 13, md: 14 }, lineHeight: 1.3 }}>
                          EX Score: {song.score} ({(song.percentage * 100).toFixed(2)}%, BPI{song.bpi})
                        </Typography>
                        <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 9, lineHeight: 1.3, color: 'text.secondary' }}>
                          {song.score} ({(song.percentage * 100).toFixed(1)}%)
                        </Typography>
                        <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 9, lineHeight: 1.3, color: 'text.secondary' }}>
                          BPI{song.bpi}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </Container>
      </SectionCard>
    </Page>
  );
};

export default Bpim2Page;
