import React, { createContext, useContext, useState, ReactNode } from 'react';

// 複数の状態を管理するための型
interface AppContextType {
  mode: 'SP' | 'DP';         // モード
  setMode: React.Dispatch<React.SetStateAction<'SP' | 'DP'>>; // モードの変更
  score: number;             // スコア
  setScore: React.Dispatch<React.SetStateAction<number>>; // スコアの変更
}

// childrenの型をReactNodeに設定
interface AppProviderProps {
  children: ReactNode; // ReactNodeは、コンポーネントの中で渡すことができるすべての型（文字列、数値、JSX、配列など）を含みます。
}

// Contextの作成
const AppContext = createContext<AppContextType | undefined>(undefined);

// AppProviderコンポーネントを作成
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'SP' | 'DP'>('SP'); // 初期値はSP
  const [score, setScore] = useState<number>(0); // 初期スコア

  return (
    <AppContext.Provider value={{ mode, setMode, score, setScore }}>
      {children}
    </AppContext.Provider>
  );
};

// useAppContextカスタムフックを作成してContextの利用を簡素化
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
