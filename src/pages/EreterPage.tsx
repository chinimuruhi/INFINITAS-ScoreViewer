import { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Paper, Box, Tabs, Tab, CircularProgress, Backdrop, LinearProgress
} from '@mui/material';
import FilterPanel from '../components/FilterPanel';
import LampAchieveProgress from '../components/LampAchieveProgress';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';
import { clearColorMap } from '../constants/colorConstrains';
import { convertDataToIdDiffKey} from '../utils/scoreDataUtils';
import { isMatchSong } from '../utils/filterUtils';
import { defaultMisscount } from '../constants/defaultValues';
import { getLampAchiveCount } from '../utils/lampUtils';

const EreterPage = () => {
  const { mode, filters, setFilters } = useAppContext();
  const [songs, setSongs] = useState<any[]>([]);
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [unlockedData, setUnlockedData] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'easy' | 'hard' | 'exhard'>('easy');
  const [loading, setLoading] = useState(true);
  const [chartInfo, setChartInfo] = useState<any>({});
  const [konamiInfInfo, setKonamiInfInfo] = useState<any>({});
  const [songInfo, setSongInfo] = useState<any>({});
  //const [estimatedSkill, setEstimatedSkill] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try { 
        const [songRes, titleRes, chartRes, konamiInfInfoRes, songInfoGz] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/ereter/songs_dict.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer()),
        ]);

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { clear, misscount, unlocked } = convertDataToIdDiffKey(local, mode);

        setSongs(Object.entries(songRes).flatMap(([id, diffs]: any) =>
          Object.entries(diffs).map(([diff, data]: any) => ({ id, difficulty: diff, ...data }))));
        setTitleMap(titleRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartRes))));
        setSongInfo(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));
        setKonamiInfInfo(konamiInfInfoRes);
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

/*
リコメンド計算がどうにもerter.netと離れてしまうので一旦廃止
  useEffect(() => {
    let isCancelled = false;
    const targets: { b: number; success: boolean }[] = [];
    const lampValues = { easy: 3, hard: 5, exhard: 6 };
    const a = 3;

    for (const song of songs) {
        const key = `${song.id}_${song.difficulty}`;
        const lamp = clearData[key];
        if (lamp === undefined || lamp === 0) continue;
        for (const lampValueKey in lampValues) {
          const keyTyped = lampValueKey as keyof typeof lampValues;
          const success = lamp >= lampValues[keyTyped];
          const diff = song[diffValueKey[keyTyped]];
          targets.push({ b: diff, success });
        }
    }
    
    if (targets.length === 0) {
      setEstimatedSkill(null);
      return;
    }

    const logLikelihood = (theta: number) => {
      return targets.reduce((sum, { b, success }) => {
        const p = 1 / (1 + Math.exp(-a * (theta - b)));
        return sum + (success ? Math.log(p) : Math.log(1 - p));
      }, 0);
    };

    const compute = () => {
      let bestTheta = 0;
      let bestLL = -Infinity;
      for (let t = -5; t <= 20; t += 0.01) {
        const ll = logLikelihood(t);
        if (ll > bestLL) {
          bestLL = ll;
          bestTheta = t;
        }
      }
      if (!isCancelled) setEstimatedSkill(bestTheta);
    };

    setTimeout(compute, 0);
    return () => { isCancelled = true; };
  }, [songs, clearData]);
*/

  const totalCount = filteredSongs.length;
  const stats = useMemo(() => {
    return getLampAchiveCount(filteredSongs, clearData);
  }, [filteredSongs, clearData]);

  const groupedSongs: { [key: string]: any[] } = {};
  filteredSongs.forEach(song => {
    const value = song[diffValueKey[activeTab]];
    const section = `${Math.floor(value)}.0 ~ ${Math.floor(value)}.9`;
    if (!groupedSongs[section]) groupedSongs[section] = [];
    groupedSongs[section].push(song);
  });

  const sortedSections = Object.keys(groupedSongs).sort((a, b) => parseFloat(b) - parseFloat(a));

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h4" gutterBottom>ereter's dp laboratory</Typography>

      {/* 
      リコメンド計算がどうにもerter.netと離れてしまうので一旦廃止
      http://walkure.net/hakkyou/komakai.html
      上記を参考に最尤推定法で計算を行ったが、低難易度の未エクハ等の外れ値に大きく影響を受ける
      {estimatedSkill === null ? (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">推定リコメンド値を計算中...</Typography>
        </Box>
      ):(
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">
            推定リコメンド値: ★{estimatedSkill.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ereter.netとは異なる計算である可能性が高いため、あくまで目安として使用してください。（地力譜面度不明のため）
          </Typography>
        </Box>
      )}
      */}

      <LampAchieveProgress stats={stats} totalCount={totalCount} />
      <FilterPanel filters={filters} onChange={setFilters} />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="EASY CLEAR難易度" value="easy" />
        <Tab label="HARD CLEAR難易度" value="hard" />
        <Tab label="EX HARD CLEAR難易度" value="exhard" />
      </Tabs>

      {sortedSections.map(section => (
        <Box key={section} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{section}</Typography>
          <Grid container spacing={2}>
          {groupedSongs[section]
              .slice()
              .sort((a, b) => b[diffValueKey[activeTab]] - a[diffValueKey[activeTab]])
              .map(song => {
                const key = `${song.id}_${song.difficulty}`;
                const lamp = clearData[key] ?? 0;
                const bg = clearColorMap[lamp];
                const title = titleMap[song.id] || song.id;
                const diffLabel = song.difficulty === 'A' ? '[A]' : song.difficulty === 'H' ? '[H]' : song.difficulty === 'L' ? '[L]' : '';
                const detailedDiff = song[diffValueKey[activeTab]];
                return (
                  <Grid item xs={6} sm={4} md={2} key={key}>
                    <Paper sx={{ p: 1.2, height: '100%', backgroundColor: bg }} elevation={3}>
                      <Typography variant="body2" fontWeight="bold">
                        {title} {diffLabel}
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
  );
};

export default EreterPage;
