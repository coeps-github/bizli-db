import * as fs from 'fs';
import { NoParamCallback, PathLike, WriteFileOptions } from 'fs';
import * as fsPath from 'path';
import { bindNodeCallback, Observable, of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import {
  Action,
  ActionReducer,
  ActionReducerMap,
  ActionReducerMetadata,
  Config,
  LogLevel,
  Migration,
  On,
  OnSubState,
  SubStateActionReducer,
  SubStateActionReducerMetadata,
  TypedAction,
  VersionedState,
} from './model';

export function createReducer<TSubState, TActionType extends string, TAction extends Action | TypedAction<TActionType>, TAsAction extends Action | TypedAction<TActionType>>
(initialState: TSubState, ...ons: Array<OnSubState<TSubState, TActionType, TAction>>): SubStateActionReducer<TSubState, TActionType, TAsAction>;
export function createReducer<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>, TAsAction extends Action | TypedAction<TActionType>>
(initialState: TState, ...ons: Array<On<TState, TActionType, TAction>>): ActionReducer<TState, TActionType, TAsAction> {
  const reducerFn = (state: TState | undefined = initialState, action: TAction | TAsAction) => {
    return ons.filter(o => o.types.includes(action.type as TActionType)).reduce((nextState, o) => {
      return o.reducer(nextState, action as TAction);
    }, { ...state, version: state?.version || initialState.version } as TState);
  };
  reducerFn.prototype.metadata = {
    initialState,
    ons,
  };
  return reducerFn;
}


export function on<TSubState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>
(reducer: SubStateActionReducer<TSubState, TActionType, TAction>, ...types: TActionType[]): OnSubState<TSubState, TActionType, TAction>
export function on<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>
(reducer: ActionReducer<TState, TActionType, TAction>, ...types: TActionType[]): On<TState, TActionType, TAction> {
  return {
    reducer,
    types,
  };
}

export function combineReducers<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>(
  actionReducerMap: ActionReducerMap<TState, TActionType, TAction>,
): ActionReducer<TState, TActionType, TAction> {
  return (state: TState | undefined, action: TAction) => {
    return Object.keys(actionReducerMap).filter(key => key !== 'version').reduce((nextState, key) => {
      (nextState as any)[key] = (actionReducerMap as any)[key]((state || {} as any)[key], action);
      return nextState;
    }, { ...state, version: state?.version || actionReducerMap.version } as TState);
  };
}

export function fileExists(filePath: string): Observable<boolean> {
  const fileExistsBinder = bindNodeCallback((
    path: PathLike,
    callback: NoParamCallback,
  ) => fs.access(path, fs.constants.F_OK, callback));
  return fileExistsBinder(filePath).pipe(
    map(() => true),
    catchError(error => of(!error)),
  );
}

export function renameFile(oldFilePath: string, newFilePath: string): Observable<void> {
  const renameFileBinder = bindNodeCallback((
    oldPath: PathLike,
    newPath: PathLike,
    callback: NoParamCallback,
  ) => fs.rename(oldPath, newPath, callback));
  return renameFileBinder(oldFilePath, newFilePath);
}

export function readFile(filePath: string, fileEncoding: string): Observable<string> {
  const readFileBinder = bindNodeCallback((
    path: PathLike | number,
    options: { encoding: string; flag?: string; } | string,
    callback: (err: NodeJS.ErrnoException | null, data: string) => void,
  ) => fs.readFile(path, options, callback));
  return readFileBinder(filePath, { encoding: fileEncoding });
}

export function writeFile(filePath: string, fileData: string, fileEncoding: string): Observable<void> {
  const writeFileBinder = bindNodeCallback((
    path: PathLike | number,
    data: any,
    options: WriteFileOptions,
    callback: NoParamCallback,
  ) => fs.writeFile(path, data, options, callback));
  return writeFileBinder(filePath, fileData, { encoding: fileEncoding });
}

export function writeFileAtomic(filePath: string, fileData: string, fileEncoding: string): Observable<void> {
  const tempFilePath = createTempFilePath(filePath);
  return writeFile(tempFilePath, fileData, fileEncoding).pipe(
    concatMap(() => renameFile(tempFilePath, filePath)),
  );
}

export function createFilePath(fileName: string = 'db.json', path: string = ''): string {
  return fsPath.join(fsPath.resolve(path), fileName);
}

export function createTempFilePath(filePath: string): string {
  const extension = fsPath.extname(filePath);
  return fsPath.join(fsPath.resolve(fsPath.dirname(filePath)), `${fsPath.basename(filePath, extension)}.temp${extension}`);
}

export function mustBeLogged<TState extends VersionedState>(logLevel: LogLevel, config: Config<TState>): boolean {
  const minimumLogLevel = config.logLevel || 'info';
  switch (minimumLogLevel) {
    case 'error':
      return logLevel === 'error';
    case 'debug':
      return logLevel === 'error' || logLevel === 'info' || logLevel === 'debug';
    default:
      return logLevel === 'error' || logLevel === 'info';
  }
}

export function mustBeLoggedToConsole<TState extends VersionedState>(logLevel: LogLevel, config: Config<TState>): boolean {
  const logToConsole = config.logToConsole || false;
  return logToConsole && mustBeLogged(logLevel, config);
}

export function last<T>(array?: T[]): T | undefined {
  return array && array.length > 0 ? array[array.length - 1] : undefined;
}

export function migrate<TState extends VersionedState>(oldState: VersionedState, migration: Migration<TState> = { targetVersion: oldState.version }): TState {
  const resultState = Object.keys(migration)
    .filter(key => key !== 'version')
    .map(x => +x)
    .sort((a, b) => a - b)
    .reduce((state, fromVersionAndKey) => {
      if (state.version === fromVersionAndKey) {
        const migrationFn = migration[fromVersionAndKey];
        const migratedState = migrationFn(state);
        const minNextVersion = fromVersionAndKey + 1;
        return {
          ...migratedState,
          version: migratedState.version >= minNextVersion ? migratedState.version : minNextVersion,
        };
      }
      return state;
    }, oldState) as TState;
  if (migration.targetVersion !== resultState.version) {
    throw new Error(`Migration Error: Mismatch of expected ${migration.targetVersion} vs actual ${resultState.version} target version of migrated state!
    Please make sure to set the new version of the state in the migration functions properly and provide a function for each version jump.`);
  }
  return resultState;
}

export function stringifyReducerMap<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>(
  actionReducerMap: ActionReducerMap<TState, TActionType, TAction>,
): string {
  return Object.keys(actionReducerMap).filter(key => key !== 'version').reduce((str, key) => {
    return `${str}\n${key}:\n${stringifySubStateReducer((actionReducerMap as any)[key])}`;
  }, '');
}

export function stringifyReducer<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>(
  actionReducer: ActionReducer<TState, TActionType, TAction>,
): string {
  if (actionReducer.prototype.metadata) {
    const metadata = actionReducer.prototype.metadata as ActionReducerMetadata<TState, TActionType, TAction>;
    const jsonMetadata = {
      initialState: metadata.initialState,
      ons: metadata.ons.map(o => ({
        reducer: o.reducer.toString(),
        types: o.types,
      })),
    };
    return JSON.stringify(jsonMetadata);
  }
  return actionReducer.toString();
}

export function stringifySubStateReducer<TSubState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>(
  subStateActionReducer: SubStateActionReducer<TSubState, TActionType, TAction>,
): string {
  if (subStateActionReducer.prototype.metadata) {
    const metadata = subStateActionReducer.prototype.metadata as SubStateActionReducerMetadata<TSubState, TActionType, TAction>;
    const jsonMetadata = {
      initialState: metadata.initialState,
      ons: metadata.ons.map(o => ({
        reducer: o.reducer.toString(),
        types: o.types,
      })),
    };
    return JSON.stringify(jsonMetadata);
  }
  return subStateActionReducer.toString();
}
