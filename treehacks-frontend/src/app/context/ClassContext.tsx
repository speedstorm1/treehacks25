"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ClassContextType = {
  classId: string | null;
  setClassId: (id: string | null) => void;
};

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export function ClassProvider({ children }: { children: ReactNode }) {
  const [classId, setClassId] = useState<string | null>(null);

  return (
    <ClassContext.Provider value={{ classId, setClassId }}>
      {children}
    </ClassContext.Provider>
  );
}

export function useClass() {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error("useClass must be used within a ClassProvider");
  }
  return context;
}
