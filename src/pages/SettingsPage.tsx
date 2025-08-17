import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
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
} from '@mui/material';
import { getCurrentFormattedDate, getCurrentFormattedTime } from '../utils/dateUtils';
import { appKeys } from '../constants/localStrageConstrains';
import SectionCard from '../components/SectionCard';
import { Page, PageHeader } from '../components/Page';
import { mergeWithJSONData } from '../utils/scoreDataUtils';
import { CLIENT_ID, DRIVE_SCOPE, DRIVE_FILE_NAME, DRIVE_FOLDER_NAME } from '../constants/driveConstrains';

declare global {
  interface Window { google?: any; }
}

const SettingsPage: React.FC = () => {
  const [djName, setDjName] = useState<string>('');
  const [loadedUser, setLoadedUser] = useState<any>({});

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false, message: '', severity: 'success',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importJson, setImportJson] = useState<any | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const tokenClientRef = useRef<any>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleSignedIn, setGoogleSignedIn] = useState(false);

  const [driveExportDialogOpen, setDriveExportDialogOpen] = useState(false);
  const [driveImportDialogOpen, setDriveImportDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        setLoadedUser(u);
        setDjName(u.djname || '');
      }
    } catch {}
    loadGisScript()
      .then(() => setGoogleReady(true))
      .catch(() => {
        setGoogleReady(false);
        setSnack({ open: true, message: 'Google連携の初期化に失敗しました。', severity: 'error' });
      });
  }, []);

  const handleSaveDjName = () => {
    try {
      const newUser = {
        djname: djName.trim(),
        lastupdated: loadedUser?.lastupdated || getCurrentFormattedDate(),
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      setLoadedUser(newUser);
      setSnack({ open: true, message: 'DJ Name を保存しました。', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'DJ Name の保存に失敗しました。', severity: 'error' });
    }
  };

  // TXT Export
  const handleExport = () => {
    try {
      const payload = makeExportPayload();
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

  // TXT Import
  const handleOpenImport = () => { fileInputRef.current?.click(); };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      validateBackupShape(json);
      setImportJson(json);
      setImportDialogOpen(true);
    } catch (err: any) {
      setSnack({ open: true, message: `ファイルの読み込みに失敗しました: ${err.message || err}`, severity: 'error' });
    }
  };

  const applyImportOverwrite = () => {
    if (!importJson) return;
    try {
      applyImportedJson(importJson);
      afterImportApplied();
      setSnack({ open: true, message: `インポート（上書き）が完了しました`, severity: 'success' });
    } catch (err: any) {
      setSnack({ open: true, message: `インポート（上書き）に失敗しました: ${err.message || err}`, severity: 'error' });
    }
  };

  const applyImportMerge = () => {
    if (!importJson) return;
    try {
      const local = makeExportPayload();
      const remote = importJson;

      const m = mergeWithJSONData(
        local.data || {},
        remote.data || {},
        local.timestamps || {},
        remote.timestamps || {},
        local.diff || {},
        false
      );

      const mergedLocal = {
        user: local.user ?? remote.user ?? null,
        data: m.data,
        diff: m.diffs,
        timestamps: m.timestamps,
        exportedAt: new Date().toISOString(),
      };

      applyImportedJson(mergedLocal);
      afterImportApplied();
      setSnack({ open: true, message: `インポート（マージ）が完了しました`, severity: 'success' });
    } catch (err: any) {
      setSnack({ open: true, message: `インポート（マージ）に失敗しました: ${err.message || err}`, severity: 'error' });
    }
  };

  const afterImportApplied = () => {
    setImportDialogOpen(false);
    setImportJson(null);
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      setLoadedUser(u);
      setDjName(u?.djname || '');
    } catch {}
  };

  // Delete
  const handleDelete = () => { setDeleteDialogOpen(true); };
  const applyDelete = () => {
    try {
      appKeys.forEach((k) => localStorage.removeItem(k));
      setDeleteDialogOpen(false);
      setDjName('');
      setLoadedUser(null);
      setSnack({ open: true, message: 'ローカルストレージのデータを削除しました。', severity: 'success' });
    } catch {
      setSnack({ open: true, message: '削除に失敗しました。', severity: 'error' });
    }
  };

  // Google Drive 連携ロジック
  async function loadGisScript() {
    if (window.google?.accounts?.oauth2) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('GIS script failed'));
      document.head.appendChild(s);
    });
  }

  function ensureTokenClient() {
    if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services is not ready.');
    if (tokenClientRef.current) return tokenClientRef.current;
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp: any) => {
        accessTokenRef.current = resp.access_token;
        setGoogleSignedIn(true);
      },
    });
    return tokenClientRef.current;
  }

  const handleGoogleSignIn = async () => {
    try {
      if (!googleReady) await loadGisScript();
      const tc = ensureTokenClient();
      tc.requestAccessToken({ prompt: 'consent' });
    } catch (e: any) {
      setSnack({ open: true, message: `Googleサインインに失敗: ${e.message || e}`, severity: 'error' });
    }
  };

  async function ensureAccessToken() {
    if (accessTokenRef.current) return accessTokenRef.current;
    await handleGoogleSignIn();
    return new Promise<string>((resolve, reject) => {
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if (accessTokenRef.current) {
          clearInterval(t); resolve(accessTokenRef.current);
        } else if (tries > 60) {
          clearInterval(t); reject(new Error('トークン取得タイムアウト'));
        }
      }, 100);
    });
  }

  // フォルダ取得/作成
  async function findOrCreateFolderId(): Promise<string> {
    const token = await ensureAccessToken();
    const searchUrl = 'https://www.googleapis.com/drive/v3/files'
      + `?q=${encodeURIComponent(`name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}`
      + '&fields=files(id,name)';
    const res = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('フォルダ検索失敗');
    const j = await res.json();
    if (j.files && j.files[0]?.id) return j.files[0].id;

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (!createRes.ok) throw new Error('フォルダ作成失敗');
    const created = await createRes.json();
    return created.id as string;
  }

  // フォルダ内で固定ファイル名のIDを探す
  async function findFileIdInFolderByName(name: string): Promise<string | null> {
    const token = await ensureAccessToken();
    const folderId = await findOrCreateFolderId();
    const listUrl = 'https://www.googleapis.com/drive/v3/files'
      + `?q=${encodeURIComponent(`name='${name}' and '${folderId}' in parents and trashed=false`)}`
      + '&pageSize=1'
      + '&fields=files(id,name)';
    const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('ファイル検索失敗');
    const j = await res.json();
    const file = j.files?.[0];
    return file?.id ?? null;
  }

  // 固定名の空ファイルを作成
  async function createEmptyFileInFolder(name: string): Promise<string> {
    const token = await ensureAccessToken();
    const folderId = await findOrCreateFolderId();
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        name,
        mimeType: 'text/plain',
        parents: [folderId],
      }),
    });
    if (!res.ok) throw new Error('ファイル作成失敗');
    const file = await res.json();
    return file.id as string;
  }

  // 固定名ファイルを取得（なければ作成）
  async function ensureFileId(): Promise<string> {
    const existing = await findFileIdInFolderByName(DRIVE_FILE_NAME);
    if (existing) return existing;
    return await createEmptyFileInFolder(DRIVE_FILE_NAME);
  }

  // PATCH で内容を更新（Drive のバージョンが増える）
  async function uploadTextToDriveFixedFile(text: string) {
    const token = await ensureAccessToken();
    const fileId = await ensureFileId();

    const metadata = { name: DRIVE_FILE_NAME, mimeType: 'text/plain' };
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
      text +
      closeDelim;

    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`アップロード失敗: ${msg || res.statusText}`);
    }
  }

  // 固定名ファイルの中身(JSON)を取得
  async function downloadFixedBackupFromDrive(): Promise<any> {
    const token = await ensureAccessToken();
    const fileId = await ensureFileId();
    const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!dlRes.ok) throw new Error('ダウンロード失敗');
    return await dlRes.json();
  }

  // Drive エクスポート
  const driveExportOverwrite = async () => {
    try {
      const payload = makeExportPayload();
      await uploadTextToDriveFixedFile(JSON.stringify(payload, null, 2));
      setSnack({ open: true, message: `Driveへエクスポート（上書き）しました。`, severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, message: `Driveエクスポート失敗: ${e.message || e}`, severity: 'error' });
    } finally {
      setDriveExportDialogOpen(false);
    }
  };

  const driveExportMerge = async () => {
    try {
      const local = makeExportPayload();
      let remote: any = null;
      try { remote = await downloadFixedBackupFromDrive(); } catch {}

      let merged = local;
      if (remote) {
        validateBackupShape(remote);
        const m = mergeWithJSONData(
          remote.data || {},
          local.data || {},
          remote.timestamps || {},
          local.timestamps || {},
          remote.diff || {},
          false
        );
        merged = {
          user: local.user ?? remote.user ?? null,
          data: m.data,
          diff: m.diffs,
          timestamps: m.timestamps,
          exportedAt: new Date().toISOString(),
        };
        applyImportedJson(merged);
      }

      await uploadTextToDriveFixedFile(JSON.stringify(merged, null, 2));
      setSnack({ open: true, message: `Driveへエクスポート（マージ）しました。`, severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, message: `Driveエクスポート（マージ）失敗: ${e.message || e}`, severity: 'error' });
    } finally {
      setDriveExportDialogOpen(false);
    }
  };

  // Drive インポート
  const driveImportOverwrite = async () => {
    try {
      const json = await downloadFixedBackupFromDrive();
      validateBackupShape(json);
      applyImportedJson(json);
      setSnack({ open: true, message: `Driveからインポート（上書き）しました。`, severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, message: `Driveインポート失敗: ${e.message || e}`, severity: 'error' });
    } finally {
      setDriveImportDialogOpen(false);
    }
  };

  const driveImportMerge = async () => {
    try {
      const remote = await downloadFixedBackupFromDrive();
      validateBackupShape(remote);

      const local = makeExportPayload();
      const m = mergeWithJSONData(
        local.data || {},
        remote.data || {},
        local.timestamps || {},
        remote.timestamps || {},
        local.diff || {},
        false
      );
      const mergedLocal = {
        user: local.user ?? remote.user ?? null,
        data: m.data,
        diff: m.diffs,
        timestamps: m.timestamps,
        exportedAt: new Date().toISOString(),
      };
      applyImportedJson(mergedLocal);

      setSnack({ open: true, message: `Driveからインポート（マージ）しました。`, severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, message: `Driveインポート（マージ）失敗: ${e.message || e}`, severity: 'error' });
    } finally {
      setDriveImportDialogOpen(false);
    }
  };

  function makeExportPayload() {
    return {
      user: JSON.parse(localStorage.getItem('user') || 'null'),
      data: JSON.parse(localStorage.getItem('data') || 'null'),
      diff: JSON.parse(localStorage.getItem('diff') || 'null'),
      timestamps: JSON.parse(localStorage.getItem('timestamps') || 'null'),
      exportedAt: new Date().toISOString(),
    };
  }

  function applyImportedJson(json: any) {
    if ('user' in json) localStorage.setItem('user', JSON.stringify(json.user));
    if ('data' in json) localStorage.setItem('data', JSON.stringify(json.data));
    if ('diff' in json) localStorage.setItem('diff', JSON.stringify(json.diff));
    if ('timestamps' in json) localStorage.setItem('timestamps', JSON.stringify(json.timestamps));
  }

  function validateBackupShape(json: any) {
    if (!json || (typeof json !== 'object')) throw new Error('JSON形式が不正です');
    if (!('user' in json) && !('data' in json) && !('diff' in json) && !('timestamps' in json)) {
      throw new Error('バックアップ形式が不正です');
    }
  }

  return (
    <Page>
      <PageHeader compact title="設定" />
      <SectionCard>
        <Container maxWidth="md" sx={{ my: 4 }}>

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

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>エクスポート / インポート</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              定期的なバックアップを推奨します。スコアデータはお使いの端末のブラウザ(LocalStorage)に保存される形式となっており、キャッシュの削除等で消えてしまう可能性がございます。
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>エクスポート</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
              <Button variant="outlined" onClick={handleExport}>ダウンロード</Button>
              <Button variant="contained" onClick={() => setDriveExportDialogOpen(true)}>Google Driveへ保存</Button>
            </Stack>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>インポート</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant="outlined" onClick={handleOpenImport}>ファイルを選択</Button>
              <Button variant="contained" onClick={() => setDriveImportDialogOpen(true)}>Google Driveからインポート</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,application/json,text/plain"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </Stack>

            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}>
              ※ Google Driveでは（{DRIVE_FOLDER_NAME}/{DRIVE_FILE_NAME}）に保存されます。
            </Typography>
            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}>
              ※ 誤って更新した場合にも、Google Driveであればバージョン管理機能から過去の状態に戻すことが可能です。
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'error.light' }}>
            <Typography variant="h6" gutterBottom color="error">データの削除</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              登録したスコアデータを削除します。
            </Typography>
            <Button color="error" variant="contained" onClick={handleDelete}>
              スコアデータを削除
            </Button>
          </Paper>

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

          <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>ローカルからインポート</DialogTitle>
            <DialogContent dividers>
              <DialogContentText sx={{ mb: 2 }}>
                選択したファイルの内容を取り込みます。<br />
                <b>上書き</b>：現在のデータを置き換えます。<br />
                <b>マージ</b>：スコア/ランプ/BP を比較し、良い方を採用して統合します。
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setImportDialogOpen(false)}>キャンセル</Button>
              <Button variant="outlined" onClick={applyImportOverwrite} color="warning">上書きで適用</Button>
              <Button variant="contained" onClick={applyImportMerge} color="primary">マージで適用</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={driveExportDialogOpen} onClose={() => setDriveExportDialogOpen(false)}>
            <DialogTitle>Driveへ保存</DialogTitle>
            <DialogContent>
              <DialogContentText>
                <b>上書き</b>：Drive の内容を現在のデータで置き換えます。<br />
                <b>マージ</b>：Drive と現在のデータを統合し、曲毎に良い方のスコア・ランプ・BPを保存します。
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDriveExportDialogOpen(false)}>キャンセル</Button>
              <Button variant="outlined" onClick={driveExportOverwrite} color="warning">上書きで保存</Button>
              <Button variant="contained" onClick={driveExportMerge} color="primary">マージで保存</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={driveImportDialogOpen} onClose={() => setDriveImportDialogOpen(false)}>
            <DialogTitle>Driveから読み込み</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Google Drive の {DRIVE_FOLDER_NAME}/{DRIVE_FILE_NAME} を読み込みます。<br />
                <b>上書き</b>：現在のデータを Drive の内容で置き換えます。<br />
                <b>マージ</b>：Drive と現在のデータを統合し、良い方の値を採用します。
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDriveImportDialogOpen(false)}>キャンセル</Button>
              <Button variant="outlined" onClick={driveImportOverwrite} color="warning">上書きで読み込み</Button>
              <Button variant="contained" onClick={driveImportMerge} color="primary">マージで読み込み</Button>
            </DialogActions>
          </Dialog>

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
      </SectionCard>
    </Page>
  );
};

export default SettingsPage;
