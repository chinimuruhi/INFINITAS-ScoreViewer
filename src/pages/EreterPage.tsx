import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Paper, Box, Tabs, Tab, CircularProgress, Backdrop, LinearProgress
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

const EreterPage = () => {
  const { mode } = useAppContext();
  const [songs, setSongs] = useState<any[]>([]);
  const [titleMap, setTitleMap] = useState<{ [key: string]: string }>({});
  const [clearData, setClearData] = useState<{ [key: string]: number }>({});
  const [missData, setMissData] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'easy' | 'hard' | 'exhard'>('easy');
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(true);
  const [chartInfo, setChartInfo] = useState<any>({});
  const [labelMap, setLabelMap] = useState<{ [key: string]: number }>({});
  const [labelNameMap, setLabelNameMap] = useState<{ [key: number]: string }>({});
  const [versionMap, setVersionMap] = useState<any>({});
  //const [estimatedSkill, setEstimatedSkill] = useState<number | null>(null);

  const userUnlockStatus = (id: string, difficulty: string): boolean => {
    const local = JSON.parse(localStorage.getItem('data') || '{}');
    const song = local[mode]?.[id]?.[difficulty];
    return song?.unlocked ?? false;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [songRes, titleRes, chartRes, labelRes, labelNamesRes, versionRes, versionNamesRes] = await Promise.all([
        fetch('https://chinimuruhi.github.io/IIDX-Data-Table/ereter/songs_dict.json').then(res => res.json()),
        fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
        fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer()),
        fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(res => res.json()),
        fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/label.json').then(res => res.json()),
        fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(res => res.arrayBuffer()),
        fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/version.json').then(res => res.json())
      ]);

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

      setSongs(Object.entries(songRes).flatMap(([id, diffs]: any) =>
        Object.entries(diffs).map(([diff, data]: any) => ({ id, difficulty: diff, ...data }))));
      setTitleMap(titleRes);
      setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartRes))));
      const versionDecoded = JSON.parse(new TextDecoder().decode(ungzip(versionRes)));
      const versionMap: any = {};
      for (const id in versionDecoded) versionMap[id] = { version: versionDecoded[id].version };
      setVersionMap(versionMap);
      const labelParsed: { [key: string]: number } = {};
      for (const id in labelRes) labelParsed[id] = labelRes[id].label;
      setLabelMap(labelParsed);
      setLabelNameMap(labelNamesRes);
      setClearData(clear);
      setMissData(miss);
      setLoading(false);
    };

    fetchData();
  }, []);

  const lampAchieved = (lamp: number, threshold: number): boolean => lamp >= threshold;
  const diffValueKey = { easy: 'ec_diff', hard: 'hc_diff', exhard: 'exh_diff' };

  const filteredSongs = useMemo(() => songs.filter(song => {
    const key = `${song.id}_${song.difficulty}`;
    const lamp = clearData[key] ?? 0;
    const chart = chartInfo[song.id] || {};
    const unlocked = userUnlockStatus(song.id, song.difficulty);

    if (filters.cleartype && filters.cleartype.length > 0 && !filters.cleartype.includes(lamp)) return false;
    if (filters.unlocked !== undefined && filters.unlocked !== unlocked) return false;
    if (filters.releaseType) {
      if (filters.releaseType === 'ac' && !chart?.in_ac) return false;
      if (filters.releaseType === 'inf' && !chart?.in_inf) return false;
      if (filters.releaseType === 'both' && (!chart?.in_ac || !chart?.in_inf)) return false;
    }
    if (filters.version?.length && !filters.version.includes(versionMap[song.id]?.version)) return false;
    if (filters.label?.length && !filters.label.includes(labelMap[song.id])) return false;

    return true;
  }), [songs, clearData, chartInfo, filters, versionMap, labelMap]);

/*
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
  const stats = {
    easy: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] ?? 0, 3)).length,
    clear: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] ?? 0, 4)).length,
    hard: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] ?? 0, 5)).length,
    exhard: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] ?? 0, 6)).length,
    fullcombo: filteredSongs.filter(s => lampAchieved(clearData[`${s.id}_${s.difficulty}`] ?? 0, 7)).length
  };

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

      <Typography variant="h4" gutterBottom>DP Ereter 難易度表</Typography>

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

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="EASY CLEAR難易度" value="easy" />
        <Tab label="HARD CLEAR難易度" value="hard" />
        <Tab label="EX HARD CLEAR難易度" value="exhard" />
      </Tabs>

      <FilterPanel filters={filters} onChange={setFilters} />

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
                const bg = colorMap[lamp];
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

export default EreterPage;
