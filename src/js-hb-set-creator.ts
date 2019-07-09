import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { JsHbLogLevel } from './js-hb-config';

export class JsHbSetCreator<T> {

    constructor(private _session: IJsHbSession,
        private _refererObj: any,
        private _refererKey: string) {
            if (!_session) {
                throw new Error('_session can not be null');
            }
            if (!_refererObj) {
                throw new Error('_refererObj can not be null');
            }
            if (!_session) {
                throw new Error('_session can not be null');
            }
            if (JsHbLogLevel.Debug >= _session.jsHbManager.jsHbConfig.logLevel) {
                console.group('JsHbSetCreator.constructor()');
                console.debug(_session as any as string); console.debug(_refererObj as any as string); console.debug(_refererKey as any as string);
                console.groupEnd();
            }
        }

    public createByProxy(): Set<T> {

        let getFunction: (target: Set<T>, p: PropertyKey, receiver: any) => any = (target: Set<T>, p: PropertyKey, receiver: any) => {
            if (p) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.group('JsHbSetCreator => getFunction. Intercepting:');
                    console.debug(target); console.debug(p); console.debug(receiver); console.groupEnd();
                }
                if (p === 'add') {
                    let proxyGet = (value: T): Set<T> => {
                        this.add(value);
                        return target.add(value);
                    };
                    return proxyGet;
                } else if (p === 'delete') {
                    let proxyDelete = (value: T): boolean => {
                        this.add(value);
                        return target.delete(value);
                    };
                    return proxyDelete;
                } else if (p === 'clear') {
                    let proxyClear = (): void => {
                        target.forEach(
                            (value: T) => {
                                this.delete(value);
                            });
                        target.clear();
                    };
                    return proxyClear;
                } else if ((target as any)[p] && (target as any)[p] instanceof Function) {
                    return (argArray?: any): any => { 
                        return (target as any)[p](argArray);
                    };
                } else {
                    return (target as any)[p];
                }
            } else {
                return undefined;
            }
        };

        return new Proxy(
            new Set<T>(),
            {
                get: getFunction
            }
        );
        
        // setResult.add = newAdd;
        // setResult.delete = newDelete;
        // setResult.clear = newClear;
        
        // return setResult;
    }

    add(value: T): void {
        if (this.session.isRecording()) {
            //gravando o playback
            let action: JsHbPlaybackAction = new JsHbPlaybackAction();
            action.fieldName = this.refererKey;
            action.actionType = JsHbPlaybackActionType.CollectionAdd;
            if (_.has(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                action.ownerSignatureStr = _.get(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
            } else if (_.has(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                action.ownerCreationRefId = _.get(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
            } else {
                throw new Error('The proprerty \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' has a not managed owner');
            }

            if (value != null) {
                if (_.has(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                    action.settedSignatureStr = _.get(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                } else if (_.has(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.settedCreationRefId = _.get(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else {
                    throw new Error('The proprerty \'' + this.refererKey + ' de \'' + this.refererObj.constructor.name + '\'.  value not managed owner: \'' + value.constructor.name + '\'');
                }
            }
            this.session.addPlaybackAction(action);
        }
    }

    delete(value: T): void {
        if (this.session.isRecording()) {
            //gravando o playback
            let action: JsHbPlaybackAction = new JsHbPlaybackAction();
            action.fieldName = this.refererKey;
            action.actionType = JsHbPlaybackActionType.CollectionRemove;
            if (_.has(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                action.ownerSignatureStr = _.get(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
            } else if (_.has(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                action.ownerCreationRefId = _.get(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
            } else {
                throw new Error('The proprerty \'' + this.refererKey + ' de \'' + this.refererObj.constructor + '\' has a not managed owner');
            }

            if (value != null) {
                if (_.has(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                    action.settedSignatureStr = _.get(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                } else if (_.has(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.settedCreationRefId = _.get(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else {
                    throw new Error('The proprerty \'' + this.refererKey + ' de \'' + this.refererObj.constructor + '\'. not managed value: \'' + value.constructor.name + '\'');
                }
            }

            this.session.addPlaybackAction(action);
        }
    }



    /**
     * Getter session
     * @return {IJsHbSession}
     */
    public get session(): IJsHbSession {
        return this._session;
    }

    /**
     * Setter session
     * @param {IJsHbSession} value
     */
    public set session(value: IJsHbSession) {
        this._session = value;
    }


    /**
     * Getter refererObj
     * @return {any}
     */
    public get refererObj(): any {
        return this._refererObj;
    }

    /**
     * Setter refererObj
     * @param {any} value
     */
    public set refererObj(value: any) {
        this._refererObj = value;
    }

    /**
     * Getter refererKey
     * @return {string}
     */
    public get refererKey(): string {
        return this._refererKey;
    }

    /**
     * Setter refererKey
     * @param {string} value
     */
    public set refererKey(value: string) {
        this._refererKey = value;
    }

}