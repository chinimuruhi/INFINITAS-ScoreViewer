import { Box, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { getTitleFontSize } from '../utils/uiUtils';
import { tileTone } from '../utils/colorUtils';

interface SongCardProps {
  songId: string;
  difficultyIndex: number;
  title: string;
  backgroundColor: string;
  children?: React.ReactNode;
}

const SongCard = ({ songId, difficultyIndex, title, backgroundColor, children }: SongCardProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const tone = tileTone(backgroundColor, theme);
  return (
    <Grid item xs={1} sm={4} md={2} sx={{ minWidth: 0 }}>
      <Box
        onClick={() => navigate(`/edit/${songId}/${difficultyIndex}`)}
        sx={{
          p: { xs: 0.75, sm: 1 },
          height: '100%',
          cursor: 'pointer',
          bgcolor: tone.bg,
          color: tone.fg,
          border: `1px solid ${theme.palette.divider}`,
          borderLeft: theme.palette.mode === 'dark' ? `3px solid ${tone.edge}` : undefined,
          borderRadius: 0.5,
          '&:hover': { outline: `1px solid ${theme.palette.text.secondary}`, outlineOffset: -1 },
          '& .MuiTypography-caption': { color: 'inherit', opacity: 0.8 },
        }}
      >
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ fontSize: getTitleFontSize(title), whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: 1.35 }}
        >
          {title}
        </Typography>
        {children}
      </Box>
    </Grid>
  );
};

export default SongCard;
