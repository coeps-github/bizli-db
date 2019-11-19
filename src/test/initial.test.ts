import { whereTheNameComesFrom } from '../index';

test('whereTheNameComesFrom', () => {
  expect(whereTheNameComesFrom()).toBe('bizli-db = only a little bit db, in swiss german');
});
