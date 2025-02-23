import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser, IUserProfile, IWallet } from "../types";
import { KycStatus, UserRole } from "../enums";

interface AuthState {
  user: IUser;
}

const initialProfileState: IUserProfile = {
  id: 0,
  userId: 0,
  firstName: "",
  lastName: "",
  gender: "",
  bio: "",
  address: "",
  city: "",
  state: "",
  country: "",
  kycStatus: KycStatus.PENDING,
  averageRating: "",
  createdAt: "",
  updatedAt: "",
  dob: "",
  profileImage: "",
  nin: "",
  bvn: ""
}

const initialWalletState: IWallet = {
  id: "",
  userId: 0,
  balance: "",
  pendingCash: "",
  currency: "",
  createdAt: "",
  updatedAt: ""
}

export const initialState: AuthState = {
  user: {
    id: 0,
    email: "",
    phone: "",
    role: UserRole.AGENT,
    verificationToken: "",
    isVerified: true,
    createdAt: "",
    updatedAt: "",
    isActive: true,
    lastLogin: "",
    profile: initialProfileState,
    kyc: [],
    wallets: [initialWalletState],
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = initialState.user;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
