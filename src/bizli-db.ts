import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';
import { FileHandlerImpl } from './file-handler';
import { combineReducers } from './helpers';
import { Action, ActionReducer, ActionReducerMap, Actions, BizliDb, Config, FileHandler, Select } from './model';

export class BizliDbImpl<TState, TActionType extends string> implements BizliDb<TState, TActionType> {
  private config: Config;
  private reducer: ActionReducer<TState, TActionType>;
  private actions: BehaviorSubject<Actions<TActionType> | undefined>;
  private states: BehaviorSubject<TState | undefined>;
  private destroy: Subject<void>;

  private fileHandler: FileHandler<TState, TActionType>;

  constructor() {
    this.config = {};
    this.reducer = (state: any) => state;
    this.actions = new BehaviorSubject<Actions<TActionType> | undefined>(undefined);
    this.states = new BehaviorSubject<TState | undefined>(undefined);
    this.destroy = new Subject();

    this.fileHandler = new FileHandlerImpl();
  }

  public configure(config?: Config) {
    this.config = config || this.config;
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ConfigChanged', message: JSON.stringify(this.config) });
    this.fileHandler.configure(this.config).subscribe(fileLoaded => {
      this.fileHandler.log({ level: 'debug', name: 'bizli-db FileLoaded', message: JSON.stringify(fileLoaded) });
      if (fileLoaded.reducer) {
        this.fileHandler.log({ level: 'debug', name: 'bizli-db ReducerChanged (configure)', message: JSON.stringify(fileLoaded.reducer) });
        this.reducer = fileLoaded.reducer;
      }
      if (fileLoaded.state) {
        this.fileHandler.log({ level: 'debug', name: 'bizli-db StateChanged (configure)', message: JSON.stringify(fileLoaded.state) });
        this.states.next(fileLoaded.state);
      }
    }, error => {
      this.fileHandler.log({ level: 'error', name: `bizli-db FileLoaded: ${error.name}`, message: error.message, stack: error.stack });
    });
  }

  public reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>) {
    this.reducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ReducerChanged (reduce)', message: JSON.stringify(this.reducer) });
    this.fileHandler.reduce(this.reducer);
  }

  public dispatch(action: Actions<TActionType>) {
    this.states.pipe(
      take(1),
    ).subscribe(state => {
      const newState = this.reducer(state, action);
      this.fileHandler.log({ level: 'debug', name: 'bizli-db StateChanged (dispatch)', message: JSON.stringify(newState) });
      this.states.next(newState);
      this.fileHandler.changeState(state);

      this.fileHandler.log({ level: 'debug', name: 'bizli-db ActionDispatched', message: JSON.stringify(state) });
      this.actions.next(action);
      this.fileHandler.dispatch(action);
    });
  }

  public select<TSubState>(select: Select<TState, TSubState>, compare?: (a: TSubState, b: TSubState) => boolean): Observable<TSubState> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db StateSelected', message: `Select: ${JSON.stringify(select)}, Compare: ${JSON.stringify(compare)}` });
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => select(state || {} as TState)),
      distinctUntilChanged(compare),
    );
  }

  public selectRoot(compare?: (a: TState, b: TState) => boolean): Observable<TState> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db RootStateSelected', message: `Compare: ${JSON.stringify(compare)}` });
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => state || {} as TState),
      distinctUntilChanged(compare),
    );
  }

  public observe(actions: Array<string | TActionType>): Observable<Actions<TActionType>> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ActionsObserved', message: JSON.stringify(actions) });
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
