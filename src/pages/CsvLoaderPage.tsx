import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Button, Box, FormControl, InputLabel, Select, MenuItem,
  SelectChangeEvent, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { parseOfficialCsv, parseRefluxTsv, parseIDCCsv, mergeWithCSVEntries } from '../utils/scoreDataUtils';
import { getCurrentFormattedDate } from '../utils/dateUtils';
import { useAppContext } from '../context/AppContext';
import LinkComponent from '../components/LinkComponent';
import { Page, PageHeader } from '../components/Page';
import SectionCard from '../components/SectionCard';

const CsvLoaderPage = () => {
  const navigate = useNavigate();
  const { mode, setMode } = useAppContext();
  const [format, setFormat] = useState<'official' | 'reflux' | 'idc'>('idc');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [successDialogOpen, setSuccessDialogOpen] = useState<boolean>(false);
  const [reportDialogOpen, setReportDialogOpen] = useState<boolean>(false);
  const [failedTitles, setFailedTitles] = useState<string[]>([]);
  const [djName, setDjName] = useState<string>('');
  const [isDjNameEmpty, setIsDjNameEmpty] = useState<boolean>(true);

  // 保存されているDJNameを取得
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}') || {};
    if (storedUser.djname) {
      setDjName(storedUser.djname);
      setIsDjNameEmpty(false);
    }
  }, []);

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

      // ファイルの読み込み
      const text = await readFileAsText(file);
      let result;
      let isReflux = false;

      if (format === 'official') {
        if (!text.includes('タイトル') || !text.includes('スコア')) {
          throw new Error('公式CSVとして認識できません');
        }
        result = await parseOfficialCsv(text, mode);
      } else if (format === 'idc') {
        if (!text.includes('LV') || !text.includes('Score')) {
          throw new Error('INFINITAS打鍵カウンタCSVとして認識できません');
        }
        result = await parseIDCCsv(text);
      } else {
        if (!text.includes('Type') || !text.includes('Label')) {
          throw new Error('Reflux TSVとして認識できません');
        }
        result = await parseRefluxTsv(text);
        isReflux = true;
      }

      const { data, diffs, timestamps, failedTitles } = await mergeWithCSVEntries(result, isReflux, format !== 'official');

      if (failedTitles.length > 0) {
        setFailedTitles(failedTitles);
        setReportDialogOpen(true);
      } else {
        setSuccessDialogOpen(true);
      }

      localStorage.setItem('data', JSON.stringify(data));
      localStorage.setItem('diff', JSON.stringify(diffs));
      localStorage.setItem('timestamps', JSON.stringify(timestamps));

      const lastUpdated = getCurrentFormattedDate();
      localStorage.setItem('user', JSON.stringify({ djname: djName, lastupdated: lastUpdated }));
    } catch (e: any) {
      setError(`読み込み失敗: ${e}`);
    }
  };

  // ファイルのエンコーディングに応じてテキストを読み込む
  const readFileAsText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let text = '';

    // 'official' の場合、UTF-8 with BOMを処理
    if (format === 'official') {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      text = decoder.decode(uint8Array);
      // BOMを取り除く
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
      }
    }

    // 'idc' の場合、Shift JISを処理
    else if (format === 'idc') {
      const decoder = new TextDecoder('shift-jis', { fatal: true });
      text = decoder.decode(uint8Array);
    }

    // 'reflux' の場合、UTF-8をそのまま処理
    else if (format === 'reflux') {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      text = decoder.decode(uint8Array);
    }

    return text;
  };

  const handleReport = () => {
    const message = encodeURIComponent(`@ci_public\n以下の曲のIDが取得できませんでした:\n${failedTitles.join('\n')}\n\nformat=${format}\n`);
    const url = `https://x.com/intent/tweet?hashtags=inf_sv_error&text=${message}`;
    window.open(url, '_blank');
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate('/diff');
  };

  return (
    <Page>
      <PageHeader compact title="CSV/TSV読み込み" />
      <SectionCard>
        <Container sx={{ mt: 4 }}>

          {isDjNameEmpty && (
            <>
              <TextField
                label="DJ Name"
                value={djName}
                onChange={(e) => setDjName(e.target.value)}
                inputProps={{ maxLength: 20 }}
                fullWidth
                sx={{ mb: 2 }}
              />
            </>
          )}

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="format-label">形式</InputLabel>
              <Select
                labelId="format-label"
                value={format}
                label="形式"
                onChange={(e: SelectChangeEvent) => setFormat(e.target.value as any)}
              >
                <MenuItem value="idc">INFINITAS打鍵カウンタCSV (β)</MenuItem>
                <MenuItem value="reflux">Reflux TSV</MenuItem>
                <MenuItem value="official">KONAMI 公式スコアCSV</MenuItem>
              </Select>
            </FormControl>

            {format === 'official' && (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
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
                <Typography variant="body2" sx={{ mb: 2 }}>
                  beatmania IIDXの公式HP(<LinkComponent url="https://p.eagate.573.jp/game/2dx/">https://p.eagate.573.jp/game/2dx/</LinkComponent>)からダウンロードできるスコアデータCSVです。
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  文字コードはUTF-8 with BOMを想定しております。CSVファイルの手動修正を行う場合は文字コードにご注意ください。CSVのダウンロードにはbeatmania IIDX プレミアムコース登録が必要となります。
                </Typography>
                <Alert severity="warning">
                  統計の充実のため、公式HPからダウンロードしたCSVは各本家サイトでもスコアデータの登録を行うことを推奨します。
                </Alert>
              </>
            )}

            {format === 'idc' && (
              <>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  INFINITAS打鍵カウンタ（<LinkComponent url="https://github.com/dj-kata/inf_daken_counter_obsw">https://github.com/dj-kata/inf_daken_counter_obsw</LinkComponent>）で出力できるCSVです。
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  文字コードはShift JISを想定しております。CSVファイルの手動修正を行う場合は文字コードにご注意ください。
                </Typography>
                <Alert severity="warning">
                  全曲における動作確認ができておらず、一部楽曲の読み込みに失敗する可能性がございます。楽曲の読み込みに失敗した場合は報告いただけますと幸いです。
                </Alert>
              </>
            )}

            {format === 'reflux' && (
              <>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Reflux（<LinkComponent url="https://github.com/olji/Reflux">https://github.com/olji/Reflux</LinkComponent>）で出力できるTSVです。
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  文字コードはUTF-8を想定しております。TSVファイルの手動修正を行う場合は文字コードにご注意ください。
                </Typography>
                <Alert severity="warning">
                  読み込み形式としては対応しておりますが、Refluxの使用を推奨するものではありません。使用は自己責任でお願いいたします。
                </Alert>
              </>
            )}
          </Box>

          <Button variant="contained" component="label">
            ファイルを選択
            <input type="file" hidden onChange={handleFileUpload} />
          </Button>

          <Box sx={{ mt: 1.5 }}>
            <Button component={RouterLink} to="/edit" size="small">
              手動入力はこちら
            </Button>
          </Box>

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
                以下の楽曲が読み込めませんでした。修正のため、報告いただけますと幸いです。
              </Typography>
              <Box>
                {failedTitles.map((title, i) => <div key={i}>{title}</div>)}
              </Box>
              <Alert severity="warning">
                <Typography variant="body2" gutterBottom>
                  新曲の読み込みの対応についてはtextage様に追加されてから最大一週間程度かかります。
                </Typography>
                <Typography variant="body2">
                  当サイトの楽曲リストは毎週水曜午前10時に更新を行っておりますので、更新後再度読み込みをお願いいたします。
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleReport}>報告する</Button>
              <Button onClick={() => { setReportDialogOpen(false); navigate('/diff'); }}>OK</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </SectionCard>
    </Page>
  );
};

export default CsvLoaderPage;
