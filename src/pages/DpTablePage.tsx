import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Paper, Box, CircularProgress, Backdrop, Tabs, Tab, LinearProgress
} from '@mui/material';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import { clearColorMap } from '../constants/colorConstrains';
import { difficultyKey } from '../constants/difficultyConstrains';
import { convertDataToIdDiffKey } from '../utils/scoreDataUtils';
import { isMatchSong } from '../utils/filterUtils';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';

const DpTablePage = () => {
  const { mode, filters, setFilters } = useAppContext();
  const [songList, setSongList] = useState<any[]>([]);
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [chartInfo, setChartInfo] = useState<Record<string, any>>({});
  const [songInfo, setSongInfo] = useState<Record<string, any>>({});
  const [konamiInfInfo, setKonamiInfInfo] = useState<Record<string, any>>({});
  const [clearData, setClearData] = useState<Record<string, number>>({});
  const [missData, setMissData] = useState<Record<string, number>>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<number>(12);
  const [tabRanges, setTabRanges] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [songsRes, titleRes, chartInfoRes, songInfoRes, konamiInfInfoRes] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/dp/songs_dict.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(res => res.json())
        ]);

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
        const { clear, misscount, unlocked } = convertDataToIdDiffKey(local, mode);

        setSongList(expandedSongs);
        setTitleMap(titleRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartInfoRes))));
        setSongInfo(JSON.parse(new TextDecoder().decode(ungzip(songInfoRes))));
        setKonamiInfInfo(konamiInfInfoRes);
        setClearData(clear);
        setMissData(misscount);
        setUnlockedData(unlocked);
        setTabRanges([...rangeSet].sort((a, b) => a - b));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSongs = useMemo(() => songList.filter(song => {
    if (song.value < activeRange || song.value >= activeRange + 1) return false;
    const key = `${song.id}_${song.difficulty}`;
    const lamp = clearData[key] ?? 0;
    const konami = konamiInfInfo[song.id] || {};
    const chart = chartInfo[song.id] || {};
    const unlocked = unlockedData[key] ?? false;
    const version = songInfo[song.id]?.version;
    const label = konamiInfInfo[song.id]?.label;

    return isMatchSong(filters, lamp, song.difficulty, konami, chart, unlocked, version, label);
  }), [songList, filters, activeRange, clearData, chartInfo, songInfo, konamiInfInfo]);

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
  const stats = useMemo(() => {
    return getLampAchiveCount(filteredSongs, clearData);
  }, [filteredSongs, clearData]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h4" gutterBottom>DP非公式難易度表</Typography>

      <LampAchieveProgress stats={stats} totalCount={totalCount} />
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
              const bg = clearColorMap[lamp];
              const title = titleMap[song.id] || song.id;
              const diffLabel = `[${song.difficulty}]`;
              const detailLink = `https://zasa.sakura.ne.jp/dp/music.php?id=${song.snj_id}`;
              const index = difficultyKey.indexOf(song.difficulty);
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

export default DpTablePage;
