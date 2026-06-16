import { useEffect, useState, useMemo } from 'react';
import {
  Container, Tabs, Tab, Typography, Grid, Box, CircularProgress, Backdrop
} from '@mui/material';
import { Page, PageHeader } from '../components/Page';
import SectionCard from '../components/SectionCard';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import { useMode } from '../context/ModeContext';
import { useFilters } from '../context/FilterContext';
import { useDataContext } from '../context/DataContext';
import { isMatchSong } from '../utils/filterUtils';
import SongCard from '../components/SongCard';
import { clearColorMap } from '../constants/colorConstrains';
import { convertDataToIdDiffKey, songKey } from '../utils/scoreDataUtils';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';

import { difficultyKey } from '../constants/difficultyConstrains';

const Sp12TablePage = () => {
  const { mode } = useMode();
  const { filters, setFilters } = useFilters();
  const { titleMap, chartInfo, songInfo, konamiInfInfo, commonLoading } = useDataContext();

  const [songs, setSongs] = useState<any[]>([]);
  const [difficultyLabels, setDifficultyLabels] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'normal' | 'hard'>('normal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [songsRes, diffRes] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp12/songs_list.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp12/difficulty.json').then(res => res.json()),
        ]);
        setSongs(songsRes);
        setDifficultyLabels(diffRes);

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { clear, misscount, unlocked } = convertDataToIdDiffKey(local, mode);
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
    const key = songKey(song.id, song.difficulty);
    const lamp = clearData[key] ?? 0;
    const konami = konamiInfInfo[song.id] || {};
    const chart = chartInfo[song.id] || {};
    const unlocked = unlockedData[key] ?? false;
    const version = songInfo[song.id]?.version;
    const label = konamiInfInfo[song.id]?.label;
    return isMatchSong(filters, lamp, song.difficulty, konami, chart, unlocked, version, label);
  }), [songs, clearData, chartInfo, konamiInfInfo, filters, songInfo, mode]);

  const totalCount = filteredSongs.length;
  const stats = useMemo(() => getLampAchiveCount(filteredSongs, clearData), [filteredSongs, clearData]);

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
    <Page>
      <PageHeader compact title="SP☆12 難易度表" />
      <SectionCard>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Backdrop open={loading || commonLoading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>

          <LampAchieveProgress stats={stats} totalCount={totalCount} />
          <FilterPanel filters={filters} onChange={setFilters} />

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="CLEAR難易度" value="normal" />
            <Tab label="HARD難易度" value="hard" />
          </Tabs>

          {sortedLabels.map(group => (
            <Box key={group.label} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>{group.label}</Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 12, md: 12 }}>
                {group.songs.map((song) => {
                  const key = songKey(song.id, song.difficulty);
                  const lamp = clearData[key] ?? 0;
                  const title = `${titleMap[song.id] || song.id} [${song.difficulty}]`;
                  return (
                    <SongCard key={key} songId={song.id} difficultyIndex={difficultyKey.indexOf(song.difficulty)} title={title} backgroundColor={clearColorMap[lamp]}>
                      <Typography variant="caption" display="block">
                        MISS: {missData[key] == null || missData[key] === defaultMisscount ? '-' : missData[key]}
                      </Typography>
                    </SongCard>
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

export default Sp12TablePage;
