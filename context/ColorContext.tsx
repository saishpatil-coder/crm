"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the allowed theme colors
export type ThemeColor = "blue" | "green" | "orange" | "purple" | "red";

interface ColorContextType {
  primaryColor: ThemeColor;
  setPrimaryColor: (color: ThemeColor) => void;
  isLoadingTheme: boolean; // Helps prevent hydration flicker
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: ReactNode }) {
  // Default to blue, but we will check localStorage immediately on mount
  const [primaryColor, setPrimaryColorState] = useState<ThemeColor>("blue");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    // 1. On initial load, check if the user/tenant has a saved color preference
    const savedColor = localStorage.getItem("app_theme_color") as ThemeColor;
    if (
      savedColor &&
      ["blue", "green", "orange", "purple", "red"].includes(savedColor)
    ) {
      setPrimaryColorState(savedColor);
    }
    setIsLoadingTheme(false);
  }, []);

  // 2. Wrap the setter to automatically save to localStorage
  const setPrimaryColor = (color: ThemeColor) => {
    setPrimaryColorState(color);
    localStorage.setItem("app_theme_color", color);

    // Optional: Add a subtle haptic feedback on mobile when changing themes
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <ColorContext.Provider
      value={{ primaryColor, setPrimaryColor, isLoadingTheme }}
    >
      {/* We use an invisible div with the color variables if you ever want to expand this 
        to pure CSS variables, but for Tailwind standard classes, this wrapper works perfectly.
      */}
      <div className="contents transition-colors duration-300">{children}</div>
    </ColorContext.Provider>
  );
}

// Custom hook for easy access
export const useColor = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColor must be used within a ColorProvider");
  }
  return context;
};
