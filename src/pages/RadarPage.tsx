import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

const mockRadarData = [
  { subject: '地力', value: 85 },
  { subject: '階段力', value: 70 },
  { subject: '縦連打', value: 60 },
  { subject: 'ソフラン', value: 50 },
  { subject: 'ラス殺し', value: 75 },
  { subject: '認識力', value: 90 },
];

const RadarPage: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        レーダーチャート
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockRadarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="自分" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  );
};

export default RadarPage;
