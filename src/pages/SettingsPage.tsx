// src/pages/SettingsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { getCurrentFormattedDate, getCurrentFormattedTime } from '../utils/dateUtils';

type UserLS = {
  djname: string;
  lastupdated: string; // YYYY-MM-DD
};

const APP_KEYS = ['user', 'data', 'diff', 'timestamps'] as const;

const SettingsPage: React.FC = () => {
  // DJ Name state
  const [djName, setDjName] = useState<string>('');
  const [loadedUser, setLoadedUser] = useState<UserLS | null>(null);

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Import
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreview, setImportPreview] = useState<string>('');
  const [importJson, setImportJson] = useState<any | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const appSnapshot = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const data = JSON.parse(localStorage.getItem('data') || 'null');
      const diff = JSON.parse(localStorage.getItem('diff') || 'null');
      const timestamps = JSON.parse(localStorage.getItem('timestamps') || 'null');
      return { user, data, diff, timestamps };
    } catch {
      return { user: null, data: null, diff: null };
    }
  }, []);

  useEffect(() => {
    // 初回ロード時に user を読み込み
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const u = JSON.parse(userRaw) as UserLS;
        setLoadedUser(u);
        setDjName(u.djname || '');
      }
    } catch {
      // 破損している場合は無視
    }
  }, []);

  const handleSaveDjName = () => {
    try {
      const newUser: UserLS = {
        djname: djName.trim(),
        lastupdated: loadedUser?.lastupdated || getCurrentFormattedDate(),
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      setLoadedUser(newUser);
      setSnack({ open: true, message: 'DJ Name を保存しました。', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, message: 'DJ Name の保存に失敗しました。', severity: 'error' });
    }
  };

  const handleExport = () => {
    try {
      // アプリ関連データをまとめてTXT(JSON)で出力
      const payload = {
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        data: JSON.parse(localStorage.getItem('data') || 'null'),
        diff: JSON.parse(localStorage.getItem('diff') || 'null'),
        timestamps: JSON.parse(localStorage.getItem('timestamps') || 'null'),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      const ymd = getCurrentFormattedTime();
      a.href = URL.createObjectURL(blob);
      a.download = `infsv-backup-${ymd}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSnack({ open: true, message: 'エクスポートしました。', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'エクスポートに失敗しました。', severity: 'error' });
    }
  };

  const handleOpenImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じファイル選択でもchangeが発火するようにリセット
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // ゆるめのバリデーション
      if (!('user' in json) && !('data' in json) && !('diff' in json)&& !('timestamps' in json)) {
        throw new Error('ファイルが不正です。');
      }
      setImportJson(json);
      setImportPreview(text.slice(0, 800));
      setImportDialogOpen(true);
    } catch (err: any) {
      setSnack({ open: true, message: `ファイルの読み込みに失敗しました: ${err.message || err}`, severity: 'error' });
    }
  };

  const applyImport = () => {
    if (!importJson) return;
    try {
      if ('user' in importJson) {
        localStorage.setItem('user', JSON.stringify(importJson.user));
      }
      if ('data' in importJson) {
        localStorage.setItem('data', JSON.stringify(importJson.data));
      }
      if ('diff' in importJson) {
        localStorage.setItem('diff', JSON.stringify(importJson.diff));
      }
      if ('timestamps' in importJson) {
        localStorage.setItem('timestamps', JSON.stringify(importJson.timestamps));
      }

      setImportDialogOpen(false);
      setImportJson(null);
      setImportPreview('');

      // 状態も更新
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        setLoadedUser(u);
        setDjName(u?.djname || '');
      } catch {}

      setSnack({ open: true, message: `インポートが完了しました`, severity: 'success' });
    } catch (err: any) {
      setSnack({ open: true, message: `インポートの適用に失敗しました: ${err.message || err}`, severity: 'error' });
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const applyDelete = () => {
    try {
      APP_KEYS.forEach((k) => localStorage.removeItem(k));
      setDeleteDialogOpen(false);

      // 画面上の状態も初期化
      setDjName('');
      setLoadedUser(null);

      setSnack({ open: true, message: 'ローカルストレージのデータを削除しました。', severity: 'success' });
    } catch {
      setSnack({ open: true, message: '削除に失敗しました。', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>設定</Typography>

      {/* DJ Name */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>DJ Name</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
          <TextField
            label="DJ Name"
            value={djName}
            onChange={(e) => setDjName(e.target.value)}
            inputProps={{ maxLength: 20 }}
            sx={{ flex: 1, minWidth: 240 }}
          />
          <Button variant="contained" onClick={handleSaveDjName}>保存</Button>
        </Stack>
      </Paper>

      {/* Export / Import */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>データのエクスポート / インポート</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          定期的なバックアップを推奨します。お使いの端末のブラウザ(LocalStorage)に保存される形式となっており、キャッシュの削除等で消えてしまう可能性がございます。
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="outlined" onClick={handleExport}>エクスポート (TXT)</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,application/json,text/plain"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <Button variant="contained" onClick={handleOpenImport}>インポート (TXT)</Button>
        </Stack>
      </Paper>

      {/* Danger Zone */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'error.light' }}>
        <Typography variant="h6" gutterBottom color="error">データの削除</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          登録したスコアデータを削除します。
        </Typography>
        <Button color="error" variant="contained" onClick={handleDelete}>
          スコアデータを削除
        </Button>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>

      {/* Import confirm dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>インポートの確認</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2 }}>
            選択したファイルの内容をローカルストレージに取り込みます。既存データは上書きされます。
          </DialogContentText>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>プレビュー</Typography>
          <Box component="pre" sx={{ maxHeight: 240, overflow: 'auto', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            {importPreview}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={applyImport} color="primary">インポートを実行</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>削除の確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            本当に登録データを削除しますか？ この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={applyDelete} color="error" variant="contained">削除する</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SettingsPage;
