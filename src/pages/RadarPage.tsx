import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Backdrop, Tabs, Tab
} from '@mui/material';
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ungzip } from 'pako';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppContext } from '../context/AppContext';
import { raderCategoryColors } from '../constants/colorConstrains';
import { chartCategories } from '../constants/chartInfoConstrains';
import { difficultyKey } from '../constants/difficultyConstrains';
import SectionCard from '../components/SectionCard';
import { Page, PageHeader } from '../components/Page';


const RadarPage = () => {
  const { mode } = useAppContext();
  const [radarData, setRadarData] = useState<Record<string, any>[]>([]);
  const [topSongs, setTopSongs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [chartInfo, setChartInfo] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [topAverages, setTopAverages] = useState<Record<string, number>>({});
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

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

        const pickBestPerSong = (items: any[], cat: string) => {
          const map = new Map<string, any>();
          for (const it of items) {
            const v = it[cat] ?? 0;
            if (!v) continue;
            const prev = map.get(it.id);
            if (!prev || v > (prev[cat] ?? 0)) {
              map.set(it.id, it);
            }
          }
          return Array.from(map.values());
        };

        chartCategories.forEach(cat => {
          const deduped = pickBestPerSong(songRadarResults, cat);

          deduped.sort((a, b) => (b[cat] ?? 0) - (a[cat] ?? 0));
          const top10 = deduped.slice(0, 10);

          top[cat] = top10;
          const denom = top10.length || 1;
          averages[cat] = Number(
            (top10.reduce((sum, cur) => sum + (cur[cat] ?? 0), 0) / denom).toFixed(2)
          );
        });

        const radarAverage = chartCategories.map(cat => ({
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

  const renderAngleTick = (props: any) => {
    const { x, y, payload } = props;
    const angle = payload?.coordinate;
    let dy = 0;

    if (angle === -90) {
      dy = isXs ? 3 : 6;
    }

    return (
      <text
        x={x} y={y} dy={dy} textAnchor="middle"
        fontSize={isXs ? 10 : 20} fill="#000"
        stroke="#fff" strokeWidth={isXs ? 3 : 3.5} style={{ paintOrder: 'stroke' }}
      >
        {payload?.value}
      </text>
    );
  };

  return (
    <Page>
      <PageHeader compact title="ノーツレーダー" />
      <SectionCard dense>
        <Box sx={{ px: { xs: 1, sm: 2 }, pt: 1 }}>
          <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>

          <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto', aspectRatio: '1 / 1' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid gridType="circle" />
                <Tooltip formatter={(value: number) => Number(value).toFixed(2)} />
                <PolarRadiusAxis angle={30} domain={[0, 200]} tick={false} axisLine={false} />
                <PolarAngleAxis dataKey="subject" tick={renderAngleTick} />
                <Radar name="Radar" dataKey="A" stroke="#00cc66" fill="#00cc66" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </Box>

          <Typography variant="h6" align="center" sx={{ mt: 2 }}>Total: {totalAverage}</Typography>

          <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mt: 2 }} variant="scrollable" scrollButtons="auto">
            {chartCategories.map((cat, i) => (
              <Tab key={cat} label={`${cat} (${topAverages[cat]?.toFixed(2) ?? '-'})`} value={i} />
            ))}
          </Tabs>

          {chartCategories.map((cat, i) => selectedTab === i && (
            <Box key={cat} sx={{ mt: 2 }}>
              <Typography variant="h6">TOP10</Typography>

              {/* スマホで横スクロールが必要なときの保険 */}
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520, fontVariantNumeric: 'tabular-nums' }}>
                  <TableHead>
                    {/* ヘッダはスマホでは非表示（行を畳むため） */}
                    <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                      <TableCell>曲名</TableCell>
                      <TableCell>レベル</TableCell>
                      <TableCell>レーダー値</TableCell>
                      <TableCell>スコア</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {topSongs[cat]?.map((s, idx) => {
                      const level = chartInfo[s.id]?.level?.[mode.toLowerCase()]?.[difficultyKey.indexOf(s.diff)];
                      const radarVal = s[cat] ?? 0;
                      const attrVal = s[`${cat}_attr`] ?? 0;
                      const ratePct = (s.scoreRate ?? 0) * 100;
                      const key = `${s.id}_${s.diff}_${idx}`;

                      return (
                        <React.Fragment key={key}>
                          {/* PC/タブレット向け：従来の4列 */}
                          <TableRow sx={{ display: { xs: 'none', sm: 'table-row' } }}>
                            <TableCell>{titleMap[s.id] || s.id} [{s.diff}]</TableCell>
                            <TableCell>{level ? `☆${level}` : '-'}</TableCell>
                            <TableCell>{radarVal.toFixed(2)} / {attrVal.toFixed(2)}</TableCell>
                            <TableCell>{s.score} ({ratePct.toFixed(2)}%)</TableCell>
                          </TableRow>

                          {/* スマホ向け：1セルに畳む */}
                          <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }}>
                            <TableCell colSpan={4} sx={{ py: 1.25 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {titleMap[s.id] || s.id} [{s.diff}]
                              </Typography>
                              <Box
                                sx={{
                                  mt: 0.5,
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  columnGap: 1.5,
                                  rowGap: 0.5,
                                  color: 'text.secondary',
                                  fontSize: 12,
                                }}
                              >
                                <span>☆{level ?? '-'}</span>
                                <span>Rader: {radarVal.toFixed(1)} / {attrVal.toFixed(1)}</span>
                                <span>Score: {s.score} ({ratePct.toFixed(1)}%)</span>
                              </Box>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ))}

        </Box>
      </SectionCard>
    </Page>
  );
};

export default RadarPage;
