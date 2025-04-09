import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    authUser: localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')) : null,
    isLoading: false,
    error: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthUser: (state, action) => {
            state.authUser = action.payload;
            localStorage.setItem('authUser', JSON.stringify(action.payload));
        },
        clearAuthUser: (state) => {
            state.authUser = null;
            localStorage.removeItem('authUser');
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const { setAuthUser, clearAuthUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;