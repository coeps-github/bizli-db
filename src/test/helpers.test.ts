import * as fs from 'fs';
import * as fsPath from 'path';
import {
  combineReducers,
  createFilePath,
  createTempFilePath,
  fileExists,
  last,
  mustBeLogged,
  mustBeLoggedToConsole,
  readFile,
  renameFile,
  writeFile,
  writeFileAtomic,
} from '../helpers';

describe('helpers', () => {

  describe('combineReducers', () => {
    test('should combine reducers into a reducer function', () => {
      const combinedReducer = combineReducers({
        test1: (state: any) => state,
        test2: (state: any) => state,
      });
      expect(typeof combinedReducer).toBe('function');
      expect(combinedReducer(undefined, { type: 'test' })).toEqual({
        test1: undefined,
        test2: undefined,
      });
    });

    test('should combine reducers into a reducer function, which extends the given initial state', () => {
      const combinedReducer = combineReducers({
        test1: (state: any) => state,
        test2: (state: any) => state,
      });
      expect(typeof combinedReducer).toBe('function');
      expect(combinedReducer({ test3: 'test' } as any, { type: 'test' })).toEqual({
        test1: undefined,
        test2: undefined,
        test3: 'test',
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

  describe('mustBeLogged', () => {
    test('should return true when error log, no matter the level in config', () => {
      expect(mustBeLogged('error', { logLevel: 'error' })).toBeTruthy();
      expect(mustBeLogged('error', { logLevel: 'info' })).toBeTruthy();
      expect(mustBeLogged('error', {})).toBeTruthy();
      expect(mustBeLogged('error', { logLevel: 'debug' })).toBeTruthy();
    });

    test('should return true when info log, for error and info (= undefined) level in config', () => {
      expect(mustBeLogged('info', { logLevel: 'error' })).toBeFalsy();
      expect(mustBeLogged('info', { logLevel: 'info' })).toBeTruthy();
      expect(mustBeLogged('info', {})).toBeTruthy();
      expect(mustBeLogged('info', { logLevel: 'debug' })).toBeTruthy();
    });

    test('should return true when debug log, for debug level in config', () => {
      expect(mustBeLogged('debug', { logLevel: 'error' })).toBeFalsy();
      expect(mustBeLogged('debug', { logLevel: 'info' })).toBeFalsy();
      expect(mustBeLogged('debug', {})).toBeFalsy();
      expect(mustBeLogged('debug', { logLevel: 'debug' })).toBeTruthy();
    });
  });

  describe('mustBeLoggedToConsole', () => {
    test('should return true when error log, no matter the level in config, and logToConsole true', () => {
      expect(mustBeLoggedToConsole('error', { logLevel: 'error', logToConsole: true })).toBeTruthy();
      expect(mustBeLoggedToConsole('error', { logLevel: 'info', logToConsole: true })).toBeTruthy();
      expect(mustBeLoggedToConsole('error', { logToConsole: true })).toBeTruthy();
      expect(mustBeLoggedToConsole('error', { logLevel: 'debug', logToConsole: true })).toBeTruthy();
    });

    test('should return true when info log, for error and info (= undefined) level in config, and logToConsole true', () => {
      expect(mustBeLoggedToConsole('info', { logLevel: 'error', logToConsole: true })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'info', logToConsole: true })).toBeTruthy();
      expect(mustBeLoggedToConsole('info', { logToConsole: true })).toBeTruthy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'debug', logToConsole: true })).toBeTruthy();
    });

    test('should return true when debug log, for debug level in config, and logToConsole true', () => {
      expect(mustBeLoggedToConsole('debug', { logLevel: 'error', logToConsole: true })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'info', logToConsole: true })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logToConsole: true })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'debug', logToConsole: true })).toBeTruthy();
    });

    test('should return false no mattter the log level, no matter the level in config, and logToConsole false or undefined', () => {
      expect(mustBeLoggedToConsole('error', { logLevel: 'error', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('error', { logLevel: 'info', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('error', { logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('error', { logLevel: 'debug', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'error', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'info', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'debug', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'error', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'info', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'debug', logToConsole: false })).toBeFalsy();
      expect(mustBeLoggedToConsole('error', { logLevel: 'error' })).toBeFalsy();
      expect(mustBeLoggedToConsole('error', { logLevel: 'info' })).toBeFalsy();
      expect(mustBeLoggedToConsole('error', {})).toBeFalsy();
      expect(mustBeLoggedToConsole('error', { logLevel: 'debug' })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'error' })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'info' })).toBeFalsy();
      expect(mustBeLoggedToConsole('info', {})).toBeFalsy();
      expect(mustBeLoggedToConsole('info', { logLevel: 'debug' })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'error' })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'info' })).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', {})).toBeFalsy();
      expect(mustBeLoggedToConsole('debug', { logLevel: 'debug' })).toBeFalsy();
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

  // TODO: migrate

});
