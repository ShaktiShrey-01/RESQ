import { createSlice } from '@reduxjs/toolkit';

// 1. Check storage BEFORE setting the initial state
const savedTheme = localStorage.getItem('theme') || 'light';

const initialState = {
  theme: savedTheme, 
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      // Flip the state
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      
      // 2. Save the new choice to storage immediately!
      localStorage.setItem('theme', state.theme);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;