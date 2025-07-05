import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';

type ScoreEntry = {
  difficulty: string;
  cleartype: number;
  score: number;
  misscount: number;
  unlocked: boolean;
};

type Diff = {
  id: string;
  before?: ScoreEntry;
  after: ScoreEntry;
};

const getGrade = (percentage: number) => {
  if (percentage < 2 / 9) return 'F';
  if (percentage < 1 / 3) return 'E';
  if (percentage < 4 / 9) return 'D';
  if (percentage < 5 / 9) return 'C';
  if (percentage < 2 / 3) return 'B';
  if (percentage < 7 / 9) return 'A';
  if (percentage < 8 / 9) return 'AA';
  if (percentage < 17 / 18) return 'AAA';
  return 'MAX-';
};

const NewPage = () => {
  const [diffs, setDiffs] = useState<Diff[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('diffs');
    if (stored) {
      setDiffs(JSON.parse(stored));
    }
  }, []);

  const renderClearDiffs = () => {
    return diffs.filter(d =>
      d.before && d.after.cleartype > d.before.cleartype &&
      d.after.cleartype > 1
    ).map((d, i) => (
      <TableRow key={i}>
        <TableCell>{d.id}</TableCell>
        <TableCell>{d.after.difficulty}</TableCell>
        <TableCell>{d.before?.cleartype ?? '-'}</TableCell>
        <TableCell>{d.after.cleartype}</TableCell>
      </TableRow>
    ));
  };

  const renderScoreDiffs = () => {
    return diffs.filter(d =>
      d.before && d.after.score > d.before.score
    ).map((d, i) => {
      const notes = 2000; // 仮値（正確なノーツ数は別途 fetch が必要）
      const beforeP = d.before!.score / (notes * 2);
      const afterP = d.after.score / (notes * 2);
      return (
        <TableRow key={i}>
          <TableCell>{d.id}</TableCell>
          <TableCell>{d.after.difficulty}</TableCell>
          <TableCell>{d.before?.score}</TableCell>
          <TableCell>{d.after.score}</TableCell>
          <TableCell>{(beforeP * 100).toFixed(2)}%</TableCell>
          <TableCell>{(afterP * 100).toFixed(2)}%</TableCell>
          <TableCell>{getGrade(beforeP)}</TableCell>
          <TableCell>{getGrade(afterP)}</TableCell>
        </TableRow>
      );
    });
  };

  const renderMissDiffs = () => {
    return diffs.filter(d =>
      d.before && d.after.misscount < d.before.misscount
    ).map((d, i) => (
      <TableRow key={i}>
        <TableCell>{d.id}</TableCell>
        <TableCell>{d.after.difficulty}</TableCell>
        <TableCell>{d.before?.misscount}</TableCell>
        <TableCell>{d.after.misscount}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>更新されたスコア</Typography>

      <Box mt={4}>
        <Typography variant="h6">クリアタイプ更新</Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>難易度</TableCell>
                <TableCell>旧</TableCell>
                <TableCell>新</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderClearDiffs()}</TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6">スコア更新</Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>難易度</TableCell>
                <TableCell>旧スコア</TableCell>
                <TableCell>新スコア</TableCell>
                <TableCell>旧%</TableCell>
                <TableCell>新%</TableCell>
                <TableCell>旧GR</TableCell>
                <TableCell>新GR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderScoreDiffs()}</TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6">ミスカウント改善</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>難易度</TableCell>
                <TableCell>旧Miss</TableCell>
                <TableCell>新Miss</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderMissDiffs()}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default NewPage;
