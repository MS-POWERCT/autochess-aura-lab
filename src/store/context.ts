import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type { AppAction, AppState } from "./appReducer";

export const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
} | null>(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used within AppProvider");
  }
  return value;
}
