import { Observable } from 'rxjs';
import * as winston from 'winston';

export interface BizliDbFactoryConfig<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  readonly config?: Config<TState, winston.LoggerOptions>;
  readonly reducer?: ActionReducer<TState, TActionType, TAction> | ActionReducerMap<TState, TActionType, TAction>;
}

export interface BizliDb<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  configure(config: BizliDbConfig): void;

  loadState(): void;

  reduce(reducer: ActionReducer<TState, TActionType, TAction> | ActionReducerMap<TState, TActionType, TAction>): void;

  dispatch(action: TAction): void;

  select<TSubState>(select?: Select<TState, TSubState>, compare?: Compare<TSubState>): Observable<TSubState>;

  select(select?: Select<TState, TState>, compare?: Compare<TState>): Observable<TState>;

  effect(actions: Array<string | TActionType>): Observable<Effect<TState, TActionType, TAction>>;

  dispose(): void;
}

export interface Config<TState extends VersionedState, TLoggerConfig> {
  readonly bizliDbConfig?: BizliDbConfig;
  readonly fileHandlerConfig?: FileHandlerConfig<TState>;
  readonly reduxDevToolsExtensionConfig?: ReduxDevToolsExtensionConfig;
  readonly loggerConfig?: TLoggerConfig;
}

// tslint:disable-next-line:no-empty-interface
export interface BizliDbConfig {
}

export interface FileHandlerConfig<TState extends VersionedState> {
  readonly fileName?: string; // default db.json
  readonly path?: string; // default executing directory
  readonly migration?: Migration<TState>; // default nothing to migrate
}

export interface ReduxDevToolsExtensionConfig {
  readonly enabled?: boolean; // default false
  readonly remotedev?: ReduxDevToolsExtensionRemoteDevConfig
}

export interface ReduxDevToolsExtensionRemoteDevConfig {
  readonly instanceId?: string; // default generated
  readonly hostname?: string; // default remotedev.io
  readonly port?: number; // default 443
  readonly secure?: boolean; // default true
  readonly autoReconnect?: boolean; // default true
  readonly autoReconnectOptions?: {
    readonly randomness?: number; // default 60000
  }
}

export interface FileHandler<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  configure(config: FileHandlerConfig<TState>): void;

  loadState(): Observable<TState | undefined>;

  saveState(state: TState | undefined): void;

  dispose(): void;
}

export interface ReduxDevToolsExtension<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  configure(config: ReduxDevToolsExtensionConfig): void;

  send(action: TAction, state: TState | undefined): void;

  receive(getState: () => TState | undefined, updateState: (state: TState | undefined) => void, dispatchAction: (action: TAction) => void): void;

  dispose(): void;
}

export interface Logger<TLoggerConfig> {
  configure(config: TLoggerConfig): void;

  log(log: Log): void;

  dispose(): void;
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
  readonly reducer: ActionReducer<TState, TActionType, TAction>,
  readonly types: TActionType[]
}

export interface OnSubState<TSubState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  readonly reducer: SubStateActionReducer<TSubState, TActionType, TAction>,
  readonly types: TActionType[]
}

export type ActionReducer<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> =
  (state: TState | undefined, action: TAction) => TState;

export type ActionReducerMap<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> = {
  [p in keyof Omit<TState, 'version'>]: SubStateActionReducer<Omit<TState, 'version'>[p], TActionType, TAction>;
} & VersionedState;

export type SubStateActionReducer<TSubState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> =
  (state: TSubState | undefined, action: TAction) => TSubState;

export interface Effect<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> {
  readonly state: TState,
  readonly action: TAction,
}

export type Migration<TState extends VersionedState> = MigrationTargetVersion & MigrationFunctions<TState>;

export interface MigrationTargetVersion {
  readonly targetVersion: number;
}

export interface MigrationFunctions<TState extends VersionedState> {
  // key: versions the migrate function updates from
  // value: migrate function to transform a state to the next version
  [key: number]: <TPrevState>(previousState: TPrevState | undefined) => TState;
}

export interface ReduxDevToolsExtensionAction<TState> {
  readonly instanceId: string;
  readonly type: 'DISPATCH' | 'ACTION';
  readonly state: TState | undefined;
  readonly action: {
    readonly type: ReduxDevToolsExtensionActionType;
  } | string;
  readonly payload: {
    readonly type: ReduxDevToolsExtensionActionType;
  } | string;
}

export type ReduxDevToolsExtensionActionType = 'RESET' | 'COMMIT' | 'ROLLBACK' | 'JUMP_TO_STATE' | 'JUMP_TO_ACTION' | 'TOGGLE_ACTION' | 'IMPORT_STATE' | string;

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
