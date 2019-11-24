import { Observable } from 'rxjs';

export interface BizliDb<TState, TActionType extends string> {
  readonly configure: Configurator<TState, TActionType>;
  readonly reduce: Reducer<TState, TActionType>;
  readonly dispatch: Dispatcher<TActionType>;
  readonly select: Selector<TState>;
  readonly observe: Observer<TActionType>;
  readonly dispose: () => void;
}

export interface Config {
  readonly fileName: string;
  readonly path: string;
  readonly reloadFile: boolean; // default false
  readonly maxHistory: number; // 0 is infinite, default 0
  readonly maxSizeBytes: number; // 0 is infinite, default 0
  readonly rotate: number; // 0 is no rotation, default 0
  readonly compress: boolean; // zip rotated files
  readonly logLevel: LogLevel; // default info
}

export interface FileHandler<TState, TActionType extends string> {
  readonly configure: FileConfigurator<TState, TActionType>;
  readonly reduce: FileReducer<TState, TActionType>;
  readonly dispatch: FileDispatcher<TActionType>;
  readonly changeState: FileStateChanger<TState>;
  readonly log: FileLogger;
  readonly observe: FileObserver<TState, TActionType>;
  readonly dispose: () => void;
}

export interface File<TState, TActionType extends string> {
  readonly configs: Config[];
  readonly reducers: Array<ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>>;
  readonly actions: Array<Actions<TActionType>>;
  readonly states: TState[];
  readonly logs: Log[];
}

export type Configurator<TState, TActionType extends string> = (config: Config) => void;
export type Reducer<TState, TActionType extends string> = (reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>) => void;
export type Dispatcher<TActionType extends string> = (action: Actions<TActionType>) => void;
export type Selector<TState> = <TSubState>(select?: Select<TState, TSubState>) => Observable<TState | TSubState>;
export type Observer<TActionType extends string> = (actions: Array<string | TActionType>) => Observable<Actions<TActionType>>;

export type FileConfigurator<TState, TActionType extends string> = (config: Config) => void;
export type FileReducer<TState, TActionType extends string> = (reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>) => void;
export type FileDispatcher<TActionType extends string> = (action: Actions<TActionType>) => void;
export type FileStateChanger<TState> = (state: TState) => void;
export type FileLogger = (log: Log) => void;
export type FileObserver<TState, TActionType extends string> = () => Observable<File<TState, TActionType>>;

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
