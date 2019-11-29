# bizli-db

simple and small in memory database with json file persistence.

based on redux/ngrx principles:
- state
- actions
- reducers

because of the persistence, the store is versioned and can be migrated.

## install

npm install @coeps/bizli-db --save

## usage

```typescript

import { take, skip } from 'rxjs/operators';
import {
  ActionReducerMap,
  bizliDbFactory,
  Config,
  createReducer,
  on,
  TypedAction
} from '@coeps/bizli-db';

interface State {
  readonly version: number;
  readonly person: PersonState;
  readonly pet: PetState;
}

type ActionType = 'ChangePersonNameAction' | 'ChangePetNameAction';

type Actions = PersonActions | PetActions;

type PersonActions = ChangePersonNameAction;
type PetActions = ChangePetNameAction;

interface ChangePersonNameAction extends TypedAction<ActionType> {
  readonly type: 'ChangePersonNameAction';
  readonly firstName: string;
  readonly lastName: string;
}

interface ChangePetNameAction extends TypedAction<ActionType> {
  readonly type: 'ChangePetNameAction';
  readonly name: string;
}

interface PersonState {
  readonly firstName: string;
  readonly lastName: string;
  readonly street: string;
  readonly zip: number;
  readonly city: string;
}

interface PetState {
  readonly name: string;
  readonly species: string;
}

// TODO: add config
const config: Config<State> = {
  logLevel: 'debug',
  logToConsole: true,
};

const initialPersonState = {
  firstName: 'Fritzli',
  lastName: 'Abächerli',
  street: 'Lücherli',
  zip: 8857,
  city: 'Vorderthal',
};

const initialPetState = {
  name: 'Chätzli',
  species: 'Cat',
};

const personReducer = createReducer<PersonState, ActionType, PersonActions, Actions>(initialPersonState, on((state, action): PersonState => {
  return {
    ...state,
    firstName: action.firstName,
    lastName: action.lastName,
  } as PersonState;
}, 'ChangePersonNameAction'));

const petReducer = createReducer<PetState, ActionType, PetActions, Actions>(initialPetState, on((state, action) => {
  return {
    ...state,
    name: action.name,
  } as PetState;
}, 'ChangePetNameAction'));

const reducer: ActionReducerMap<State, ActionType, Actions> = {
  version: 1234,
  person: personReducer,
  pet: petReducer,
};

const bizliDb = bizliDbFactory<State, ActionType, Actions>({
  config,
  reducer, // either reducer function or reducer map
});

bizliDb.select(state => state?.person, (a, b) => a?.lastName === b?.lastName)
  .pipe(take(1))
  .subscribe(person => {
    // TODO: do stuff
  });

bizliDb.select(state => state?.pet, (a, b) => a?.name === b?.name)
  .pipe(skip(1))
  .subscribe(pet => {
    // TODO: do stuff
  });

bizliDb.dispatch({ type: 'ChangePersonNameAction', firstName: 'Franz', lastName: 'Hugentobler' });
bizliDb.dispatch({ type: 'ChangePetNameAction', name: 'Müüsli' });

```

## migration


