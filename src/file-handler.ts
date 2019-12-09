import { AsyncSubject, BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { exhaustMap, filter, map, shareReplay, take, takeUntil, tap, throttleTime } from 'rxjs/operators';
import { createFilePath, fileExists, migrate, readFile, writeFileAtomic } from './helpers';
import { Action, FileHandler, FileHandlerConfig, Logger, TypedAction, VersionedState } from './model';

export class FileHandlerImpl<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>, TLoggerConfig> implements FileHandler<TState, TActionType, TAction> {
  private config: FileHandlerConfig<TState>;
  private file: BehaviorSubject<TState | undefined>;
  private fileLoadLatch: AsyncSubject<void>;
  private readonly destroy: Subject<void>;

  constructor(private logger: Logger<TLoggerConfig>) {
    this.config = {};
    this.file = new BehaviorSubject<TState | undefined>(undefined);
    this.fileLoadLatch = new AsyncSubject();
    this.destroy = new Subject();

    this.file.pipe(
      takeUntil(this.destroy),
      filter(file => !!file),
      throttleTime(1000, undefined, { leading: true, trailing: true }),
      exhaustMap(file =>
        writeFileAtomic(createFilePath(this.config.fileName, this.config.path), JSON.stringify(file)),
      ),
    ).subscribe(() => {
      this.logger.log({ level: 'debug', name: 'file-handler FileWritten', message: '...' });
    }, error => {
      this.logger.log({ level: 'error', message: error.message, name: `file-handler FileWritten: ${error.name}`, stack: error.stack });
    });

    this.fileLoadLatch.next();
    this.fileLoadLatch.complete();
  }

  configure(config: FileHandlerConfig<TState>) {
    this.logger.log({ level: 'debug', name: 'file-handler ConfigChanged (before)', message: JSON.stringify(this.config) });
    this.config = { ...this.config, ...config };
    this.logger.log({ level: 'debug', name: 'file-handler ConfigChanged (after)', message: JSON.stringify(this.config) });
  }

  loadState(): Observable<TState | undefined> {
    this.fileLoadLatch = new AsyncSubject();
    const fileObservable =
      fileExists(createFilePath(this.config.fileName, this.config.path)).pipe(
        exhaustMap(exists => {
          if (exists) {
            if (this.config.migration) {
              return readFile(createFilePath(this.config.fileName, this.config.path)).pipe(
                map(currentFileString => JSON.parse(currentFileString)),
                tap(file => this.logger.log({
                  level: 'info',
                  name: 'file-handler Migration (before)',
                  message: `Starting migration from version ${file.version} to ${this.config.migration?.targetVersion} | ${JSON.stringify(file)}`,
                })),
                map(file => migrate(file, this.config.migration)),
                tap(file => this.logger.log({
                  level: 'info',
                  name: 'file-handler Migration (after)',
                  message: `Finished migration with version ${file.version} | ${JSON.stringify(file)}`,
                })),
                exhaustMap(file =>
                  writeFileAtomic(createFilePath(this.config.fileName, this.config.path), JSON.stringify(file)).pipe(
                    map(() => file),
                  ),
                ),
              );
            }
            return readFile(createFilePath(this.config.fileName, this.config.path)).pipe(
              map(currentFileString => JSON.parse(currentFileString) as TState),
            );
          }
          return of(undefined);
        }),
      ).pipe(shareReplay(1));
    fileObservable.subscribe(file => {
      this.logger.log({ level: 'debug', name: 'file-handler FileLoaded', message: JSON.stringify(file) });
      if (file) {
        this.logger.log({ level: 'debug', name: 'file-handler StateChanged (loadState)', message: JSON.stringify(file) });
        this.file.next(file);
      }
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    }, error => {
      this.logger.log({ level: 'error', message: error.message, name: `file-handler FileLoaded: ${error.name}`, stack: error.stack });
      this.fileLoadLatch.next();
      this.fileLoadLatch.complete();
    });
    return fileObservable;
  }

  saveState(state: TState | undefined) {
    this.fileLoadLatch.pipe(
      take(1),
    ).subscribe(() => {
      this.logger.log({ level: 'debug', name: 'file-handler StateChanged (saveState)', message: JSON.stringify(state) });
      this.file.next(state);
    }, error => {
      this.logger.log({ level: 'error', message: error.message, name: `file-handler StateChanged: ${error.name}`, stack: error.stack });
    });
  }

  dispose() {
    this.fileLoadLatch.next();
    this.fileLoadLatch.complete();
    this.destroy.next();
    this.destroy.complete();
  }
}
