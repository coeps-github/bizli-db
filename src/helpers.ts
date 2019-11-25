import * as fs from 'fs';
import { NoParamCallback, PathLike, WriteFileOptions } from 'fs';
import * as fsPath from 'path';
import { bindNodeCallback, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActionReducer, ActionReducerMap, Actions, Config, LogLevel, States } from './model';

export function combineReducers<TState, TActionType extends string>(
  actionReducerMap: ActionReducerMap<TState, TActionType>,
): ActionReducer<TState, TActionType> {
  return (state: States<TState> | undefined, action: Actions<TActionType>) => {
    return Object.keys(actionReducerMap).reduce((nextState, key) => {
      (nextState as any)[key] = (actionReducerMap as any)[key]((state || {} as any)[key], action);
      return nextState;
    }, { ...state } as States<TState>);
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

export function createFilePath(fileName: string = 'db.json', path: string = ''): string {
  return fsPath.join(fsPath.resolve(path), fileName);
}

export function mustBeLogged<TState>(logLevel: LogLevel, config: Config<TState>): boolean {
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

export function mustBeLoggedToConsole<TState>(logLevel: LogLevel, config: Config<TState>): boolean {
  const logToConsole = config.logToConsole || false;
  return logToConsole && mustBeLogged(logLevel, config);
}

export function last<T>(array?: T[]): T | undefined {
  return array && array.length > 0 ? array[array.length - 1] : undefined;
}
