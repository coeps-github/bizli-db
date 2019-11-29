import { Observable } from 'rxjs';

export interface BizliDbFactoryConfig<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  readonly config?: Config<TState>;
  readonly reducer?: ActionReducer<TState, TActionType, TAction> | ActionReducerMap<TState, TActionType, TAction>;
}

export interface BizliDb<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  configure(config?: Config<TState>): void;

  reduce(reducer: ActionReducer<TState, TActionType, TAction> | ActionReducerMap<TState, TActionType, TAction>): void;

  dispatch(action: TAction): void;

  select<TSubState>(select?: Select<TState, TSubState>, compare?: Compare<TSubState>): Observable<TSubState>;

  select(select?: Select<TState, TState>, compare?: Compare<TState>): Observable<TState>;

  observe(actions: Array<string | TActionType>): Observable<TAction>;

  dispose(): void;
}

export interface Config<TState extends VersionedState> {
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

export interface FileHandler<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  configure(config?: Config<TState>): Observable<TState | undefined>;

  reduce(reducer: ActionReducer<TState, TActionType, TAction>): void;

  dispatch(action: TAction): void;

  changeState(state: TState | undefined): void;

  log(log: Log): void;

  dispose(): void;
}

export interface File<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  readonly configs: Array<Config<TState>>;
  readonly reducers: Array<ActionReducer<TState, TActionType, TAction>>;
  readonly actions: TAction[];
  readonly states: TState[];
  readonly logs: Log[];
}

export interface VersionedState {
  readonly version: number;
}

export type Select<TState, TSubState> = (state: TState) => TSubState;

export type Compare<T> = (a: T, b: T) => boolean;

export interface Action {
  readonly type: string;
}

export interface TypedAction<TActionType extends string> extends Action {
  readonly type: TActionType
}

export interface On<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  reducer: ActionReducer<TState, TActionType, TAction>,
  types: TActionType[]
}

export interface OnSubState<TSubState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  reducer: SubStateActionReducer<TSubState, TActionType, TAction>,
  types: TActionType[]
}

export type ActionReducer<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> =
  (state: TState | undefined, action: TAction) => TState;

export type ActionReducerMap<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> = {
  [p in keyof Omit<TState, 'version'>]: SubStateActionReducer<Omit<TState, 'version'>[p], TActionType, TAction>;
} & VersionedState;

export type SubStateActionReducer<TSubState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> =
  (state: TSubState | undefined, action: TAction) => TSubState;

export type Migration<TState extends VersionedState> = MigrationTargetVersion & MigrationFunctions<TState>;

export interface MigrationTargetVersion {
  readonly targetVersion: number;
}

export interface MigrationFunctions<TState extends VersionedState> {
  // key: versions the migrate function updates from
  // value: migrate function to transform a state to the next version
  [key: number]: <TPrevState>(previousState: TPrevState | undefined) => TState;
}

export type LogLevel = 'error' | 'info' | 'debug';

export type Log = Error | LogInfo | LogDebug;

export interface LogBase {
  readonly level: LogLevel;
  readonly name: string;
  readonly message: string;
}

export interface Error extends LogBase {
  readonly level: 'error';
  readonly stack?: string;
}

export interface LogInfo extends LogBase {
  readonly level: 'info';
}

export interface LogDebug extends LogBase {
  readonly level: 'debug';
}
