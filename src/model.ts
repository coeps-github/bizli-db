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

export type Dispatcher<TActionType extends string> = (action: Actions<TActionType>) => void;
export type Selector<TState> = <TSubState>(select: Select<TState, TSubState>) => Observable<TSubState>;

export type Select<TState, TSubState> = (state: TState) => TSubState;

export type Actions<TActionType extends string> = Action | TypedAction<TActionType>

export interface Action {
  readonly type: string;
}

export interface TypedAction<TActionType extends string> extends Action {
  readonly type: TActionType
}

export type ActionReducer<TState, TActionType extends string> =
  (action: Actions<TActionType>, state?: TState) => TState;

export type ActionReducerMap<TState, TActionType extends string> = {
  [p in keyof TState]: ActionReducer<TState[p], TActionType>;
};

export type BizliDbActions = 'BIZLI-DB-INIT';
export const BizliDbInitAction: TypedAction<BizliDbActions> = { type: 'BIZLI-DB-INIT' };
