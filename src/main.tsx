import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import { ColorModeProvider } from './context/ColorModeContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppProvider>
      <DataProvider>
        <ColorModeProvider>
          <App />
        </ColorModeProvider>
      </DataProvider>
    </AppProvider>
  </React.StrictMode>
);
