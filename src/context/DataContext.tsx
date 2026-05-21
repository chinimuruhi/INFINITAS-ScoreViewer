import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ungzip } from 'pako';

const BASE = 'https://chinimuruhi.github.io/IIDX-Data-Table';

interface DataContextType {
  titleMap: Record<string, string>;
  chartInfo: Record<string, any>;
  songInfo: Record<string, any>;
  konamiInfInfo: Record<string, any>;
  versionLabels: Record<number, string>;
  labelMap: Record<number, string>;
  commonLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const toNumMap = (obj: Record<string, string>): Record<number, string> => {
  const m: Record<number, string> = {};
  for (const [k, v] of Object.entries(obj)) m[parseInt(k)] = v;
  return m;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [chartInfo, setChartInfo] = useState<Record<string, any>>({});
  const [songInfo, setSongInfo] = useState<Record<string, any>>({});
  const [konamiInfInfo, setKonamiInfInfo] = useState<Record<string, any>>({});
  const [versionLabels, setVersionLabels] = useState<Record<number, string>>({});
  const [labelMap, setLabelMap] = useState<Record<number, string>>({});
  const [commonLoading, setCommonLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [titleRes, chartGz, songInfoGz, konamiRes, versionRes, labelRes] = await Promise.all([
          fetch(`${BASE}/textage/title.json`).then(r => r.json()),
          fetch(`${BASE}/textage/chart-info.json.gz`).then(r => r.arrayBuffer()),
          fetch(`${BASE}/textage/song-info.json.gz`).then(r => r.arrayBuffer()),
          fetch(`${BASE}/konami/song_to_label.json`).then(r => r.json()),
          fetch(`${BASE}/textage/version.json`).then(r => r.json()),
          fetch(`${BASE}/konami/label.json`).then(r => r.json()),
        ]);

        setTitleMap(titleRes);
        setChartInfo(JSON.parse(new TextDecoder().decode(ungzip(chartGz))));
        setSongInfo(JSON.parse(new TextDecoder().decode(ungzip(songInfoGz))));
        setKonamiInfInfo(konamiRes);
        setVersionLabels(toNumMap(versionRes));
        setLabelMap(toNumMap(labelRes));
      } catch (e) {
        console.error('DataContext fetch failed:', e);
      } finally {
        setCommonLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <DataContext.Provider value={{ titleMap, chartInfo, songInfo, konamiInfInfo, versionLabels, labelMap, commonLoading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataContext must be used within DataProvider');
  return ctx;
};
