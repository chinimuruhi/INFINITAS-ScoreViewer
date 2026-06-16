import { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Box, CircularProgress, Backdrop, Tabs, Tab
} from '@mui/material';
import { useMode } from '../context/ModeContext';
import { useFilters } from '../context/FilterContext';
import { useDataContext } from '../context/DataContext';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import { clearColorMap } from '../constants/colorConstrains';
import { difficultyKey } from '../constants/difficultyConstrains';
import { convertDataToIdDiffKey, songKey } from '../utils/scoreDataUtils';
import { isMatchSong } from '../utils/filterUtils';
import SongCard from '../components/SongCard';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';
import { Page, PageHeader } from '../components/Page';
import SectionCard from '../components/SectionCard';


const DpTablePage = () => {
  const { mode } = useMode();
  const { filters, setFilters } = useFilters();
  const { titleMap, chartInfo, songInfo, konamiInfInfo, commonLoading } = useDataContext();

  const [songList, setSongList] = useState<any[]>([]);
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
        const songsRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/dp/songs_dict.json').then(res => res.json());

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
    const key = songKey(song.id, song.difficulty);
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
  const stats = useMemo(() => getLampAchiveCount(filteredSongs, clearData), [filteredSongs, clearData]);

  return (
    <Page>
      <PageHeader compact title="DP非公式難易度表" />
      <SectionCard dense>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Backdrop open={loading || commonLoading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>

          <LampAchieveProgress stats={stats} totalCount={totalCount} />
          <FilterPanel filters={filters} onChange={setFilters} />

          <Tabs value={activeRange} onChange={(_, v) => setActiveRange(v)} sx={{ mb: 3 }} variant="scrollable">
            {tabRanges.map(range => (
              <Tab key={range} label={`${range}.0~${range}.9`} value={range} />
            ))}
          </Tabs>

          {sortedDecimals.map(dec => (
            <Box key={dec} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>{dec}</Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 12, md: 12 }}>
                {groupedByDecimal[dec].map(song => {
                  const key = songKey(song.id, song.difficulty);
                  const lamp = clearData[key] ?? 0;
                  const diffIndex = difficultyKey.indexOf(song.difficulty);
                  const officialLevel = chartInfo[song.id]?.level?.dp?.[diffIndex];
                  const title = `${titleMap[song.id] || song.id} [${song.difficulty}]`;
                  return (
                    <SongCard key={key} songId={song.id} difficultyIndex={diffIndex} title={title} backgroundColor={clearColorMap[lamp]}>
                      <Typography variant="caption" display="block">
                        難易度: {officialLevel != null && officialLevel > 0 ? `☆${officialLevel} (${song.value.toFixed(1)})` : `(${song.value.toFixed(1)})`}
                      </Typography>
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

export default DpTablePage;
