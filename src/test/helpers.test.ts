import { combineReducers } from '../helpers';
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
const initialState = {} as State;
const expectedState: State = {
  subState1: {
    value1: 'test1',
  },
  subState2: {
    value2: 'test2',
  },
};

describe('helpers', () => {
  test('combineReducers should combine reducers happy case', () => {
    const combinedReducer = combineReducers(reducerMap);
    const resultingState = combinedReducer(initialState, BizliDbInitAction);

    expect(resultingState).toEqual(expectedState);
  });
});
