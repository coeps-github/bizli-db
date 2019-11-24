import * as fs from 'fs';
import { NoParamCallback, PathLike, WriteFileOptions } from 'fs';
import { bindNodeCallback, Observable } from 'rxjs';
import { ActionReducer, ActionReducerMap, Actions } from './model';

export function combineReducers<TState, TActionType extends string>(
  actionReducerMap: ActionReducerMap<TState, TActionType>,
): ActionReducer<TState, TActionType> {
  return (state: TState | undefined, action: Actions<TActionType>) => {
    return Object.keys(actionReducerMap).reduce((nextState, key) => {
      (nextState as any)[key] = (actionReducerMap as any)[key]((state || {} as any)[key], action);
      return nextState;
    }, { ...state } as TState);
  };
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
