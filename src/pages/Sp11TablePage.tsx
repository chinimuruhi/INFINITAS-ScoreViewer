import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Tabs, Tab, Typography, Grid, Paper, Box, CircularProgress, Backdrop
} from '@mui/material';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';
import { clearColorMap } from '../constants/colorConstrains';
import { convertDataToIdDiffKey } from '../utils/scoreDataUtils';
import { isMatchSong } from '../utils/filterUtils';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';

const Sp11TablePage = () => {
  const { mode, filters, setFilters } = useAppContext();
  const [songs, setSongs] = useState<any[]>([]);
  const [difficultyLabels, setDifficultyLabels] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'normal' | 'hard'>('normal');
  const [konamiInfInfo, setKonamiInfInfo] = useState<any>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [songInfo, setSongInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [songsRes, diffRes, titleRes, konamiInfInfoRes, songInfoGz, chartGz] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp11/songs_list.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp11/difficulty.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer())
        ]);

        setSongs(songsRes);
        setDifficultyLabels(diffRes);
        setTitleMap(titleRes);
        setKonamiInfInfo(konamiInfInfoRes);
        setSongInfo(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { clear, misscount, unlocked } = convertDataToIdDiffKey(local, mode );
        setClearData(clear);
        setMissData(misscount);
        setUnlockedData(unlocked);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode]);

  const filteredSongs = useMemo(() => songs.filter(song => {
    const key = `${song.id}_${song.difficulty}`;
    const lamp = clearData[key] ?? 0;
    const konami = konamiInfInfo[song.id] || {};
    const chart = chartInfo[song.id] || {};
    const unlocked = unlockedData[key] ?? false;
    const version = songInfo[song.id]?.version;
    const label = konamiInfInfo[song.id]?.label;

    return isMatchSong(filters, lamp, song.difficulty, konami, chart, unlocked, version, label);
  }), [songs, clearData, chartInfo, filters, konamiInfInfo, songInfo]);

  const totalCount = filteredSongs.length;
  const stats = useMemo(() => {
    return getLampAchiveCount(filteredSongs, clearData);
  }, [filteredSongs, clearData]);

  const groupedSongs = useMemo(() => {
    const groups: { [label: string]: { label: string, songs: any[], value: number } } = {};
    filteredSongs.forEach(song => {
      const value = activeTab === 'normal' ? song.n_value : song.h_value;
      const label = difficultyLabels[activeTab]?.[String(value)] || '未定';
      if (!groups[label]) groups[label] = { label, songs: [], value: value ?? -1 };
      groups[label].songs.push(song);
    });
    return Object.values(groups).sort((a, b) => b.value - a.value);
  }, [filteredSongs, activeTab, difficultyLabels]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h4" gutterBottom>SP☆11 難易度表</Typography>
      <LampAchieveProgress stats={stats} totalCount={totalCount} />
      <FilterPanel filters={filters} onChange={setFilters} />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="CLEAR難易度" value="normal" />
        <Tab label="HARD CLEAR難易度" value="hard" />
      </Tabs>

      {groupedSongs.map(group => (
        <Box key={group.label} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{group.label}</Typography>
          <Grid container spacing={2}>
            {group.songs.map((song) => {
              const key = `${song.id}_${song.difficulty}`;
              const lamp = clearData[key] ?? 0;
              const bg = clearColorMap[lamp];
              const diffLabel = `[${song.difficulty}]`;
              const title = titleMap[song.id] || song.id;

              return (
                <Grid item xs={6} sm={4} md={2} key={key}>
                  <Paper sx={{ p: 1.2, height: '100%', backgroundColor: bg }} elevation={3}>
                    <Typography variant="body2" fontWeight="bold">
                      {title} {diffLabel}
                    </Typography>
                    <Typography variant="caption" display="block">
                      MISS: {missData[key] == null || missData[key] === defaultMisscount ? '-' : missData[key]}
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

export default Sp11TablePage;
