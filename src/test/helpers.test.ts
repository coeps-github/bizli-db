import { combineReducers } from '../helpers';
import { ActionReducerMap, Actions, BizliDbActions, BizliDbInitAction } from '../model';

test('combineReducers', () => {
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

  const reducer1 = (action: Actions<BizliDbActions>, state?: Partial<SubState1>) => {
    switch (action.type) {
      case 'BIZLI-DB-INIT': {
        return {
          ...state,
          value1: 'test1',
        };
      }
    }
    return state as SubState1;
  };
  const reducer2 = (action: Actions<BizliDbActions>, state?: Partial<SubState2>) => {
    switch (action.type) {
      case 'BIZLI-DB-INIT': {
        return {
          ...state,
          value2: 'test2',
        };
      }
    }
    return state as SubState2;
  };
  const reducerMap: ActionReducerMap<State, BizliDbActions> = {
    subState1: reducer1,
    subState2: reducer2,
  };
  const initialStateUndefined = undefined;
  const initialStateEmpty: Partial<State> = {};
  const expectedState: State = {
    subState1: {
      value1: 'test1',
    },
    subState2: {
      value2: 'test2',
    },
  };

  const combinedReducer = combineReducers(reducerMap);
  const resultingState1 = combinedReducer(BizliDbInitAction, initialStateUndefined);
  const resultingState2 = combinedReducer(BizliDbInitAction, initialStateEmpty);

  expect(resultingState1).toEqual(expectedState);
  expect(resultingState2).toEqual(expectedState);
});
