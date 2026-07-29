"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ReadingModeContextType {
  immersive: boolean;
  toggle: () => void;
}

const ReadingModeContext = createContext<ReadingModeContextType>({
  immersive: false,
  toggle: () => {},
});

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  const toggle = () => setImmersive((v) => !v);
  return (
    <ReadingModeContext.Provider value={{ immersive, toggle }}>
      {children}
    </ReadingModeContext.Provider>
  );
}

export function useReadingMode() {
  return useContext(ReadingModeContext);
}
