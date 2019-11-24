import { ActionReducer, ActionReducerMap, Actions } from './model';

export function combineReducers<TState, TActionType extends string>(
  actionReducerMap: ActionReducerMap<TState, TActionType>,
): ActionReducer<TState, TActionType> {
  return (state: TState | undefined, action: Actions<TActionType>) => {
    return Object.keys(actionReducerMap).reduce((nextState, key) => {
      (nextState as any)[key] = (actionReducerMap as any)[key]((state || {} as any)[key], action);
      return nextState;
    }, { ...state } as TState);
  };
}
