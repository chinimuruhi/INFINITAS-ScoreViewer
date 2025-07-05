import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box } from '@mui/material';

const ManualEditPage: React.FC = () => {
  const [data, setData] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('data');
    if (stored) setData(JSON.stringify(JSON.parse(stored), null, 2));
  }, []);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(data);
      localStorage.setItem('data', JSON.stringify(parsed));
      alert('保存しました');
    } catch (e) {
      alert('JSON形式が不正です');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        手動データ編集
      </Typography>
      <TextField
        label="JSONデータ"
        multiline
        fullWidth
        rows={20}
        value={data}
        onChange={(e) => setData(e.target.value)}
        variant="outlined"
      />
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          保存
        </Button>
      </Box>
    </Container>
  );
};

export default ManualEditPage;
