import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, Typography, Grid, Paper, Box, Tabs, Tab, CircularProgress, Backdrop, LinearProgress
} from '@mui/material';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';
import FilterPanel, { FilterState } from '../components/FilterPanel';

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

const cpiTypes = ['easy', 'clear', 'hard', 'exh', 'fc'] as const;

const CpiPage = () => {
  const { mode } = useAppContext();
  const [songs, setSongs] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<(typeof cpiTypes)[number]>('easy');
  const [loading, setLoading] = useState(true);
  const [songInfo, setSongInfo] = useState<any>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [versionMap, setVersionMap] = useState<any>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          cpiSongs,
          titleRes,
          songInfoRes,
          chartGz,
          songInfoGz
        ] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/cpi/songs_list.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer())
        ]);

        setSongs(cpiSongs);
        setTitleMap(titleRes);
        setSongInfo(songInfoRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));
        setVersionMap(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const clear: { [key: string]: number } = {};
        const unlocked: { [key: string]: boolean } = {};
        const miss: { [key: string]: number } = {};
        for (const id in local[mode]) {
          for (const diff in local[mode][id]) {
            clear[`${id}_${diff}`] = local[mode][id][diff].cleartype;
            unlocked[`${id}_${diff}`] = local[mode][id][diff].unlocked;
            miss[`${id}_${diff}`] = local[mode][id][diff].misscount;
          }
        }
        setClearData(clear);
        setUnlockedData(unlocked);
        setMissData(miss);
      } catch (error) {
        console.error("Error fetching data:", error);
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
    const unlocked = unlockedData[key] ?? false;
    const info = songInfo[song.id] || {};
    const chart = chartInfo[song.id] || {};

    if (filters.cleartype?.length && !filters.cleartype.includes(lamp)) return false;
    if (filters.unlocked !== undefined && filters.unlocked !== unlocked) return false;
    if (filters.releaseType) {
      if (filters.releaseType === 'ac' && !chart?.in_ac) return false;
      if (filters.releaseType === 'inf' && (!chart?.in_inf || (song.difficulty === 'L' && !info?.in_leggendaria))) return false;
      if (filters.releaseType === 'both' && (!chart?.in_ac || !chart?.in_inf || (song.difficulty === 'L' && !info?.in_leggendaria))) return false;
    }
    if (filters.version?.length && !filters.version.includes(versionMap[song.id]?.version)) return false;
    if (filters.label?.length && !filters.label.includes(songInfo[song.id]?.label)) return false;

    return true;
  }), [songs, clearData, unlockedData, chartInfo, songInfo, filters, versionMap, activeTab]);

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

  if (infinity.length > 0) {
    result['Infinity'] = { label: 'Infinity', value: Infinity, songs: infinity };
  }
  if (excluded.length > 0) {
    result['算出対象外'] = { label: '算出対象外', value: -Infinity, songs: excluded };
  }

  return result;
}, [filteredSongs, activeTab]);

