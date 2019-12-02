import { AsyncSubject, BehaviorSubject, Observable, Subject } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';
import { combineReducers, stringifyReducer, stringifyReducerMap } from './helpers';
import { Action, ActionReducer, ActionReducerMap, BizliDb, Compare, Config, Effect, FileHandler, Select, TypedAction, VersionedState } from './model';

export class BizliDbImpl<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>> implements BizliDb<TState, TActionType, TAction> {
  private reducer: ActionReducer<TState, TActionType, TAction>;
  private actions: BehaviorSubject<TAction | undefined>;
  private states: BehaviorSubject<TState | undefined>;
  private effects: BehaviorSubject<Effect<TState, TActionType, TAction> | undefined>;
  private fileLoadLatch: AsyncSubject<void>;
  private readonly destroy: Subject<void>;

  constructor(private fileHandler: FileHandler<TState, TActionType, TAction>) {
    this.reducer = (state: any) => state;
    this.actions = new BehaviorSubject<TAction | undefined>(undefined);
    this.states = new BehaviorSubject<TState | undefined>(undefined);
    this.effects = new BehaviorSubject<Effect<TState, TActionType, TAction> | undefined>(undefined);
    this.fileLoadLatch = new AsyncSubject();
    this.destroy = new Subject();

    this.fileLoadLatch.next();
    this.fileLoadLatch.complete();
  }

  public configure(config?: Config<TState>) {
    this.fileLoadLatch = new AsyncSubject();
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ConfigChanged', message: JSON.stringify(config) });
    this.fileHandler.configure(config).subscribe(state => {
      this.fileHandler.log({ level: 'debug', name: 'bizli-db StateLoaded', message: JSON.stringify(state) });
      if (state) {
        this.fileHandler.log({ level: 'debug', name: 'bizli-db StateChanged (configure)', message: JSON.stringify(state) });
        this.states.next(state);
      }
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    }, error => {
      this.fileHandler.log({ level: 'error', name: `bizli-db StateLoaded: ${error.name}`, message: error.message, stack: error.stack });
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    });
  }

  public reduce(reducer: ActionReducer<TState, TActionType, TAction> | ActionReducerMap<TState, TActionType, TAction>) {
    this.fileLoadLatch.pipe(
      take(1),
    ).subscribe(() => {
      const reducerString = typeof reducer === 'function' ? stringifyReducer(reducer) : stringifyReducerMap(reducer);
      this.reducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
      this.fileHandler.log({ level: 'debug', name: 'bizli-db ReducerChanged', message: JSON.stringify(reducerString) });
      this.fileHandler.reduce(reducerString);
    }, error => {
      this.fileHandler.log({ level: 'error', name: `bizli-db ReducerChanged: ${error.name}`, message: error.message, stack: error.stack });
    });
  }

  public dispatch(action: TAction) {
    this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.states.pipe(
          take(1),
        ),
      ),
    ).subscribe(state => {
      const newState = this.reducer(state, action);

      this.fileHandler.log({ level: 'debug', name: 'bizli-db ActionDispatched', message: JSON.stringify(action) });
      this.fileHandler.log({ level: 'debug', name: 'bizli-db StateChanged (dispatch)', message: JSON.stringify(newState) });

      this.actions.next(action);
      this.states.next(newState);
      this.effects.next({ action, state: newState });

      this.fileHandler.dispatch(action);
      this.fileHandler.changeState(newState);
    }, error => {
      this.fileHandler.log({ level: 'error', name: `bizli-db ActionDispatched / StateChanged: ${error.name}`, message: error.message, stack: error.stack });
    });
  }

  public select<TSubState>(select?: Select<TState, TSubState>, compare?: Compare<TSubState>): Observable<TSubState>;
  public select(select?: Select<TState, TState>, compare?: Compare<TState>): Observable<TState> {
    this.fileHandler.log({
      level: 'debug',
      name: 'bizli-db StateSelected',
      message: `Select: ${JSON.stringify(select)}, Compare: ${JSON.stringify(compare)}`,
    });
    return this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.states.pipe(
          takeUntil(this.destroy),
          filter(state => !!state),
          map(state => select ? select(state || {} as TState) : state || {} as TState),
          filter(subState => !!subState),
          distinctUntilChanged(compare),
        ),
      ),
    );
  }

  public effect(actions: Array<string | TActionType>): Observable<Effect<TState, TActionType, TAction>> {
    this.fileHandler.log({ level: 'debug', name: 'bizli-db ActionsObserved', message: JSON.stringify(actions) });
    return this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.effects.pipe(
          takeUntil(this.destroy),
          filter(effect => !!effect && actions.includes(effect.action.type)),
          map(effect => effect || {} as Effect<TState, TActionType, TAction>),
        ),
      ),
    );
  }

  public dispose() {
    this.destroy.next();
    this.destroy.complete();
    this.fileHandler.dispose();
  }
}
