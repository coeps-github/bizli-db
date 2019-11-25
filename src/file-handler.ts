import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { exhaustMap, filter, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { createFilePath, fileExists, mustBeLogged, readFile, writeFile } from './helpers';
import { ActionReducer, Actions, Config, File, FileHandler, FileLoaded, Log } from './model';

export class FileHandlerImpl<TState, TActionType extends string> implements FileHandler<TState, TActionType> {
  private configs: BehaviorSubject<Config | undefined>;
  private fileLoaded: BehaviorSubject<FileLoaded<TState, TActionType> | undefined>;
  private files: BehaviorSubject<File<TState, TActionType> | undefined>;
  private logs: BehaviorSubject<Log | undefined>;
  private destroy: Subject<void>;

  constructor() {
    this.configs = new BehaviorSubject<Config | undefined>(undefined);
    this.fileLoaded = new BehaviorSubject<FileLoaded<TState, TActionType> | undefined>(undefined);
    this.files = new BehaviorSubject<File<TState, TActionType> | undefined>(undefined);
    this.logs = new BehaviorSubject<Log | undefined>(undefined);
    this.destroy = new Subject();

    this.configs.pipe(
      takeUntil(this.destroy),
      filter(config => !!config),
    ).subscribe(config => {
      this.logs.next({ level: 'debug', name: 'file-handler ConfigChanged', message: JSON.stringify(config) });
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'file-handler ConfigChanged: ' + error.name,
        stack: error.stack,
      });
    });

    this.configs.pipe(
      takeUntil(this.destroy),
      filter(config => !!config),
      exhaustMap(config =>
        fileExists(config && createFilePath(config.fileName, config.path) || '').pipe(
          take(1),
          exhaustMap(exists => {
            if (exists) {
              return readFile(config && createFilePath(config.fileName, config.path) || '', 'utf8').pipe(
                take(1),
                map(fileString => JSON.parse(fileString) as File<TState, TActionType>),
              );
            }
            return of(undefined);
          }),
        ),
      ),
    ).subscribe(file => {
      this.logs.next({ level: 'debug', name: 'file-handler FileRead', message: JSON.stringify(file) });
      this.fileLoaded.next({
        reducer: file && file.reducers && file.reducers.length > 0 && file.reducers[file.reducers.length - 1] || undefined,
        state: file && file.states && file.states.length > 0 && file.states[file.states.length - 1] || undefined,
      });
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'file-handler FileRead: ' + error.name,
        stack: error.stack,
      });
    });

    this.fileLoaded.pipe(
      takeUntil(this.destroy),
      filter(fileLoaded => !!fileLoaded),
    ).subscribe(fileLoaded => {
      this.logs.next({ level: 'debug', name: 'file-handler FileLoaded', message: JSON.stringify(fileLoaded) });
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'file-handler FileLoaded: ' + error.name,
        stack: error.stack,
      });
    });

    this.files.pipe(
      takeUntil(this.destroy),
      filter(file => !!file),
      map(file => JSON.stringify(file)),
      withLatestFrom(this.configs),
      filter(([, config]) => !!config),
      exhaustMap(([fileString, config]) =>
        writeFile(config && createFilePath(config.fileName, config.path) || '', fileString, 'utf8').pipe(
          take(1),
        ),
      ),
    ).subscribe(() => {
      // Nothing
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'file-handler FileChanged: ' + error.name,
        stack: error.stack,
      });
    });

    this.logs.pipe(
      takeUntil(this.destroy),
      filter(log => !!log),
    ).subscribe(log => {
      this.log(log || {} as Log);
    }, error => {
      // tslint:disable-next-line:no-console
      console.log(JSON.stringify({
        level: 'error',
        message: error.message,
        name: 'file-handler LogReceived: ' + error.name,
        stack: error.stack,
      }));
    });
  }

  public configure(config: Config): Observable<FileLoaded<TState, TActionType>> {
    this.configs.next(config);
    return this.fileLoaded.pipe(
      takeUntil(this.destroy),
      filter(fileLoaded => !!fileLoaded),
      map(fileLoaded => fileLoaded || {} as FileLoaded<TState, TActionType>),
    );
  }

  public reduce(reducer: ActionReducer<TState, TActionType>) {
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      this.files.next({
        ...file,
        reducers: file && file.reducers ? [...file.reducers, reducer] : [reducer],
      } as File<TState, TActionType>);
    });
  }

  public dispatch(action: Actions<TActionType>) {
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      this.files.next({
        ...file,
        actions: file && file.actions ? [...file.actions, action] : [action],
      } as File<TState, TActionType>);
    });
  }

  public changeState(state: TState) {
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      this.files.next({
        ...file,
        states: file && file.states ? [...file.states, state] : [state],
      } as File<TState, TActionType>);
    });
  }

  public log(log: Log) {
    combineLatest([this.configs, this.files]).pipe(
      take(1),
    ).subscribe(([config, file]) => {
      if (mustBeLogged(log.level, config && config.logLevel)) {
        this.files.next({
          ...file,
          logs: file && file.logs ? [...file.logs, log] : [log],
        } as File<TState, TActionType>);
      }
    });
  }

  public dispose() {
    this.destroy.next();
    this.destroy.complete();
  }
}
