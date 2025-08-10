import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Tabs, Tab, Typography, Grid, Paper, Box, LinearProgress, CircularProgress, Backdrop
} from '@mui/material';
import FilterPanel, { FilterState } from '../components/FilterPanel';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';

const colorMap: { [key: number]: string } = {
  0: '#FFFFFF',
  1: '#CCCCCC',
  2: '#FF66CC',
  3: '#99FF99',
  4: '#99CCFF',
  5: '#FF6666',
  6: '#FFFF99',
  7: '#FF9966'
};

const Sp12TablePage = () => {
  const { mode } = useAppContext();
  const [songs, setSongs] = useState<any[]>([]);
  const [difficultyLabels, setDifficultyLabels] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'normal' | 'hard'>('normal');
  const [filters, setFilters] = useState<FilterState>({});
  const [songInfo, setSongInfo] = useState<any>({});
  const [labelMap, setLabelMap] = useState<any>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [versionMap, setVersionMap] = useState<any>({});
  const [versionLabels, setVersionLabels] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const userUnlockStatus = (id: string, difficulty: string): boolean => {
    const local = JSON.parse(localStorage.getItem('data') || '{}');
    const song = local[mode]?.[id]?.[difficulty];
    return song?.unlocked ?? false;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [songsRes, diffRes, titleRes, songInfoRes, labelRes, songInfoGz, versionRes, chartGz] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp12/songs_list.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp12/difficulty.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/label.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/version.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer())
        ]);

        setSongs(songsRes);
        setDifficultyLabels(diffRes);
        setTitleMap(titleRes);
        setSongInfo(songInfoRes);
        setLabelMap(labelRes);
        setVersionMap(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));
        setVersionLabels(versionRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const user = local[mode] || {};
        const clear: { [key: string]: number } = {};
        const miss: { [key: string]: number } = {};
        for (const id in user) {
          const entries = user[id];
          for (const diff in entries) {
            clear[`${id}_${diff}`] = entries[diff].cleartype;
            miss[`${id}_${diff}`] = entries[diff].misscount;
          }
        }
        setClearData(clear);
        setMissData(miss);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode]);

  const lampAchieved = (lamp: number, threshold: number): boolean => lamp >= threshold;

  const filteredSongs = useMemo(() => songs.filter(song => {
    const key = `${song.id}_${song.difficulty}`;
    const lamp = clearData[key] ?? 0;
    const info = songInfo[song.id] || {};
    const chart = chartInfo[song.id] || {};
    const unlocked = userUnlockStatus(song.id, song.difficulty);

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
  }), [songs, clearData, chartInfo, songInfo, filters, versionMap, mode]);

  const totalCount = filteredSongs.length;
  const stats = useMemo(() => ({
    easy: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] || 0, 3)).length,
    clear: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] || 0, 4)).length,
    hard: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] || 0, 5)).length,
    exhard: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] || 0, 6)).length,
    fullcombo: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] || 0, 7)).length
  }), [filteredSongs, clearData]);

  const groupedSongs = useMemo(() => {
    const result: { [label: string]: { label: string, songs: any[], value: number } } = {};
    filteredSongs.forEach(song => {
      const value = activeTab === 'normal' ? song.n_value : song.h_value;
      const label = difficultyLabels[activeTab]?.[String(value)] || '未定';
      if (!result[label]) result[label] = { label, songs: [], value: value ?? -1 };
      result[label].songs.push(song);
    });
    return result;
  }, [filteredSongs, activeTab, difficultyLabels]);

  const sortedLabels = useMemo(() => (
    Object.values(groupedSongs).sort((a, b) => b.value - a.value)
  ), [groupedSongs]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h4" gutterBottom>SP☆12 難易度表</Typography>

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

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="CLEAR難易度" value="normal" />
        <Tab label="HARD CLEAR難易度" value="hard" />
      </Tabs>

      {sortedLabels.map(group => (
        <Box key={group.label} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{group.label}</Typography>
          <Grid container spacing={2}>
            {group.songs.map((song) => {
              const key = `${song.id}_${song.difficulty}`;
              const lamp = clearData[key] ?? 0;
              const bg = colorMap[lamp];
              const diffLabel = song.difficulty === 'A' ? '' : `[${song.difficulty}]`;
              const title = titleMap[song.id] || song.id;

              return (
                <Grid item xs={6} sm={4} md={2} key={key}>
                  <Paper sx={{ p: 1.2, height: '100%', backgroundColor: bg }} elevation={3}>
                    <Typography variant="body2" fontWeight="bold">
                      {title} {diffLabel}
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

export default Sp12TablePage;
