import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';  // AppProviderをインポート
import { CssBaseline } from '@mui/material';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppProvider>  
      <CssBaseline />
      <App />
    </AppProvider>
  </React.StrictMode>
);