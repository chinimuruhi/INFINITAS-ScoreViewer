import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ungzip } from 'pako';
import { useAppContext } from '../../context/AppContext';

const difficultyIndexMap = { B: 0, N: 1, H: 2, A: 3, L: 4 };

const normalizeText = (text: string) => {
  text = text.replace(/[Ａ-Ｚａ-ｚ０-９ａ-ｚＡ-Ｚ]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );

  text = text.replace(/[ぁ-ん]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) + 0x60)
  );
  
  return text.toLowerCase();
};

const EditSongSelectPage = () => {
  const { mode, setMode } = useAppContext();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<any[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<any[]>([]);
  const [songSearch, setSongSearch] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(12);
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [openResetDialog, setOpenResetDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const titleRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json');
        const titles = await titleRes.json();

        const chartRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz');
        const chartBuffer = await chartRes.arrayBuffer();
        const chartJson = JSON.parse(ungzip(new Uint8Array(chartBuffer), { to: 'string' }));

        const songList = [];

        for(const id of Object.keys(titles)){
          for(const difficulty of Object.keys(difficultyIndexMap)){
            const diffNumber = difficultyIndexMap[difficulty as keyof typeof difficultyIndexMap];
            const key = `${id}_${diffNumber}`;
            if(chartJson[id]['level'][mode.toLowerCase()][diffNumber] === 0) continue;
            if(!chartJson[id]['in_ac'] && !chartJson[id]['in_inf']) continue;
            songList.push({
              key, id, diffNumber, difficulty,
              title: titles[id],
              normalizeTitle: normalizeText(titles[id]),
              level: chartJson[id]['level'][mode.toLowerCase()][diffNumber]
            })
          }
        }

        setSongs(songList);
        setFilteredSongs(songList); // 初期は全ての曲を表示
      } catch (err) {
        console.error('Error loading song data:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // 曲名検索に基づいて曲リストをフィルタリング
    setFilteredSongs(
      songs.filter(song => 
        (songSearch === '' || song.normalizeTitle.includes(normalizeText(songSearch)))
        && song.level === selectedLevel
      ).sort((a, b) => a.title.localeCompare(b.title))
    );
  }, [songSearch, selectedLevel, songs]);

  const handleSelectSong = (songId: string, difficulty: string) => {
    navigate(`/edit/${songId}/${difficulty}`);
  };

  const handleLevelChange = (event: SelectChangeEvent<string>) => {
    setSelectedLevel(Number(event.target.value));
  };

  const handleResetClick = () => {
    setOpenResetDialog(true);
  };

  const handleResetCancel = () => {
    setOpenResetDialog(false);
  };

  const handleResetConfirm = () => {
    localStorage.setItem('diff', '{}');
    setOpenResetDialog(false);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        スコア手動登録
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={handleResetClick}>
          更新差分クリア
        </Button>
        <Typography variant="body2">
          このページで登録したデータは更新差分ページにも追加されます。プレー日が変わる度に、更新差分クリアすることを推奨します。
        </Typography>
        <Typography variant="body2">
          ※ 登録したスコアは削除されません。
        </Typography>
      </Box>

      {/* 曲名検索 */}
      <TextField
        label="曲名検索"
        value={songSearch}
        onChange={(e) => setSongSearch(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>レベルを選択</InputLabel>
        <Select
          value={String(selectedLevel)}
          onChange={handleLevelChange}
          label="レベルを選択"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <MenuItem key={index + 1} value={index + 1}>
              ⭐︎{index + 1}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TableContainer sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ cursor: 'pointer' }}>曲名</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSongs.map((song) => (
              <TableRow
                key={`${song.key}`}
                onClick={() => handleSelectSong(song.id, song.diffNumber)}
                style={{
                  cursor: 'pointer',
                  transition: 'background-color 0.3s', // スムーズなホバーエフェクト
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: '#f0f0f0', // ホバー時の背景色
                  },
                  backgroundColor: selectedSong === song.id ? '#e0e0e0' : '', // 選択された行の背景色
                }}
              >
                <TableCell>{song.title} [{song.difficulty}]</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openResetDialog} onClose={handleResetCancel}>
        <DialogTitle>更新差分クリア</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            更新差分をクリアしてもよろしいですか？
          </Typography>
          <Typography variant="body1">
            ※ 登録したスコアは削除されません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetCancel} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleResetConfirm} color="secondary">
            リセット
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditSongSelectPage;
