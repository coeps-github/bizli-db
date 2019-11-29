import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';
import { combineReducers } from './helpers';
import { Action, ActionReducer, ActionReducerMap, BizliDb, Compare, Config, FileHandler, Select, TypedAction, VersionedState } from './model';

export class BizliDbImpl<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> implements BizliDb<TState, TActionType, TAction> {
  private reducer: ActionReducer<TState, TActionType, TAction>;
  private actions: BehaviorSubject<TAction | undefined>;
  private states: BehaviorSubject<TState | undefined>;
  private readonly destroy: Subject<void>;

  constructor(private fileHandler: FileHandler<TState, TActionType, TAction>) {
    this.reducer = (state: any) => state;
    this.actions = new BehaviorSubject<TAction | undefined>(undefined);
    this.states = new BehaviorSubject<TState | undefined>(undefined);
    this.destroy = new Subject();
  }

  public configure(config?: Config<TState>) {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ConfigChanged', message: JSON.stringify(config) });
    this.fileHandler.configure(config).subscribe(state => {
      this.fileHandler.log({ level: 'debug', name: 'bizli-db StateLoaded', message: JSON.stringify(state) });
      if (state) {
        this.fileHandler.log({ level: 'debug', name: 'bizli-db StateChanged (configure)', message: JSON.stringify(state) });
        this.states.next(state);
      }
    }, error => {
      this.fileHandler.log({ level: 'error', name: `bizli-db StateLoaded: ${error.name}`, message: error.message, stack: error.stack });
    });
  }

  public reduce(reducer: ActionReducer<TState, TActionType, TAction> | ActionReducerMap<TState, TActionType, TAction>) {
    this.reducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ReducerChanged', message: JSON.stringify(this.reducer) });
    this.fileHandler.reduce(this.reducer);
  }

  public dispatch(action: TAction) {
    this.states.pipe(
      take(1),
    ).subscribe(state => {
      const newState = this.reducer(state, action);
      this.fileHandler.log({ level: 'debug', name: 'bizli-db StateChanged (dispatch)', message: JSON.stringify(newState) });
      this.states.next(newState);
      this.fileHandler.changeState(newState);

      this.fileHandler.log({ level: 'debug', name: 'bizli-db ActionDispatched', message: JSON.stringify(action) });
      this.actions.next(action);
      this.fileHandler.dispatch(action);
    });
  }

  public select<TSubState>(select?: Select<TState, TSubState>, compare?: Compare<TSubState>): Observable<TSubState>;
  public select(select?: Select<TState, TState>, compare?: Compare<TState>): Observable<TState> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db RootStateSelected', message: `Compare: ${JSON.stringify(compare)}` });
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => select ? select(state || {} as TState) : state || {} as TState),
      filter(subState => !!subState),
      distinctUntilChanged(compare),
    );
  }

  public observe(actions: Array<string | TActionType>): Observable<TAction> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ActionsObserved', message: JSON.stringify(actions) });
    return this.actions.pipe(
      takeUntil(this.destroy),
      filter(action => !!action && actions.includes(action.type)),
      map(action => action || {} as TAction),
    );
  }

  public dispose() {
    this.destroy.next();
    this.destroy.complete();
  }
}
