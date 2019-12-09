import * as winston from 'winston';
import { Log, Logger } from './model';

export class WinstonLogger implements Logger<winston.LoggerOptions> {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  configure(config: winston.LoggerOptions) {
    this.log({ level: 'debug', name: 'winston-logger ConfigChanged (before)', message: this.stringifyConfig(config) });
    this.logger.configure(config);
    this.log({ level: 'debug', name: 'winston-logger ConfigChanged (after)', message: this.stringifyConfig(config) });
  }

  log(log: Log) {
    this.logger.log({ level: log.level, message: log.message, meta: log.name });
  }

  // TODO: .toString() not working, circular references not either
  private stringifyConfig(config: winston.LoggerOptions) {
    return JSON.stringify({
      levels: config.levels,
      silent: config.silent,
      format: config.format?.toString(),
      level: config.level,
      exitOnError: typeof config.exitOnError === 'function' ? config.exitOnError.toString() : config.exitOnError,
      defaultMeta: config.defaultMeta,
      transports: Array.isArray(config.transports) ? config.transports.map(transport => transport.toString()).join(', ') : config.transports?.toString(),
      exceptionHandlers: config.exceptionHandlers,
    });
  }
}
