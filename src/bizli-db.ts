import { Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import * as winston from 'winston';
import { Logger } from 'winston';
import { combineReducers } from './helpers';
import { ActionReducer, ActionReducerMap, Actions, BizliDb, BizliDbInitAction, Select } from './model';

export class BizliDbImpl<TState, TActionType extends string> implements BizliDb<TState, TActionType> {
  private states: Subject<TState>;
  private reducer: ActionReducer<TState, TActionType>;
  private actions: Subject<Actions<TActionType>>;
  private logger: Logger;

  constructor(
    actionReducer: ActionReducer<TState, TActionType> |
      ActionReducerMap<TState, TActionType>,
    initialState?: Partial<TState>,
  ) {
    this.reducer = typeof actionReducer === 'function' ? actionReducer : combineReducers(actionReducer);
    this.states = new Subject<TState>();
    this.actions = new Subject<Actions<TActionType>>();
    this.logger = this.createLogger();

    this.states.subscribe(state => {
      this.logger.debug('StateChanged', state);
    }, error => {
      this.logger.error(error);
    });

    this.states.next(this.reducer(BizliDbInitAction, initialState));

    this.actions.subscribe(action => {
      this.logger.debug('ActionReceived', action);
      this.states.pipe(take(1)).subscribe(state => this.states.next(this.reducer(action, state)));
    }, error => {
      this.logger.error(error);
    });
  }

  public dispatch(action: Actions<TActionType>) {
    this.actions.next(action);
  }

  public select<TSubState>(select: Select<TState, TSubState>): Observable<TSubState> {
    return this.states.pipe(map(state => select(state)));
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
