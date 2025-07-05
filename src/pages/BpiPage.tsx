import React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

const mockData = [
  { title: 'Example Song 1', bpi: 100.0 },
  { title: 'Example Song 2', bpi: 89.5 },
  { title: 'Example Song 3', bpi: 76.2 },
];

const BpiPage: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        BPI一覧
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>曲名</TableCell>
              <TableCell>BPI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.bpi}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default BpiPage;
