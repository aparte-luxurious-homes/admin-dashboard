import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser, IUserProfile, IWallet } from "../types";
import { KycStatus, UserRole } from "../enums";

interface AuthState {
  user: IUser | null;
}

export const initialState: AuthState = {
  user: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
