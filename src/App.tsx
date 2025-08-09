import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Container, CssBaseline, AppBar, Toolbar, Typography, IconButton,
  Drawer, List, ListItem, ListItemText, ToggleButton, ToggleButtonGroup, Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import CsvLoaderPage from './pages/CsvLoaderPage';
import NewPage from './pages/NewPage';
import Sp12TablePage from './pages/Sp12TablePage';
import Sp11TablePage from './pages/Sp11TablePage';
import DpTablePage from './pages/DpTablePage';
import CpiPage from './pages/CpiPage';
import BpiPage from './pages/BpiPage';
import EreterPage from './pages/EreterPage';
import RadarPage from './pages/RadarPage';
import StatusPage from './pages/StatusPage';
import SettingsPage from './pages/SettingsPage';
import ManualEditPage from './pages/ManualEditPage';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'SP' | 'DP'>('SP');

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { text: 'データ読み込み', path: '/', mode: 'both' },
    { text: 'New', path: '/new', mode: 'both' },
    { text: 'SP☆12表', path: '/sp12', mode: 'SP' },
    { text: 'SP☆11表', path: '/sp11', mode: 'SP' },
    { text: 'DP表', path: '/dp', mode: 'DP' },
    { text: 'CPI', path: '/cpi', mode: 'SP' },
    { text: 'BPI', path: '/bpi', mode: 'both' },
    { text: 'ereter.net', path: '/ereter', mode: 'DP' },
    { text: 'レーダー', path: '/radar', mode: 'both' },
    { text: '設定', path: '/settings', mode: 'both' },
    { text: '手動編集', path: '/manual', mode: 'both' }
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
          <Route path="/" element={<CsvLoaderPage />} />
          <Route path="/new" element={<NewPage mode={mode} />} />
          <Route path="/sp12" element={mode === 'SP' ? <Sp12TablePage mode={mode} /> : <Typography>このページはSPモードでのみ利用可能です。</Typography>} />
          <Route path="/sp11" element={mode === 'SP' ? <Sp11TablePage mode={mode} /> : <Typography>このページはSPモードでのみ利用可能です。</Typography>} />
          <Route path="/dp" element={mode === 'DP' ? <DpTablePage mode={mode} /> : <Typography>このページはDPモードでのみ利用可能です。</Typography>} />
          <Route path="/cpi" element={mode === 'SP' ? <CpiPage mode={mode} /> : <Typography>このページはSPモードでのみ利用可能です。</Typography>} />
          <Route path="/bpi" element={<BpiPage mode={mode} />} />
          <Route path="/ereter" element={mode === 'DP' ? <EreterPage mode={mode} /> : <Typography>このページはDPモードでのみ利用可能です。</Typography>} />
          <Route path="/radar" element={<RadarPage mode={mode} />} />
          <Route path="/settings" element={<SettingsPage mode={mode} />} />
          <Route path="/manual" element={<ManualEditPage mode={mode} />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
