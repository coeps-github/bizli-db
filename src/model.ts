import { Observable } from 'rxjs';

export interface Config {
  readonly maxHistory: number; // 0 is infinite, default 0
  readonly maxSizeBytes: number; // 0 is infinite, default 0
  readonly rotate: number; // 0 is no rotation, default 0
  readonly compress: boolean; // zip rotated files
}

export interface BizliDb<TState, TActionType extends string> {
  readonly dispatch: Dispatcher<TActionType>;
  readonly select: Selector<TState>;
}

export interface File<TState> {
  readonly data: TState[]
}

export type Dispatcher<TActionType extends string> = (action: Action<TActionType>) => void;
export type Selector<TState> = <TSubState>(select: Select<TState, TSubState>) => Observable<TSubState>;

export type Select<TState, TSubState> = (state: TState) => TSubState;

export interface Action<TActionType extends string> {
  readonly type: TActionType
}

export type ActionReducer<TState, TActionType extends string, TAction extends Action<TActionType> = Action<TActionType>> =
  (state: TState | null, action: TAction) => TState;

export type ActionReducerMap<TState, TActionType extends string, TAction extends Action<TActionType> = Action<TActionType>> = {
  [p in keyof TState]: ActionReducer<TState, TActionType, TAction>;
};

export type ActionReducerFactory<TState, TActionType extends string, TAction extends Action<TActionType> = Action<TActionType>> =
  (reducerMap: ActionReducerMap<TState, TActionType, TAction>, initialState?: Partial<TState>) => ActionReducer<TState, TActionType, TAction>;
