import { Observable, of } from 'rxjs';
import { combineReducers } from './helpers';
import { Action, ActionReducer, ActionReducerMap, BizliDb, BizliDbInitAction, Select } from './model';

export class BizliDbImpl<TState, TActionType extends string> implements BizliDb<TState, TActionType> {
  private state: TState;
  private reducer: ActionReducer<TState, TActionType>;

  constructor(
    actionReducer: ActionReducer<TState, TActionType> |
      ActionReducerMap<TState, TActionType>,
    initialState?: Partial<TState>,
  ) {
    this.reducer = typeof actionReducer === 'function' ? actionReducer : combineReducers(actionReducer);
    this.state = this.reducer(initialState as TState, BizliDbInitAction);
  }

  public dispatch(action: Action<TActionType>) {
    // TODO: impl
  }

  public select<TSubState>(select: Select<TState, TSubState>): Observable<TSubState> {
    return of({} as TSubState);
  }
}