import * as winston from 'winston';
import { BizliDbImpl } from './bizli-db';
import { FileHandlerImpl } from './file-handler';
import { Action, BizliDb, BizliDbFactoryConfig, TypedAction, VersionedState } from './model';
import { ReduxDevtoolsExtensionImpl } from './redux-devtools-extension';
import { WinstonLogger } from './winston-logger';

export function bizliDbFactory<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>
(config?: BizliDbFactoryConfig<TState, TActionType, TAction>): BizliDb<TState, TActionType, TAction> {
  const logger = new WinstonLogger();
  const reduxDevToolsExtension = new ReduxDevtoolsExtensionImpl<TState, TActionType, TAction, winston.LoggerOptions>(logger);
  const fileHandler = new FileHandlerImpl<TState, TActionType, TAction, winston.LoggerOptions>(logger);
  const bizliDb = new BizliDbImpl<TState, TActionType, TAction, winston.LoggerOptions>(fileHandler, reduxDevToolsExtension, logger);
  const conf = config && config.config;
  if (conf?.loggerConfig) {
    logger.configure(conf.loggerConfig);
  }
  if (conf?.reduxDevToolsExtensionConfig) {
    reduxDevToolsExtension.configure(conf.reduxDevToolsExtensionConfig);
  }
  if (conf?.fileHandlerConfig) {
    fileHandler.configure(conf.fileHandlerConfig);
  }
  if (conf?.bizliDbConfig) {
    bizliDb.configure(conf.bizliDbConfig);
  }
  if (config?.reducer) {
    bizliDb.reduce(config.reducer);
  }
  bizliDb.loadState();
  return bizliDb;
}
