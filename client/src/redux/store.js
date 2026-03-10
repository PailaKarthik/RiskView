import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reportReducer from './slices/reportSlice';
import notificationReducer from './slices/notificationSlice';
import travelReducer from './slices/travelSlice';
import mlReducer from './slices/mlSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    report: reportReducer,
    notification: notificationReducer,
    travel: travelReducer,
    ml: mlReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware(),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
