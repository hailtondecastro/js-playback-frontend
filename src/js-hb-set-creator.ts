import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { JsHbLogLevel } from './js-hb-config';
import { set as lodashSet, get as lodashGet, has as lodashHas, mergeWith as lodashMergeWith, keys as lodashKeys, clone as lodashClone } from 'lodash';
import { JsHbContants } from './js-hb-constants';
import { NgJsHbDecorators } from './js-hb-decorators';
import { JsHbBackendMetadatas } from './js-hb-backend-metadatas';

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
        
        // setResult.add = newAdd;
        // setResult.delete = newDelete;
        // setResult.clear = newClear;
        
        // return setResult;
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
                let backendMetadatasRefererObj = allMD.refererObjMD;
                let backendMetadatasValue = allMD.objectMD;
                // let backendMetadatasRefererObj: JsHbBackendMetadatas = { $iAmJsHbBackendMetadatas$: true };
                // if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                //     backendMetadatasRefererObj = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                // }
                // let backendMetadatasValue: JsHbBackendMetadatas = { $iAmJsHbBackendMetadatas$: true };
                // if (value && lodashHas(value, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                //     backendMetadatasValue = lodashGet(value, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                // }
                
                //gravando o playback
                let action: JsHbPlaybackAction = new JsHbPlaybackAction();
                action.fieldName = this.refererKey;
                action.actionType = JsHbPlaybackActionType.CollectionAdd;
                //if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                if (backendMetadatasRefererObj.$signature$) {
                    action.ownerSignatureStr = backendMetadatasRefererObj.$signature$;
                } else if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.ownerCreationRefId = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else if (!backendMetadatasRefererObj.$isComponentHibernateId$) {
                    throw new Error('The proprerty \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' has a not managed owner');
                }
    
                if (value != null) {
                    //if (lodashHas(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                    if (backendMetadatasValue.$signature$) {
                        //action.settedSignatureStr = lodashGet(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                        action.settedSignatureStr = backendMetadatasValue.$signature$;
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
                let backendMetadatasRefererObj = allMD.refererObjMD;
                let backendMetadatasValue = allMD.objectMD;

                // let backendMetadatasRefererObj: JsHbBackendMetadatas = { $iAmJsHbBackendMetadatas$: true };
                // if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                //     backendMetadatasRefererObj = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                // }
                // let backendMetadatasValue: JsHbBackendMetadatas = { $iAmJsHbBackendMetadatas$: true };
                // if (value && lodashHas(value, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                //     backendMetadatasValue = lodashGet(value, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                // }

                //gravando o playback
                let action: JsHbPlaybackAction = new JsHbPlaybackAction();
                action.fieldName = this.refererKey;
                action.actionType = JsHbPlaybackActionType.CollectionRemove;
                //if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                if (backendMetadatasRefererObj.$signature$) {
                    //action.ownerSignatureStr = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                    action.ownerSignatureStr = backendMetadatasRefererObj.$signature$;
                } else if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.ownerCreationRefId = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else {
                    throw new Error('The proprerty \'' + this.refererKey + ' of \'' + this.refererObj.constructor + '\' has a not managed owner');
                }
                if (value != null) {
                    //if (lodashHas(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                    if (backendMetadatasValue.$signature$) {
                        //action.settedSignatureStr = lodashGet(value, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                        action.settedSignatureStr = backendMetadatasValue.$signature$;
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