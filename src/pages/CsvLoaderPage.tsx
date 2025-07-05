import React, { useState } from 'react';
import {
  Container, Typography, Button, Box, FormControl, InputLabel, Select, MenuItem,
  SelectChangeEvent, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { parseCsv, parseTsv, mergeWithStorage } from '../utils/storageUtils';

const CsvLoaderPage: React.FC<{ setDarkMode: (val: boolean) => void }> = ({ setDarkMode }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'SP' | 'DP'>('SP');
  const [format, setFormat] = useState<'official' | 'reflux'>('reflux');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [failedTitles, setFailedTitles] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setWarnings([]);
    setFailedTitles([]);

    try {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
        throw new Error('拡張子がcsvまたはtsvではありません');
      }

      const text = await file.text();
      let result;
      let isReflux = false;

      if (format === 'official') {
        if (!text.includes('タイトル') || !text.includes('スコア')) {
          throw new Error('公式CSVとして認識できません');
        }
        result = await parseCsv(text, mode);
      } else {
        if (!text.includes('EX Score') || !text.includes('Lamp')) {
          throw new Error('Reflux TSVとして認識できません');
        }
        result = await parseTsv(text);
        isReflux = true;
      }

      const { data, diffs, failedTitles } = await mergeWithStorage(result, isReflux);

      if (failedTitles.length > 0) {
        setFailedTitles(failedTitles);
        setReportDialogOpen(true);
      } else {
        setSuccessDialogOpen(true);
      }

      localStorage.setItem('data', JSON.stringify(data));
      localStorage.setItem('diff', JSON.stringify(diffs));

    } catch (e: any) {
      setError(`読み込み失敗: ${e.message}`);
    }
  };

  const handleReport = () => {
    const message = encodeURIComponent(`@ci_public\n以下の曲のIDが取得できませんでした:\n${failedTitles.join('\n')}\n`);
    const url = `https://x.com/intent/tweet?text=${message}`;
    window.open(url, '_blank');
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate('/new');
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        CSV/TSV 読み込み
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="format-label">形式</InputLabel>
          <Select
            labelId="format-label"
            value={format}
            label="形式"
            onChange={(e: SelectChangeEvent) => setFormat(e.target.value as any)}
          >
            <MenuItem value="official">公式CSV</MenuItem>
            <MenuItem value="reflux">Reflux TSV</MenuItem>
          </Select>
        </FormControl>

        {format === 'official' && (
          <FormControl fullWidth>
            <InputLabel id="mode-label">モード</InputLabel>
            <Select
              labelId="mode-label"
              value={mode}
              label="モード"
              onChange={(e: SelectChangeEvent) => setMode(e.target.value as any)}
            >
              <MenuItem value="SP">SP</MenuItem>
              <MenuItem value="DP">DP</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      <Button variant="contained" component="label">
        ファイルを選択
        <input type="file" hidden onChange={handleFileUpload} />
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {warnings.map((w, i) => <div key={i}>{w}</div>)}
        </Alert>
      )}

      <Dialog open={successDialogOpen} onClose={handleSuccessDialogClose}>
        <DialogTitle>読み込み成功</DialogTitle>
        <DialogContent>
          データの読み込みに成功しました。
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessDialogClose}>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
        <DialogTitle>読み込み成功</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            以下の楽曲IDが解決できませんでした。
          </Typography>
          <Box>
            {failedTitles.map((title, i) => <div key={i}>{title}</div>)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReport}>報告する</Button>
          <Button onClick={() => { setReportDialogOpen(false); navigate('/new'); }}>OK</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CsvLoaderPage;
