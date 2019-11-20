import { Observable } from 'rxjs';

export interface IConfig {
  /*
   * < 2 means every change is written to a temp file, when writing succeeded, the current file is replaced by the temp file
   * higher values improve write performance, but also increase the risk of data loss
   * default 0
   */
  readonly minChanges: number;
  /*
   * Maximum amount of time in ms to wait until writing changes, if any
   * especially useful in combination with high minChanges values
   * default 0
   */
  readonly maxTimeMs: number;
  readonly maxHistory: number; // 0 is infinite, default 0
  readonly maxSizeBytes: number; // 0 is infinite, default 0
  readonly rotate: number; // 0 is no rotation, default 0
  readonly compress: boolean; // zip rotated files
}

export interface IBizliDb<TState> {
  readonly create: (object: TState) => Observable<TState>;
  readonly read: <TSubState>(query: IQuery<TState, TSubState>) => Observable<TSubState>;
  readonly readWhenChanged: <TSubState>(query: IQuery<TState, TSubState>) => Observable<TSubState>;
  readonly update: (object: TState) => Observable<TState>;
  readonly delete: <TSubState>(selectFn: (state: TState) => TSubState) => Observable<TState>;

  readonly createAll: (objects: Observable<TState>) => Observable<TState>;
  readonly readAll: <TSubState>(queries: Observable<IQuery<TState, TSubState>>) => Observable<TSubState>;
  readonly readAllWhenChanged: <TSubState>(queries: Observable<IQuery<TState, TSubState>>) => Observable<TSubState>;
  readonly updateAll: (objects: Observable<TState>) => Observable<TState>;
  readonly deleteAll: <TSubState>(selectFns: Observable<(state: TState) => TSubState>) => Observable<TState>;
}

export interface IQuery<TState, TSubState> {
  readonly selectFn?: (state: TState) => TSubState;
  // TODO: Add query stuff
}

export interface IFile<TState> {
  readonly data: TState[]
}
