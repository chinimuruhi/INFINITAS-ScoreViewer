import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Container, CssBaseline, AppBar, Toolbar, Typography, IconButton,
  Drawer, List, ListItemButton, ListItemText, ListItemIcon, ToggleButton,
  ToggleButtonGroup, Box, Divider, Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import DifferenceRoundedIcon from '@mui/icons-material/DifferenceRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import RadarRoundedIcon from '@mui/icons-material/RadarRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

import { useAppContext } from './context/AppContext';

import CsvLoaderPage from './pages/CsvLoaderPage';
import DiffPage from './pages/DiffPage';
import Sp12TablePage from './pages/Sp12TablePage';
import Sp11TablePage from './pages/Sp11TablePage';
import DpTablePage from './pages/DpTablePage';
import CpiPage from './pages/CpiPage';
import BpiPage from './pages/BpiPage';
import EreterPage from './pages/EreterPage';
import RadarPage from './pages/RadarPage';
import SettingsPage from './pages/SettingsPage';
import EditSongSelectPage from './pages/ManualEdit/EditSongSelectPage';
import EditDataPage from './pages/ManualEdit/EditDataPage';
import Index from './pages/Index';

type VisibleMode = 'SP' | 'DP' | 'both';

const AppShell: React.FC = () => {
  const { mode, setMode } = useAppContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

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
    { text: 'BPI', path: '/bpi', mode: 'both', icon: <GridViewRoundedIcon /> },
    { text: 'ereter.net', path: '/ereter', mode: 'DP', icon: <GridViewRoundedIcon /> },
    { text: 'レーダー', path: '/radar', mode: 'both', icon: <RadarRoundedIcon /> },
    { text: '設定', path: '/settings', mode: 'both', icon: <SettingsRoundedIcon /> },
  ];

  const visibleMenu = menuItems.filter(item => item.mode === 'both' || item.mode === mode);

  return (
    <>
      <CssBaseline />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background:
            'linear-gradient(90deg, rgba(99,102,241,.95), rgba(56,189,248,.95))',
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton edge="start" color="inherit" onClick={toggleDrawer(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: .3 }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              INFINITAS Score Viewer
            </Link>
          </Typography>

          {/* SP / DP Toggle */}
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,.9)',
              borderRadius: 999,
              px: 1,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              border: theme => `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 10px rgba(0,0,0,.08)',
            }}
          >
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, value) => value && setMode(value)}
              size="small"
              color="primary"
            >
              <ToggleButton value="SP" sx={{ fontWeight: 700, px: 2 }}>SP</ToggleButton>
              <ToggleButton value="DP" sx={{ fontWeight: 700, px: 2 }}>DP</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 280 }}>
          <Box
            sx={{
              px: 2,
              py: 2,
              background:
                'linear-gradient(135deg, rgba(99,102,241,.12), rgba(56,189,248,.10))',
              borderBottom: theme => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ opacity: .8, mb: .5 }}>
              モード
            </Typography>
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 999,
                px: 1,
                py: 0.5,
                border: theme => `1px solid ${theme.palette.divider}`,
                width: 'fit-content',
              }}
            >
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, value) => value && setMode(value)}
                size="small"
                color="primary"
              >
                <ToggleButton value="SP" sx={{ px: 2, fontWeight: 700 }}>SP</ToggleButton>
                <ToggleButton value="DP" sx={{ px: 2, fontWeight: 700 }}>DP</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <List sx={{ py: 1 }}>
            {visibleMenu.map(item => {
              const selected = location.pathname === item.path;
              return (
                <Tooltip key={item.path} title={item.text} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={selected}
                    onClick={toggleDrawer(false)}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      mb: .5,
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        boxShadow: 'inset 0 0 0 1px rgba(99,102,241,.25)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontWeight: selected ? 800 : 600 }}
                    />
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>

          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} INFINITAS ScoreViewer
            </Typography>
          </Box>
        </Box>
      </Drawer>

      <Container sx={{ mt: 4, mb: 6 }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<CsvLoaderPage />} />
          <Route path="/diff" element={<DiffPage />} />
          <Route
            path="/sp12"
            element={
              mode === 'SP'
                ? <Sp12TablePage />
                : <Typography>このページはSPモードでのみ利用可能です。</Typography>
            }
          />
          <Route
            path="/sp11"
            element={
              mode === 'SP'
                ? <Sp11TablePage />
                : <Typography>このページはSPモードでのみ利用可能です。</Typography>
            }
          />
          <Route
            path="/dp"
            element={
              mode === 'DP'
                ? <DpTablePage />
                : <Typography>このページはDPモードでのみ利用可能です。</Typography>
            }
          />
          <Route
            path="/cpi"
            element={
              mode === 'SP'
                ? <CpiPage />
                : <Typography>このページはSPモードでのみ利用可能です。</Typography>
            }
          />
          <Route path="/bpi" element={<BpiPage />} />
          <Route
            path="/ereter"
            element={
              mode === 'DP'
                ? <EreterPage />
                : <Typography>このページはDPモードでのみ利用可能です。</Typography>
            }
          />
          <Route path="/radar" element={<RadarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/edit" element={<EditSongSelectPage />} />
          <Route path="/edit/:songIdRaw/:difficultyRaw" element={<EditDataPage />} />
        </Routes>
      </Container>
    </>
  );
};

const App: React.FC = () => (
  <Router basename={process.env.BASE_URL || '/'}>
    <AppShell />
  </Router>
);

export default App;
