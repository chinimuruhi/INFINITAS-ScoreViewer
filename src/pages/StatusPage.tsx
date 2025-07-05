import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer } from '@mui/material';

const StatusPage = () => {
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('data') || '{}');
    const sp = local.SP || {};
    const values: number[] = [];

    Object.values(sp).forEach((entries: any) =>
      entries.forEach((e: any) => {
        const p = e.score / 4000;
        if (!isNaN(p)) values.push(p);
      })
    );

    const total = values.length;
    const avg = values.reduce((a, b) => a + b, 0) / total;
    const rate = Math.floor(avg * 10000) / 100;

    setStats([{ label: '記録数', value: total }, { label: '平均達成率', value: rate + '%' }]);
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>統計情報</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              <TableCell>値</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{row.label}</TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default StatusPage;
