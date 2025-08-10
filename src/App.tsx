import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Container, CssBaseline, AppBar, Toolbar, Typography, IconButton,
  Drawer, List, ListItem, ListItemText, ToggleButton, ToggleButtonGroup, Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

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

const App: React.FC = () => {
  const { mode, setMode } = useAppContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { text: 'スコアCSV/TSV読み込み', path: '/register', mode: 'both' },
    { text: 'スコア手動登録', path: '/edit', mode: 'both' },
    { text: '更新差分', path: '/diff', mode: 'both' },
    { text: 'SP☆12表', path: '/sp12', mode: 'SP' },
    { text: 'SP☆11表', path: '/sp11', mode: 'SP' },
    { text: 'DP表', path: '/dp', mode: 'DP' },
    { text: 'CPI', path: '/cpi', mode: 'SP' },
    { text: 'BPI', path: '/bpi', mode: 'both' },
    { text: 'ereter.net', path: '/ereter', mode: 'DP' },
    { text: 'レーダー', path: '/radar', mode: 'both' },
    { text: '設定', path: '/settings', mode: 'both' },
  ];

  return (
      <Router>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              INFINITAS Score Tool
            </Typography>
            <Box sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              px: 1,
              py: 0.5,
              display: 'flex',
              alignItems: 'center'
            }}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, value) => value && setMode(value)}
                size="small"
                color="primary"
              >
                <ToggleButton value="SP">SP</ToggleButton>
                <ToggleButton value="DP">DP</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
          <List sx={{ width: 250 }}>
            {menuItems.filter(item => item.mode === mode || item.mode === 'both').map(item => (
              <ListItem button key={item.path} component={Link} to={item.path} onClick={toggleDrawer(false)}>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/register" element={<CsvLoaderPage />} />
            <Route path="/diff" element={<DiffPage />} />
            <Route path="/sp12" element={mode === 'SP' ? <Sp12TablePage /> : <Typography>このページはSPモードでのみ利用可能です。</Typography>} />
            <Route path="/sp11" element={mode === 'SP' ? <Sp11TablePage /> : <Typography>このページはSPモードでのみ利用可能です。</Typography>} />
            <Route path="/dp" element={mode === 'DP' ? <DpTablePage /> : <Typography>このページはDPモードでのみ利用可能です。</Typography>} />
            <Route path="/cpi" element={mode === 'SP' ? <CpiPage /> : <Typography>このページはSPモードでのみ利用可能です。</Typography>} />
            <Route path="/bpi" element={<BpiPage />} />
            <Route path="/ereter" element={mode === 'DP' ? <EreterPage /> : <Typography>このページはDPモードでのみ利用可能です。</Typography>} />
            <Route path="/radar" element={<RadarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/edit" element={<EditSongSelectPage />} />
            <Route path="/edit/:songIdRaw/:difficultyRaw" element={<EditDataPage />} />
          </Routes>
        </Container>
      </Router>
  );
};

export default App;
