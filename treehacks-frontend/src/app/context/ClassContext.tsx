"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface ClassContextType {
  classId: string | null;
  setClassId: (id: string | null) => void;
}

const ClassContext = createContext<ClassContextType>({
  classId: null,
  setClassId: () => {},
});

export function ClassProvider({ children }: { children: React.ReactNode }) {
  const [classId, setClassIdState] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("classId");
    }
    return null;
  });

  const setClassId = (id: string | null) => {
    setClassIdState(id);
    // Persist to localStorage
    if (id) {
      localStorage.setItem("classId", id);
    } else {
      localStorage.removeItem("classId");
    }
  };

  return (
    <ClassContext.Provider value={{ classId, setClassId }}>
      {children}
    </ClassContext.Provider>
  );
}

export const useClass = () => useContext(ClassContext);
