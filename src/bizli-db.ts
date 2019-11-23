import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, skipWhile, take, takeUntil } from 'rxjs/operators';
import * as winston from 'winston';
import { Logger } from 'winston';
import { combineReducers } from './helpers';
import { ActionReducer, ActionReducerMap, Actions, BizliDb, BizliDbInitAction, Select } from './model';

export class BizliDbImpl<TState, TActionType extends string> implements BizliDb<TState, TActionType> {
  private reducer: BehaviorSubject<ActionReducer<TState, TActionType>>;
  private states: BehaviorSubject<TState | undefined>;
  private actions: BehaviorSubject<Actions<TActionType>>;
  private destroy: Subject<void>;
  private logger: Logger;

  constructor() {
    this.reducer = new BehaviorSubject<ActionReducer<TState, TActionType>>(() => ({} as TState));
    this.states = new BehaviorSubject<TState | undefined>(undefined);
    this.actions = new BehaviorSubject<Actions<TActionType>>(BizliDbInitAction);
    this.destroy = new Subject();
    this.logger = this.createLogger();

    this.reducer.pipe(
      takeUntil(this.destroy),
    ).subscribe(reducer => {
      this.logger.debug('ReducerChanged', reducer);
      this.states.pipe(take(1)).subscribe(state => this.states.next(reducer(state, BizliDbInitAction)));
    }, error => {
      this.logger.error(error);
    });

    this.states.pipe(
      takeUntil(this.destroy),
    ).subscribe(state => {
      this.logger.debug('StateChanged', state);
    }, error => {
      this.logger.error(error);
    });

    this.actions.pipe(
      takeUntil(this.destroy),
    ).subscribe(action => {
      this.logger.debug('ActionReceived', action);
      combineLatest([this.states, this.reducer]).pipe(take(1)).subscribe(([state, reducer]) => this.states.next(reducer(state, action)));
    }, error => {
      this.logger.error(error);
    });
  }

  public reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>) {
    const actionReducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
    this.reducer.next(actionReducer);
  }

  public dispatch(action: Actions<TActionType>) {
    this.actions.next(action);
  }

  public select<TSubState>(select: Select<TState, TSubState>): Observable<TSubState> {
    return this.states.pipe(
      takeUntil(this.destroy),
      skipWhile(state => !state),
      map(state => select(state || {} as TState)),
    );
  }

  public observe(actions: Array<string | TActionType>): Observable<Actions<TActionType>> {
    return this.actions.pipe(
      takeUntil(this.destroy),
      filter(action => actions.includes(action.type)),
    );
  }

  public dispose() {
    this.destroy.next();
    this.destroy.complete();
  }

  private createLogger() {
    const logger = winston.createLogger({
      defaultMeta: { service: 'bizli-db' },
      format: winston.format.json(),
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
    if (process.env.NODE_ENV !== 'production') {
      logger.add(new winston.transports.Console({
        format: winston.format.simple(),
      }));
    }
    return logger;
  }
}
