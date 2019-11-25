import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, exhaustMap, filter, map, take, takeUntil } from 'rxjs/operators';
import { FileHandlerImpl } from './file-handler';
import { combineReducers } from './helpers';
import { Action, ActionReducer, ActionReducerMap, Actions, BizliDb, Config, FileHandler, Log, Select } from './model';

export class BizliDbImpl<TState, TActionType extends string> implements BizliDb<TState, TActionType> {
  private configs: BehaviorSubject<Config | undefined>;
  private reducers: BehaviorSubject<ActionReducer<TState, TActionType> | undefined>;
  private actions: BehaviorSubject<Actions<TActionType> | undefined>;
  private states: BehaviorSubject<TState | undefined>;
  private logs: BehaviorSubject<Log | undefined>;
  private destroy: Subject<void>;

  private fileHandler: FileHandler<TState, TActionType>;

  constructor() {
    this.configs = new BehaviorSubject<Config | undefined>(undefined);
    this.reducers = new BehaviorSubject<ActionReducer<TState, TActionType> | undefined>(undefined);
    this.actions = new BehaviorSubject<Actions<TActionType> | undefined>(undefined);
    this.states = new BehaviorSubject<TState | undefined>(undefined);
    this.logs = new BehaviorSubject<Log | undefined>(undefined);
    this.destroy = new Subject();

    this.fileHandler = new FileHandlerImpl();

    this.configs.pipe(
      takeUntil(this.destroy),
      filter(config => !!config),
    ).subscribe(config => {
      this.logs.next({ level: 'debug', name: 'bizli-db ConfigChanged', message: JSON.stringify(config) });
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'bizli-db ConfigChanged: ' + error.name,
        stack: error.stack,
      });
    });

    this.configs.pipe(
      takeUntil(this.destroy),
      filter(config => !!config),
      exhaustMap(config =>
        this.fileHandler.configure(config || {} as Config).pipe(
          take(1),
        )),
    ).subscribe(fileLoaded => {
      this.logs.next({ level: 'debug', name: 'bizli-db FileLoaded', message: JSON.stringify(fileLoaded) });
      if (fileLoaded.reducer) {
        this.reducers.next(fileLoaded.reducer);
      }
      if (fileLoaded.state) {
        this.states.next(fileLoaded.state);
      }
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'bizli-db FileLoaded: ' + error.name,
        stack: error.stack,
      });
    });

    this.reducers.pipe(
      takeUntil(this.destroy),
      filter(reducer => !!reducer),
    ).subscribe(reducer => {
      this.logs.next({ level: 'debug', name: 'bizli-db ReducerChanged', message: JSON.stringify(reducer) });
      this.fileHandler.reduce(reducer || ((state = {} as TState) => state));
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'bizli-db ReducerChanged: ' + error.name,
        stack: error.stack,
      });
    });

    this.actions.pipe(
      takeUntil(this.destroy),
      filter(action => !!action),
    ).subscribe(action => {
      this.logs.next({ level: 'debug', name: 'bizli-db ActionReceived', message: JSON.stringify(action) });
      this.fileHandler.dispatch(action || {} as Action);
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'bizli-db ActionReceived: ' + error.name,
        stack: error.stack,
      });
    });

    this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
    ).subscribe(state => {
      this.logs.next({ level: 'debug', name: 'bizli-db StateChanged', message: JSON.stringify(state) });
      this.fileHandler.changeState(state || {} as TState);
    }, error => {
      this.logs.next({
        level: 'error',
        message: error.message,
        name: 'bizli-db StateChanged: ' + error.name,
        stack: error.stack,
      });
    });

    this.logs.pipe(
      takeUntil(this.destroy),
      filter(log => !!log),
    ).subscribe(log => {
      this.fileHandler.log(log || {} as Log);
    }, error => {
      this.fileHandler.log({
        level: 'error',
        message: error.message,
        name: 'bizli-db LogReceived: ' + error.name,
        stack: error.stack,
      });
    });
  }

  public configure(config: Config) {
    this.configs.next(config);
  }

  public reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>) {
    const actionReducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
    this.reducers.next(actionReducer);
  }

  public dispatch(action: Actions<TActionType>) {
    combineLatest([this.reducers, this.states]).pipe(
      take(1),
    ).subscribe(([reducer, state]) => {
      if (reducer) {
        this.states.next(reducer(state, action));
      }
      this.actions.next(action);
    });
  }

  public select<TSubState>(select: Select<TState, TSubState>, compare?: (a: TSubState, b: TSubState) => boolean): Observable<TSubState> {
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => select(state || {} as TState)),
      distinctUntilChanged(compare),
    );
  }

  public selectRoot(compare?: (a: TState, b: TState) => boolean): Observable<TState> {
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => state || {} as TState),
      distinctUntilChanged(compare),
    );
  }

  public observe(actions: Array<string | TActionType>): Observable<Actions<TActionType>> {
    return this.actions.pipe(
      takeUntil(this.destroy),
      filter(action => !!action && actions.includes(action.type)),
      map(action => action || {} as Action),
    );
  }

  public dispose() {
    this.destroy.next();
    this.destroy.complete();
  }
}
