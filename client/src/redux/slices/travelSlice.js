import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  travelMode: false,
};

const travelSlice = createSlice({
  name: 'travel',
  initialState,
  reducers: {
    toggleTravelMode: (state) => {
      state.travelMode = !state.travelMode;
    },
  },
});

export const { toggleTravelMode } = travelSlice.actions;

export default travelSlice.reducer;
