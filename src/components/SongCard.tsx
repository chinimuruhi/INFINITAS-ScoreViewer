import { Grid, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getTitleFontSize } from '../utils/uiUtils';

interface SongCardProps {
  songId: string;
  difficultyIndex: number;
  title: string;
  backgroundColor: string;
  children?: React.ReactNode;
}

const SongCard = ({ songId, difficultyIndex, title, backgroundColor, children }: SongCardProps) => {
  const navigate = useNavigate();
  return (
    <Grid item xs={1} sm={4} md={2} sx={{ minWidth: 0 }}>
      <Paper elevation={3} sx={{ p: { xs: 1, sm: 1.2 }, height: '100%', backgroundColor }}>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ fontSize: getTitleFontSize(title), whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: 1.35 }}
          onClick={() => navigate(`/edit/${songId}/${difficultyIndex}`)}
        >
          {title}
        </Typography>
        {children}
      </Paper>
    </Grid>
  );
};

export default SongCard;
