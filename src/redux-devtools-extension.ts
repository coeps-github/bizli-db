// @ts-ignore
import { connect } from 'remotedev/lib/devTools';
import { parse } from './helpers';
import {
  Action,
  Logger,
  ReduxDevToolsExtension,
  ReduxDevToolsExtensionAction,
  ReduxDevToolsExtensionConfig,
  ReduxDevToolsExtensionRemoteDevConfig,
  TypedAction,
  VersionedState,
} from './model';

export class ReduxDevtoolsExtensionImpl<TState extends VersionedState,
  TActionType extends string,
  TAction extends Action | TypedAction<TActionType>,
  TLoggerConfig> implements ReduxDevToolsExtension<TState, TActionType, TAction> {
  private getState: (() => TState | undefined) | undefined;
  private updateState: ((state: TState | undefined) => void) | undefined;
  private dispatchAction: ((action: TAction) => void) | undefined;
  private extension: any | undefined;

  constructor(private logger: Logger<TLoggerConfig>) {
  }

  configure(config: ReduxDevToolsExtensionConfig) {
    this.logger.log({ level: 'debug', name: 'redux-devtools-extension ConfigChanged (before)', message: JSON.stringify(config) });
    this.dispose();
    if (config.enabled) {
      this.createExtension(config.remotedev);
    }
    this.logger.log({ level: 'debug', name: 'redux-devtools-extension ConfigChanged (after)', message: JSON.stringify(config) });
  }

  send(action: TAction, state: TState | undefined) {
    this.logger.log({ level: 'debug', name: 'redux-devtools-extension SendToExtension', message: `${JSON.stringify(action)} -> ${JSON.stringify(state)}` });
    if (this.extension) {
      this.extension.send(action.type, state);
    }
  }

  receive(getState: () => TState | undefined, updateState: (state: TState | undefined) => void, dispatchAction: (action: TAction) => void) {
    this.logger.log({ level: 'debug', name: 'redux-devtools-extension ReceiverChanged', message: '...' });
    this.getState = getState;
    this.updateState = updateState;
    this.dispatchAction = dispatchAction;
  }

  dispose() {
    if (this.extension) {
      this.extension.unsubscribe();
    }
  }

  private createExtension(config?: ReduxDevToolsExtensionRemoteDevConfig) {
    this.extension = connect(config);
    if (this.extension) {
      this.extension.subscribe((message: ReduxDevToolsExtensionAction<TState>) => {
        const state = message.state && parse(message.state);
        const action = !message.action || typeof message.action === 'string' ? { type: message.action } : message.action;
        const payload = !message.payload || typeof message.payload === 'string' ? { type: message.payload } : message.payload;
        this.logger.log({
          level: 'debug',
          name: 'redux-devtools-extension ReceivedFromExtension',
          message: `${JSON.stringify(message.type)} -> ${payload.type} -> ${JSON.stringify(state)}`,
        });
        if (message.type === 'DISPATCH') {
          switch (action.type || payload.type) {
            case 'RESET':
              if (this.updateState) {
                this.updateState(undefined);
                this.extension.init(undefined);
              }
              return;
            case 'COMMIT':
              if (this.updateState && this.getState) {
                const currState = this.getState();
                this.updateState(currState);
                this.extension.init(currState);
              }
              return;
            case 'ROLLBACK':
              if (this.updateState) {
                this.updateState(state);
                this.extension.init(state);
              }
              return;
            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
              if (this.updateState) {
                this.updateState(state);
              }
              return;
            case 'TOGGLE_ACTION':
              // TODO: TOGGLE_ACTION
              return;
            case 'IMPORT_STATE': {
              // TODO: IMPORT_STATE
              return;
            }
          }
        } else if (message.type === 'ACTION') {
          if (this.dispatchAction) {
            this.dispatchAction(action as TAction);
          }
        }
      });
      this.extension.init();
    }
  }
}
