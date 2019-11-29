import { of } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { BizliDbImpl } from '../bizli-db';
import { Action, ActionReducerMap, FileHandler, TypedAction, VersionedState } from '../model';

interface State extends VersionedState {
  version: number;
  subState1: SubState1,
  subState2: SubState2,
  subState3: SubState3,
  subState4: SubState4
}

interface SubState1 {
  value1: string
}

interface SubState2 {
  value2: string
}

interface SubState3 {
  value3: string
}

interface SubState4 {
  value4: string
}

const reducer1 = (state = {} as SubState1, action: TypedAction<'test'>) => {
  switch (action.type) {
    case 'test': {
      return {
        ...state,
        value1: 'test1',
      };
    }
  }
  return state;
};
const reducer2 = (state: any, action: TypedAction<'test'>) => {
  switch (action.type) {
    case 'test': {
      return {
        ...state,
        value2: 'test2',
      };
    }
  }
  return state;
};
const reducer3 = (state: any, action: TypedAction<'test'>) => {
  switch (action.type) {
    case 'test': {
      return {
        ...state,
        value3: 'test3',
      };
    }
  }
  return state;
};
const reducer4 = (state = {} as SubState4, action: TypedAction<'test'>) => {
  switch (action.type) {
    case 'test': {
      return {
        ...state,
        value4: 'test4',
      };
    }
  }
  return state;
};
const reducerMap1: ActionReducerMap<State, 'test', TypedAction<'test'>> = {
  subState1: reducer1,
  subState2: reducer2,
} as ActionReducerMap<State, 'test', TypedAction<'test'>>;
const reducerMap2: ActionReducerMap<State, 'test', TypedAction<'test'>> = {
  subState3: reducer3,
  subState4: reducer4,
} as ActionReducerMap<State, 'test', TypedAction<'test'>>;
const expectedState1: State = {
  subState1: {
    value1: 'test1',
  },
  subState2: {
    value2: 'test2',
  },
} as State;
const expectedState2: State = {
  subState3: {
    value3: 'test3',
  },
  subState4: {
    value4: 'test4',
  },
} as State;
const expectedSubState1: SubState1 = {
  value1: 'test1',
};
const expectedSubState2: SubState2 = {
  value2: 'test2',
};
const FileHandlerMock = jest.fn<FileHandler<any, any, any>, any>((state?: any) => ({
  changeState: jest.fn(),
  configure: jest.fn(() => of(state)),
  dispatch: jest.fn(),
  dispose: jest.fn(),
  log: jest.fn(),
  reduce: jest.fn(),
}));
const BizliDb = () => new BizliDbImpl(new FileHandlerMock());

