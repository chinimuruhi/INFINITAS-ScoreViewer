import { normalizeTitle, fetchNormalizedTitleMap, fetchReplaceMap } from './titleUtils';
import { ScoreEntry, DiffEntry } from '../types/strage';
import { parse as parseCSV } from 'papaparse';
import { UnfoldLessOutlined } from '@mui/icons-material';

type CSVEntry = {
  title: string;
  difficulty: string;
  score: number;
  misscount: number;
  cleartype: number;
  unlocked: boolean;
};

type ParsedData = {
  [mode: string]: {
    [title: string]: {
      [difficulty: string]: CSVEntry;
    };
  };
};

const clearMapOfficial: Record<string, number> = {
  "NO PLAY": 0,
  "FAILED": 1,
  "ASSIST CLEAR": 2,
  "EASY CLEAR": 3,
  "CLEAR": 4,
  "HARD CLEAR": 5,
  "EX HARD CLEAR": 6,
  "FULLCOMBO CLEAR": 7
};

const clearMapReflux: Record<string, number> = {
  "NP": 0,
  "F": 1,
  "AC": 2,
  "EC": 3,
  "NC": 4,
  "HC": 5,
  "EX": 6,
  "FC": 7
};

const levelKeys = ["BEGINNER", "NORMAL", "HYPER", "ANOTHER", "LEGGENDARIA"];
const levelAbbr = ["B", "N", "H", "A", "L"];

export async function parseCsv(text: string, mode: 'SP' | 'DP'): Promise<ParsedData> {
  const rows = parseCSV(text, { header: true }).data as any[];
  const data: ParsedData = {};

  rows.forEach(row => {
    const title = row['タイトル'];
    if (!title) return;

    for (let i = 0; i < levelKeys.length; i++) {
      const key = levelKeys[i];
      const score = parseInt(row[`${key} スコア`] || '0');
      const miss = parseInt(row[`${key} ミスカウント`] || '0');
      const clear = clearMapOfficial[(row[`${key} クリアタイプ`] || '').trim()] ?? 0;
      if (clear != 0) {
        if (!data[mode]) data[mode] = {};
        if (!data[mode][title]) data[mode][title] = {};
        data[mode][title][levelAbbr[i]] = {
          title,
          difficulty: levelAbbr[i],
          score: isNaN(score) ? 0 : score,
          misscount: isNaN(miss) ? 99999 : miss,
          cleartype: clear,
          unlocked: false
        };
      }
    }
  });

  return data;
}

export async function parseTsv(text: string): Promise<ParsedData> {
  const rows = text.split('\n').map(line => line.split('\t'));
  const headers = rows[0];
  const data: ParsedData = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => rowObj[h] = row[idx]);

    const title = rowObj['title'];
    if (!title) continue;

    for (const mode of ['SP', 'DP']) {
      for (let i = 0; i < levelAbbr.length; i++) {
        const diff = levelAbbr[i];
        const prefix = mode + diff;
        const score = parseInt(rowObj[`${prefix} EX Score`] || '0');
        const miss = parseInt(rowObj[`${prefix} Miss Count`] || '99999');
        const clear = clearMapReflux[rowObj[`${prefix} Lamp`]] ?? 0;
        const unlocked = rowObj[`${prefix} Unlocked`] === 'TRUE';

        if (clear != 0 || unlocked) {
          if (!data[mode]) data[mode] = {};
          if (!data[mode][title]) data[mode][title] = {};
          data[mode][title][diff] = {
            title,
            difficulty: diff,
            score: isNaN(score) ? 0 : score,
            misscount: isNaN(miss) ? 99999 : miss,
            cleartype: clear,
            unlocked
          };
        }
      }
    }
  }

  return data;
}

export async function mergeWithStorage(parsed: ParsedData, isReflux: boolean) {
  const replaceMap = await fetchReplaceMap();
  const idMap = await fetchNormalizedTitleMap();

  const existingRaw = localStorage.getItem('data');
  const existing = existingRaw ? JSON.parse(existingRaw) : {};
  const diffs: any = {};
  const failedTitles: string[] = [];
  const merged = { ...existing };


  for(const mode in parsed){ 
    for (const rawTitle in parsed[mode]) {
      let title = rawTitle;
      for (const [from, to] of replaceMap['title']) {
        while(title.includes(from)) {
          title = title.replace(from, to);
        }
      }
      const normTitle = normalizeTitle(title);
      const songId = idMap[normTitle];
      if (!songId) {
        failedTitles.push(rawTitle);
        console.log(rawTitle + '(' + title + ')の読み込みに失敗しました。');
        console.log(idMap[''])
        continue;
      }

      if (!merged[mode]) merged[mode] = {};
      if (!merged[mode][songId]) merged[mode][songId] = {};

      const newEntries = parsed[mode][rawTitle];
      for (const diffKey in newEntries) {
        const entry = newEntries[diffKey];
        const old = merged[mode][songId][entry.difficulty];

        if (old) {
          const updated = {
            score: old.score,
            cleartype: old.cleartype,
            misscount: old.misscount,
            unlocked: isReflux ? entry.unlocked : old.unlocked
          };
          const diff: DiffEntry = {};
          if(entry.score > old.score){
            updated['score'] = entry.score;
            diff['score'] = {
              old: old.score,
              new: entry.score
            };
          }
          if(entry.cleartype > old.cleartype){
            updated['cleartype'] = entry.cleartype;
            diff['cleartype'] = {
              old: old.cleartype,
              new: entry.cleartype
            };
          }
          if(entry.misscount < old.misscount){
            updated['misscount'] = entry.misscount;
            diff['misscount'] = {
              old: old.misscount,
              new: entry.misscount
            };
          }
          merged[mode][songId][entry.difficulty] = updated;
          if(Object.keys(diff).length > 0){
            if (!diffs[mode]) diffs[mode] = {};
            if (!diffs[mode][songId]) diffs[mode][songId] = {};
            diffs[mode][songId] = diff;
          }
        } else {
          merged[mode][songId][entry.difficulty] = {
            score: entry.score,
            cleartype: entry.cleartype,
            misscount: entry.misscount,
            unlocked: entry.unlocked
          };
        }
      }
    }
  }

  return { data: merged, diffs, failedTitles };
}
