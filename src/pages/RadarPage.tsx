import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Backdrop, Tabs, Tab
} from '@mui/material';
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Tooltip } from 'recharts';
import { ungzip } from 'pako';
import { useAppContext } from '../context/AppContext';
import { raderCategoryColors } from '../constants/colorConstrains';
import { chartCategories } from '../constants/chartInfoConstrains';
import { difficultyKey } from '../constants/difficultyConstrains';


const RadarPage = () => {
  const { mode } = useAppContext();
  const [radarData, setRadarData] = useState<Record<string, any>[]>([]);
  const [topSongs, setTopSongs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [topAverages, setTopAverages] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchRadar = async () => {
      setLoading(true);
      try {
        const radarUrl = mode === 'SP'
          ? 'https://chinimuruhi.github.io/IIDX-Data-Table/notes_radar/sp.json.gz'
          : 'https://chinimuruhi.github.io/IIDX-Data-Table/notes_radar/dp.json.gz';

        const [radarBuf, titleJson, chartInfoBuf] = await Promise.all([
          fetch(radarUrl).then(res => res.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(res => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(res => res.arrayBuffer())
        ]);

        const radarJson = JSON.parse(new TextDecoder().decode(ungzip(radarBuf)));
        const chartJson = JSON.parse(new TextDecoder().decode(ungzip(chartInfoBuf)));
        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const userData = local[mode] || {};
        const songRadarResults: any[] = [];

        for (const id in userData) {
          for (const diff in userData[id]) {
            const index = difficultyKey.indexOf(diff);
            const score = userData[id][diff].score;
            const notes = radarJson[id]?.notes?.[index] ?? 0;
            if (!notes || !score) continue;
            const scoreRate = score / (notes * 2);
            const radarItem: Record<string, any> = { id, diff, score, notes, scoreRate };
            chartCategories.forEach(cat => {
              const attr = radarJson[id]?.[cat]?.[index];
              if (attr) {
                radarItem[cat] = attr * scoreRate;
                radarItem[`${cat}_attr`] = attr;
              }
            });
            songRadarResults.push(radarItem);
          }
        }

        const top: Record<string, any[]> = {};
        const averages: Record<string, number> = {};
        chartCategories.forEach(cat => {
          const sorted = [...songRadarResults].sort((a, b) => (b[cat] ?? 0) - (a[cat] ?? 0)).slice(0, 10);
          top[cat] = sorted;
          averages[cat] = parseFloat((sorted.reduce((sum, cur) => sum + (cur[cat] ?? 0), 0) / 10).toFixed(2));
        });

        const reordered = ['NOTES', 'PEAK', 'SCRATCH', 'SOFLAN', 'CHARGE', 'CHORD'];
        const radarAverage = reordered.map(cat => ({
          subject: cat,
          A: averages[cat]
        }));

        setRadarData(radarAverage);
        setTopSongs(top);
        setTopAverages(averages);
        setTitleMap(titleJson);
        setChartInfo(chartJson);
      } finally {
        setLoading(false);
      }
    };
    fetchRadar();
  }, [mode]);

  const totalAverage = Object.values(topAverages).reduce((sum, v) => sum + v, 0).toFixed(2);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" gutterBottom>{mode} ノーツレーダー</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <RadarChart cx={250} cy={250} outerRadius={160} width={500} height={500} data={radarData}>
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#000' }} />
          <Radar name="Radar" dataKey="A" stroke="#00cc66" fill="#00cc66" fillOpacity={0.6} />
          <PolarGrid gridType="circle" />
          <PolarRadiusAxis angle={30} domain={[0, 200]} tick={false} axisLine={false} />
          <Tooltip formatter={(value: number) => value.toFixed(2)} />
        </RadarChart>
      </Box>

      <Typography variant="h6" align="center" sx={{ mt: 2 }}>Total: {totalAverage}</Typography>

      <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mt: 2 }} variant="scrollable" scrollButtons="auto">
        {chartCategories.map((cat, i) => (
          <Tab key={cat} label={`${cat} (${topAverages[cat]?.toFixed(2) ?? '-'})`} value={i} />
        ))}
      </Tabs>

      {chartCategories.map((cat, i) => selectedTab === i && (
        <Box key={cat} sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ color: 'black' }}>TOP10</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>曲名</TableCell>
                <TableCell>レベル</TableCell>
                <TableCell>レーダー値
                </TableCell>
                <TableCell>スコア</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topSongs[cat]?.map((s, i) => {
                const level = chartInfo[s.id]?.level?.[mode.toLowerCase()]?.[difficultyKey.indexOf(s.diff)];
                return (
                  <TableRow key={i}>
                    <TableCell>{titleMap[s.id] || s.id} [{s.diff}]</TableCell>
                    <TableCell>{level ? `☆${level}` : '-'}</TableCell>
                    <TableCell>{(s[cat] ?? 0).toFixed(2)} / {(s[`${cat}_attr`] ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{s.score} ({(s.scoreRate * 100).toFixed(2)}%)</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      ))}
    </Container>
  );
};

export default RadarPage;
