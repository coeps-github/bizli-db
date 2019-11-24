import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { exhaustMap, filter, map, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { readFile, writeFile } from './helpers';
import { ActionReducer, ActionReducerMap, Actions, Config, File, FileHandler, Log } from './model';

export class FileHandlerImpl<TState, TActionType extends string> implements FileHandler<TState, TActionType> {
  private configs: BehaviorSubject<Config | undefined>;
  private files: BehaviorSubject<File<TState, TActionType> | undefined>;
  private logs: BehaviorSubject<Log | undefined>;
  private destroy: Subject<void>;

  constructor() {
    this.configs = new BehaviorSubject<Config | undefined>(undefined);
    this.files = new BehaviorSubject<File<TState, TActionType> | undefined>(undefined);
    this.logs = new BehaviorSubject<Log | undefined>(undefined);
    this.destroy = new Subject();

    this.configs.pipe(
      takeUntil(this.destroy),
      filter(config => !!config),
      tap(config => {
        this.logs.next({ level: 'debug', name: 'file-handler ConfigChanged', message: JSON.stringify(config) });
      }),
      exhaustMap(config =>
        readFile(config && (config.path + config.fileName) || '', 'utf8').pipe(
          tap(fileString => this.logs.next({ level: 'debug', name: 'file-handler FileRead', message: fileString })),
          map(fileString => JSON.parse(fileString) as File<TState, TActionType>),
        ),
      ),
    ).subscribe(file => {
      this.files.next(file);
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'file-handler ConfigChanged: ' + error.name,
        stack: error.stack,
      });
    });

    this.files.pipe(
      takeUntil(this.destroy),
      filter(file => !!file),
      map(file => JSON.stringify(file)),
      tap(fileString => {
        this.logs.next({ level: 'debug', name: 'file-handler FileChanged', message: fileString });
      }),
      withLatestFrom(this.configs),
      filter(([, config]) => !!config),
      exhaustMap(([fileString, config]) =>
        writeFile(config && (config.path + config.fileName) || '', fileString, 'utf8'),
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
    ).subscribe(() => {
      // Nothing
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

  public configure(config: Config) {
    this.configs.next(config);
  }

  public reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>) {
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
    this.files.pipe(
      take(1),
    ).subscribe(file => {
      this.files.next({
        ...file,
        logs: file && file.logs ? [...file.logs, log] : [log],
      } as File<TState, TActionType>);
    });
  }

  public observe(): Observable<File<TState, TActionType>> {
    return this.files.pipe(
      takeUntil(this.destroy),
      filter(file => !!file),
      map(file => file || {} as File<TState, TActionType>),
    );
  }

  public dispose() {
    this.destroy.next();
    this.destroy.complete();
  }
}
