import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { JsHbLogLevel, ConsoleLike, JsHbLogger } from './js-hb-config';
import { set as lodashSet, get as lodashGet, has as lodashHas, mergeWith as lodashMergeWith, keys as lodashKeys, clone as lodashClone } from 'lodash';
import { JsHbContants } from './js-hb-constants';
import { NgJsHbDecorators } from './js-hb-decorators';
import { JsHbBackendMetadatas } from './js-hb-backend-metadatas';

export class JsHbSetCreator<T> {

    private consoleLike: ConsoleLike;
    constructor(private _session: IJsHbSession,
            private _refererObj: any,
            private _refererKey: string) {
        const thisLocal = this;
        if (!_session) {
            throw new Error('_session can not be null');
        }
        if (!_refererObj) {
            throw new Error('_refererObj can not be null');
        }
        if (!_session) {
            throw new Error('_session can not be null');
        }
        thisLocal.consoleLike = _session.jsHbManager.jsHbConfig.getConsole(JsHbLogger.JsHbSetCreator);
        if (thisLocal.consoleLike.enabledFor(JsHbLogLevel.Trace)) {
            thisLocal.consoleLike.group('JsHbSetCreator.constructor()');
            thisLocal.consoleLike.debug(_session as any as string); thisLocal.consoleLike.debug(_refererObj as any as string); thisLocal.consoleLike.debug(_refererKey as any as string);
            thisLocal.consoleLike.groupEnd();
        }
    }

    public createByProxy(): Set<T> {
        const thisLocal = this;
        let getFunction: (target: Set<T>, p: PropertyKey, receiver: any) => any = (target: Set<T>, p: PropertyKey, receiver: any) => {
            if (p) {
                if (thisLocal.consoleLike.enabledFor(JsHbLogLevel.Trace)) {
                    thisLocal.consoleLike.group('JsHbSetCreator => getFunction. Intercepting:');
                    thisLocal.consoleLike.debug(target);
                    thisLocal.consoleLike.debug(p);
                    //thisLocal.consoleLike.debug(receiver);
                    thisLocal.consoleLike.groupEnd();
                }
                if (p === 'add') {
                    let proxyGet = (value: T): Set<T> => {
                        this.add(target, value);
                        return target.add(value);
                    };
                    return proxyGet;
                } else if (p === 'delete') {
                    let proxyDelete = (value: T): boolean => {
                        this.add(target, value);
                        return target.delete(value);
                    };
                    return proxyDelete;
                } else if (p === 'clear') {
                    let proxyClear = (): void => {
                        target.forEach(
                            (value: T) => {
                                this.delete(target, value);
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
    }

    add(targetSet: Set<T>, value: T): void {
        let propertyOptions: NgJsHbDecorators.PropertyOptions<T> = Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, this.refererObj, this.refererKey);
        if (!propertyOptions){
            throw new Error('@NgJsHbDecorators.property() not defined for ' + this.refererObj.constructor.name + '.' + this.refererKey);
        }
        if (propertyOptions.persistent) {
            let isOnlazyLoad: any = lodashGet(targetSet, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME);
            if (!this.session.isOnRestoreEntireStateFromLiteral() && !isOnlazyLoad) {
                if (!this.session.isRecording()){
                    throw new Error('Invalid operation. It is not recording. Is this Error correct?!');
                }
                let allMD = this.session.resolveMetadatas({object: value, refererObject: this.refererObj, key: this.refererKey});
                let mdRefererObj = allMD.refererObjMd;
                let mdValue = allMD.objectMd;
                
                //recording playback
                let action: JsHbPlaybackAction = new JsHbPlaybackAction();
                action.fieldName = this.refererKey;
                action.actionType = JsHbPlaybackActionType.CollectionAdd;
                if (mdRefererObj.$signature$) {
                    action.ownerSignatureStr = mdRefererObj.$signature$;
                } else if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.ownerCreationRefId = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else if (!mdRefererObj.$isComponentHibernateId$) {
                    throw new Error('The proprerty \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' has a not managed owner');
                }
    
                if (value != null) {
                    if (mdValue.$signature$) {
                        action.settedSignatureStr = mdValue.$signature$;
                    } else if (lodashHas(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                        action.settedCreationRefId = lodashGet(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                    } else {
                        throw new Error('The proprerty \'' + this.refererKey + ' of \'' + this.refererObj.constructor.name + '\'.  value not managed owner: \'' + value.constructor.name + '\'');
                    }
                }
                this.session.addPlaybackAction(action);
            }
        }
    }

    delete(targetSet: Set<T>, value: T): void {
        let propertyOptions: NgJsHbDecorators.PropertyOptions<T> = Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, this.refererObj, this.refererKey);
        if (!propertyOptions){
            throw new Error('@NgJsHbDecorators.property() not defined for ' + this.refererObj.constructor.name + '.' + this.refererKey);
        }
        if (propertyOptions.persistent) {
            let isOnlazyLoad: any = lodashGet(targetSet, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME);
            if (!this.session.isOnRestoreEntireStateFromLiteral() && !isOnlazyLoad) {
                if (!this.session.isRecording()){
                    throw new Error('Invalid operation. It is not recording. Is this Error correct?!');
                }
                let allMD = this.session.resolveMetadatas({object: value, refererObject: this.refererObj, key: this.refererKey});
                let mdRefererObj = allMD.refererObjMd;
                let mdValue = allMD.objectMd;

                //recording playback
                let action: JsHbPlaybackAction = new JsHbPlaybackAction();
                action.fieldName = this.refererKey;
                action.actionType = JsHbPlaybackActionType.CollectionRemove;
                if (mdRefererObj.$signature$) {
                    action.ownerSignatureStr = mdRefererObj.$signature$;
                } else if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.ownerCreationRefId = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else {
                    throw new Error('The proprerty \'' + this.refererKey + ' of \'' + this.refererObj.constructor + '\' has a not managed owner');
                }
                if (value != null) {
                    if (mdValue.$signature$) {
                        action.settedSignatureStr = mdValue.$signature$;
                    } else if (lodashHas(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                        action.settedCreationRefId = lodashGet(value, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                    } else {
                        throw new Error('The proprerty \'' + this.refererKey + ' of \'' + this.refererObj.constructor + '\'. not managed value: \'' + value.constructor.name + '\'');
                    }
                }
    
                this.session.addPlaybackAction(action);
            }
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