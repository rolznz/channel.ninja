import { configureStore } from "@reduxjs/toolkit";
import tooltipSlice from "../components/Ninja/tooltip-slice";
import globalSlice from "./global-slice";

export const store = configureStore({
  reducer: {
    global: globalSlice,
    tooltip: tooltipSlice,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
