import React, { useEffect, useState } from 'react';
import { Container, Tabs, Tab, Typography, Grid, Paper } from '@mui/material';

const colorMap = {
  0: '#FFFFFF', 1: '#CCCCCC', 2: '#FF66CC', 3: '#99FF99', 4: '#99CCFF',
  5: '#FF6666', 6: '#FFFF99', 7: '#FF9966'
};

const Sp11TablePage = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [labels, setLabels] = useState<any>({});
  const [lampMap, setLampMap] = useState<{ [key: string]: number }>({});
  const [tab, setTab] = useState<'normal' | 'hard'>('normal');

  useEffect(() => {
    fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp11/songs_list.json')
      .then(res => res.json()).then(setSongs);
    fetch('https://chinimuruhi.github.io/IIDX-Data-Table/difficulty/sp11/difficulty.json')
      .then(res => res.json()).then(setLabels);
    const data = JSON.parse(localStorage.getItem('data') || '{}');
    const flat: { [key: string]: number } = {};
    Object.entries(data.SP || {}).forEach(([id, vals]: any) =>
      vals.forEach((v: any) => flat[`${id}_${v.difficulty}`] = v.cleartype)
    );
    setLampMap(flat);
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4">SP☆11 難易度表</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="CLEAR難易度" value="normal" />
        <Tab label="HARD CLEAR難易度" value="hard" />
      </Tabs>

      <Grid container spacing={1}>
        {songs.sort((a, b) =>
          (tab === 'normal' ? b.n_value - a.n_value : b.h_value - a.h_value)
        ).map(song => {
          const key = `${song.id}_${song.difficulty}`;
          const lamp = lampMap[key] ?? 0;
          return (
            <Grid item xs={6} sm={3} md={2} key={key}>
              <Paper sx={{ p: 1, backgroundColor: colorMap[lamp] }}>
                <Typography variant="body2">{song.id} [{song.difficulty}]</Typography>
                <Typography variant="caption">
                  {labels[tab === 'normal' ? song.n_value : song.h_value]}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default Sp11TablePage;
