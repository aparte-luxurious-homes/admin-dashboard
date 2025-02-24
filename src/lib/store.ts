import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import alertDialogReducer from "./slices/alertDialogSlice";
import storage from "redux-persist/lib/storage"; // Uses localStorage
import { persistReducer, persistStore } from "redux-persist";

// 🔹 Persist Config (Only for 'auth' slice)
const persistConfig = {
  key: "auth",
  storage,
  whitelist: ["user"], // Only persist 'user', not the whole auth state
};

// 🔹 Create Persisted Reducer for 'auth'
const persistedAuthReducer = persistReducer(persistConfig, authReducer);

// 🔹 Configure Store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer, // Persisted
    alertDialog: alertDialogReducer, // NOT Persisted
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for Redux Persist
    }),
});

// 🔹 Persistor (Needed for app integration)
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
