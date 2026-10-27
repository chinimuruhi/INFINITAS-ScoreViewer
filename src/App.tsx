import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container, AppBar, Toolbar, Typography, IconButton,
  Drawer, List, ListItemButton, ListItemText, ListItemIcon, ToggleButton,
  ToggleButtonGroup, Box, Divider, Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import DifferenceRoundedIcon from '@mui/icons-material/DifferenceRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import RadarRoundedIcon from '@mui/icons-material/RadarRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TableRowsIcon from '@mui/icons-material/TableRows';

import { useMode } from './context/ModeContext';
import { useColorMode } from './context/ColorModeContext';

import CsvLoaderPage from './pages/CsvLoaderPage';
import DiffPage from './pages/DiffPage';
import Sp12TablePage from './pages/Sp12TablePage';
import Sp11TablePage from './pages/Sp11TablePage';
import DpTablePage from './pages/DpTablePage';
import CpiPage from './pages/CpiPage';
import BpiPage from './pages/BpiPage';
import Bpim2Page from './pages/Bpim2Page';
import EreterPage from './pages/EreterPage';
import RadarPage from './pages/RadarPage';
import SettingsPage from './pages/SettingsPage';
import EditSongSelectPage from './pages/ManualEdit/EditSongSelectPage';
import EditDataPage from './pages/ManualEdit/EditDataPage';
import SongTablePage from './pages/SongTablePage';
import Index from './pages/Index';

type VisibleMode = 'SP' | 'DP' | 'both';

const AppShell: React.FC = () => {
  const { mode, setMode } = useMode();
  const { resolvedMode, toggle: toggleColorMode } = useColorMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);

  const menuItems: Array<{ text: string; path: string; mode: VisibleMode; icon: React.ReactNode }> = [
    { text: 'Top', path: '/', mode: 'both', icon: <HomeRoundedIcon /> },
    { text: 'スコアCSV/TSV読み込み', path: '/register', mode: 'both', icon: <UploadRoundedIcon /> },
    { text: 'スコア手動登録', path: '/edit', mode: 'both', icon: <EditNoteRoundedIcon /> },
    { text: '更新差分', path: '/diff', mode: 'both', icon: <DifferenceRoundedIcon /> },
    { text: 'SP☆12難易度表', path: '/sp12', mode: 'SP', icon: <GridViewRoundedIcon /> },
    { text: 'SP☆11難易度表', path: '/sp11', mode: 'SP', icon: <GridViewRoundedIcon /> },
    { text: 'DP非公式難易度表', path: '/dp', mode: 'DP', icon: <GridViewRoundedIcon /> },
    { text: 'CPI', path: '/cpi', mode: 'SP', icon: <GridViewRoundedIcon /> },
    { text: 'BPIM', path: '/bpi', mode: 'both', icon: <GridViewRoundedIcon /> },
    { text: 'BPIM2', path: '/bpim2', mode: 'SP', icon: <GridViewRoundedIcon /> },
    { text: 'ereter.net', path: '/ereter', mode: 'DP', icon: <GridViewRoundedIcon /> },
    { text: 'ノーツレーダー', path: '/radar', mode: 'both', icon: <RadarRoundedIcon /> },
    { text: '楽曲一覧', path: '/songtable', mode: 'both', icon: <TableRowsIcon /> },
    { text: '設定', path: '/settings', mode: 'both', icon: <SettingsRoundedIcon /> },
  ];

  const visibleMenu = menuItems.filter(item => item.mode === 'both' || item.mode === mode);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const redirect = urlParams.get('redirect');

    const params = new URLSearchParams(location.search);
    params.delete('redirect');

    if (redirect) {
      navigate(`${redirect}?${params.toString()}`);
    }
  }, [location.search, navigate]);

  const modeToggle = (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={(_, value) => value && setMode(value)}
      size="small"
      aria-label="プレースタイル"
      sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.25, lineHeight: 1.6 } }}
    >
      <ToggleButton value="SP">SP</ToggleButton>
      <ToggleButton value="DP">DP</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ minHeight: { xs: 52, sm: 56 }, px: { xs: 1, sm: 2 }, gap: 1 }}>
          <IconButton edge="start" color="inherit" onClick={toggleDrawer(true)} aria-label="メニューを開く">
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1, minWidth: 0 }}>
            <Link
              to="/"
              style={{ textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}
              title="INFINITAS Score Viewer"
            >
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>INF Score Viewer</Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>INFINITAS Score Viewer</Box>
            </Link>
          </Typography>
          {modeToggle}
          <Tooltip title={resolvedMode === 'dark' ? 'ライトテーマにする' : 'ダークテーマにする'}>
            <IconButton color="inherit" onClick={toggleColorMode} aria-label="テーマを切り替える" edge="end">
              {resolvedMode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 264, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary">プレースタイル</Typography>
            {modeToggle}
          </Box>

          <List sx={{ py: 1, flexGrow: 1 }} component="nav">
            {visibleMenu.map(item => {
              const selected = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  selected={selected}
                  onClick={toggleDrawer(false)}
                  sx={{
                    py: 0.75,
                    borderLeft: '3px solid transparent',
                    '&.Mui-selected, &.Mui-selected:hover': {
                      bgcolor: 'action.hover',
                      borderLeftColor: 'secondary.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 700 : 400 }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Divider />
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} chinimuruhi
            </Typography>
          </Box>
        </Box>
      </Drawer>

      <Container maxWidth={false} sx={{ maxWidth: theme => theme.layout.pageMaxWidth, mb: 6, px: { xs: 2, sm: 3 } }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<CsvLoaderPage />} />
          <Route path="/diff" element={<DiffPage />} />
          <Route
            path="/sp12"
            element={
              mode === 'SP'
                ? <Sp12TablePage />
                : <ModeOnlyNotice mode="SP" />
            }
          />
          <Route
            path="/sp11"
            element={
              mode === 'SP'
                ? <Sp11TablePage />
                : <ModeOnlyNotice mode="SP" />
            }
          />
          <Route
            path="/dp"
            element={
              mode === 'DP'
                ? <DpTablePage />
                : <ModeOnlyNotice mode="DP" />
            }
          />
          <Route
            path="/cpi"
            element={
              mode === 'SP'
                ? <CpiPage />
                : <ModeOnlyNotice mode="SP" />
            }
          />
          <Route path="/bpi" element={<BpiPage />} />
          <Route
            path="/bpim2"
            element={
              mode === 'SP'
                ? <Bpim2Page />
                : <ModeOnlyNotice mode="SP" />
            }
          />
          <Route
            path="/ereter"
            element={
              mode === 'DP'
                ? <EreterPage />
                : <ModeOnlyNotice mode="DP" />
            }
          />
          <Route path="/radar" element={<RadarPage />} />
          <Route path="/songtable" element={<SongTablePage/>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/edit" element={<EditSongSelectPage />} />
          <Route path="/edit/:songIdRaw/:difficultyRaw" element={<EditDataPage />} />
        </Routes>
      </Container>
    </>
  );
};

const ModeOnlyNotice: React.FC<{ mode: 'SP' | 'DP' }> = ({ mode }) => (
  <Typography color="text.secondary" sx={{ py: 4 }}>このページは{mode}モードでのみ利用可能です。</Typography>
);

const App: React.FC = () => (
  <Router basename={process.env.BASE_URL || '/'}>
    <AppShell />
  </Router>
);

export default App;
