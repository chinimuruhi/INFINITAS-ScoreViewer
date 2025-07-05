import React from 'react';
import { Container, Typography, Button } from '@mui/material';

const SettingsPage = () => {
  const handleClear = () => {
    if (window.confirm('本当にすべてのスコアデータを削除しますか？')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>設定</Typography>
      <Button variant="contained" color="error" onClick={handleClear}>
        データをすべて削除する
      </Button>
    </Container>
  );
};

export default SettingsPage;
