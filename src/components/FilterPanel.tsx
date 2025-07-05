import React, { useEffect, useState } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText,
  Collapse, Button, IconButton, Typography
} from '@mui/material';
import { FilterList, FilterListOff } from '@mui/icons-material';

export type FilterState = {
  cleartype?: number[];
  unlocked?: boolean;
  releaseType?: 'ac' | 'inf' | 'both';
  version?: number[];
  label?: number[];
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

const FilterPanel = ({ filters, onChange }: Props) => {
  const [versionLabels, setVersionLabels] = useState<{ [key: number]: string }>({});
  const [labelMap, setLabelMap] = useState<{ [key: number]: string }>({});
  const [open, setOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);

  useEffect(() => {
    fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/version.json')
      .then(res => res.json())
      .then(data => {
        const map: { [key: number]: string } = {};
        Object.entries(data).forEach(([k, v]) => {
          map[parseInt(k)] = v as string;
        });
        setVersionLabels(map);
      });

    fetch('https://chinimuruhi.github.io/IIDX-Data-Table/konami/label.json')
      .then(res => res.json())
      .then(data => {
        const map: { [key: number]: string } = {};
        Object.entries(data).forEach(([k, v]) => {
          map[parseInt(k)] = v as string;
        });
        setLabelMap(map);
      });
  }, []);

  const handleApply = () => {
    onChange(pendingFilters);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => setOpen(!open)}>
          {open ? <FilterListOff /> : <FilterList />}
        </IconButton>
        <Typography variant="button" onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>
          {open ? 'フィルターを閉じる' : 'フィルターを開く'}
        </Typography>
      </Box>

      <Collapse in={open}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="cleartype-label">クリアタイプ</InputLabel>
          <Select
            labelId="cleartype-label"
            multiple
            value={pendingFilters.cleartype || []}
            onChange={(e) => setPendingFilters({ ...pendingFilters, cleartype: e.target.value })}
            renderValue={(selected) => selected.map((v: number) => ['NO PLAY', 'FAILED', 'ASSIST', 'EASY', 'CLEAR', 'HARD', 'EXHARD', 'FULLCOMBO'][v]).join(', ')}
          >
            {['NO PLAY', 'FAILED', 'ASSIST', 'EASY', 'CLEAR', 'HARD', 'EXHARD', 'FULLCOMBO'].map((label, index) => (
              <MenuItem key={index} value={index}>
                <Checkbox checked={pendingFilters.cleartype?.includes(index) || false} />
                <ListItemText primary={label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="unlock-label">INFINITAS解禁状況</InputLabel>
          <Select
            labelId="unlock-label"
            value={pendingFilters.unlocked ?? ''}
            onChange={(e) => setPendingFilters({ ...pendingFilters, unlocked: e.target.value === '' ? undefined : e.target.value === 'true' })}
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="true">解禁済み</MenuItem>
            <MenuItem value="false">未解禁</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="release-type-label">AC/INFINITAS収録</InputLabel>
          <Select
            labelId="release-type-label"
            value={pendingFilters.releaseType || ''}
            onChange={(e) => setPendingFilters({ ...pendingFilters, releaseType: e.target.value || undefined })}
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="ac">AC収録のみ</MenuItem>
            <MenuItem value="inf">INFINITAS収録のみ</MenuItem>
            <MenuItem value="both">AC収録&INFINITAS収録</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="version-label">バージョン</InputLabel>
          <Select
            labelId="version-label"
            multiple
            value={pendingFilters.version || []}
            onChange={(e) => setPendingFilters({ ...pendingFilters, version: e.target.value })}
            renderValue={(selected) => selected.map((v) => versionLabels[v] || v).join(', ')}
          >
            {Object.keys(versionLabels).sort((a, b) => parseInt(a) - parseInt(b)).map((key) => (
              <MenuItem key={key} value={parseInt(key)}>
                <Checkbox checked={pendingFilters.version?.includes(parseInt(key)) || false} />
                <ListItemText primary={versionLabels[parseInt(key)]} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="label-label">ラベル</InputLabel>
          <Select
            labelId="label-label"
            multiple
            value={pendingFilters.label || []}
            onChange={(e) => setPendingFilters({ ...pendingFilters, label: e.target.value })}
            renderValue={(selected) => selected.map((v) => labelMap[v] || v).join(', ')}
          >
            {Object.keys(labelMap).sort((a, b) => parseInt(a) - parseInt(b)).map((key) => (
              <MenuItem key={key} value={parseInt(key)}>
                <Checkbox checked={pendingFilters.label?.includes(parseInt(key)) || false} />
                <ListItemText primary={labelMap[parseInt(key)]} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box textAlign="right">
          <Button variant="contained" onClick={handleApply}>フィルターを適用</Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterPanel;
