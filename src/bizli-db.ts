import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';
import { combineReducers } from './helpers';
import { Action, ActionReducer, ActionReducerMap, Actions, BizliDb, Compare, Config, FileHandler, Select, States } from './model';

export class BizliDbImpl<TState, TActionType extends string> implements BizliDb<TState, TActionType> {
  private config: Config<TState>;
  private reducer: ActionReducer<TState, TActionType>;
  private actions: BehaviorSubject<Actions<TActionType> | undefined>;
  private states: BehaviorSubject<States<TState> | undefined>;
  private destroy: Subject<void>;

  constructor(private fileHandler: FileHandler<TState, TActionType>) {
    this.config = {};
    this.reducer = (state: any) => state;
    this.actions = new BehaviorSubject<Actions<TActionType> | undefined>(undefined);
    this.states = new BehaviorSubject<States<TState> | undefined>(undefined);
    this.destroy = new Subject();
  }

  public configure(config?: Config<TState>) {
    this.config = config || this.config;
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ConfigChanged', message: JSON.stringify(this.config) });
    this.fileHandler.configure(this.config).subscribe(state => {
      this.fileHandler.log({ level: 'debug', name: 'bizli-db StateLoaded', message: JSON.stringify(state) });
      if (state) {
        this.fileHandler.log({ level: 'debug', name: 'bizli-db StateChanged (configure)', message: JSON.stringify(state) });
        this.states.next(state);
      }
    }, error => {
      this.fileHandler.log({ level: 'error', name: `bizli-db StateLoaded: ${error.name}`, message: error.message, stack: error.stack });
    });
  }

  public reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>) {
    this.reducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ReducerChanged', message: JSON.stringify(this.reducer) });
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

  public select<TSubState>(select: Select<TState, TSubState>, compare?: Compare<TSubState>): Observable<TSubState> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db StateSelected', message: `Select: ${JSON.stringify(select)}, Compare: ${JSON.stringify(compare)}` });
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => select(state || {} as States<TState>)),
      distinctUntilChanged(compare),
    );
  }

  public selectRoot(compare?: Compare<States<TState>>): Observable<States<TState>> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db RootStateSelected', message: `Compare: ${JSON.stringify(compare)}` });
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => state || {} as States<TState>),
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
