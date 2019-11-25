import * as fs from 'fs';
import * as fsPath from 'path';
import { combineReducers, createFilePath, fileExists, mustBeLogged, mustBeLoggedToConsole, readFile, writeFile } from '../helpers';

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
      }, error => {
        expect(error).not.toBeUndefined();
        done();
      });
    });
  });

  describe('writeFile', () => {
    test('should write existing file', done => {
      writeFile(`${__dirname}/files/write.json`, JSON.stringify({ test: 'test' }), 'utf8').subscribe(() => {
        done();
      });
    });

    test('should write non-existing file', done => {
      const path = `${__dirname}/temp/write.json`;

      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

      writeFile(`${__dirname}/temp/write.json`, JSON.stringify({ test: 'test' }), 'utf8').subscribe(() => {
        done();
      });
    });
  });

  describe('createFilePath', () => {
    test('should return default file path when nothing supplied', () => {
      const expected = fsPath.join(fsPath.resolve(''), 'db.json');
      expect(createFilePath()).toEqual(expected);
    });

    test('should return correct path when using path and fileName', () => {
      const expected = fsPath.join(fsPath.resolve('path'), 'file.json');
      expect(createFilePath('file.json', 'path')).toEqual(expected);
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

});
