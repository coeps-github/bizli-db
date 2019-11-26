import { Observable } from 'rxjs';

export interface BizliDb<TState, TActionType extends string> {
  configure(config?: Config<TState>): void;

  reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>): void;

  dispatch(action: Actions<TActionType>): void;

  select<TSubState>(select: Select<TState, TSubState>, compare?: Compare<TSubState>): Observable<TSubState>;

  selectRoot(compare?: Compare<States<TState>>): Observable<States<TState>>;

  observe(actions: Array<string | TActionType>): Observable<Actions<TActionType>>;

  dispose(): void;
}

export interface Config<TState> {
  readonly fileName?: string; // default db.json
  readonly path?: string; // default executing directory
  readonly migration?: Migration<TState> // default nothing to migrate
  readonly logLevel?: LogLevel; // default info
  readonly logToConsole?: boolean; // default false

  // TODO: Maybe ... KISS YAGNI
  // readonly maxHistory: number; // 0 is infinite, default 0
  // readonly maxSizeBytes: number; // 0 is infinite, default 0
  // readonly rotate: number; // 0 is no rotation, default 0
  // readonly compress: boolean; // zip rotated files
}

export interface FileHandler<TState, TActionType extends string> {
  configure(config?: Config<TState>): Observable<States<TState> | undefined>;

  reduce(reducer: ActionReducer<TState, TActionType>): void;

  dispatch(action: Actions<TActionType>): void;

  changeState(state: States<TState> | undefined): void;

  log(log: Log): void;

  dispose(): void;
}

export interface File<TState, TActionType extends string> {
  readonly configs: Array<Config<TState>>;
  readonly reducers: Array<ActionReducer<TState, TActionType>>;
  readonly actions: Array<Actions<TActionType>>;
  readonly states: Array<States<TState>>;
  readonly logs: Log[];
}

export type States<TState> = VersionedState & TState;

export interface VersionedState {
  readonly version: number;
}

export type Select<TState, TSubState> = (state: States<TState>) => TSubState;

export type Compare<T> = (a: T, b: T) => boolean;

export type Actions<TActionType extends string> = Action | TypedAction<TActionType>

export interface Action {
  readonly type: string;
}

export interface TypedAction<TActionType extends string> extends Action {
  readonly type: TActionType
}

export type ActionReducer<TState, TActionType extends string> =
  (state: States<TState> | undefined, action: Actions<TActionType>) => States<TState>;

export type ActionReducerMap<TState, TActionType extends string> = {
  [p in keyof TState]: ActionReducer<TState[p], TActionType>;
};

export type Migration<TState> = MigrationTargetVersion & MigrationFunctions<TState>;

export interface MigrationTargetVersion {
  readonly targetVersion: number;
}

export interface MigrationFunctions<TState> {
  // key: versions the migrate function updates from
  // value: migrate function to transform a state to the next version
  [key: number]: <TPrevState>(previousState: TPrevState | undefined) => States<TState>;
}

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
