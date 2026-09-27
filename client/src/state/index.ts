import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface initialStateTypes {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  activeProjectId: number | null;
  allProjectsSelected: boolean;
}

const initialState: initialStateTypes = {
  isSidebarCollapsed: false,
  isDarkMode: false,
  activeProjectId: null,
  allProjectsSelected: false,
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    setActiveProjectId: (state, action: PayloadAction<number | null>) => {
      state.activeProjectId = action.payload;
    },
    setAllProjectsSelected: (state, action: PayloadAction<boolean>) => {
      state.allProjectsSelected = action.payload;
    },
  },
});

export const { setIsSidebarCollapsed, setIsDarkMode, setActiveProjectId, setAllProjectsSelected } = globalSlice.actions;
export default globalSlice.reducer;
