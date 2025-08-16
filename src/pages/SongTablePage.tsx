import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, Typography, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  Box, Backdrop, CircularProgress, Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Page, PageHeader } from '../components/Page';
import SectionCard from '../components/SectionCard';
import FilterPanel from '../components/FilterPanel';
import { useAppContext } from '../context/AppContext';
import { ungzip } from 'pako';

import { difficultyKey } from '../constants/difficultyConstrains';
import { clearColorMap } from '../constants/colorConstrains';
import { simpleClearName } from '../constants/clearConstrains';
import { defaultMisscount } from '../constants/defaultValues';

import { getPercentage, getDetailGrade, getGrade } from '../utils/gradeUtils';
import { generateSearchText } from '../utils/titleUtils';
import { isMatchSong } from '../utils/filterUtils';
import { convertDataToIdDiffKey } from '../utils/scoreDataUtils';
import { acInfDiffMap } from '../constants/titleConstrains';
import { calculateBpi } from '../utils/bpiUtils';

type SongRow = {
  id: string;
  difficulty: string;
  diffIndex: number;
  level: number;
  notes: number;
  title: string;
  normalizedTitle: string;
};

type SortKey = 'lv' | 'title' | 'cleartype' | 'grade' | 'score' | 'bp' | 'bpi';
type SortDir = 'asc' | 'desc';

