"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface ClassContextType {
  classId: string | null;
  classCode: string | null;
  setClass: (id: string | null, code: string | null) => void;
}

const ClassContext = createContext<ClassContextType>({
  classId: null,
  classCode: null,
  setClass: () => {},
});

export function ClassProvider({ children }: { children: React.ReactNode }) {
  const [classId, setClassIdState] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("classId");
    }
    return null;
  });

  const [classCode, setClassCodeState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("classCode");
    }
    return null;
  });

  const setClass = (id: string | null, code: string | null) => {
    setClassIdState(id);
    setClassCodeState(code);
    // Persist to localStorage
    if (id && code) {
      localStorage.setItem("classId", id);
      localStorage.setItem("classCode", code);
    } else {
      localStorage.removeItem("classId");
      localStorage.removeItem("classCode");
    }
  };

  return (
    <ClassContext.Provider value={{ classId, classCode, setClass }}>
      {children}
    </ClassContext.Provider>
  );
}

export const useClass = () => useContext(ClassContext);
