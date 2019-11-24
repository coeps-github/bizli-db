import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import * as winston from 'winston';
import { Logger } from 'winston';
import { combineReducers } from './helpers';
import { Action, ActionReducer, ActionReducerMap, Actions, BizliDb, BizliDbInitAction, Select } from './model';

export class BizliDbImpl<TState, TActionType extends string> implements BizliDb<TState, TActionType> {
  private reducers: BehaviorSubject<ActionReducer<TState, TActionType> | undefined>;
  private states: BehaviorSubject<TState | undefined>;
  private actions: BehaviorSubject<Actions<TActionType> | undefined>;
  private destroy: Subject<void>;
  private logger: Logger;

  constructor() {
    this.reducers = new BehaviorSubject<ActionReducer<TState, TActionType> | undefined>(undefined);
    this.states = new BehaviorSubject<TState | undefined>(undefined);
    this.actions = new BehaviorSubject<Actions<TActionType> | undefined>(undefined);
    this.destroy = new Subject();
    this.logger = this.createLogger();

    this.reducers.pipe(
      takeUntil(this.destroy),
      filter(reducer => !!reducer),
    ).subscribe(reducer => {
      this.logger.debug('ReducerChanged', reducer);
    }, error => {
      this.logger.error(error);
    });

    this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
    ).subscribe(state => {
      this.logger.debug('StateChanged', state);
    }, error => {
      this.logger.error(error);
    });

    this.actions.pipe(
      takeUntil(this.destroy),
      withLatestFrom(this.states, this.reducers),
      filter(([action, , reducer]) => !!action && !!reducer),
    ).subscribe(([action, state, reducer]) => {
      this.logger.debug('ActionReceived', action);
      if (action && reducer) {
        this.states.next(reducer(state, action));
      }
    }, error => {
      this.logger.error(error);
    });
  }

  public reduce(reducer: ActionReducer<TState, TActionType> | ActionReducerMap<TState, TActionType>, resetState?: boolean) {
    const actionReducer = typeof reducer === 'function' ? reducer : combineReducers(reducer);
    this.reducers.pipe(
      take(1),
    ).subscribe(currentReducer => {
      if (resetState || !currentReducer) {
        this.states.next(undefined);
        this.states.next(actionReducer(undefined, BizliDbInitAction));
      }
      this.reducers.next(actionReducer);
    });
  }

  public dispatch(action: Actions<TActionType>) {
    this.actions.next(action);
  }

  public select<TSubState>(select?: Select<TState, TSubState>): Observable<TState | TSubState> {
    return this.states.pipe(
      takeUntil(this.destroy),
      filter(state => !!state),
      map(state => {
        const stateDefined = state || {} as TState;
        return select ? select(stateDefined) : stateDefined;
      }),
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
