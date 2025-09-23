import { difficultyKey } from "../constants/difficultyConstrains";
import { FilterState } from "../types/Types";

export const isMatchSong = (filters: FilterState, lamp: number, difficulty: string, konamiInfInfo: any, chartInfo: any, unlocked: boolean, version: number, label: number) =>{

    if (filters?.cleartype && filters?.cleartype.length > 0 && !filters?.cleartype.includes(lamp)) return false;
    if (filters?.difficultyPattern && !filters.difficultyPattern.includes(difficultyKey.indexOf(difficulty))) return false;
    if (filters?.unlocked !== undefined && filters?.unlocked !== unlocked) return false;
    if (filters?.releaseType) {
      const notInInf = (!chartInfo?.in_inf || (difficulty === 'L' && !konamiInfInfo?.in_leggendaria));
      if (filters?.releaseType === 'ac' && !chartInfo?.in_ac) return false;
      if (filters?.releaseType === 'inf' && notInInf) return false;
      if (filters?.releaseType === 'ac_only' && (!chartInfo?.in_ac || (chartInfo?.in_ac && !notInInf))) return false;
      if (filters?.releaseType === 'inf_only' && (notInInf || (!notInInf && chartInfo?.in_ac))) return false;
    }
    if (filters?.version?.length && !filters?.version?.includes(version)) return false;
    if (filters?.label?.length && !filters?.label?.includes(label)) return false;

    return true;
}