const SongTablePage: React.FC = () => {
  const { mode, filters, setFilters } = useAppContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const [chartInfo, setChartInfo] = useState<any>({});
  const [songInfo, setSongInfo] = useState<any>({});
  const [konamiInfInfo, setKonamiInfInfo] = useState<any>({});

  const [clearData, setClearData] = useState<Record<string, number>>({});
  const [scoreData, setScoreData] = useState<Record<string, number>>({});
  const [missData, setMissData] = useState<Record<string, number>>({});
  const [unlockedData, setUnlockedData] = useState<Record<string, boolean>>({});
  const [bpiInfo, setBpiInfo] = useState<any>({});

  const [songs, setSongs] = useState<SongRow[]>([]);
  const [songSearch, setSongSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number>(12);
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDir }>({
    key: 'title',
    direction: 'asc',
  });

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : {
          key,
          direction:
            key === 'bp' ? 'asc' :
              key === 'lv' ? 'desc' :
                key === 'score' ? 'desc' :
                  key === 'grade' ? 'desc' : 'asc',
        }
    );
  };
  const handleSortKeyChange = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        key === 'bp' ? 'asc' :
          key === 'lv' ? 'desc' :
            key === 'score' ? 'desc' :
              key === 'grade' ? 'desc' :
                prev.direction,
    }));
  };
  const toggleSortDir = () =>
    setSortConfig((s) => ({ ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }));

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [
          titleRes,
          songInfoGz,
          chartGz,
          konamiRes,
          bpiSpInfo,
          bpiDpInfo,
        ] = await Promise.all([
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/title.json').then(r => r.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/song-info.json.gz').then(r => r.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/chart-info.json.gz').then(r => r.arrayBuffer()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/song_to_label.json').then(r => r.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/bpi/sp_dict.json').then((res) => res.json()),
          fetch('https://chinimuruhi.github.io/IIDX-Data-Table/bpi/dp_dict.json').then((res) => res.json()),
        ]);

        setSongInfo(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));
        const chartJson = JSON.parse(new TextDecoder().decode(ungzip(chartGz)));
        setChartInfo(chartJson);
        setKonamiInfInfo(konamiRes);
        setBpiInfo({
          'SP': bpiSpInfo,
          'DP': bpiDpInfo
        });

        const local = JSON.parse(localStorage.getItem('data') || '{}');
        const { clear, score, misscount, unlocked } = convertDataToIdDiffKey(local, mode);
        setClearData(clear);
        setScoreData(score ?? {});
        setMissData(misscount);
        setUnlockedData(unlocked);

        const list: SongRow[] = [];
        for (const id of Object.keys(titleRes)) {
          const c = chartJson[id];
          if (!c) continue;
          if (!(c.in_ac || c.in_inf)) continue;

          for (const diff of difficultyKey) {
            const diffIndex = difficultyKey.indexOf(diff);
            const lv = c.level?.[mode.toLowerCase()]?.[diffIndex] ?? 0;
            if (!lv) continue;

            const notes = c.notes?.[mode.toLowerCase()]?.[diffIndex] ?? 0;
            const title = titleRes[id] ?? id;
            list.push({
              id,
              difficulty: diff,
              diffIndex,
              level: lv,
              notes,
              title,
              normalizedTitle: generateSearchText(title),
            });
          }
        }
        setSongs(list);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [mode]);

  const filtered = useMemo(() => {
    const query = generateSearchText(songSearch);
    return songs
      .filter(s => {
        if (query && !s.normalizedTitle.includes(query)) return false;
        if (s.level !== selectedLevel) return false;

        const key = `${s.id}_${s.difficulty}`;
        const lamp = clearData[key] ?? 0;
        const konami = konamiInfInfo[s.id] || {};
        const chart = chartInfo[s.id] || {};
        const unlocked = unlockedData[key] ?? false;
        const version = songInfo[s.id]?.version;
        const label = konamiInfInfo[s.id]?.label;

        return isMatchSong(filters, lamp, s.difficulty, konami, chart, unlocked, version, label);
      });
  }, [songs, songSearch, selectedLevel, filters, clearData, chartInfo, konamiInfInfo, unlockedData, songInfo]);

  const getLamp = (id: string, difficulty: string) => {
    const key = `${id}_${difficulty}`;
    return clearData[key] ?? 0;
  };
  const getScore = (id: string, difficulty: string) => {
    const key = `${id}_${difficulty}`;
    return scoreData[key] ?? 0;
  };
  const getRate = (id: string, difficulty: string, notes: number) => {
    const score = getScore(id, difficulty);
    return getPercentage(score, notes);
  };
  const getBP = (id: string, difficulty: string) => {
    const key = `${id}_${difficulty}`;
    const bp = missData[key];
    if (bp == null || bp === defaultMisscount) return Number.POSITIVE_INFINITY;
    return bp;
  };
  const getBPI = (id: string, difficulty: string) => {
    const bpiInfoEntry = bpiInfo?.[mode]?.[id]?.[difficulty];
    const score = getScore(id, difficulty);
    const bpi = bpiInfoEntry && score ? calculateBpi(bpiInfoEntry.wr, bpiInfoEntry.avg, bpiInfoEntry.notes, score, bpiInfoEntry.coef) : -99;
    return bpi ? bpi : -99
  }

  const handleSelectSong = (songId: string, difficultyIndex: string) => {
    navigate(`/edit/${songId}/${difficultyIndex}`);
  };

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortConfig.direction;

    const cmpNum = (a: number, b: number) => (dir === 'asc' ? a - b : b - a);
    const cmpStr = (a: string, b: string) => (dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a));

    return arr.sort((a, b) => {
      switch (sortConfig.key) {
        case 'lv':
          return cmpNum(a.level, b.level);
        case 'title':
          return cmpStr(a.title, b.title);
        case 'cleartype': {
          const la = getLamp(a.id, a.difficulty);
          const lb = getLamp(b.id, b.difficulty);
          return cmpNum(la, lb);
        }
        case 'grade': {
          const ra = getRate(a.id, a.difficulty, a.notes);
          const rb = getRate(b.id, b.difficulty, b.notes);
          return cmpNum(ra, rb);
        }
        case 'score': {
          const sa = getScore(a.id, a.difficulty);
          const sb = getScore(b.id, b.difficulty);
          return cmpNum(sa, sb);
        }
        case 'bp': {
          const ba = getBP(a.id, a.difficulty);
          const bb = getBP(b.id, b.difficulty);
          return cmpNum(ba, bb);
        }
        case 'bpi': {
          const ba = getBPI(a.id, a.difficulty);
          const bb = getBPI(b.id, b.difficulty);
          return cmpNum(ba, bb);
        }
        default:
          return 0;
      }
    });
  }, [filtered, sortConfig]);

  const renderCleartype = (id: string, difficulty: string) => {
    const key = `${id}_${difficulty}`;
    const lamp = clearData[key] ?? 0;
    const bg = clearColorMap[lamp];
    const text = simpleClearName[lamp] ?? '-';
    return (
      <Box sx={{ px: 1, borderRadius: 1, display: 'inline-block', backgroundColor: bg }}>
        {text}
      </Box>
    );
  };

  const renderGrade = (id: string, difficulty: string, notes: number) => {
    const key = `${id}_${difficulty}`;
    const score = scoreData[key] ?? 0;
    const rate = getPercentage(score, notes);
    return `${getGrade(rate)} (${getDetailGrade(score, notes)})`;
  };

  const renderScore = (id: string, difficulty: string, notes: number) => {
    const key = `${id}_${difficulty}`;
    const score = scoreData[key] ?? 0;
    const rate = getPercentage(score, notes) * 100;
    return `${score} (${rate.toFixed(2)}%)`;
  };

  const renderBP = (id: string, difficulty: string) => {
    const key = `${id}_${difficulty}`;
    const bp = missData[key];
    if (bp == null || bp === defaultMisscount) return '-';
    return String(bp);
  };

  const renderBPI = (id: string, difficulty: string) => {
    const bpiInfoEntry = bpiInfo?.[mode]?.[id]?.[difficulty];
    const score = getScore(id, difficulty);
    const bpi = bpiInfoEntry && score ? calculateBpi(bpiInfoEntry.wr, bpiInfoEntry.avg, bpiInfoEntry.notes, score, bpiInfoEntry.coef) : NaN;
    if (Number.isNaN(bpi)){
      return ''
    }else{
      return bpi
    }
  }

  const handleLevelChange = (e: SelectChangeEvent<string>) => {
    setSelectedLevel(Number(e.target.value));
  };

  return (
    <Page>
      <PageHeader compact title="楽曲一覧" />
      <SectionCard>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
            <CircularProgress color="inherit" />
          </Backdrop>

          <FilterPanel filters={filters} onChange={setFilters} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2, my: 2 }}>
            <TextField
              label="曲名検索"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>レベル（☆）</InputLabel>
              <Select value={String(selectedLevel)} label="レベル（☆）" onChange={handleLevelChange}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(lv => (
                  <MenuItem key={lv} value={lv}>⭐︎{lv}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {isXs && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>ソート</InputLabel>
                <Select
                  label="ソート"
                  value={sortConfig.key}
                  onChange={(e) => handleSortKeyChange(e.target.value as SortKey)}
                >
                  <MenuItem value="lv">Level</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="cleartype">Lamp</MenuItem>
                  {selectedLevel >= 11 && 
                    <MenuItem value="bpi">BPI</MenuItem>
                  }
                  <MenuItem value="grade">Grade</MenuItem>
                  <MenuItem value="score">Score</MenuItem>
                  <MenuItem value="bp">BP</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" size="small" onClick={toggleSortDir}>
                {sortConfig.direction === 'asc' ? '昇順' : '降順'}
              </Button>
            </Box>
          )}

          <TableContainer sx={{ mb: 3 }}>
            <Table size="small" sx={{ minWidth: 700, '& td, & th': { fontSize: { xs: 12, sm: 14 } } }}>
              {/* PC/Tablet: 通常ヘッダ */}
              <TableHead sx={{ display: { xs: 'none', sm: 'table-header-group' } }}>
                <TableRow>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('lv')}>
                    ☆
                  </TableCell>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
                    Title
                  </TableCell>
                  <TableCell sx={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('cleartype')}>
                    Lamp
                  </TableCell>
                  {selectedLevel >= 11 && 
                    <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('bpi')}>
                      BPI
                    </TableCell>
                  }
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('grade')}>
                    Grade
                  </TableCell>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('score')}>
                    Score
                  </TableCell>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => handleSort('bp')}>
                    BP
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sorted.map((s) => (
                  <React.Fragment key={`${s.id}_${s.difficulty}`}>
                    <TableRow
                      sx={{ display: { xs: 'none', sm: 'table-row' } }}
                      hover
                      onClick={() => handleSelectSong(s.id, String(s.diffIndex))}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell>⭐︎{s.level}</TableCell>
                      <TableCell>
                        {s.title} [{s.difficulty}]
                        {acInfDiffMap[Number(s.id)] ? ' (INFINITAS)' : ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {renderCleartype(s.id, s.difficulty)}
                      </TableCell>
                      {selectedLevel >= 11 && 
                        <TableCell>{renderBPI(s.id, s.difficulty)}</TableCell>
                      }
                      <TableCell>{renderGrade(s.id, s.difficulty, s.notes)}</TableCell>
                      <TableCell>{renderScore(s.id, s.difficulty, s.notes)}</TableCell>
                      <TableCell>{renderBP(s.id, s.difficulty)}</TableCell>
                    </TableRow>

                    <TableRow
                      sx={{ display: { xs: 'table-row', sm: 'none' } }}
                      hover
                      onClick={() => handleSelectSong(s.id, String(s.diffIndex))}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell colSpan={6} sx={{ py: 1.25 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {s.title} [{s.difficulty}] {acInfDiffMap[Number(s.id)] ? '(INFINITAS)' : ''}
                        </Typography>

                        <Box
                          sx={{
                            mt: 0.5,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            alignItems: 'center',
                            color: 'text.secondary',
                            fontSize: 10,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {renderCleartype(s.id, s.difficulty)}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>BPI{renderBPI(s.id, s.difficulty)}</span>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{renderGrade(s.id, s.difficulty, s.notes)}</span>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{renderScore(s.id, s.difficulty, s.notes)}</span>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>BP: {renderBP(s.id, s.difficulty)}</span>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}

                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      条件に一致する曲がありません。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </Container>
      </SectionCard>
    </Page>
  );
};

export default SongTablePage;