describe('bizli-db', () => {

  describe('configure', () => {
    test('should call configure on file handler without config when no config given', () => {
      const mock = new FileHandlerMock();
      const bizliDb = new BizliDbImpl(mock);
      bizliDb.configure();
      expect(mock.configure).toHaveBeenCalledWith(undefined);
    });

    test('should call configure on file handler with given config', () => {
      const mock = new FileHandlerMock();
      const bizliDb = new BizliDbImpl(mock);
      const config = { fileName: 'test.abc' };
      bizliDb.configure(config);
      expect(mock.configure).toHaveBeenCalledWith(config);
    });

    test('should not apply any state change when file handler returns undefined', done => {
      const mock = new FileHandlerMock();
      const bizliDb = new BizliDbImpl(mock);
      bizliDb.configure();
      bizliDb.select().pipe(take(1)).subscribe(state => {
        done.fail();
      });
      setTimeout(done, 1000);
    });

    test('should apply state change when file handler returns new state', done => {
      const expectedState = { test: 'test' };
      const mock = new FileHandlerMock(expectedState);
      const bizliDb = new BizliDbImpl(mock);
      bizliDb.configure();
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual(state);
        done();
      });
    });
  });

  describe('reduce and dispatch', () => {
    test('should call changeState and dispatch on file handler after calculating new state with the given reducer and action', () => {
      const expectedState = { test: 'test' };
      const reducer = jest.fn(() => expectedState);
      const action = { type: 'test' };
      const mock = new FileHandlerMock();
      const bizliDb = new BizliDbImpl(mock);
      bizliDb.reduce(reducer);
      bizliDb.dispatch(action);
      expect(mock.reduce).toHaveBeenCalledWith(reducer);
      expect(reducer).toHaveBeenCalledWith(undefined, action);
      expect(mock.changeState).toHaveBeenCalledWith(expectedState);
      expect(mock.dispatch).toHaveBeenCalledWith(action);
    });

    test('should add a single reducer and have the reducers initial state in state, when dispatching an unhandled action', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce((state = { value: 'hoi' }) => state);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({ value: 'hoi' });
        done();
      });
    });

    test('should add two single reducers and have the first reducers initial state in state, when dispatching an unhandled action before the second reducer is added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce((state = { value: 'hoi' }) => state);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.reduce((state = { value: 'du' }) => state);
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({ value: 'hoi' });
        done();
      });
    });

    test('should add two single reducers and have the first reducers initial state in state, when dispatching an unhandled action after each reducer is added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce((state = { value: 'hoi' }) => state);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.reduce((state = { value: 'du' }) => state);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({ value: 'hoi' });
        done();
      });
    });

    test('should add a single reducer and have the modified state in state, when dispatching the test action', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducer1);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual(expectedSubState1);
        done();
      });
    });

    test('should add two single reducers and have the modified state of the first reducer in state, when dispatching the test action before the second reducer is added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducer1);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.reduce(reducer2);
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual(expectedSubState1);
        done();
      });
    });

    test('should add two single reducers and have the modified state of both reducers in state, when dispatching the test action after both reducers are added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducer1);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.reduce(reducer2);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({ ...expectedSubState1, ...expectedSubState2 });
        done();
      });
    });

    test('should add a reducer map and have the reducers initial state in state, when dispatching an unhandled action', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducerMap1);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({
          subState1: {},
          subState2: undefined,
        });
        done();
      });
    });

    test('should add two reducer maps and have the first reducers initial state in state, when dispatching an unhandled action before the second reducer is added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducerMap1);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.reduce(reducerMap2);
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({
          subState1: {},
          subState2: undefined,
        });
        done();
      });
    });

    test('should add two reducer maps and have both reducers initial state in state, when dispatching an unhandled action after each reducer is added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducerMap1);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.reduce(reducerMap2);
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({
          subState1: {},
          subState2: undefined,
          subState3: undefined,
          subState4: {},
        });
        done();
      });
    });

    test('should add a reducer map and have the modified state in state, when dispatching the test action', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducerMap1);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual(expectedState1);
        done();
      });
    });

    test('should add two reducer maps and have the modified state of the first reducer in state, when dispatching the test action before the second reducer is added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducerMap1);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.reduce(reducerMap2);
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual(expectedState1);
        done();
      });
    });

    test('should add two reducer maps and have the modified state of both reducers in state, when dispatching the test action after both reducers are added', done => {
      const bizliDb = BizliDb();
      bizliDb.reduce(reducerMap1);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.reduce(reducerMap2);
      bizliDb.dispatch({ type: 'test' });
      bizliDb.select().pipe(take(1)).subscribe(state => {
        expect(state).toEqual({ ...expectedState1, ...expectedState2 });
        done();
      });
    });
  });

  describe('select (sub state)', () => {
    test('should get sub state updates no matter where in state the change happened, when no compare is used', done => {
      const bizliDb = BizliDb();
      const reducer = (state = { subState: { test: '' }, changeState: '' }) => ({ subState: { test: '' }, changeState: 'hallo' });
      const selector = (state: { subState: { test: string }, changeState: string }) => state.subState;
      let resultCount = 3;
      bizliDb.reduce(reducer);
      bizliDb.select(selector).pipe(take(resultCount)).subscribe(subState => {
        if (--resultCount === 0) {
          expect(subState).toEqual({ test: '' });
          done();
        }
      });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'hoi' });
      bizliDb.dispatch({ type: 'bingo' });
    });

    test('should get sub state update when selecting the first time, and then when compared state changes only', done => {
      const bizliDb = BizliDb();
      const reducer = (state = { subState: { test: '' }, changeState: '' }, action: Action) => {
        return action.type === 'test' ? { ...state, changeState: 'test' } : { ...state, subState: { test: 'hallo' } };
      };
      const selector = (state: { subState: { test: string }, changeState: string }) => state.subState;
      const comperator = (a: { test: string }, b: { test: string }) => a.test === b.test;
      let resultCount = 2;
      bizliDb.reduce(reducer);
      bizliDb.select().pipe(skip(3), take(1)).subscribe(state => {
        expect(state).toEqual({ subState: { test: '' }, changeState: 'test' });
        bizliDb.dispatch({ type: 'hallo' });
      });
      bizliDb.select(selector, comperator).pipe(take(resultCount)).subscribe(subState => {
        if (--resultCount === 0) {
          expect(subState).toEqual({ test: 'hallo' });
          done();
        }
      });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
    });

    test('should NOT get sub state update when selecting the first time (because sub state is undefined), but when compared state changes to a value', done => {
      const bizliDb = BizliDb();
      const reducer = (state = { subState: undefined, changeState: '' }, action: Action) => {
        return action.type === 'test' ? { ...state, changeState: 'test' } : { ...state, subState: { test: 'hallo' } };
      };
      const selector = (state: { subState: { test: string } | undefined, changeState: string }) => state.subState;
      const comperator = (a: { test: string } | undefined, b: { test: string } | undefined) => (a && a.test) === (b && b.test);
      bizliDb.reduce(reducer);
      bizliDb.select().pipe(skip(3), take(1)).subscribe(state => {
        expect(state).toEqual({ subState: undefined, changeState: 'test' });
        bizliDb.dispatch({ type: 'hallo' });
      });
      bizliDb.select(selector, comperator).pipe(take(1)).subscribe(subState => {
        expect(subState).toEqual({ test: 'hallo' });
        done();
      });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
    });
  });

  describe('select (root)', () => {
    test('should get state updates no matter where in state the change happened, when no compare is used', done => {
      const bizliDb = BizliDb();
      const reducer = (state = { subState: { test: '' }, changeState: '' }) => ({ subState: { test: '' }, changeState: 'hallo' });
      let resultCount = 3;
      bizliDb.reduce(reducer);
      bizliDb.select().pipe(take(resultCount)).subscribe(subState => {
        if (--resultCount === 0) {
          expect(subState).toEqual({ subState: { test: '' }, changeState: 'hallo' });
          done();
        }
      });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'hoi' });
      bizliDb.dispatch({ type: 'bingo' });
    });

    test('should get state update when selecting the first time, and then when compared state changes only', done => {
      const bizliDb = BizliDb();
      const reducer = (state = { subState: { test: '' }, changeState: '' }, action: Action) => {
        return action.type === 'test' ? { ...state, changeState: 'test' } : { ...state, subState: { test: 'hallo' } };
      };
      const comperator = (a: { subState: { test: string }, changeState: string }, b: { subState: { test: string }, changeState: string }) => a.subState.test === b.subState.test;
      let resultCount = 2;
      bizliDb.reduce(reducer);
      bizliDb.select().pipe(skip(3), take(1)).subscribe(state => {
        expect(state).toEqual({ subState: { test: '' }, changeState: 'test' });
        bizliDb.dispatch({ type: 'hallo' });
      });
      bizliDb.select(undefined, comperator).pipe(take(resultCount)).subscribe(subState => {
        if (--resultCount === 0) {
          expect(subState).toEqual({ subState: { test: 'hallo' }, changeState: 'test' });
          done();
        }
      });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'test' });
    });
  });

  describe('observe', () => {
    test('should receive observed actions only', done => {
      const bizliDb = BizliDb();
      const actionTypes = ['test', 'test2'];
      let resultCount = 2;
      bizliDb.observe(actionTypes).pipe(take(resultCount)).subscribe(action => {
        expect(actionTypes.includes(action.type)).toBeTruthy();
        if (--resultCount === 0) {
          done();
        }
      });
      bizliDb.dispatch({ type: 'unknown' });
      bizliDb.dispatch({ type: 'bla' });
      bizliDb.dispatch({ type: 'test' });
      bizliDb.dispatch({ type: 'hoi' });
      bizliDb.dispatch({ type: 'du' });
      bizliDb.dispatch({ type: 'test2' });
      bizliDb.dispatch({ type: 'hungry' });
    });
  });

});


