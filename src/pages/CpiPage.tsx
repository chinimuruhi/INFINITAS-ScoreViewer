import { useEffect, useMemo, useState } from 'react';
import {
  Container, Typography, Grid, Paper, Box, Tabs, Tab, CircularProgress, Backdrop
} from '@mui/material';
import { useMode } from '../context/ModeContext';
import { useFilters } from '../context/FilterContext';
import { useDataContext } from '../context/DataContext';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import SectionCard from '../components/SectionCard';
import { Page, PageHeader } from '../components/Page';
import { clearColorMap } from '../constants/colorConstrains';
import { cpiClearMap } from '../constants/clearConstrains';
import { convertDataToIdDiffKey } from '../utils/scoreDataUtils';
import { isMatchSong } from '../utils/filterUtils';
import { getTitleFontSize } from '../utils/uiUtils';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';
import { useNavigate } from 'react-router-dom';
import { difficultyKey } from '../constants/difficultyConstrains';

const CpiPage = () => {
  const { mode } = useMode();
  const { filters, setFilters } = useFilters();
  const { titleMap, chartInfo, songInfo, konamiInfInfo, commonLoading } = useDataContext();

  const [songs, setSongs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<(keyof typeof cpiClearMap)[number]>('easy');
  const [loading, setLoading] = useState(true);
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cpiSongs = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/cpi/songs_list.json').then(res => res.json());
        setSongs(cpiSongs);

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { clear, misscount, unlocked } = convertDataToIdDiffKey(local, mode);
        setClearData(clear);
        setMissData(misscount);
        setUnlockedData(unlocked);
      } catch (error) {
        console.error('Error fetching CPI data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mode]);

  const filteredSongs = useMemo(() => songs.filter(song => {
    const value = song[activeTab]?.cpi_value;
    if (value == null) return false;
    const key = `${song.id}_${song.difficulty}`;
    const lamp = clearData[key] ?? 0;
    const konami = konamiInfInfo[song.id] || {};
    const chart = chartInfo[song.id] || {};
    const unlocked = unlockedData[key] ?? false;
    const version = songInfo[song.id]?.version;
    const label = konamiInfInfo[song.id]?.label;
    return isMatchSong(filters, lamp, song.difficulty, konami, chart, unlocked, version, label);
  }), [songs, clearData, unlockedData, chartInfo, konamiInfInfo, filters, songInfo, activeTab]);

  const groupedSongs = useMemo(() => {
    const result: { [label: string]: { label: string; value: number; songs: any[] } } = {};
    const infinity: any[] = [];
    const excluded: any[] = [];
    filteredSongs.forEach(song => {
      const value = song[activeTab].cpi_value;
      if (value === -1) {
        infinity.push(song);
      } else if (value === -2) {
        excluded.push(song);
      } else {
        const bucket = Math.floor(value / 50) * 50;
        const label = `${bucket}~${bucket + 49}`;
        if (!result[label]) result[label] = { label, value: bucket, songs: [] };
        result[label].songs.push(song);
      }
    });
    if (infinity.length > 0) result['Infinity'] = { label: 'Infinity', value: Infinity, songs: infinity };
    if (excluded.length > 0) result['算出対象外'] = { label: '算出対象外', value: -Infinity, songs: excluded };
    return result;
  }, [filteredSongs, activeTab]);

  const sortedBuckets = useMemo(() => (
    Object.values(groupedSongs).sort((a, b) => b.value - a.value)
  ), [groupedSongs]);

  const totalCount = filteredSongs.length;
  const stats = useMemo(() => getLampAchiveCount(filteredSongs, clearData), [filteredSongs, clearData]);

  const metaTextSx = {
    fontSize: { xs: 10, sm: 12, md: 12 },
    lineHeight: 1.3,
    color: 'text.secondary',
  } as const;

  return (
    <Page>
      <PageHeader compact title="Clear Power Indicator(CPI)" />
      <SectionCard>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Backdrop open={loading || commonLoading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>

          <LampAchieveProgress stats={stats} totalCount={totalCount} />
          <FilterPanel filters={filters} onChange={setFilters} />

          <Tabs value={activeTab} variant="scrollable" onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            {Object.keys(cpiClearMap).map(type => (
              <Tab key={type} label={type.toUpperCase()} value={type} />
            ))}
          </Tabs>

          {sortedBuckets.map(group => (
            <Box key={group.label} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {group.label === 'Infinity' ? 'CPI Infinity'
                  : group.label === '算出対象外' ? '算出対象外'
                    : `CPI ${group.label}`}
              </Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 12, md: 12 }}>
                {group.songs
                  .sort((a, b) => (b[activeTab]?.cpi_value ?? 0) - (a[activeTab]?.cpi_value ?? 0))
                  .map(song => {
                    const key = `${song.id}_${song.difficulty}`;
                    const lamp = clearData[key] ?? 0;
                    const bg = clearColorMap[lamp] ?? '#FFFFFF';
                    const diffLabel = song.difficulty === 'A' ? '' : `[${song.difficulty}]`;
                    const title = titleMap[song.id] || song.id;
                    const cpiValue = song[activeTab]?.cpi_value;
                    const displayTitle = `${title} ${diffLabel}`;
                    return (
                      <Grid item xs={1} sm={4} md={2} key={key} sx={{ minWidth: 0 }}>
                        <Paper elevation={3} sx={{ p: { xs: 1, sm: 1.2 }, height: '100%', backgroundColor: bg }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              fontSize: getTitleFontSize(displayTitle),
                              whiteSpace: 'normal',
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                              lineHeight: 1.35,
                            }}
                            onClick={() => navigate(`/edit/${song.id}/${difficultyKey.indexOf(song.difficulty)}`)}
                          >
                            {displayTitle}
                          </Typography>
                          {cpiValue !== -2 && (
                            <Typography variant="caption" display="block" sx={metaTextSx}>
                              CPI: {cpiValue === -1 ? 'Infinity' : cpiValue}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block" sx={metaTextSx}>
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
      </SectionCard>
    </Page>
  );
};

export default CpiPage;
