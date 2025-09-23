import React, { useEffect, useState } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText,
  Collapse, Button, IconButton, Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { FilterList, FilterListOff } from '@mui/icons-material';
import { FilterState } from '../types/Types';
import { simpleClearName } from '../constants/clearConstrains';
import { difficultyDetailKeys, difficultyKey } from '../constants/difficultyConstrains';

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

const FilterPanel = ({ filters, onChange }: Props) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // ← スマホ判定

  const [versionLabels, setVersionLabels] = useState<{ [key: number]: string }>({});
  const [labelMap, setLabelMap] = useState<{ [key: number]: string }>({});
  const [open, setOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);

  useEffect(() => {
    fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/version.json')
      .then(res => res.json())
      .then(data => {
        const map: { [key: number]: string } = {};
        Object.entries(data).forEach(([k, v]) => { map[parseInt(k)] = v as string; });
        setVersionLabels(map);
      });

    fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/label.json')
      .then(res => res.json())
      .then(data => {
        const map: { [key: number]: string } = {};
        Object.entries(data).forEach(([k, v]) => { map[parseInt(k)] = v as string; });
        setLabelMap(map);
      });
  }, []);

  const handleApply = () => onChange(pendingFilters);

  // 共通スタイル（スマホでのサイズ感）
  const selectBaseSx = {
    '& .MuiSelect-select': {
      fontSize: isXs ? 13 : 14,
      py: isXs ? 1 : 1.25, // 内側の縦パディングを少しだけ詰める
    },
  } as const;

  const menuProps = {
    PaperProps: {
      sx: {
        maxHeight: isXs ? 280 : 360,
        '& .MuiMenuItem-root': {
          fontSize: isXs ? 13 : 14,
          minHeight: 'unset',
          py: 0.75,
        },
        '& .MuiCheckbox-root': { p: isXs ? 0.5 : 0.75 },
      },
    },
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => setOpen(!open)} size={isXs ? 'small' : 'medium'}>
          {open ? <FilterListOff fontSize={isXs ? 'small' : 'medium'} /> : <FilterList fontSize={isXs ? 'small' : 'medium'} />}
        </IconButton>
        <Typography
          variant="button"
          onClick={() => setOpen(!open)}
          sx={{ cursor: 'pointer', fontSize: isXs ? 12 : 13 }}
        >
          {open ? 'フィルターを閉じる' : 'フィルターを開く'}
        </Typography>
      </Box>

      <Collapse in={open}>
        {/* クリアランプ */}
        <FormControl fullWidth sx={{ mb: 2 }} size={isXs ? 'small' : 'medium'}>
          <InputLabel sx={{ fontSize: isXs ? 12 : 14 }}>クリアランプ</InputLabel>
          <Select
            multiple
            value={pendingFilters?.cleartype || []}
            onChange={(e) => setPendingFilters({ ...pendingFilters, cleartype: e.target.value as number[] })}
            renderValue={(selected) => (selected as number[]).map((v) => simpleClearName[v]).join(', ')}
            size={isXs ? 'small' : 'medium'}
            MenuProps={menuProps}
            sx={selectBaseSx}
          >
            {simpleClearName.map((label, index) => (
              <MenuItem key={index} value={index}>
                <Checkbox checked={pendingFilters?.cleartype?.includes(index) || false} />
                <ListItemText primaryTypographyProps={{ fontSize: isXs ? 13 : 14 }} primary={label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 譜面難易度  */}
        <FormControl fullWidth sx={{ mb: 2 }} size={isXs ? 'small' : 'medium'}>
          <InputLabel sx={{ fontSize: isXs ? 12 : 14 }}>譜面難易度</InputLabel>
          <Select
            multiple
            value={pendingFilters?.difficultyPattern || []}
            onChange={(e) => setPendingFilters({ ...pendingFilters, difficultyPattern: e.target.value as number[] })}
            renderValue={(selected) => (selected as number[]).map((v) => difficultyDetailKeys[v]).join(', ')}
            size={isXs ? 'small' : 'medium'}
            MenuProps={menuProps}
            sx={selectBaseSx}
          >
            {difficultyDetailKeys.map((label, index) => (
              <MenuItem key={index} value={index}>
                <Checkbox checked={pendingFilters?.difficultyPattern?.includes(index) || false} />
                <ListItemText primaryTypographyProps={{ fontSize: isXs ? 13 : 14 }} primary={label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 解禁状況 */}
        <FormControl fullWidth sx={{ mb: 2 }} size={isXs ? 'small' : 'medium'}>
          <InputLabel sx={{ fontSize: isXs ? 12 : 14 }}>INFINITAS解禁状況（Reflux）</InputLabel>
          <Select
            value={pendingFilters?.unlocked ?? ''}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                unlocked: e.target.value === '' ? undefined : e.target.value === 'true',
              })
            }
            size={isXs ? 'small' : 'medium'}
            MenuProps={menuProps}
            sx={selectBaseSx}
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="true">解禁済み</MenuItem>
            <MenuItem value="false">未解禁</MenuItem>
          </Select>
        </FormControl>

        {/* 収録状況 */}
        <FormControl fullWidth sx={{ mb: 2 }} size={isXs ? 'small' : 'medium'}>
          <InputLabel sx={{ fontSize: isXs ? 12 : 14 }}>AC/INFINITAS収録状況</InputLabel>
          <Select
            value={pendingFilters?.releaseType || ''}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                releaseType: (e.target.value as typeof filters.releaseType) || undefined,
              })
            }
            size={isXs ? 'small' : 'medium'}
            MenuProps={menuProps}
            sx={selectBaseSx}
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="ac">AC収録</MenuItem>
            <MenuItem value="inf">INFINITAS収録</MenuItem>
            <MenuItem value="ac_only">ACのみ収録</MenuItem>
            <MenuItem value="inf_only">INFINITASのみ収録</MenuItem>
          </Select>
        </FormControl>

        {/* バージョン */}
        <FormControl fullWidth sx={{ mb: 2 }} size={isXs ? 'small' : 'medium'}>
          <InputLabel sx={{ fontSize: isXs ? 12 : 14 }}>バージョン</InputLabel>
          <Select
            multiple
            value={pendingFilters?.version || []}
            onChange={(e) => setPendingFilters({ ...pendingFilters, version: e.target.value as number[] })}
            renderValue={(selected) => (selected as number[]).map((v) => versionLabels[v] || v).join(', ')}
            size={isXs ? 'small' : 'medium'}
            MenuProps={menuProps}
            sx={selectBaseSx}
          >
            {Object.keys(versionLabels).sort((a, b) => parseInt(a) - parseInt(b)).map((key) => (
              <MenuItem key={key} value={parseInt(key, 10)}>
                <Checkbox checked={pendingFilters?.version?.includes(parseInt(key, 10)) || false} />
                <ListItemText primaryTypographyProps={{ fontSize: isXs ? 13 : 14 }} primary={versionLabels[parseInt(key, 10)]} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 楽曲パック */}
        <FormControl fullWidth sx={{ mb: 2 }} size={isXs ? 'small' : 'medium'}>
          <InputLabel sx={{ fontSize: isXs ? 12 : 14 }}>楽曲パック</InputLabel>
          <Select
            multiple
            value={pendingFilters?.label || []}
            onChange={(e) => setPendingFilters({ ...pendingFilters, label: e.target.value as number[] })}
            renderValue={(selected) => (selected as number[]).map((v) => labelMap[v] || v).join(', ')}
            size={isXs ? 'small' : 'medium'}
            MenuProps={menuProps}
            sx={selectBaseSx}
          >
            {Object.keys(labelMap).sort((a, b) => parseInt(a) - parseInt(b)).map((key) => (
              <MenuItem key={key} value={parseInt(key, 10)}>
                <Checkbox checked={pendingFilters?.label?.includes(parseInt(key, 10)) || false} />
                <ListItemText primaryTypographyProps={{ fontSize: isXs ? 13 : 14 }} primary={labelMap[parseInt(key, 10)]} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box textAlign="right">
          <Button
            variant="contained"
            size={isXs ? 'small' : 'medium'}
            onClick={handleApply}
            sx={{ fontSize: isXs ? 12 : 14, fontWeight: 700 }}
          >
            フィルターを適用
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterPanel;
