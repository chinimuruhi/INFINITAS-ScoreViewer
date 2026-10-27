import { Box, SxProps, Theme } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { simpleClearName } from '../constants/clearConstrains';
import { clearColorMap } from '../constants/colorConstrains';
import { labelTone } from '../utils/colorUtils';

const LampLabel = ({ lamp, sx }: { lamp: number; sx?: SxProps<Theme> }) => {
  const theme = useTheme();
  const tone = labelTone(clearColorMap[lamp], theme);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.75,
        lineHeight: 1.6,
        fontSize: '0.85em',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        borderRadius: 0.5,
        bgcolor: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.edge}`,
        ...sx,
      }}
    >
      {simpleClearName[lamp] ?? '-'}
    </Box>
  );
};

export default LampLabel;
