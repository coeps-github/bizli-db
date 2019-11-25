import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { exhaustMap, filter, map, take, takeUntil } from 'rxjs/operators';
import { createFilePath, fileExists, mustBeLogged, mustBeLoggedToConsole, readFile, writeFile } from './helpers';
import { ActionReducer, Actions, Config, File, FileHandler, FileLoaded, Log } from './model';

export class FileHandlerImpl<TState, TActionType extends string> implements FileHandler<TState, TActionType> {
  private config: Config;
  private files: BehaviorSubject<File<TState, TActionType> | undefined>;
  private destroy: Subject<void>;

  constructor() {
    this.config = {};
    this.files = new BehaviorSubject<File<TState, TActionType> | undefined>(undefined);
    this.destroy = new Subject();

    this.files.pipe(
      takeUntil(this.destroy),
      filter(file => !!file),
      exhaustMap(file =>
        writeFile(createFilePath(this.config.fileName, this.config.path), JSON.stringify(file), 'utf8'),
      ),
    ).subscribe(() => {
      this.logToConsole({ level: 'debug', name: 'file-handler FileWritten', message: '...' });
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler FileWritten: ${error.name}`, stack: error.stack });
    });
  }

  public configure(config?: Config): Observable<FileLoaded<TState, TActionType>> {
    this.config = config || this.config;
    this.log({ level: 'debug', name: 'file-handler ConfigChanged', message: JSON.stringify(this.config) });
    const fileObservable =
      fileExists(createFilePath(this.config.fileName, this.config.path)).pipe(
        exhaustMap(exists => {
          if (exists) {
            return readFile(createFilePath(this.config.fileName, this.config.path), 'utf8').pipe(
              map(currentFileString => JSON.parse(currentFileString) as File<TState, TActionType>),
            );
          }
          return of(undefined);
        }),
      );
    fileObservable.subscribe(file => {
      this.log({ level: 'debug', name: 'file-handler FileLoaded', message: JSON.stringify(file) });
      if (file) {
        this.files.next(file);
      }
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler FileLoaded: ${error.name}`, stack: error.stack });
    });
    return fileObservable.pipe(
      map(file => ({
        reducer: file && file.reducers && file.reducers.length > 0 && file.reducers[file.reducers.length - 1] || undefined,
        state: file && file.states && file.states.length > 0 && file.states[file.states.length - 1] || undefined,
      })),
    );
  }

  public reduce(reducer: ActionReducer<TState, TActionType>) {
    this.log({ level: 'debug', name: 'file-handler ReducerChanged', message: JSON.stringify(reducer) });
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      this.files.next({
        ...file,
        reducers: file && file.reducers ? [...file.reducers, reducer] : [reducer],
      } as File<TState, TActionType>);
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler ReducerChanged: ${error.name}`, stack: error.stack });
    });
  }

  public dispatch(action: Actions<TActionType>) {
    this.log({ level: 'debug', name: 'file-handler ActionDispatched', message: JSON.stringify(action) });
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      this.files.next({
        ...file,
        actions: file && file.actions ? [...file.actions, action] : [action],
      } as File<TState, TActionType>);
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler ActionDispatched: ${error.name}`, stack: error.stack });
    });
  }

  public changeState(state: TState | undefined) {
    this.log({ level: 'debug', name: 'file-handler StateChanged', message: JSON.stringify(state) });
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      this.files.next({
        ...file,
        states: file && file.states ? [...file.states, state] : [state],
      } as File<TState, TActionType>);
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler StateChanged: ${error.name}`, stack: error.stack });
    });
  }

  public log(log: Log) {
    this.logToConsole(log);
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      if (mustBeLogged(log.level, this.config)) {
        this.files.next({
          ...file,
          logs: file && file.logs ? [...file.logs, log] : [log],
        } as File<TState, TActionType>);
      }
    }, error => {
      this.logToConsole({ level: 'error', message: error.message, name: `file-handler Log: ${error.name}`, stack: error.stack });
    });
  }

  public dispose() {
    this.destroy.next();
    this.destroy.complete();
  }

  private logToConsole(log: Log) {
    if (mustBeLoggedToConsole(log.level, this.config)) {
      console[log.level](log);
    }
  }
}
