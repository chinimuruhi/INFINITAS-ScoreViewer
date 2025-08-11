import { ungzip, gzip } from 'pako';
import { defaultMisscount } from '../constants/defaultValues';
import { replaceKeyMap, replacedDefaultMisscount } from '../constants/compressConstrains';

// Base64 URLセーフ形式にエンコード
export const base64UrlEncode = (str: string) => {
  let base64 = btoa(str);

  return encodeURIComponent(
    base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  );
};

// Base64 URLセーフ形式からデコード
export const base64UrlDecode = (encodedStr: string) => {
  let decoded = decodeURIComponent(encodedStr);

  decoded = decoded
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  // パディングを復元
  const padding = decoded.length % 4;
  if (padding) {
    decoded += '='.repeat(4 - padding);
  }

  return atob(decoded);
};

// キー名を短縮する関数
const minimizeData = (data: any): any => {
  const result: any = Array.isArray(data) ? [] : {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const newKey = replaceKeyMap[key] || key;
      const value = data[key];
      if (value && typeof value === 'object') {
        result[newKey] = minimizeData(value);
      } else {
        if(value === defaultMisscount){
          result[newKey] = replacedDefaultMisscount;
        }else{
          result[newKey] = value;
        }
      }
    }
  }
  return result;
};

// キー名を元に戻す関数
const restoreOriginalKeys = (data: any): any => {
  const result: any = Array.isArray(data) ? [] : {};
  const reverseKeyMap = Object.fromEntries(
    Object.entries(replaceKeyMap).map(([k, v]) => [v, k])
  );

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const originalKey = reverseKeyMap[key] || key; 
      const value = data[key];

      if (value && typeof value === 'object') {
        result[originalKey] = restoreOriginalKeys(value);
      } else {
        if(value === replacedDefaultMisscount){
          result[originalKey] = defaultMisscount;
        }else{
          result[originalKey] = value;
        }
      }
    }
  }

  return result;
};

// 圧縮してエンコード
export const compressDiffData = (data: any) => {
  const minimizedData = minimizeData(data);
  const jsonString = JSON.stringify(minimizedData);
  const compressedData = gzip(jsonString, { level: 9 });
  const compressedString = String.fromCharCode(...compressedData);
  return base64UrlEncode(compressedString);
}

// 解凍してデコード
export const decompressDiffData = (encodedData: string) => {
  const decodedString = base64UrlDecode(encodedData);
  const compressedData = new Uint8Array(decodedString.split('').map(char => char.charCodeAt(0)));
  const decompressedData = ungzip(compressedData, { to: 'string' });
  const data = JSON.parse(decompressedData);
  return restoreOriginalKeys(data);
};