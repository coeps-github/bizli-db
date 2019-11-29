import { BizliDbImpl } from './bizli-db';
import { FileHandlerImpl } from './file-handler';
import { Action, BizliDb, BizliDbFactoryConfig, TypedAction, VersionedState } from './model';

export function bizliDbFactory<TState extends VersionedState, TActionType extends string, TAction extends Action | TypedAction<TActionType>>
(config?: BizliDbFactoryConfig<TState, TActionType, TAction>): BizliDb<TState, TActionType, TAction> {
  const bizliDb = new BizliDbImpl<TState, TActionType, TAction>(new FileHandlerImpl<TState, TActionType, TAction>());
  if (config && config.config) {
    bizliDb.configure(config.config);
  }
  if (config && config.reducer) {
    bizliDb.reduce(config.reducer);
  }
  return bizliDb;
}
