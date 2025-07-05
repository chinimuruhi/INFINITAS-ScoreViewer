import React, { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CpiPage = () => {
  const [data, setData] = useState<{ range: string, count: number }[]>([]);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('data') || '{}');
    const sp = local.SP || {};
    const rates: number[] = [];

    Object.values(sp).forEach((entries: any) =>
      entries.forEach((e: any) => {
        const p = e.score / 4000;
        if (!isNaN(p)) rates.push(p);
      })
    );

    const bins = Array(11).fill(0);
    rates.forEach(p => {
      const idx = Math.min(10, Math.floor(p * 10));
      bins[idx]++;
    });

    const hist = bins.map((count, i) => ({
      range: `${i * 10}-${i * 10 + 9}%`,
      count
    }));
    setData(hist);

    if (rates.length) {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      setAverage(avg * 100);
    }
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>CPI - 達成率分布</Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>
        平均達成率: {average.toFixed(2)}%
      </Typography>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="range" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    </Container>
  );
};

export default CpiPage;
