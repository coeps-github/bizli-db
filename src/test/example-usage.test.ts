import { skip, take } from 'rxjs/operators';
import * as winston from 'winston';
import { bizliDbFactory } from '../bizli-db-factory';
import { createReducer, on } from '../helpers';
import { ActionReducerMap, Config, TypedAction } from '../model';

describe('example-usage', () => {

  test('should describe the example usage', done => {

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

    const config: Config<State, winston.LoggerOptions> = {
      // default bizli-db config
      bizliDbConfig: {},
      // default file handler config
      fileHandlerConfig: {
        fileName: 'db.json',
        path: '',
        // example migration config (default undefined)
        migration: {
          targetVersion: 1,
          // migrate from version 0 to version 1
          0: (state: any) => ({
            ...state,
            version: 1,
          }),
        },
      },
      // default logger config
      loggerConfig: {
        level: 'debug', // default info
        format: winston.format.json(),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: 'combined.log' }),
        ],
      },
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
      version: 0,
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
        expect(person.firstName).toBe('Franz');
        expect(person.lastName).toBe('Hugentobler');
      });

    bizliDb.select(state => state?.pet, (a, b) => a?.name === b?.name)
      .pipe(skip(1))
      .subscribe(pet => {
        expect(pet.name).toBe('Müüsli');
      });

    bizliDb.dispatch({ type: 'ChangePersonNameAction', firstName: 'Franz', lastName: 'Hugentobler' });
    bizliDb.dispatch({ type: 'ChangePetNameAction', name: 'Müüsli' });

  }, 99999999);

});
