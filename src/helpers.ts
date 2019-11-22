import { Action, ActionReducer, ActionReducerMap, BizliDbActions } from './model';

export function combineReducers<TState, TActionType extends string>(actionReducerMap: ActionReducerMap<TState, TActionType>):
  ActionReducer<TState, TActionType> {
  return (state: TState | undefined, action: Action<TActionType | BizliDbActions>) => {
    const internalState = state ? state : {} as TState;
    return Object.keys(actionReducerMap).reduce((nextState, key) => {
      (nextState as any)[key] = (actionReducerMap as any)[key]((internalState as any)[key], action);
      return nextState;
    }, {} as TState);
  };
}
