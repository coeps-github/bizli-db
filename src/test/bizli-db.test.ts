import { take } from 'rxjs/operators';
import { BizliDbImpl } from '../bizli-db';
import { ActionReducerMap, Actions, BizliDbActions, BizliDbInitAction } from '../model';

interface State {
  subState1: SubState1,
  subState2: SubState2
}

interface SubState1 {
  value1: string
}

interface SubState2 {
  value2: string
}

const reducer1 = (state = {} as SubState1, action: Actions<BizliDbActions>) => {
  switch (action.type) {
    case 'BIZLI-DB-INIT': {
      return {
        ...state,
        value1: 'test1',
      };
    }
  }
  return state;
};
const reducer2 = (state = {} as SubState2, action: Actions<BizliDbActions>) => {
  switch (action.type) {
    case 'BIZLI-DB-INIT': {
      return {
        ...state,
        value2: 'test2',
      };
    }
  }
  return state;
};
const reducerMap: ActionReducerMap<State, BizliDbActions> = {
  subState1: reducer1,
  subState2: reducer2,
};
const expectedState: State = {
  subState1: {
    value1: 'test1',
  },
  subState2: {
    value2: 'test2',
  },
};
const expectedSubState1: SubState1 = {
  value1: 'test1',
};
const expectedSubState2: SubState2 = {
  value2: 'test2',
};

describe('bizli-db', () => {
  test('BizliDbImpl should add a single reducer including initialState', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce((state = { value: 'hoi' }) => state);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ value: 'hoi' });
      done();
    });
  });

  test('BizliDbImpl should add multiple single reducer without state reset', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce((state = { value: 'hoi' }) => state);
    bizliDb.reduce((state = { value: 'du' }) => state);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ value: 'hoi' });
      done();
    });
  });

  test('BizliDbImpl should add multiple single reducer with state reset', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce((state = { value: 'hoi' }) => state);
    bizliDb.reduce((state = { value: 'du' }) => state, true);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ value: 'du' });
      done();
    });
  });

  test('BizliDbImpl should add a single reducer including initialState by init action', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducer1);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedSubState1);
      done();
    });
  });

  test('BizliDbImpl should add multiple single reducer including initialState by init action without state reset', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducer1);
    bizliDb.reduce(reducer2);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedSubState1);
      done();
    });
  });

  test('BizliDbImpl should add multiple single reducer including initialState by init action with state reset', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducer1);
    bizliDb.reduce(reducer2, true);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedSubState2);
      done();
    });
  });

  test('BizliDbImpl should add multiple single reducer including initialState by init action including after each reducer switch without state reset', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducer1);
    bizliDb.reduce(reducer2);
    bizliDb.dispatch(BizliDbInitAction);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ ...expectedSubState1, ...expectedSubState2 });
      done();
    });
  });

  test('BizliDbImpl should add a reducer map including initialState by init action', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce(reducerMap);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual(expectedState);
      done();
    });
  });

  test('BizliDbImpl should dispatch an action without reducer, the action is observable', () => {

  });

  test('BizliDbImpl should dispatch an action with reducer, the action is observable', () => {

  });

  test('BizliDbImpl should select the full state and receive updates on dispatches', () => {

  });

  test('BizliDbImpl should select a sub state and receive updates on dispatches, when that sub state changed only', () => {

  });
});


