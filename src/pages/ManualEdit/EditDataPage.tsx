// EditDataPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentFormattedDate, convertDateToTimeString, getCurrentFormattedTime } from '../../utils/dateUtils';
import { mergeWithJSONData } from '../../utils/scoreDataUtils';
import { useAppContext } from '../../context/AppContext';
import { difficultyKey } from '../../constants/difficultyConstrains';
import { simpleClearName } from '../../constants/clearConstrains';
import { defaultMisscount } from '../../constants/defaultValues';
import { Page, PageHeader } from '../../components/Page';
import SectionCard from '../../components/SectionCard';


const EditDataPage = () => {
  const { mode, setMode } = useAppContext();
  const { songIdRaw, difficultyRaw } = useParams<{ songIdRaw: string, difficultyRaw: string }>();
  const navigate = useNavigate();

  const [songId, setsongId] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string>('');
  const [user, setUser] = useState<any>({});
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);
  const [titleMap, setTitleMap] = useState<any>({});
  const [score, setScore] = useState<number>(0);
  const [cleartype, setClearType] = useState<number>(0);
  const [misscount, setMissCount] = useState<number>(0);
  const [lastplay, setLastPlay] = useState<string>('');
  const [unlocked, setUnlocked] = useState<boolean>(false);

  useEffect(() => {
    // 曲名取得
    const fetchData = async () => {
      try {
        const titleRes = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json');
        const titles = await titleRes.json();
        setTitleMap(titles);
      } catch (err) {
        console.error('Error loading song data:', err);
      }
    };
    fetchData();
    // localStrage読み込み
    const dataRes = JSON.parse(localStorage.getItem('data') || '{}');
    setUser(JSON.parse(localStorage.getItem('user') || '{}'));

    const songIdRes = Number(songIdRaw) || -1;
    const difficultyRes = difficultyKey[Number(difficultyRaw) || 3] || 'A';
    setsongId(songIdRes);
    setDifficulty(difficultyRes);
    setScore(dataRes?.[mode]?.[songIdRes]?.[difficultyRes]?.['score'] || 0);
    setClearType(dataRes?.[mode]?.[songIdRes]?.[difficultyRes]?.['cleartype'] || 0);
    setMissCount(dataRes?.[mode]?.[songIdRes]?.[difficultyRes]?.['misscount'] || defaultMisscount);
    setUnlocked(dataRes?.[mode]?.[songIdRes]?.[difficultyRes]?.['unlocked']);
    setLastPlay(getCurrentFormattedTime());
  }, [songIdRaw, difficultyRaw, mode]);

  const handleSave = () => {
    const lastUpdated = getCurrentFormattedTime();
    if (forceUpdate) {
      // 強制更新
      const newData = JSON.parse(localStorage.getItem('data') || '{}');
      const newTimeStamp = JSON.parse(localStorage.getItem('timestamps') || '{}');
      const newDiff = JSON.parse(localStorage.getItem('diff') || '{}');
      if (!newData[mode]) newData[mode] = {};
      if (!newData[mode][songId]) newData[mode][songId] = {};
      if (!newTimeStamp[mode]) newTimeStamp[mode] = {};
      if (!newTimeStamp[mode][songId]) newTimeStamp[mode][songId] = {};
      newData[mode][songId][difficulty] = {
        score,
        cleartype,
        misscount,
        unlocked
      }
      newTimeStamp[mode][songId][difficulty] = {
        lastplay,
        cleartypeupdated: lastUpdated,
        misscountupdated: lastUpdated,
        scoreupdated: lastUpdated
      }
      if (newDiff?.[mode]?.[songId]?.[difficulty]) newDiff[mode][songId][difficulty] = {};
      localStorage.setItem('data', JSON.stringify(newData));
      localStorage.setItem('diff', JSON.stringify(newDiff));
      localStorage.setItem('timestamps', JSON.stringify(newTimeStamp));
    } else {
      // 通常更新
      const saveData: any = {};
      saveData[mode] = {};
      saveData[mode][songId] = {};
      saveData[mode][songId][difficulty] = {
        score,
        cleartype,
        misscount,
        unlocked
      };
      const saveTimestamp: any = {};
      saveTimestamp[mode] = {};
      saveTimestamp[mode][songId] = {};
      saveTimestamp[mode][songId][difficulty] = {
        lastplay
      }
      const newData = mergeWithJSONData(saveData, saveTimestamp, true);
      localStorage.setItem('data', JSON.stringify(newData.data));
      localStorage.setItem('diff', JSON.stringify(newData.diffs));
      localStorage.setItem('timestamps', JSON.stringify(newData.timestamps));
      localStorage.setItem('user', JSON.stringify({ djname: user.djName, lastupdated: getCurrentFormattedDate() }));
    }
    alert('データを保存しました');
    navigate('/edit');
  };

  return (
    <Page>
      <PageHeader compact title={titleMap[songId] ? `${titleMap[songId]} [${difficulty}]` : '曲データが見つかりません'} />
      <SectionCard>
        <Container sx={{ mt: 4 }}>

          {titleMap[songId] ? (
            <>
              <FormControlLabel
                control={<Checkbox checked={unlocked} onChange={(e) => setUnlocked(e.target.checked)} />}
                label="INFINITAS解禁済み"
                sx={{ my: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>モード選択</InputLabel>
                <Select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'SP' | 'DP')}
                  label="モード"
                >
                  <MenuItem value="SP">SP</MenuItem>
                  <MenuItem value="DP">DP</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="スコア"
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value) || 0)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>クリアタイプ</InputLabel>
                <Select
                  value={cleartype}
                  onChange={(e) => setClearType(Number(e.target.value))}
                  label="クリアタイプ"
                >


                  {simpleClearName.map((value, index) => (
                    <MenuItem key={index} value={index}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="ミスカウント（値なしの場合は99999）"
                type="number"
                value={misscount}
                onChange={(e) => setMissCount(Number(e.target.value) === 0 || e.target.value === '' ? 0 : Number(e.target.value) || defaultMisscount)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="プレイ日時"
                type="datetime-local"
                value={lastplay}
                onChange={(e) => setLastPlay(convertDateToTimeString(e.target.value))}
                fullWidth
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={<Checkbox checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} />}
                label="強制更新（誤って登録したデータの修正用）"
                sx={{ my: 2 }}
              />
              {forceUpdate && (
                <>
                  <Alert severity="warning">
                    ランプ、スコア、BPが良くなっていない場合も更新します。更新差分は削除されますのでご注意ください。
                  </Alert>
                </>
              )}

              <Box mt={2}>
                <Button variant="contained" onClick={handleSave}>
                  保存
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body1" color="error">
              曲データが見つかりません。
            </Typography>
          )}
        </Container>
      </SectionCard>
    </Page>
  );
};

export default EditDataPage;
