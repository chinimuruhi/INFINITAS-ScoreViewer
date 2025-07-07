import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Paper, Box, CircularProgress, Backdrop, Tabs, Tab, LinearProgress
} from '@mui/material';
import { ungzip } from 'pako';
import FilterPanel, { FilterState } from '../components/FilterPanel';

const colorMap = {
  0: '#FFFFFF', 1: '#CCCCCC', 2: '#FF66CC', 3: '#99FF99',
  4: '#99CCFF', 5: '#FF6666', 6: '#FFFF99', 7: '#FF9966'
};

const difficultyIndexMap = { B: 0, N: 1, H: 2, A: 3, L: 4 };

const DpTablePage = () => {
  const [songList, setSongList] = useState<any[]>([]);
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [chartInfo, setChartInfo] = useState<Record<string, any>>({});
  const [songInfo, setSongInfo] = useState<Record<string, any>>({});
  const [labelMap, setLabelMap] = useState<Record<string, any>>({});
  const [clearData, setClearData] = useState<Record<string, number>>({});
  const [missData, setMissData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<number>(12);
  const [tabRanges, setTabRanges] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [songsRes, titleRes, chartResBuffer, songInfoBuffer, labelMapRes] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/dp/songs_dict.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(res => res.json())
        ]);

        const chartRes = JSON.parse(new TextDecoder().decode(ungzip(chartResBuffer)));
        const songInfoRes = JSON.parse(new TextDecoder().decode(ungzip(songInfoBuffer)));

        const expandedSongs: any[] = [];
        const rangeSet = new Set<number>();

        Object.entries(songsRes).forEach(([id, diffs]: any) => {
          Object.entries(diffs).forEach(([diff, entry]: any) => {
            expandedSongs.push({ id, difficulty: diff, ...entry });
            rangeSet.add(Math.floor(entry.value));
          });
        });

        expandedSongs.sort((a, b) => b.value - a.value);

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const user = local['DP'] || {};
        const clear: Record<string, number> = {};
        const miss: Record<string, number> = {};
        for (const id in user) {
          for (const diff in user[id]) {
            clear[`${id}_${diff}`] = user[id][diff].cleartype;
            miss[`${id}_${diff}`] = user[id][diff].misscount;
          }
        }

        setSongList(expandedSongs);
        setTitleMap(titleRes);
        setChartInfo(chartRes);
        setSongInfo(songInfoRes);
        setLabelMap(labelMapRes);
        setClearData(clear);
        setMissData(miss);
        setTabRanges([...rangeSet].sort((a, b) => a - b));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSongs = useMemo(() => songList.filter(s => {
    if (s.value < activeRange || s.value >= activeRange + 1) return false;
    const key = `${s.id}_${s.difficulty}`;
    const lamp = clearData[key] ?? 0;
    const unlocked = (localStorage.getItem('data') && JSON.parse(localStorage.getItem('data') || '{}')?.['DP']?.[s.id]?.[s.difficulty]?.unlocked) ?? false;

    if (filters.cleartype && filters.cleartype.length > 0 && !filters.cleartype.includes(lamp)) return false;
    if (filters.unlocked !== undefined && filters.unlocked !== unlocked) return false;
    const chart = chartInfo[s.id];
    if (filters.releaseType === 'ac' && !chart?.in_ac) return false;
    if (filters.releaseType === 'inf' && !chart?.in_inf) return false;
    if (filters.releaseType === 'both' && (!chart?.in_ac || !chart?.in_inf)) return false;
    if (filters.version && filters.version.length > 0) {
      const version = songInfo[s.id]?.version;
      if (!filters.version.includes(version)) return false;
    }
    if (filters.label && filters.label.length > 0) {
      const label = labelMap[s.id]?.label;
      if (!filters.label.includes(label)) return false;
    }
    return true;
  }), [songList, filters, activeRange, clearData, chartInfo, songInfo, labelMap]);

  const groupedByDecimal = useMemo(() => {
    const group: Record<string, any[]> = {};
    filteredSongs.forEach(song => {
      const decimal = (Math.floor(song.value * 10) / 10).toFixed(1);
      (group[decimal] ||= []).push(song);
    });
    return group;
  }, [filteredSongs]);

  const sortedDecimals = useMemo(() => Object.keys(groupedByDecimal).sort((a, b) => Number(b) - Number(a)), [groupedByDecimal]);

  const totalCount = filteredSongs.length;
  const stats = {
    easy: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 3).length,
    clear: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 4).length,
    hard: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 5).length,
    exhard: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 6).length,
    fullcombo: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 7).length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h4" gutterBottom>DP 難易度表</Typography>

      <Box sx={{ my: 2 }}>
        {(['easy', 'clear', 'hard', 'exhard', 'fullcombo'] as const).map(key => (
          <Box key={key} sx={{ mb: 1 }}>
            <Typography variant="body1">
              {key.toUpperCase()}達成率: {totalCount > 0 ? ((stats[key] / totalCount) * 100).toFixed(1) : '0.0'}% ({stats[key]}/{totalCount})
            </Typography>
            <LinearProgress variant="determinate" value={totalCount > 0 ? (stats[key] / totalCount) * 100 : 0} sx={{ backgroundColor: '#eee', '& .MuiLinearProgress-bar': { backgroundColor: colorMap[{ easy: 3, clear: 4, hard: 5, exhard: 6, fullcombo: 7 }[key]] } }} />
          </Box>
        ))}
      </Box>

      <FilterPanel filters={filters} onChange={setFilters} />

      <Tabs value={activeRange} onChange={(_, v) => setActiveRange(v)} sx={{ mb: 3 }}>
        {tabRanges.map(range => (
          <Tab key={range} label={`${range}.0~${range}.9`} value={range} />
        ))}
      </Tabs>

      {sortedDecimals.map(dec => (
        <Box key={dec} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{dec}</Typography>
          <Grid container spacing={2}>
            {groupedByDecimal[dec].map(song => {
              const key = `${song.id}_${song.difficulty}`;
              const lamp = clearData[key] ?? 0;
              const bg = colorMap[lamp];
              const title = titleMap[song.id] || song.id;
              const diffLabel = `[${song.difficulty}]`;
              const detailLink = `https://zasa.sakura.ne.jp/dp/music.php?id=${song.snj_id}`;
              const index = difficultyIndexMap[song.difficulty];
              const officialLevel = chartInfo[song.id]?.level?.dp?.[index];

              return (
                <Grid item xs={6} sm={4} md={2} key={key}>
                  <Paper sx={{ p: 1.2, height: '100%', backgroundColor: bg }} elevation={3}>
                    <Typography variant="body2" fontWeight="bold">
                      <a href={detailLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {title} {diffLabel}
                      </a>
                    </Typography>
                    <Typography variant="caption" display="block">
                      難易度: {officialLevel != null && officialLevel > 0 ? `☆${officialLevel} (${song.value.toFixed(1)})` : `(${song.value.toFixed(1)})`}
                    </Typography>
                    <Typography variant="caption" display="block">
                      MISS: {missData[key] == null || missData[key] === 99999 ? '-' : missData[key]}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Container>
  );
};

export default DpTablePage;
