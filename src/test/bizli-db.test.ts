import { take } from 'rxjs/operators';
import { BizliDbImpl } from '../bizli-db';
import { ActionReducerMap, Actions, BizliDbActions } from '../model';

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
const initialState = {} as State;
const initialSubState1 = {} as SubState1;
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

describe('bizli-db', () => {
  test('BizliDbImpl should add a single reducer including initialState', done => {
    const bizliDb = new BizliDbImpl();
    bizliDb.reduce((state = { value: 'hoi' }) => state);
    bizliDb.select().pipe(take(1)).subscribe(state => {
      expect(state).toEqual({ value: 'hoi' });
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


