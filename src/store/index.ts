import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { AppState } from './initialState';
import reducer from './reducer';

const composeEnhancer = compose;

export const store = createStore(reducer, composeEnhancer(applyMiddleware(thunkMiddleware)));

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
