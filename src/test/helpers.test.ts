import * as fs from 'fs';
import * as fsPath from 'path';
import { combineReducers, createFilePath, createTempFilePath, fileExists, last, migrate, readFile, renameFile, writeFile, writeFileAtomic } from '../helpers';
import { TypedAction, VersionedState } from '../model';

describe('helpers', () => {

  // TODO: createReducer (sub state)
  // TODO: createReducer (root)
  // TODO: on (sub state)
  // TODO: on (root)

  describe('combineReducers', () => {
    interface State extends VersionedState {
      readonly test1: string;
      readonly test2: string;
    }

    test('should combine reducers into a reducer function', () => {
      const combinedReducer = combineReducers<State, 'test', TypedAction<'test'>>({
        version: 1,
        test1: (state: any) => state,
        test2: (state: any) => state,
      });
      expect(typeof combinedReducer).toBe('function');
      expect(combinedReducer(undefined, { type: 'test' })).toEqual({
        version: 1,
        test1: undefined,
        test2: undefined,
      });
    });

    test('should combine reducers into a reducer function, which extends the given initial state', () => {
      const combinedReducer = combineReducers<State, 'test', TypedAction<'test'>>({
        version: 1,
        test1: (state: any) => state,
        test2: (state: any) => state,
      });
      expect(typeof combinedReducer).toBe('function');
      expect(combinedReducer({ test3: 'test' } as any, { type: 'test' })).toEqual({
        version: 1,
        test1: undefined,
        test2: undefined,
        test3: 'test',
      });
    });

    test('should combine reducers into a reducer function, which uses the version of the given initial state over the action reducer map one', () => {
      const combinedReducer = combineReducers<State, 'test', TypedAction<'test'>>({
        version: 1,
        test1: (state: any) => state,
        test2: (state: any) => state,
      });
      expect(typeof combinedReducer).toBe('function');
      expect(combinedReducer({ version: 10 } as any, { type: 'test' })).toEqual({
        version: 10,
        test1: undefined,
        test2: undefined,
      });
    });
  });

  describe('fileExists', () => {
    test('should detect existing file', done => {
      fileExists(`${__dirname}/files/simple.json`).subscribe(exists => {
        expect(exists).toBeTruthy();
        done();
      });
    });

    test('should detect non-existing file', done => {
      fileExists(`${__dirname}/files/non-existing.json`).subscribe(exists => {
        expect(exists).toBeFalsy();
        done();
      });
    });
  });

  describe('renameFile', () => {
    test('should rename existing file and overwrite non-existing file', done => {
      const oldPath = `${__dirname}/temp/rename.json`;
      const newPath = `${__dirname}/temp/renamed-non-existing.json`;

      if (!fs.existsSync(oldPath)) {
        fs.writeFileSync(oldPath, JSON.stringify({ text: 'please rename me' }), { encoding: 'utf8' });
      }
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }

      renameFile(oldPath, newPath).subscribe(file => {
        const newPathFileJson = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));
        expect(newPathFileJson).toEqual({ text: 'please rename me' });
        done();
      });
    });

    test('should rename existing file and overwrite other existing file', done => {
      const oldPath = `${__dirname}/temp/rename.json`;
      const newPath = `${__dirname}/temp/renamed-existing.json`;

      if (!fs.existsSync(oldPath)) {
        fs.writeFileSync(oldPath, JSON.stringify({ text: 'please rename me' }), { encoding: 'utf8' });
      }
      if (!fs.existsSync(newPath)) {
        fs.writeFileSync(newPath, JSON.stringify({ text: 'please overwrite me' }), { encoding: 'utf8' });
      }

      renameFile(oldPath, newPath).subscribe(file => {
        const newPathFileJson = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));
        expect(newPathFileJson).toEqual({ text: 'please rename me' });
        done();
      });
    });

    test('should not rename non-existing file', done => {
      renameFile(`${__dirname}/files/non-existing.json`, 'utf8').subscribe(() => {
        // Nothing
      }, error => {
        expect(error).not.toBeUndefined();
        done();
      });
    });
  });

  describe('readFile', () => {
    test('should read existing file', done => {
      readFile(`${__dirname}/files/simple.json`, 'utf8').subscribe(file => {
        expect(JSON.parse(file)).toEqual({
          test: 'test',
        });
        done();
      });
    });

    test('should not read non-existing file', done => {
      readFile(`${__dirname}/files/non-existing.json`, 'utf8').subscribe(() => {
        // Nothing
      }, error => {
        expect(error).not.toBeUndefined();
        done();
      });
    });
  });

  describe('writeFile', () => {
    test('should write existing file', done => {
      const path = `${__dirname}/files/write.json`;
      writeFile(path, JSON.stringify({ test: 'test' }), 'utf8').subscribe(() => {
        const newPathFileJson = JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
        expect(newPathFileJson).toEqual({ test: 'test' });
        done();
      });
    });

    test('should write non-existing file', done => {
      const path = `${__dirname}/temp/write.json`;

      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

      writeFile(`${__dirname}/temp/write.json`, JSON.stringify({ test: 'test' }), 'utf8').subscribe(() => {
        const newPathFileJson = JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
        expect(newPathFileJson).toEqual({ test: 'test' });
        done();
      });
    });
  });

  describe('writeFileAtomic', () => {
    test('should write existing file', done => {
      const path = `${__dirname}/files/write.json`;
      writeFileAtomic(path, JSON.stringify({ test: 'test' }), 'utf8').subscribe(() => {
        const newPathFileJson = JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
        expect(newPathFileJson).toEqual({ test: 'test' });
        done();
      });
    });

    test('should write non-existing file', done => {
      const path = `${__dirname}/temp/write.json`;

      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

      writeFileAtomic(`${__dirname}/temp/write.json`, JSON.stringify({ test: 'test' }), 'utf8').subscribe(() => {
        const newPathFileJson = JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
        expect(newPathFileJson).toEqual({ test: 'test' });
        done();
      });
    });

    // TODO: Test Atomicity?
  });

  describe('createFilePath', () => {
    test('should return default file path when nothing supplied', () => {
      const expected = fsPath.join(fsPath.resolve(''), 'db.json');
      expect(createFilePath()).toEqual(expected);
    });

    test('should return correct path when using path and fileName', () => {
      const expected = fsPath.join(fsPath.resolve('/this/is/a/path'), 'file.json');
      expect(createFilePath('file.json', '/this/is/a/path')).toEqual(expected);
    });
  });

  describe('createTempFilePath', () => {
    test('should return temp file path when file has extension', () => {
      const input = fsPath.join(fsPath.resolve('/this/is/a/path'), 'file.extension');
      const expected = fsPath.join(fsPath.resolve('/this/is/a/path'), 'file.temp.extension');
      expect(createTempFilePath(input)).toEqual(expected);
    });

    test('should return temp file path when file has no extension', () => {
      const input = fsPath.join(fsPath.resolve('/this/is/a/path'), 'file');
      const expected = fsPath.join(fsPath.resolve('/this/is/a/path'), 'file.temp');
      expect(createTempFilePath(input)).toEqual(expected);
    });
  });

  describe('last', () => {
    test('should return undefined when undefined is input', () => {
      expect(last(undefined)).toBeUndefined();
    });

    test('should return undefined when array without any element is input', () => {
      expect(last([])).toBe(undefined);
    });

    test('should return last element of array with single element', () => {
      expect(last([1])).toBe(1);
    });

    test('should return last element of array with multiple elements', () => {
      expect(last([1, 2, 3, 4, 5])).toBe(5);
    });
  });

  describe('migrate', () => {
    test('should return the same state when no migration is supplied', () => {
      const state = { version: 1, test: 'test' };
      expect(migrate(state)).toBe(state);
    });

    test('should return correct state with single migration function', () => {
      const state = { version: 1, test: 'test' };
      expect(migrate(state, {
        targetVersion: 2,
        1: (s) => ({ ...s, version: 2 }),
      })).toEqual({ ...state, version: 2 });
    });

    test('should return correct state with multiple migration functions', () => {
      const state = { version: 1, test: 'test' };
      expect(migrate(state, {
        targetVersion: 3,
        1: (s) => ({ ...s, version: 2 }),
        2: (s) => ({ ...s, version: 3 }),
      })).toEqual({ ...state, version: 3 });
    });

    test('should return correct state with multiple migration functions and big version gaps', () => {
      const state = { version: 1, test: 'test' };
      expect(migrate(state, {
        targetVersion: 100,
        1: (s) => ({ ...s, version: 28 }),
        28: (s) => ({ ...s, version: 94 }),
        94: (s) => ({ ...s, version: 100 }),
      })).toEqual({ ...state, version: 100 });
    });

    test('should return correct state with multiple migration functions and not using all of them', () => {
      const state = { version: 1, test: 'test' };
      expect(migrate(state, {
        targetVersion: 100,
        1: (s) => ({ ...s, version: 94 }),
        28: (s) => ({ ...s, version: 94 }),
        94: (s) => ({ ...s, version: 100 }),
      })).toEqual({ ...state, version: 100 });
    });

    test('should fail when migration with future targetVersion but no migration functions', () => {
      const state = { version: 1, test: 'test' };
      expect(() => migrate(state, { targetVersion: 30 })).toThrow();
    });

    test('should fail when migration with future targetVersion and single migration function', () => {
      const state = { version: 1, test: 'test' };
      expect(() => migrate(state, { targetVersion: 30, 1: (s) => ({ ...s, version: 2 }) })).toThrow();
    });

    test('should fail when migration with past targetVersion and single migration function', () => {
      const state = { version: 1, test: 'test' };
      expect(() => migrate(state, { targetVersion: 0, 1: (s) => ({ ...s, version: 2 }) })).toThrow();
    });

    test('should fail when migration with future targetVersion and multiple migration functions', () => {
      const state = { version: 1, test: 'test' };
      expect(() => migrate(state, {
        targetVersion: 30,
        1: (s) => ({ ...s, version: 2 }),
        2: (s) => ({ ...s, version: 3 }),
      })).toThrow();
    });
  });

});
