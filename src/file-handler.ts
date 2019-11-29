import { BehaviorSubject, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { concatMap, filter, map, take, takeUntil, throttleTime } from 'rxjs/operators';
import { createFilePath, fileExists, last, migrate, mustBeLogged, mustBeLoggedToConsole, readFile, writeFileAtomic } from './helpers';
import { Action, ActionReducer, Config, File, FileHandler, Log, TypedAction, VersionedState } from './model';

export class FileHandlerImpl<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> implements FileHandler<TState, TActionType, TAction> {
  private config: Config<TState>;
  private files: BehaviorSubject<File<TState, TActionType, TAction> | undefined>;
  private fileLoadLatch: ReplaySubject<void>;
  private readonly destroy: Subject<void>;

  constructor() {
    this.config = {};
    this.files = new BehaviorSubject<File<TState, TActionType, TAction> | undefined>(undefined);
    this.fileLoadLatch = new ReplaySubject(1);
    this.destroy = new Subject();

    this.files.pipe(
      takeUntil(this.destroy),
      filter(file => !!file),
      throttleTime(1000, undefined, { leading: true, trailing: true }),
      concatMap(file =>
        writeFileAtomic(createFilePath(this.config.fileName, this.config.path), JSON.stringify(file), 'utf8'),
      ),
    ).subscribe(() => {
      this.logToConsole({ level: 'debug', name: 'file-handler FileWritten', message: '...' });
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler FileWritten: ${error.name}`, stack: error.stack });
    });

    this.fileLoadLatch.next();
    this.fileLoadLatch.complete();
  }

  public configure(config?: Config<TState>): Observable<TState | undefined> {
    this.config = config || this.config;
    this.fileLoadLatch = new ReplaySubject(1);
    this.log({ level: 'debug', name: 'file-handler ConfigChanged', message: JSON.stringify(this.config) });
    const fileObservable =
      fileExists(createFilePath(this.config.fileName, this.config.path)).pipe(
        concatMap(exists => {
          if (exists) {
            if (this.config.migration) {
              return readFile(createFilePath(this.config.fileName, this.config.path), 'utf8').pipe(
                map(currentFileString => JSON.parse(currentFileString) as File<any, TActionType, TAction>),
                map(file => {
                  const lastState = last(file.states) as VersionedState;
                  const migratedState = migrate(lastState, this.config.migration);
                  const migratedStateArr = lastState.version !== migratedState.version ? [migratedState] : [];
                  return {
                    ...file,
                    states: file && file.states ? [...file.states, ...migratedStateArr] : migratedStateArr,
                  } as File<TState, TActionType, TAction>;
                }),
                concatMap(file =>
                  writeFileAtomic(createFilePath(this.config.fileName, this.config.path), JSON.stringify(file), 'utf8').pipe(
                    map(() => file),
                  ),
                ),
              );
            }
            return readFile(createFilePath(this.config.fileName, this.config.path), 'utf8').pipe(
              map(currentFileString => JSON.parse(currentFileString) as File<TState, TActionType, TAction>),
            );
          }
          return of(undefined);
        }),
      );
    fileObservable.subscribe(file => {
      this.log({ level: 'debug', name: 'file-handler FileLoaded', message: JSON.stringify(file) });
      if (file) {
        this.log({ level: 'debug', name: 'file-handler FileChanged', message: JSON.stringify(file) });
        this.files.next(file);
      }
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler FileLoaded: ${error.name}`, stack: error.stack });
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    });
    return fileObservable.pipe(
      map(file => last(file && file.states)),
    );
  }

  public reduce(reducer: ActionReducer<TState, TActionType, TAction>) {
    this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.files.pipe(
          take(1),
        ),
      ),
    ).subscribe(file => {
      this.log({ level: 'debug', name: 'file-handler ReducerChanged', message: JSON.stringify(reducer) });
      this.files.next({
        ...file,
        reducers: file && file.reducers ? [...file.reducers, reducer] : [reducer],
      } as File<TState, TActionType, TAction>);
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler ReducerChanged: ${error.name}`, stack: error.stack });
    });
  }

  public dispatch(action: TAction) {
    this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.files.pipe(
          take(1),
        ),
      ),
    ).subscribe(file => {
      this.log({ level: 'debug', name: 'file-handler ActionDispatched', message: JSON.stringify(action) });
      this.files.next({
        ...file,
        actions: file && file.actions ? [...file.actions, action] : [action],
      } as File<TState, TActionType, TAction>);
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler ActionDispatched: ${error.name}`, stack: error.stack });
    });
  }

  public changeState(state: TState | undefined) {
    this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.files.pipe(
          take(1),
        ),
      ),
    ).subscribe(file => {
      this.log({ level: 'debug', name: 'file-handler StateChanged', message: JSON.stringify(state) });
      this.files.next({
        ...file,
        states: file && file.states ? [...file.states, state] : [state],
      } as File<TState, TActionType, TAction>);
    }, error => {
      this.log({ level: 'error', message: error.message, name: `file-handler StateChanged: ${error.name}`, stack: error.stack });
    });
  }

  public log(log: Log) {
    this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.files.pipe(
          take(1),
        ),
      ),
    ).subscribe(file => {
      this.logToConsole(log);
      if (mustBeLogged(log.level, this.config)) {
        this.files.next({
          ...file,
          logs: file && file.logs ? [...file.logs, log] : [log],
        } as File<TState, TActionType, TAction>);
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
