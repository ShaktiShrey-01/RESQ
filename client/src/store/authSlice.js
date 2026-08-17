import { createSlice } from "@reduxjs/toolkit";

const initialState = { 
    accessToken: null, 
    user: null, 
    loading: true 
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
           state.accessToken = action.payload.accessToken;
           state.user = action.payload.user;
           state.loading = false;
        },
        logOut: (state) => {
            state.accessToken = null;
            state.user = null;
            state.loading = false;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    }
});

export const { setCredentials, logOut, setLoading } = authSlice.actions;
export default authSlice.reducer;