"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fm_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsedState(saved === "true");
      }
    } catch {
      // Ignore if localStorage is unavailable
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fm_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem("fm_sidebar_collapsed", String(collapsed));
    } catch {
      // Ignore
    }
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        setCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        toggleMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
