import { createContext, useContext } from "react";

export interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

export const SIDEBAR_STORAGE_KEY = "planor_sidebar_collapsed";
