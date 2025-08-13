import { normalizeTitle, fetchNormalizedTitleMap } from './titleUtils';
import { parse as parseCSV } from 'papaparse';
import { convertDateToTimeString, getCurrentFormattedTime } from './dateUtils'
import { clearMapIDC, clearMapOfficial, clearMapReflux } from '../constants/clearConstrains';
import { difficultyDetailKeys, difficultyKey } from '../constants/difficultyConstrains';
import { defaultLastPlay, defaultMisscount } from '../constants/defaultValues';
import { acInfDiffMap } from '../constants/titleConstrains';

// 公式CSVのパース
export async function parseOfficialCsv(text: string, mode: 'SP' | 'DP'): Promise<any> {
  const rows = parseCSV(text, { header: true }).data as any[];
  const data: any = {};

  rows.forEach(row => {
    const title = row['タイトル'];
    if (!title) return;
    const lastplay = row['最終プレー日時'];

    for (let i = 0; i < difficultyDetailKeys.length; i++) {
      const key = difficultyDetailKeys[i];
      const score = parseInt(row[`${key} スコア`] || '0');
      const miss = row[`${key} ミスカウント`] ? parseInt(row[`${key} ミスカウント`]) : defaultMisscount;
      const clear = clearMapOfficial[(row[`${key} クリアタイプ`] || '').trim()] ?? 0;
      if (clear != 0) {
        if (!data[mode]) data[mode] = {};
        if (!data[mode][title]) data[mode][title] = {};
        data[mode][title][difficultyKey[i]] = {
          title,
          difficulty: difficultyKey[i],
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

// INFINITAS打鍵カウンタCSVのパース
export async function parseIDCCsv(text: string): Promise<any> {
  const rows = parseCSV(text, { header: true }).data as any[];
  const data: any = {};

  rows.forEach(row => {
    const title = row['Title'];
    if (!title) return;
    const mode = row['mode'].slice(0, 2);
    const diff = row['mode'].slice(2, 3);
    const score = parseInt(row['Score'] || '0');
    const clear = clearMapIDC[(row['Lamp'] || '').trim()] ?? 0;
    const miss = row['BP'] ? parseInt(row['BP']) : defaultMisscount;
    const lastplay = convertDateToTimeString(row['Last Played']);

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

// Reflux TSVのパース
export async function parseRefluxTsv(text: string): Promise<any> {
  const rows = text.split('\n').map(line => line.split('\t'));
  const headers = rows[0];
  const data: any = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => rowObj[h] = row[idx]);

    const title = rowObj['title'];
    if (!title) continue;

    for (const mode of ['SP', 'DP']) {
      for (let i = 0; i < difficultyKey.length; i++) {
        const diff = difficultyKey[i];
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

// 曲毎のマージ処理
const mergeScore = (entry: any, oldData: any, oldTS: any, isReflux: boolean, lastplay: string) => {
  let updated: { [key: string]: any } = {};
  let diff: { [key: string]: any } = {};
  let timestamp: { [key: string]: any } = {};

  if (Object.keys(oldData).length > 0 && Object.keys(oldTS).length > 0) {
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
    if (entry.score > oldData.score) {
      updated['score'] = entry.score;
      diff['score'] = {
        old: oldData.score,
        new: entry.score
      };
      timestamp['scoreupdated'] = lastplay;
    }
    if (entry.cleartype > oldData.cleartype) {
      updated['cleartype'] = entry.cleartype;
      diff['cleartype'] = {
        old: oldData.cleartype,
        new: entry.cleartype
      };
      timestamp['cleartypeupdated'] = lastplay;
    }
    if (entry.misscount < oldData.misscount) {
      updated['misscount'] = entry.misscount;
      diff['misscount'] = {
        old: oldData.misscount,
        new: entry.misscount
      };
      timestamp['misscountupdated'] = lastplay;
    }
  } else {
    //初プレイ楽曲
    updated = {
      score: entry.score,
      cleartype: entry.cleartype,
      misscount: entry.misscount,
      unlocked: entry.unlocked
    };
    let fixedLastPlay = lastplay;
    if (entry.score === 0 && entry.cleartype === 0 && entry.misscount === defaultMisscount) {
      fixedLastPlay = defaultLastPlay;
    } else {
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
  return { updated, diff, timestamp }
}

// CSV読み込み時のLocalStrageデータとのマージ処理
export async function mergeWithCSVEntries(parsed: any, isReflux: boolean, isInf: boolean) {
  const idMap = await fetchNormalizedTitleMap();
  const reversedacInfDiffMap: { [key: number]: any } =
    Object.fromEntries(
      Object.entries(acInfDiffMap).map(([infId, data]) => [
        data.acID,                 // 新しいキー = acID
        { ...data, infId: Number(infId) } // 元のIDを含めたオブジェクト
      ])
    );

  const existingDataRaw = localStorage.getItem('data') || '{}';
  const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : {};
  const existingTSRaw = localStorage.getItem('timestamps') || '{}';
  const existingTS = existingTSRaw ? JSON.parse(existingTSRaw) : {};
  const diffs: any = {};
  const failedTitles: string[] = [];
  const mergedData = { ...existingData };
  const mergedTS = { ...existingTS };
  let isInfId = false;

  for (const mode in parsed) {
    for (const rawTitle in parsed[mode]) {
      const normTitle = normalizeTitle(rawTitle);
      const acSongId = idMap[normTitle];
      let acInfDif;
      if (!acSongId) {
        failedTitles.push(rawTitle);
        console.log(rawTitle + '(' + normTitle + ')の読み込みに失敗しました。');
        continue;
      }
      if (isInf) {
        acInfDif = reversedacInfDiffMap[Number(acSongId)];
      }
      const newEntries = parsed[mode][rawTitle];
      for (const difficulty in newEntries) {
        let songId = acSongId;
        const entry = newEntries[difficulty];
        if(acInfDif && acInfDif.changedChart.includes(mode + difficulty)){
          songId = acInfDif.infId;
        }
        if (!mergedData[mode]) mergedData[mode] = {};
        if (!mergedData[mode][songId]) mergedData[mode][songId] = {};
        if (!mergedTS[mode]) mergedTS[mode] = {};
        if (!mergedTS[mode][songId]) mergedTS[mode][songId] = {};
        const oldData = mergedData[mode][songId][entry.difficulty] || {};
        const oldTS = mergedTS[mode][songId][entry.difficulty] || {};
        const lastplay = entry.lastplay ? entry.lastplay : getCurrentFormattedTime();

        const merged = mergeScore(entry, oldData, oldTS, isReflux, lastplay);

        // 登録共通処理
        mergedData[mode][songId][entry.difficulty] = merged.updated;
        if (entry.score !== 0 || entry.cleartype !== 0 || entry.misscount !== defaultMisscount) {
          if (!mergedTS[mode][songId]) mergedTS[mode][songId] = {};
          mergedTS[mode][songId][entry.difficulty] = merged.timestamp;
        }
        if (Object.keys(merged.diff).length > 0) {
          if (!diffs[mode]) diffs[mode] = {};
          if (!diffs[mode][songId]) diffs[mode][songId] = {};
          diffs[mode][songId][entry.difficulty] = merged.diff;
        }
      }
    }
  }

  return { data: mergedData, diffs, timestamps: mergedTS, failedTitles };
}

// JSON変更時のLocalStrageデータとのマージ処理
export function mergeWithJSONData(data: any, timestamps: any, isReflux: boolean) {
  const existingDataRaw = localStorage.getItem('data') || '{}';
  const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : {};
  const existingTSRaw = localStorage.getItem('timestamps') || '{}';
  const existingTS = existingTSRaw ? JSON.parse(existingTSRaw) : {};
  const existingDiffRaw = localStorage.getItem('diff') || '{}';
  const existingDiff = existingDataRaw ? JSON.parse(existingDiffRaw) : {};
  const mergedData = { ...existingData };
  const mergedTS = { ...existingTS };
  const mergedDiff = { ...existingDiff };

  for (const mode in data) {
    for (const songId in data[mode]) {

      if (!mergedData[mode]) mergedData[mode] = {};
      if (!mergedData[mode][songId]) mergedData[mode][songId] = {};
      if (!mergedTS[mode]) mergedTS[mode] = {};
      if (!mergedTS[mode][songId]) mergedTS[mode][songId] = {};

      const newEntries = data[mode][songId];
      for (const difficulty in newEntries) {
        const entry = newEntries[difficulty];
        const oldData = mergedData[mode][songId][difficulty] || {};
        const oldTS = mergedTS[mode][songId][difficulty] || {};
        const lastplay = timestamps?.[mode]?.[songId]?.[difficulty]?.lastplay ? timestamps[mode][songId][difficulty].lastplay : getCurrentFormattedTime();

        const merged = mergeScore(entry, oldData, oldTS, isReflux, lastplay);

        // 登録共通処理
        mergedData[mode][songId][difficulty] = merged.updated;
        if (entry.score !== 0 || entry.cleartype !== 0 || entry.misscount !== defaultMisscount) {
          if (!mergedTS[mode][songId]) mergedTS[mode][songId] = {};
          mergedTS[mode][songId][difficulty] = merged.timestamp;
        }
        if (Object.keys(merged.diff).length > 0) {
          if (!mergedDiff[mode]) mergedDiff[mode] = {};
          if (!mergedDiff[mode][songId]) mergedDiff[mode][songId] = {};
          if (!mergedDiff[mode][songId][difficulty]) mergedDiff[mode][songId][difficulty] = {};
          for (const diffType in merged.diff) {
            mergedDiff[mode][songId][difficulty][diffType] = merged.diff[diffType];
          }
        }
      }
    }
  }

  return { data: mergedData, diffs: mergedDiff, timestamps: mergedTS };
}


// ${id}_${diff}形式のオブジェクトに変換
export const convertDataToIdDiffKey = (data: any, mode: 'SP' | 'DP') => {
  const score: { [key: string]: number } = {};
  const clear: { [key: string]: number } = {};
  const misscount: { [key: string]: number } = {};
  const unlocked: { [key: string]: boolean } = {};
  for (const id in data[mode]) {
    for (const diff in data[mode][id]) {
      score[`${id}_${diff}`] = data[mode][id][diff].score;
      clear[`${id}_${diff}`] = data[mode][id][diff].cleartype;
      misscount[`${id}_${diff}`] = data[mode][id][diff].misscount;
      unlocked[`${id}_${diff}`] = data[mode][id][diff].unlocked;
    }
  }

  return { score, clear, misscount, unlocked }
}