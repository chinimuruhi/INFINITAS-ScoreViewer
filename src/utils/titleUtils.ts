import { replaceTitle, replaceCharacters } from '../constants/replaceConstrains'

async function fetchReplaceMap(): Promise<Record<string, string>> {
  const res = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/manual/replace-characters.json');
  if (!res.ok) throw new Error('replace-characters.json の取得に失敗しました');
  return await res.json();
}

export async function fetchNormalizedTitleMap(): Promise<Record<string, string>> {
  const res = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/reverse-normalized-title.json');
  if (!res.ok) throw new Error('reverse-normalized-title.json の取得に失敗しました');
  return await res.json();
}

const remoteReplaceMap = await fetchReplaceMap();

export const normalizeTitle = (title: string): string => {
  for (const { from, to } of replaceTitle) {
    if(title === from) {
      title = to;
    }
  }
  for (const [from, to] of remoteReplaceMap['title']) {
    while (title.includes(from)) {
      title = title.replace(from, to);
    }
  }
  for (const { from, to } of replaceCharacters) {
    while (title.includes(from)) {
      title = title.replace(from, to);
    }
  }

  return title.split('').map(char => {
    const code = char.charCodeAt(0);
    return code > 127 ? '\\u' + code.toString(16).padStart(4, '0') : char;
  }).join('');
}

export const generateSearchText = (text: string) => {
  text = text.replace(/[Ａ-Ｚａ-ｚ０-９ａ-ｚＡ-Ｚ]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );

  text = text.replace(/[ぁ-ん]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) + 0x60)
  );
  
  return text.toLowerCase();
};
