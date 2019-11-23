import { ActionReducer, ActionReducerMap, Actions } from './model';

export function combineReducers<TState, TActionType extends string>(
  actionReducerMap: ActionReducerMap<TState, TActionType>,
): ActionReducer<TState, TActionType> {
  return (action: Actions<TActionType>, state?: Partial<TState>) => {
    const internalState = state ? state : {} as TState;
    return Object.keys(actionReducerMap).reduce((nextState, key) => {
      (nextState as any)[key] = (actionReducerMap as any)[key](action, (internalState as any)[key]);
      return nextState;
    }, {} as TState);
  };
}
