import { useEffect, useMemo, useState } from 'react';
import {
  Container, Typography, Grid, Paper, Box, Tabs, Tab, CircularProgress, Backdrop, LinearProgress
} from '@mui/material';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import SectionCard from '../components/SectionCard';
import { Page, PageHeader } from '../components/Page';
import { clearColorMap } from '../constants/colorConstrains';
import { cpiClearMap } from '../constants/clearConstrains';
import { convertDataToIdDiffKey } from '../utils/scoreDataUtils';
import { isMatchSong } from '../utils/filterUtils';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';

const CpiPage = () => {
  const { mode, filters, setFilters } = useAppContext();
  const [songs, setSongs] = useState<any[]>([]);
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<(keyof typeof cpiClearMap)[number]>('easy');
  const [loading, setLoading] = useState(true);
  const [konamiInfInfo, setKomaniInfInfo] = useState<any>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [songInfo, setSongInfo] = useState<any>({});
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
          konamiInfInfoRes,
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
        setKomaniInfInfo(konamiInfInfoRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));
        setSongInfo(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { clear, misscount, unlocked } = convertDataToIdDiffKey(local, mode);
        setClearData(clear);
        setMissData(misscount);
        setUnlockedData(unlocked);
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

  const totalCount = filteredSongs.length;
  const stats = useMemo(() => {
    return getLampAchiveCount(filteredSongs, clearData);
  }, [filteredSongs, clearData]);

  const estimateCPI = useMemo(() => {
    const targets: { cpi: number; kojinsa: number; success: boolean }[] = [];

    for (const song of songs) {
      const key = `${song.id}_${song.difficulty}`;
      const lamp = clearData[key];
      if (lamp === undefined || lamp === 0) continue;
      for (const lampValueKey in cpiClearMap) {
        const data = song[lampValueKey];
        if (data.cpi_value < 0 || data.kojinsa_value == null) continue;
        const keyTyped = lampValueKey as keyof typeof cpiClearMap;
        targets.push({
          cpi: data.cpi_value,
          kojinsa: data.kojinsa_value,
          success: lamp >= cpiClearMap[keyTyped],
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

  const getTitleFontSize = (text: string) => {
    const len = text.length;
    if (len >= 25) return { xs: 8, sm: 13, md: 13 };
    if (len >= 15) return { xs: 10, sm: 14, md: 14 };
    return { xs: 12, sm: 14, md: 14 };
  };

  const metaTextSx = {
    fontSize: { xs: 10, sm: 12, md: 12 }, // スマホは少し小さく
    lineHeight: 1.3,
    color: 'text.secondary',
  } as const;

  return (
    <Page>
      <PageHeader compact title="Clear Power Indicator(CPI)" />
      <SectionCard>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>
          <Typography variant="h6" gutterBottom>推定CPI(β): {estimateCPI.toFixed(2)}</Typography>
          <Typography variant="caption" color="text.secondary">
            cpi.makecir.comとは異なる推定方法であるため、あくまで目安として使用してください。（イローテーティングではなく最尤推定法を使用）
          </Typography>

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

              {/* xs=3カラム、sm/md=12カラム */}
              <Grid
                container
                spacing={{ xs: 1, sm: 2 }}
                columns={{ xs: 3, sm: 12, md: 12 }}
              >
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
                      // xs=1 → 3カラム、sm=4、md=2 は従来レイアウト維持
                      <Grid item xs={1} sm={4} md={2} key={key} sx={{ minWidth: 0 }}>
                        <Paper elevation={3} sx={{ p: { xs: 1, sm: 1.2 }, height: '100%', backgroundColor: bg }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              fontSize: getTitleFontSize(displayTitle), // ← 長いときだけ小さく
                              whiteSpace: 'normal',
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                              lineHeight: 1.35,
                            }}
                          >
                            <a
                              href={`https://cpi.makecir.com/scores/view/${song?.cpi_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              {displayTitle}
                            </a>
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
