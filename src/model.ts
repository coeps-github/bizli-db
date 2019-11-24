import { Observable } from 'rxjs';

export interface BizliDb<TState, TActionType extends string> {
  configure(config: Config): void;

  reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>): void;

  dispatch(action: Actions<TActionType>): void;

  select<TSubState>(select?: Select<TState, TSubState>): Observable<TState | TSubState>;

  observe(actions: Array<string | TActionType>): Observable<Actions<TActionType>>;

  dispose(): void;
}

export interface Config {
  readonly fileName: string;
  readonly path: string;
  readonly logLevel: LogLevel; // default info
  // TODO: Maybe ... KISS YAGNI
  // readonly maxHistory: number; // 0 is infinite, default 0
  // readonly maxSizeBytes: number; // 0 is infinite, default 0
  // readonly rotate: number; // 0 is no rotation, default 0
  // readonly compress: boolean; // zip rotated files
}

export interface FileHandler<TState, TActionType extends string> {
  configure(config: Config): void;

  reduce(reducer: ActionReducer<TState, TActionType>): void;

  dispatch(action: Actions<TActionType>): void;

  changeState(state: TState): void;

  log(log: Log): void;

  observe(): Observable<File<TState, TActionType>>;

  dispose(): void;
}

export interface File<TState, TActionType extends string> {
  readonly configs: Config[];
  readonly reducers: Array<ActionReducer<TState, TActionType>>;
  readonly actions: Array<Actions<TActionType>>;
  readonly states: TState[];
  readonly logs: Log[];
}

export type Select<TState, TSubState> = (state: TState) => TSubState;

export type Actions<TActionType extends string> = Action | TypedAction<TActionType>

export interface Action {
  readonly type: string;
}

export interface TypedAction<TActionType extends string> extends Action {
  readonly type: TActionType
}

export type ActionReducer<TState, TActionType extends string> =
  (state: TState | undefined, action: Actions<TActionType>) => TState;

export type ActionReducerMap<TState, TActionType extends string> = {
  [p in keyof TState]: ActionReducer<TState[p], TActionType>;
};

export type LogLevel = 'error' | 'info' | 'debug';

export type Log = Error | LogInfo | LogDebug;

export interface LogBase {
  level: LogLevel;
  name: string;
  message: string;
}

export interface Error extends LogBase {
  level: 'error';
  stack?: string;
}

export interface LogInfo extends LogBase {
  level: 'info';
}

export interface LogDebug extends LogBase {
  level: 'debug';
}
