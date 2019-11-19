import { whereTheNameComesFrom } from '../index';

test('My Greeter', () => {
  expect(whereTheNameComesFrom()).toBe('bizli-db = only a little bit db, in swiss german');
});