const sortedBuckets = useMemo(() => (
  Object.values(groupedSongs).sort((a, b) => b.value - a.value)
), [groupedSongs]);

  const stats = useMemo(() => {
    const total = filteredSongs.length;
    const counts = {
      easy: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 3).length,
      clear: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 4).length,
      hard: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 5).length,
      exh: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 6).length,
      fc: filteredSongs.filter(s => (clearData[`${s.id}_${s.difficulty}`] ?? 0) >= 7).length,
      total
    };
    return counts;
  }, [filteredSongs, clearData]);

  const estimateCPI = useMemo(() => {
    const targets: { cpi: number; kojinsa: number; success: boolean }[] = [];
    const lampValues = {'easy': 3, 'clear': 4, 'hard': 5, 'exh': 6, 'fc':7 };

    for (const song of songs) {
        const key = `${song.id}_${song.difficulty}`;
        const lamp = clearData[key];
        if (lamp === undefined || lamp === 0) continue;
        for (const lampValueKey in lampValues) {
          const data = song[lampValueKey];
          if (data.cpi_value < 0 || data.kojinsa_value == null) continue;
          const keyTyped = lampValueKey as keyof typeof lampValues;
          targets.push({
            cpi: data.cpi_value,
            kojinsa: data.kojinsa_value,
            success: lamp >= lampValues[keyTyped],
          });
        }
    }

    if (targets.length === 0) return 0;

    const logLikelihood = (theta: number) =>
      targets.reduce((sum, { cpi, kojinsa, success }) => {
        const p = 1 / (1 + Math.exp(-((1 / kojinsa) * (theta - cpi))));
        return sum + (success ? Math.log(p) : Math.log(1 - p));
      }, 0);

  let bestTheta = 0;
  let bestLL = -Infinity;

  for (let t = 1000; t <= 3500; t += 1) {
    const ll = logLikelihood(t);
    if (ll > bestLL) {
      bestLL = ll;
      bestTheta = t;
    }
  }

  let refinedTheta = bestTheta;
  let refinedLL = bestLL;
  for (let t = bestTheta - 2; t <= bestTheta + 2; t += 0.01) {
    const ll = logLikelihood(t);
    if (ll > refinedLL) {
      refinedLL = ll;
      refinedTheta = t;
    }
  }

  return refinedTheta;

  }, [songs, clearData]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h4" gutterBottom>CPI表 ({mode}☆12)</Typography>
      <Typography variant="h6" gutterBottom>推定CPI: {estimateCPI.toFixed(2)}</Typography>
      <Typography variant="caption" color="text.secondary">
        cpi.makecir.comとは異なる推定方法であるため、あくまで目安として使用してください。（イローテーティングではなく最尤推定法を使用）
      </Typography>

      <Box sx={{ my: 2 }}>
        {cpiTypes.map(key => (
          <Box key={key} sx={{ mb: 1 }}>
            <Typography variant="body1">
              {key.toUpperCase()}達成率: {stats.total > 0 ? ((stats[key] / stats.total) * 100).toFixed(1) : '0.0'}% ({stats[key]}/{stats.total})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={stats.total > 0 ? (stats[key] / stats.total) * 100 : 0}
              sx={{
                backgroundColor: '#eee',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: colorMap[{ easy: 3, clear: 4, hard: 5, exh: 6, fc: 7 }[key]]
                }
              }}
            />
          </Box>
        ))}
      </Box>

      <FilterPanel filters={filters} onChange={setFilters} />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        {cpiTypes.map(type => (
          <Tab key={type} label={type.toUpperCase()} value={type} />
        ))}
      </Tabs>

{sortedBuckets.map(group => (
  <Box key={group.label} sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>
      {group.label === 'Infinity' ? 'CPI Infinity' :
       group.label === '算出対象外' ? '算出対象外' :
       `CPI ${group.label}`}
    </Typography>
    <Grid container spacing={2}>
      {group.songs
        .sort((a, b) => (b[activeTab]?.cpi_value ?? 0) - (a[activeTab]?.cpi_value ?? 0))
        .map(song => {
          const key = `${song.id}_${song.difficulty}`;
          const lamp = clearData[key] ?? 0;
          const bg = colorMap[lamp] ?? '#FFFFFF';
          const diffLabel = song.difficulty === 'A' ? '' : `[${song.difficulty}]`;
          const title = titleMap[song.id] || song.id;
          const cpiValue = song[activeTab]?.cpi_value;

          return (
            <Grid item xs={6} sm={4} md={2} key={key}>
              <Paper sx={{ p: 1.2, height: '100%', backgroundColor: bg }} elevation={3}>
                <Typography variant="body2" fontWeight="bold">
                  <a
                    href={`https://cpi.makecir.com/scores/view/${song[activeTab]?.cpi_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {title} {diffLabel}
                  </a>
                </Typography>
                {cpiValue !== -2 && (
                  <Typography variant="caption" display="block">
                    CPI: {cpiValue === -1 ? 'Infinity' : cpiValue}
                  </Typography>
                )}
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

export default CpiPage;
