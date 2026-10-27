import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, ButtonBase, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

export type NavGroup = 'top' | 'register' | 'view' | 'settings';

export type NavItem = { text: string; path: string; icon: React.ReactNode; group: NavGroup };

import { bottomNavHeight } from '../constants/layoutConstrains';

const tabs: { group: NavGroup; label: string; icon: React.ReactNode }[] = [
  { group: 'top', label: 'Top', icon: <HomeRoundedIcon /> },
  { group: 'register', label: 'スコア登録', icon: <UploadRoundedIcon /> },
  { group: 'view', label: 'スコア閲覧', icon: <GridViewRoundedIcon /> },
  { group: 'settings', label: '設定', icon: <SettingsRoundedIcon /> },
];

const groupOfPath = (pathname: string, items: NavItem[]): NavGroup | undefined => {
  if (pathname.startsWith('/edit')) return 'register';
  return items.find((item) => item.path === pathname)?.group;
};

// スマホ用の下部ナビ。項目が複数あるグループは、タップで下からメニューを出す
const BottomNav: React.FC<{ items: NavItem[] }> = ({ items }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<NavGroup | null>(null);

  const current = groupOfPath(location.pathname, items);
  const sheetItems = sheet ? items.filter((item) => item.group === sheet) : [];

  const handleTab = (group: NavGroup) => {
    const groupItems = items.filter((item) => item.group === group);
    if (groupItems.length === 1) {
      navigate(groupItems[0].path);
      setSheet(null);
    } else {
      setSheet(sheet === group ? null : group);
    }
  };

  return (
    <>
      <Box
        component="nav"
        aria-label="ページ移動"
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          display: 'flex',
          bgcolor: 'background.default',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          pb: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabs.map((tab) => {
          const active = sheet ? sheet === tab.group : current === tab.group;
          return (
            <ButtonBase
              key={tab.group}
              onClick={() => handleTab(tab.group)}
              aria-current={current === tab.group ? 'page' : undefined}
              aria-expanded={tab.group === 'register' || tab.group === 'view' ? sheet === tab.group : undefined}
              sx={{
                flex: 1,
                height: bottomNavHeight,
                flexDirection: 'column',
                gap: 0.25,
                color: active ? 'secondary.main' : 'text.secondary',
                '& .MuiSvgIcon-root': { fontSize: 22 },
              }}
            >
              {tab.icon}
              <Typography component="span" sx={{ fontSize: 11, fontWeight: active ? 700 : 400, lineHeight: 1 }}>
                {tab.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {/* グループ内のページ一覧（ナビの上に出す） */}
      <Drawer
        anchor="bottom"
        open={sheet !== null}
        onClose={() => setSheet(null)}
        PaperProps={{
          sx: {
            bottom: `calc(${bottomNavHeight}px + env(safe-area-inset-bottom))`,
            maxHeight: '70vh',
            borderRight: 0,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <List sx={{ py: 1 }}>
          {sheetItems.map((item) => {
            const selected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={selected}
                onClick={() => setSheet(null)}
                sx={{
                  py: 1,
                  borderLeft: '3px solid transparent',
                  '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'action.hover', borderLeftColor: 'secondary.main' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 15, fontWeight: selected ? 700 : 400 }} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
    </>
  );
};

export default BottomNav;
