import { AsyncSubject, BehaviorSubject, Observable, Subject } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';
import { combineReducers } from './helpers';
import {
  Action,
  ActionReducer,
  ActionReducerMap,
  BizliDb,
  BizliDbConfig,
  Compare,
  Effect,
  FileHandler,
  Logger,
  Select,
  TypedAction,
  VersionedState,
} from './model';

export class BizliDbImpl<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>, TLoggerConfig> implements BizliDb<TState, TActionType, TAction> {
  private config: BizliDbConfig;
  private reducer: ActionReducer<TState, TActionType, TAction>;
  private actions: BehaviorSubject<TAction | undefined>;
  private states: BehaviorSubject<TState | undefined>;
  private effects: BehaviorSubject<Effect<TState, TActionType, TAction> | undefined>;
  private fileLoadLatch: AsyncSubject<void>;
  private readonly destroy: Subject<void>;

  constructor(private fileHandler: FileHandler<TState, TActionType, TAction>, private logger: Logger<TLoggerConfig>) {
    this.config = {};
    this.reducer = (state: any) => state;
    this.actions = new BehaviorSubject<TAction | undefined>(undefined);
    this.states = new BehaviorSubject<TState | undefined>(undefined);
    this.effects = new BehaviorSubject<Effect<TState, TActionType, TAction> | undefined>(undefined);
    this.fileLoadLatch = new AsyncSubject();
    this.destroy = new Subject();

    this.fileLoadLatch.next();
    this.fileLoadLatch.complete();
  }

  configure(config: BizliDbConfig) {
    this.logger.log({ level: 'debug', name: 'bizli-db ConfigChanged (before)', message: JSON.stringify(this.config) });
    this.config = { ...this.config, ...config };
    this.logger.log({ level: 'debug', name: 'bizli-db ConfigChanged (after)', message: JSON.stringify(this.config) });
  }

  loadState() {
    this.fileLoadLatch = new AsyncSubject();
    this.fileHandler.loadState().subscribe(state => {
      this.logger.log({ level: 'debug', name: 'bizli-db StateLoaded', message: JSON.stringify(state) });
      if (state) {
        this.logger.log({ level: 'debug', name: 'bizli-db StateChanged (loadState)', message: JSON.stringify(state) });
        this.states.next(state);
      }
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    }, error => {
      this.logger.log({ level: 'error', name: `bizli-db StateLoaded: ${error.name}`, message: error.message, stack: error.stack });
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    });
  }

  reduce(reducer: ActionReducer<TState, TActionType, TAction> | ActionReducerMap<TState, TActionType, TAction>) {
    this.logger.log({ level: 'debug', name: 'bizli-db ReducerChanged', message: '...' });
    this.reducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
  }

  dispatch(action: TAction) {
    this.fileLoadLatch.pipe(
      take(1),
      concatMap(() =>
        this.states.pipe(
          take(1),
        ),
      ),
    ).subscribe(state => {
      const newState = this.reducer(state, action);

      this.logger.log({ level: 'debug', name: 'bizli-db ActionDispatched', message: JSON.stringify(action) });
      this.logger.log({ level: 'debug', name: 'bizli-db StateChanged (dispatch)', message: JSON.stringify(newState) });

      this.actions.next(action);
      this.states.next(newState);
      this.effects.next({ action, state: newState });

      this.fileHandler.saveState(newState);
    }, error => {
      this.logger.log({ level: 'error', name: `bizli-db ActionDispatched / StateChanged: ${error.name}`, message: error.message, stack: error.stack });
    });
  }

  select<TSubState>(select?: Select<TState, TSubState>, compare?: Compare<TSubState>): Observable<TSubState>;
  select(select?: Select<TState, TState>, compare?: Compare<TState>): Observable<TState> {
    this.logger.log({
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

  effect(actions: Array<string | TActionType>): Observable<Effect<TState, TActionType, TAction>> {
    this.logger.log({ level: 'debug', name: 'bizli-db ActionsObserved', message: JSON.stringify(actions) });
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

  dispose() {
    this.fileLoadLatch.next();
    this.fileLoadLatch.complete();
    this.destroy.next();
    this.destroy.complete();
    this.fileHandler.dispose();
  }
}
