import { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Paper, Box, Tabs, Tab, CircularProgress, Backdrop, LinearProgress
} from '@mui/material';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import { useMode } from '../context/ModeContext';
import { useFilters } from '../context/FilterContext';
import { useDataContext } from '../context/DataContext';
import { clearColorMap } from '../constants/colorConstrains';
import { convertDataToIdDiffKey } from '../utils/scoreDataUtils';
import { isMatchSong } from '../utils/filterUtils';
import { getTitleFontSize } from '../utils/uiUtils';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';
import { Page, PageHeader } from '../components/Page';
import SectionCard from '../components/SectionCard';
import { useNavigate } from 'react-router-dom';
import { difficultyKey } from '../constants/difficultyConstrains';

const EreterPage = () => {
  const { mode } = useMode();
  const { filters, setFilters } = useFilters();
  const { titleMap, chartInfo, songInfo, konamiInfInfo, commonLoading } = useDataContext();

  const [songs, setSongs] = useState<any[]>([]);
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'easy' | 'hard' | 'exhard'>('easy');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const songRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/ereter/songs_dict.json').then(res => res.json());

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { clear, misscount, unlocked } = convertDataToIdDiffKey(local, mode);

        setSongs(Object.entries(songRes).flatMap(([id, diffs]: any) =>
          Object.entries(diffs).map(([diff, data]: any) => ({ id, difficulty: diff, ...data }))));
        setClearData(clear);
        setMissData(misscount);
        setUnlockedData(unlocked);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const diffValueKey = { easy: 'ec_diff', hard: 'hc_diff', exhard: 'exh_diff' };

  const filteredSongs = useMemo(() => songs.filter(song => {
    const key = `${song.id}_${song.difficulty}`;
    const lamp = clearData[key] ?? 0;
    const konami = konamiInfInfo[song.id] || {};
    const chart = chartInfo[song.id] || {};
    const unlocked = unlockedData[key] ?? false;
    const version = songInfo[song.id]?.version;
    const label = konamiInfInfo[song.id]?.label;
    return isMatchSong(filters, lamp, song.difficulty, konami, chart, unlocked, version, label);
  }), [songs, clearData, chartInfo, filters, songInfo, konamiInfInfo]);

  const totalCount = filteredSongs.length;
  const stats = useMemo(() => getLampAchiveCount(filteredSongs, clearData), [filteredSongs, clearData]);

  const groupedSongs: { [key: string]: any[] } = {};
  filteredSongs.forEach(song => {
    const value = song[diffValueKey[activeTab]];
    const section = `${Math.floor(value)}.0 ~ ${Math.floor(value)}.9`;
    if (!groupedSongs[section]) groupedSongs[section] = [];
    groupedSongs[section].push(song);
  });
  const sortedSections = Object.keys(groupedSongs).sort((a, b) => parseFloat(b) - parseFloat(a));

  return (
    <Page>
      <PageHeader compact title="ereter's dp laboratory" />
      <SectionCard dense>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Backdrop open={loading || commonLoading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>

          <LampAchieveProgress stats={stats} totalCount={totalCount} />
          <FilterPanel filters={filters} onChange={setFilters} />

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }} variant="scrollable">
            <Tab label="EASY難易度" value="easy" />
            <Tab label="HARD難易度" value="hard" />
            <Tab label="EX HARD難易度" value="exhard" />
          </Tabs>

          {sortedSections.map(section => (
            <Box key={section} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>{section}</Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 12, md: 12 }}>
                {groupedSongs[section]
                  .slice()
                  .sort((a, b) => b[diffValueKey[activeTab]] - a[diffValueKey[activeTab]])
                  .map(song => {
                    const key = `${song.id}_${song.difficulty}`;
                    const lamp = clearData[key] ?? 0;
                    const bg = clearColorMap[lamp];
                    const title = titleMap[song.id] || song.id;
                    const diffLabel =
                      song.difficulty === 'A' ? '[A]' :
                        song.difficulty === 'H' ? '[H]' :
                          song.difficulty === 'L' ? '[L]' : '';
                    const detailedDiff = song[diffValueKey[activeTab]];
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
                          <Typography variant="caption" display="block">
                            ★{detailedDiff.toFixed(1)}
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
      </SectionCard>
    </Page>
  );
};

export default EreterPage;
