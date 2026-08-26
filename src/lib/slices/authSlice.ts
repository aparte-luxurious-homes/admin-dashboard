import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "../types";
import { AgentNetworkRole } from "../enums";

interface AuthState {
  user: IUser | null;
  agentNetworkRole: AgentNetworkRole | null;
}

export const initialState: AuthState = {
  user: null,
  agentNetworkRole: null,
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
      state.agentNetworkRole = null;
    },
    setAgentNetworkRole: (state, action: PayloadAction<AgentNetworkRole | null>) => {
      state.agentNetworkRole = action.payload;
    },
  },
});

export const { setUser, clearUser, setAgentNetworkRole } = authSlice.actions;
export default authSlice.reducer;
