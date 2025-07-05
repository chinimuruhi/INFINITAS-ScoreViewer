export function normalizeTitle(title: string): string {
  return title.split('').map(char => {
    const code = char.charCodeAt(0);
    return code > 127 ? '\\u' + code.toString(16).padStart(4, '0') : char;
  }).join('');
}

export async function fetchReplaceMap(): Promise<Record<string, string>> {
  const res = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/manual/replace-characters.json');
  if (!res.ok) throw new Error('replace-characters.json の取得に失敗しました');
  return await res.json();
}

export async function fetchNormalizedTitleMap(): Promise<Record<string, string>> {
  const res = await fetch('https://chinimuruhi.github.io/IIDX-Data-Table/textage/reverse-normalized-title.json');
  if (!res.ok) throw new Error('reverse-normalized-title.json の取得に失敗しました');
  return await res.json();
}
