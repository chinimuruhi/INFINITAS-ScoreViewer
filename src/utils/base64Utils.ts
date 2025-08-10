// Base64 URLエンコード
export const base64UrlEncode = (str: string) => {
  // まず通常のBase64エンコードを行う
  let base64 = btoa(str);

  // Base64 URLセーフ形式に変換
  return encodeURIComponent(
    base64
      .replace(/\+/g, '-') // + を - に変換
      .replace(/\//g, '_') // / を _ に変換
      .replace(/=+$/, '')  // パディング = を削除
  );
};

// Base64 URLデコード
export const base64UrlDecode = (encodedStr: string) => {
  // URLデコード
  let decoded = decodeURIComponent(encodedStr);

  // Base64 URL形式から通常のBase64に戻す
  decoded = decoded
    .replace(/-/g, '+') // - を + に戻す
    .replace(/_/g, '/') // _ を / に戻す;

  const padding = decoded.length % 4;
  if (padding) {
    decoded += '='.repeat(4 - padding); // パディングを復元
  }

  // Base64デコード
  return atob(decoded);
};