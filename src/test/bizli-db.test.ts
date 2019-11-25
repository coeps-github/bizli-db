import { take } from 'rxjs/operators';
import { BizliDbImpl } from '../bizli-db';
import { ActionReducerMap, Actions } from '../model';

interface State {
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

const reducer1 = (state = {} as SubState1, action: Actions<'test'>) => {
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
const reducer2 = (state: any, action: Actions<'test'>) => {
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
const reducer3 = (state: any, action: Actions<'test'>) => {
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
const reducer4 = (state = {} as SubState4, action: Actions<'test'>) => {
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
const reducerMap1: ActionReducerMap<State, 'test'> = {
  subState1: reducer1,
  subState2: reducer2,
} as ActionReducerMap<State, 'test'>;
const reducerMap2: ActionReducerMap<State, 'test'> = {
  subState3: reducer3,
  subState4: reducer4,
} as ActionReducerMap<State, 'test'>;
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

describe('bizli-db', () => {
  test('BizliDbImpl should add a single reducer and have the reducers initial state in state, when dispatching an unhandled action', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce((state = { value: 'hoi' }) => state);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ value: 'hoi' });
      done();
    });
  });

  test('BizliDbImpl should add two single reducers and have the first reducers initial state in state, when dispatching an unhandled action before the second reducer is added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce((state = { value: 'hoi' }) => state);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.reduce((state = { value: 'du' }) => state);
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ value: 'hoi' });
      done();
    });
  });

  test('BizliDbImpl should add two single reducers and have the first reducers initial state in state, when dispatching an unhandled action after each reducer is added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce((state = { value: 'hoi' }) => state);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.reduce((state = { value: 'du' }) => state);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ value: 'hoi' });
      done();
    });
  });

  test('BizliDbImpl should add a single reducer and have the modified state in state, when dispatching the test action', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducer1);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedSubState1);
      done();
    });
  });

  test('BizliDbImpl should add two single reducers and have the modified state of the first reducer in state, when dispatching the test action before the second reducer is added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducer1);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.reduce(reducer2);
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedSubState1);
      done();
    });
  });

  test('BizliDbImpl should add two single reducers and have the modified state of both reducers in state, when dispatching the test action after both reducers are added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducer1);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.reduce(reducer2);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ ...expectedSubState1, ...expectedSubState2 });
      done();
    });
  });

  test('BizliDbImpl should add a reducer map and have the reducers initial state in state, when dispatching an unhandled action', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducerMap1);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({
        subState1: {},
        subState2: undefined,
      });
      done();
    });
  });

  test('BizliDbImpl should add two reducer maps and have the first reducers initial state in state, when dispatching an unhandled action before the second reducer is added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducerMap1);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.reduce(reducerMap2);
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({
        subState1: {},
        subState2: undefined,
      });
      done();
    });
  });

  test('BizliDbImpl should add two reducer maps and have both reducers initial state in state, when dispatching an unhandled action after each reducer is added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducerMap1);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.reduce(reducerMap2);
    bizliDb.dispatch({ type: 'bla' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({
        subState1: {},
        subState2: undefined,
        subState3: undefined,
        subState4: {},
      });
      done();
    });
  });

  test('BizliDbImpl should add a reducer map and have the modified state in state, when dispatching the test action', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducerMap1);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedState1);
      done();
    });
  });

  test('BizliDbImpl should add two reducer maps and have the modified state of the first reducer in state, when dispatching the test action before the second reducer is added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducerMap1);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.reduce(reducerMap2);
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedState1);
      done();
    });
  });

  test('BizliDbImpl should add two reducer maps and have the modified state of both reducers in state, when dispatching the test action after both reducers are added', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducerMap1);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.reduce(reducerMap2);
    bizliDb.dispatch({ type: 'test' });
    bizliDb.selectRoot().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ ...expectedState1, ...expectedState2 });
      done();
    });
  });

  test('BizliDbImpl should dispatch an action without reducer, the action is observable', done => {

  });

  test('BizliDbImpl should dispatch an action with reducer, the action is observable', done => {

  });

  test('BizliDbImpl should select the full state and receive updates on dispatches', done => {

  });

  test('BizliDbImpl should select a sub state and receive updates on dispatches, when that sub state changed only', done => {

  });
});


