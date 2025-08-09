import { normalizeTitle, fetchNormalizedTitleMap, fetchReplaceMap } from './titleUtils';
import { ScoreEntry, DiffEntry, TimestampEntry } from '../types/strage';
import { parse as parseCSV } from 'papaparse';
import { UnfoldLessOutlined } from '@mui/icons-material';

type CSVEntry = {
  title: string;
  difficulty: string;
  score: number;
  misscount: number;
  cleartype: number;
  unlocked: boolean;
  lastplay: string;
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

const clearMapIDC: Record<string, number> = {
  "NO PLAY": 0,
  "FAILED": 1,
  "A-CLEAR": 2,
  "E-CLEAR": 3,
  "CLEAR": 4,
  "H-CLEAR": 5,
  "EXH-CLEAR": 6,
  "F-COMBO": 7
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

const defaultMisscount = 99999
const defaultLastPlay = "1970-01-01 00:00"

function formatDate(date: Date): string{
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getCurrentFormattedDate(): string {
  const date = new Date(); 
  return formatDate(date);
}

function convertDateFormat(dateString: string): string {
    const date = new Date(dateString);
    return formatDate(date);
}

export async function parseOfficialCsv(text: string, mode: 'SP' | 'DP'): Promise<ParsedData> {
  const rows = parseCSV(text, { header: true }).data as any[];
  const data: ParsedData = {};

  rows.forEach(row => {
    const title = row['タイトル'];
    if (!title) return;
    const lastplay = row['最終プレー日時'];

    for (let i = 0; i < levelKeys.length; i++) {
      const key = levelKeys[i];
      const score = parseInt(row[`${key} スコア`] || '0');
      const miss = row[`${key} ミスカウント`] ? parseInt(row[`${key} ミスカウント`]) : defaultMisscount;
      const clear = clearMapOfficial[(row[`${key} クリアタイプ`] || '').trim()] ?? 0;
      if (clear != 0) {
        if (!data[mode]) data[mode] = {};
        if (!data[mode][title]) data[mode][title] = {};
        data[mode][title][levelAbbr[i]] = {
          title,
          difficulty: levelAbbr[i],
          score: isNaN(score) ? 0 : score,
          misscount: isNaN(miss) ? defaultMisscount : miss,
          cleartype: clear,
          unlocked: false,
          lastplay: lastplay
        };
      }
    }
  });

  return data;
}

export async function parseIDCCsv(text: string): Promise<ParsedData> {
  const rows = parseCSV(text, { header: true }).data as any[];
  const data: ParsedData = {};

  rows.forEach(row => {
    const title = row['Title'];
    if (!title) return;
    const mode = row['mode'].slice(0,2);
    const diff = row['mode'].slice(2,3);
    const score = parseInt(row['Score'] || '0');
    const clear = clearMapIDC[(row['Lamp'] || '').trim()] ?? 0;
    const miss = row['BP'] ? parseInt(row['BP']): defaultMisscount;
    const lastplay = convertDateFormat(row['Last Played']);

    if (clear != 0) {
      if (!data[mode]) data[mode] = {};
      if (!data[mode][title]) data[mode][title] = {};
      data[mode][title][diff] = {
        title,
        difficulty: diff,
        score: score,
        misscount: miss,
        cleartype: clear,
        unlocked: false,
        lastplay
      };
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
        const miss = rowObj[`${prefix} Miss Count`] ? parseInt(rowObj[`${prefix} Miss Count`]) : defaultMisscount;
        const clear = clearMapReflux[rowObj[`${prefix} Lamp`]] ?? 0;
        const unlocked = rowObj[`${prefix} Unlocked`] === 'TRUE';

        if (clear != 0 || unlocked) {
          if (!data[mode]) data[mode] = {};
          if (!data[mode][title]) data[mode][title] = {};
          data[mode][title][diff] = {
            title,
            difficulty: diff,
            score: isNaN(score) ? 0 : score,
            misscount: isNaN(miss) ? defaultMisscount : miss,
            cleartype: clear,
            unlocked,
            lastplay: '',
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

  const existingDataRaw = localStorage.getItem('data');
  const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : {};
  const existingTSRaw = localStorage.getItem('timestamps');
  const existingTS = existingTSRaw ? JSON.parse(existingTSRaw) : {};
  const diffs: any = {};
  const failedTitles: string[] = [];
  const mergedData = { ...existingData };
  const mergedTS = { ...existingTS};

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
        continue;
      }

      if (!mergedData[mode]) mergedData[mode] = {};
      if (!mergedData[mode][songId]) mergedData[mode][songId] = {};
      if (!mergedTS[mode]) mergedTS[mode] = {};
      if (!mergedTS[mode][songId]) mergedTS[mode][songId] = {};

      const newEntries = parsed[mode][rawTitle];
      for (const diffKey in newEntries) {
        const entry = newEntries[diffKey];
        const oldData = mergedData[mode][songId][entry.difficulty] || {};
        const oldTS = mergedTS[mode][songId][entry.difficulty] || {};
        const lastplay = entry.lastplay ? entry.lastplay : getCurrentFormattedDate();

        let updated: { [key: string]: any }  = {};
        let diff: { [key: string]: any }  = {};
        let timestamp: { [key: string]: any }  = {};

        if(Object.keys(oldData).length > 0 && Object.keys(oldTS).length > 0){
          // 既プレイ楽曲
          updated = {
            score: oldData.score,
            cleartype: oldData.cleartype,
            misscount: oldData.misscount,
            unlocked: isReflux ? entry.unlocked : oldData.unlocked
          };
          timestamp = {
            lastplay: lastplay,
            scoreupdated: oldTS.scoreupdated,
            cleartypeupdated: oldTS.cleartypeupdated,
            misscountupdated: oldTS.misscountupdated
          }
          if(entry.score > oldData.score){
            updated['score'] = entry.score;
            diff['score'] = {
              old: oldData.score,
              new: entry.score
            };
            timestamp['scoreupdated'] = lastplay;
          }
          if(entry.cleartype > oldData.cleartype){
            updated['cleartype'] = entry.cleartype;
            diff['cleartype'] = {
              old: oldData.cleartype,
              new: entry.cleartype
            };
            timestamp['cleartypeupdated'] = lastplay;
          }
          if(entry.misscount < oldData.misscount){
            updated['misscount'] = entry.misscount;
            diff['misscount'] = {
              old: oldData.misscount,
              new: entry.misscount
            };
            timestamp['misscountupdated'] = lastplay;
          }
        }else{
          //初プレイ楽曲
          updated = {
            score: entry.score,
            cleartype: entry.cleartype,
            misscount: entry.misscount,
            unlocked: entry.unlocked
          };
          let fixedLastPlay = lastplay;
          if(entry.score === 0 && entry.cleartype === 0 && entry.misscount === defaultMisscount){
            fixedLastPlay = defaultLastPlay;
          }else{
            diff = {
              score: {
                old: 0,
                new: entry.score
              },
              cleartype: {
                old: 0,
                new: entry.cleartype
              },
              misscount: {
                old: defaultMisscount,
                new: entry.misscount
              }
            }
          }
          timestamp = {
            lastplay: fixedLastPlay,
            scoreupdated: fixedLastPlay,
            cleartypeupdated: fixedLastPlay,
            misscountupdated: fixedLastPlay
          }
        }
        // 登録共通処理
        mergedData[mode][songId][entry.difficulty] = updated;
        if(entry.score !== 0 || entry.cleartype !== 0 || entry.misscount !== defaultMisscount){
          if (!mergedTS[mode][songId]) mergedTS[mode][songId] = {};
          mergedTS[mode][songId][entry.difficulty] = timestamp;
        }
        if(Object.keys(diff).length > 0){
          if (!diffs[mode]) diffs[mode] = {};
          if (!diffs[mode][songId]) diffs[mode][songId] = {};
          diffs[mode][songId][entry.difficulty] = diff;
        }
      }
    }
  }

  return { data: mergedData, diffs, timestamps: mergedTS, failedTitles };
}
