import { createContext, useContext } from "react";

export interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (value: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

export const SIDEBAR_STORAGE_KEY = "planor_sidebar_collapsed";
