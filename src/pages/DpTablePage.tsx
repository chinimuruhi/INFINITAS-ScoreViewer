import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Link } from '@mui/material';

const colorMap = {
  0: '#FFFFFF', 1: '#CCCCCC', 2: '#FF66CC', 3: '#99FF99', 4: '#99CCFF',
  5: '#FF6666', 6: '#FFFF99', 7: '#FF9966'
};

const DpTablePage = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [lampMap, setLampMap] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/chinimuruhi/IIDX-Data-Table/gh-pages/difficulty/dp/songs_list.json')
      .then(res => res.json()).then(setSongs);
    const data = JSON.parse(localStorage.getItem('data') || '{}');
    const flat: { [key: string]: number } = {};
    Object.entries(data.DP || {}).forEach(([id, vals]: any) =>
      vals.forEach((v: any) => flat[`${id}_${v.difficulty}`] = v.cleartype)
    );
    setLampMap(flat);
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4">DP 難易度表</Typography>

      <Grid container spacing={1}>
        {songs.sort((a, b) => b.value - a.value).map(song => {
          const key = `${song.id}_${song.difficulty}`;
          const lamp = lampMap[key] ?? 0;
          return (
            <Grid item xs={6} sm={3} md={2} key={key}>
              <Paper sx={{ p: 1, backgroundColor: colorMap[lamp] }}>
                <Link href={`https://zasa.sakura.ne.jp/dp/music.php?id=${song.snj_id}`} target="_blank" rel="noopener">
                  <Typography variant="body2">{song.id} [{song.difficulty}]</Typography>
                </Link>
                <Typography variant="caption">☆{song.difficulty} ({song.value})</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default DpTablePage;
