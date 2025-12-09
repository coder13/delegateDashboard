import { type AppState } from './initialState';
import reducer from './reducer';
import { type TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux';
import { createStore, applyMiddleware, compose, type AnyAction, type Reducer } from 'redux';
import thunkMiddleware, { type ThunkDispatch } from 'redux-thunk';

// Redux DevTools Extension - window property may not exist in production
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
  reducer as Reducer<AppState, AnyAction>,
  composeEnhancers(applyMiddleware(thunkMiddleware))
);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Configure AppDispatch to support thunk actions
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;
