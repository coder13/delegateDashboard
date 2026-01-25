import type { Action, ReduxAction } from './actions';
import INITIAL_STATE, { type AppState } from './initialState';
import { reducers } from './reducerHandlers';

function reducer<T extends Action, P extends object>(
  state: AppState = INITIAL_STATE,
  action: ReduxAction<T, P>
): AppState {
  if (reducers[action.type]) {
    return reducers[action.type](state, action);
  }
  return state;
}

export default reducer;
