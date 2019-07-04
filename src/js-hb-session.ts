import { GenericNode, GenericTokenizer } from './generic-tokenizer';
import { LazyRefMTO, LazyRefBase } from './lazy-ref';
import { IJsHbManager } from './js-hb-manager';
import { Type } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { MergeWithCustomizer } from 'lodash';
import { Subject, Subscription } from 'rxjs';
import { PartialObserver } from 'rxjs/Observer';
import { JsHbContants } from './js-hb-constants';
import { JsHbPlayback } from './js-hb-playback';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { JsHbSetCreator } from './js-hb-set-creator';
import { JSONHelper } from './json-helper';
import { JsHbLogLevel } from './js-hb-config';

export interface IJsHbSession {
    //loadLazyRef<L, I>(literalJsObject: any, genericNode: GenericNode): LazyRef<L, I>;
    jsHbManager: IJsHbManager;
    //cacheLazyRef<L, I>(signatureStr: String, lazyRef: LazyRef<L, I>): void;
    processJsHbResultEntity<L>(entityType: Type<L>, literalJsHbResultEntity: any): L;
    processJsHbResultEntityArray<L>(entityType: Type<L>, literalJsHbResultEntity: any): Array<L>;
    newEntityInstance<T>(entityType: Type<T>): T;
    startRecord(): void;
    stopRecord(): void;
    getLastRecordedPlayback(): JsHbPlayback;
    getCachedBySignature<T>(signatureStr: String): T;
    /**
     * Uso interno.
     */
    addPlaybackAction(action: JsHbPlaybackAction): void;
    isRecording(): boolean;
    recordSave(entity: any): void;
    recordDelete(entity: any): void;
    getLastRecordedPlaybackAsLiteral(): any;
    clear(): void;
}

export class JsHbSessionDefault implements IJsHbSession {
    private _objectsBySignature: Map<String, any> = null;
    private _objectsCreationId: Map<any, Number> = null;
    private _nextCreationId: number = null;
    private _currentJsHbPlayback: JsHbPlayback = null;
    private _lastJsHbPlayback: JsHbPlayback = null;

    constructor(private _jsHbManager: IJsHbManager) {
		if (!_jsHbManager) {
			throw new Error('_jsHbManager can not be null');
        }
        if (JsHbLogLevel.Debug >= _jsHbManager.jsHbConfig.logLevel) {
            console.group('JsHbSessionDefault.constructor');
			console.debug(_jsHbManager as any as string);
            console.groupEnd();
		}
        this._objectsBySignature = new Map<String, any>();
    }

    /**
     * Getter jsHbManager
     * @return {IJsHbManager}
     */
    public get jsHbManager(): IJsHbManager {
        return this._jsHbManager;
    }

    /**
     * Setter jsHbManager
     * @param {IJsHbManager} value
     */
    public set jsHbManager(value: IJsHbManager) {
        if (JsHbLogLevel.Debug >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('JsHbSessionDefault.jsHbManager set');
			console.debug(value as any as string);
            console.groupEnd();
		}
        this._jsHbManager = value;
    }

    public processJsHbResultEntity<L>(entityType: Type<L>, literalJsHbResultEntity: any): L {
        if (!literalJsHbResultEntity.result) {
            throw new Error('literalJsHbResultEntity.result existe' + JSON.stringify(literalJsHbResultEntity));
        }
        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('JsHbSessionDefault.processJsHbResultEntity<L>()');
            console.debug(entityType); console.debug(literalJsHbResultEntity);
            console.groupEnd();
		}
        let refMap: Map<Number, any> = new Map<Number, any>();
        let result = this.processJsHbResultEntityPriv(entityType, literalJsHbResultEntity.result, refMap);
        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('JsHbSessionDefault.processJsHbResultEntity<L>().  result:');
            console.debug(result);
            console.groupEnd();
        }
        
        //result.constructor == Set;
        //Object.getPrototypeOf(result).constructor == Set;

        return result;
    }

    public processJsHbResultEntityArray<L>(entityType: Type<L>, literalJsHbResultEntity: any): Array<L> {
        if (!literalJsHbResultEntity.result) {
            throw new Error('literalJsHbResultEntity.result existe' + JSON.stringify(literalJsHbResultEntity));
        }
        let resultArr: Array<L> = [];
        let refMap: Map<Number, any> = new Map<Number, any>();
        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('JsHbSessionDefault.processJsHbResultEntityArray<L>()');
            console.debug(entityType); console.debug(literalJsHbResultEntity);
            console.groupEnd();
		}
        for (let index = 0; index < literalJsHbResultEntity.result.length; index++) {
            const resultElement = literalJsHbResultEntity.result[index];
            resultArr.push(this.processJsHbResultEntityPriv(entityType, resultElement, refMap));
        }
        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('JsHbSessionDefault.processJsHbResultEntityArray<L>(). result:');
            console.debug(resultArr);
            console.groupEnd();
		}
        return resultArr;
    }

    public newEntityInstance<T>(entityType: Type<T>): T {
        this.validatingControlFieldsExistence(entityType);
        let entityObj = new entityType();
        _.set(entityObj, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
        let realKeys: string[] = Object.keys(Object.getPrototypeOf(entityObj));
        if (JsHbLogLevel.Debug >= this.jsHbManager.jsHbConfig.logLevel) {
            console.debug('entityType: ' + entityType.name);
        }
        for (let index = 0; index < realKeys.length; index++) {
            const keyItem = realKeys[index];
            let prpGenType: GenericNode = GenericTokenizer.resolveNode(entityObj, keyItem);
            if (!prpGenType) {
                if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('GenericNode not found for property key \'' + keyItem + '\' of ' + entityType.name);
                }
            } else if (prpGenType.gType !== LazyRefMTO) {
                if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('GenericNode found but it is not a LazyRef. Property key \'' + keyItem + '\' of ' + entityType.name);
                }
            } else {
                let lazyRefGenericParam: Type<any> = null;
                if (prpGenType.gParams.length > 0) {
                    if (prpGenType.gParams[0] instanceof GenericNode) {
                        lazyRefGenericParam = (prpGenType.gParams[0] as GenericNode).gType;
                    } else {
                        lazyRefGenericParam = (prpGenType.gParams[0] as Type<any>);
                    }

                    if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                        console.debug('GenericNode found and it is a LazyRef, lazyRefGenericParam: ' + lazyRefGenericParam.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                    }

                    if (this.isCollection(lazyRefGenericParam)) {
                        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                            console.debug('GenericNode found, it is a LazyRef, and it is a Collection, lazyRefGenericParam: ' + lazyRefGenericParam.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRefSet: LazyRefBase<any, any> = new LazyRefBase<any, any>();
                        lazyRefSet.internalSetLazyObjForCollection(this.createCollection(lazyRefGenericParam, entityObj, keyItem));
                        lazyRefSet.refererObj = entityObj;
                        lazyRefSet.refererKey = keyItem;
                        lazyRefSet.session = this;
                        _.set(entityObj, keyItem, lazyRefSet);
                    } else {
                        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                            console.debug('GenericNode found, it is a LazyRef, and it is not a Collection, lazyRefGenericParam: ' + lazyRefGenericParam.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRef: LazyRefBase<any, any> = new LazyRefBase<any, any>();
                        lazyRef.refererObj = entityObj;
                        lazyRef.refererKey = keyItem;
                        lazyRef.session = this;
                        _.set(entityObj, keyItem, lazyRef);
                    }
                } else {
                    throw new Error('Property \'' + keyItem + ' of \'' + entityObj.constructor + '\'. LazyRef not properly defined on Reflect');
                }
            }
        }
        if (this.isRecording()) {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.debug('isRecording, ');
            }
            //gravando o playback
            let action: JsHbPlaybackAction = new JsHbPlaybackAction();
            action.fieldName = null;
            action.actionType = JsHbPlaybackActionType.Create;

            action.ownerJavaClass = Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_JAVA_CLASS, entityObj.constructor);
            if (!action.ownerJavaClass) {
                throw new Error('the classe \'' + entityType + ' is not using the decorator \'NgJsHbDecorators.clazz\'');
            }
            action.ownerCreationId = this._nextCreationId;
            _.set(entityObj, this.jsHbManager.jsHbConfig.jsHbCreationIdName, action.ownerCreationId);
            _.set(entityObj, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
            this._nextCreationId++;
            this.addPlaybackAction(action);
        }
        return entityObj;
    }

    public startRecord(): void {
        if (JsHbLogLevel.Debug >= this.jsHbManager.jsHbConfig.logLevel) {
            console.debug('reseting  this._currentJsHbPlayback, this._objectsCreationId and this._nextCreationId');
        }
        this._currentJsHbPlayback = new JsHbPlayback();
        this._objectsCreationId = new Map<any, Number>();
        this._nextCreationId = 1;
    }

    public stopRecord(): void {
        if (this.isRecording()) {
            if (JsHbLogLevel.Debug >= this.jsHbManager.jsHbConfig.logLevel) {
                console.debug('updating this.lastJsHbPlayback and resetting this.currentJsHbPlayback');
            }
            this._lastJsHbPlayback = this._currentJsHbPlayback;
            this._currentJsHbPlayback = null;
        } else {
            if (JsHbLogLevel.Debug >= this.jsHbManager.jsHbConfig.logLevel) {
                console.debug('nothing, it is not recording now');
            }
        }
    }
    
    public recordSave(entity: any): void {
        if (!entity){
            throw new Error('entity can not be null');
        }
        if (!this.isRecording()){
            throw new Error('Invalid operation. It is not recording. entity: \'' + entity.constructor.name + '\'');
        }
        let session: IJsHbSession = _.get(entity, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME) as IJsHbSession;
        if (!session) {
            throw new Error('Invalid operation. \'' + entity.constructor.name + '\' not managed. \'' + JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME + '\' estah null');
        } else if (session !== this) {
            throw new Error('Invalid operation. \'' + entity.constructor.name + '\' managed by another session.');
        }
        //gravando o playback
        let action: JsHbPlaybackAction = new JsHbPlaybackAction();
        action.actionType = JsHbPlaybackActionType.Save;
        if (_.has(entity, this.jsHbManager.jsHbConfig.jsHbSignatureName)) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' has a signature, that is, it has persisted');
        } else if (_.has(entity, this.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
            action.ownerCreationRefId = _.get(entity, this.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
        } else {
            throw new Error('Invalid operation. Not managed entity. Entity: \'' + entity.constructor + '\'');
        }
        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('action: ');
            console.debug(action);
            console.groupEnd();
        }
        this.addPlaybackAction(action);
    }

    public recordDelete(entity: any): void {
        if (!entity){
            throw new Error('Entity nao pode ser nula');
        }
        if (!this.isRecording()){
            throw new Error('Invalid operation. Nao estah gravando. Entity: \'' + entity.constructor + '\'');
        }
        let session: IJsHbSession = _.get(entity, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME) as IJsHbSession;
        if (!session) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' not managed. \'' + JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME + '\' estah null');
        } else if (session !== this) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' managed by another session.');
        }
        //gravando o playback
        let action: JsHbPlaybackAction = new JsHbPlaybackAction();
        action.actionType = JsHbPlaybackActionType.Delete;
        if (_.has(entity, this.jsHbManager.jsHbConfig.jsHbSignatureName)) {
            action.ownerSignatureStr = _.get(entity, this.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
        } else if (_.has(entity, this.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' has id of creation, that is, is not persisted.');
        } else {
            throw new Error('Invalid operation. Not managed entity. Entity: \'' + entity.constructor + '\'');
        }
        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
            console.debug('action: ' + action);
        }
        this.addPlaybackAction(action);
    }

    public clear(): void {
        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
            console.debug('clearing: this.objectsBySignature, this.objectsCreationId, this.nextCreationId, this.currentJsHbPlayback, this.lastJsHbPlayback and this.objectsBySignature');
        }
        this._objectsBySignature = null;
        this._objectsCreationId = null;
        this._nextCreationId = null;
        this._currentJsHbPlayback = null;
        this._lastJsHbPlayback = null;
        this._objectsBySignature = new Map<String, any>();
    }

    public getLastRecordedPlayback(): JsHbPlayback {
        return this._lastJsHbPlayback;
    }

    public addPlaybackAction(action: JsHbPlaybackAction): void {
        if (!this.isRecording()) {
            throw new Error('Nao iniciou a gravacao!');
        }
        if (JsHbLogLevel.Debug >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('addPlaybackAction');
            console.debug(action as any as string);
            console.groupEnd();
        }

        this._currentJsHbPlayback.actions.push(action);
    }

    public isRecording(): boolean {
        return (this._currentJsHbPlayback != null);
    }

    public getLastRecordedPlaybackAsLiteral(): any {
        const result: any = JSONHelper.convertToLiteralObject(this.getLastRecordedPlayback(), true)
        if (JsHbLogLevel.Debug >= this.jsHbManager.jsHbConfig.logLevel) {
            console.group('getLastRecordedPlaybackAsLiteral');
            console.debug(result as any as string);
            console.groupEnd();
        }
        return result;
    }

    public getCachedBySignature<T>(signatureStr: String): T {
        if (this._objectsBySignature.get(signatureStr)) {
            return this._objectsBySignature.get(signatureStr);
        } else {
            return null;
        }
    }

    private validatingControlFieldsExistence(entityType: Type<any>): void {
        const camposControleArr = [
            this.jsHbManager.jsHbConfig.jsHbCreationIdName,
            this.jsHbManager.jsHbConfig.jsHbHibernateIdName,
            this.jsHbManager.jsHbConfig.jsHbIdName,
            this.jsHbManager.jsHbConfig.jsHbIdRefName,
            this.jsHbManager.jsHbConfig.jsHbIsLazyUninitializedName,
            this.jsHbManager.jsHbConfig.jsHbSignatureName,
            JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME,
            JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME];
        for (let index = 0; index < camposControleArr.length; index++) {
            const internalKeyItem = camposControleArr[index];
            if (Object.keys(entityType.prototype).lastIndexOf(internalKeyItem.toString()) >= 0) {
                throw new Error('The Entity ' + entityType.name + ' already has the property \'' + internalKeyItem.toString() + '\' defined!');
            }            
        }
    }

    private processJsHbResultEntityPriv<L>(entityType: Type<L>, result: any, refMap: Map<Number, any>): L {
        let signatureStr: String = <String>_.get(result, this.jsHbManager.jsHbConfig.jsHbSignatureName);
        let entityValue: any = this._objectsBySignature.get(signatureStr);
        if (!entityValue) {
            let jsHbIdRef: Number = <Number>_.get(result, this.jsHbManager.jsHbConfig.jsHbIdRefName);
            if (jsHbIdRef) {
                entityValue = refMap.get(jsHbIdRef);
            }
        }
        
        if (!entityValue) {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.debug('entity not processed yet on this session. Not found by signature: ' + signatureStr);
            }
            this.validatingControlFieldsExistence(entityType);
            entityValue = new entityType();
            // if (signatureStr) {
            //     this._objectsBySignature.set(signatureStr, entityValue);
            // }
            _.set(entityValue, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
            this.removeNonUsedKeysFromLiteral(entityValue, result);

            if (_.has(result, this.jsHbManager.jsHbConfig.jsHbIdName)) {
                refMap.set(<Number>_.get(result, this.jsHbManager.jsHbConfig.jsHbIdName), entityValue);
            } else {
                throw new Error('This should not happen 1');
            }

            _.set(entityValue, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
            try {
                this.tryCacheInstanceBySignature(entityValue, result);
                _.mergeWith(entityValue, result, this.mergeWithCustomizerPropertyReplection(refMap));
            } finally {
                _.set(entityValue, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
            }
        } else {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.debug('entity already processed on this session. Found by signature: ' + signatureStr);
            }
        }
        return entityValue;
    }

    private createLoadedLazyRef<L, I>(genericNode: GenericNode, literalLazyObj: any, refMap: Map<Number, any>, refererObj: any, refererKey: string): LazyRefMTO<L, I> {
        let lr: LazyRefBase<L, I> = this.createApropriatedLazyRefBase<L, I>(genericNode, literalLazyObj, refMap, refererObj, refererKey);
        
        this.trySetHibernateIdentifier(lr, genericNode, literalLazyObj, refMap);
        this.tryGetFromObjectsBySignature(lr, genericNode, literalLazyObj, refMap);

        if (lr.lazyLoadedObj) {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.group('LazyRef.lazyLoadedObj is already setted: ');
                console.debug(lr.lazyLoadedObj);
                console.groupEnd();
            }
        } else {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.debug('LazyRef.lazyLoadedObj is not setted yet');
            }
            let lazyLoadedObjType: Type<any> = null;
            if (genericNode.gParams[0] instanceof GenericNode) {
                lazyLoadedObjType = (<GenericNode>genericNode.gParams[0]).gType;
            } else {
                lazyLoadedObjType = <Type<any>>genericNode.gParams[0];
            }
            
            lr.lazyLoadedObj = null;
            if (this.isCollection(lazyLoadedObjType)) {
                if (!(genericNode.gParams[0] instanceof GenericNode) || (<GenericNode>genericNode.gParams[0]).gParams.length <=0) {
                    throw new Error('LazyRef nao definido corretamente: \'' + refererKey + '\' em ' + refererObj.constructor);
                }
                let collTypeParam: Type<any> =  null;
                if ((<GenericNode>genericNode.gParams[0]).gParams[0] instanceof GenericNode) {
                    collTypeParam = (<GenericNode>(<GenericNode>genericNode.gParams[0]).gParams[0]).gType;
                } else {
                    collTypeParam = <Type<any>>(<GenericNode>genericNode.gParams[0]).gParams[0];
                }

                lr.lazyLoadedObj = this.createCollection(lazyLoadedObjType, refererObj, refererKey);
                for (const literalItem of literalLazyObj) {
                    // let realItem = new collTypeParam();
                    // this.tryCacheInstanceBySignature(lr.lazyLoadedObj, literalLazyObj);
                    // _.mergeWith(realItem, literalItem, this.mergeWithCustomizerPropertyReplection(refMap));
                    let realItem = this.processJsHbResultEntityPriv(collTypeParam, literalLazyObj, refMap);
                    this.addOnCollection(lazyLoadedObjType, lr.lazyLoadedObj, realItem);
                }
            } else {
                // lr.lazyLoadedObj = new lazyLoadedObjType(); 
                // _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
                // _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
                // this.removeNonUsedKeysFromLiteral(lr.lazyLoadedObj, literalLazyObj);
                // try {
                //     this.tryCacheInstanceBySignature(lr.lazyLoadedObj, literalLazyObj);
                //     _.mergeWith(lr.lazyLoadedObj, literalLazyObj, this.mergeWithCustomizerPropertyReplection(refMap));
                // } finally {
                //     _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                // }
                lr.lazyLoadedObj = this.processJsHbResultEntityPriv(lazyLoadedObjType, literalLazyObj, refMap);
            }

            // if (lr.signatureStr) {
            //     this._objectsBySignature.set(lr.signatureStr, lr.lazyLoadedObj);
            // }
        }
        return lr;
    }

    private tryCacheInstanceBySignature(realInstance: any, literalInstance: any): void {
        let signatureStr: String = <String>_.get(literalInstance, this.jsHbManager.jsHbConfig.jsHbSignatureName);
        if (signatureStr) {
            this._objectsBySignature.set(signatureStr, realInstance);
        }
    }

    private lodashMergeOrGetBySignature(lr: LazyRefBase<any, any>, literalLazyObj: any, lazyLoadedObjType: Type<any>, refMap: Map<Number, any>): void {
        if (this.getCachedBySignature(lr.signatureStr)) {
            lr.lazyLoadedObj = this.getCachedBySignature(lr.signatureStr);
            lr.respObs = null;
        } else {
            // lr.lazyLoadedObj = new lazyLoadedObjType() as any; 
            // _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
            // _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
            // this.removeNonUsedKeysFromLiteral(lr.lazyLoadedObj, literalLazyObj);
            // try {
            //     _.mergeWith(lr.lazyLoadedObj, literalLazyObj, this.mergeWithCustomizerPropertyReplection(refMap));
            // } finally {
            //     _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
            // }
            lr.lazyLoadedObj = this.processJsHbResultEntityPriv(lazyLoadedObjType, literalLazyObj, refMap);
        }
    }

    private createNotLoadedLazyRef<L, I>(genericNode: GenericNode, literalLazyObj: any, refMap: Map<Number, any>, refererObj: any, refererKey: string): LazyRefMTO<L, I> {
        let lr: LazyRefBase<L, I> = this.createApropriatedLazyRefBase<L, I>(genericNode, literalLazyObj, refMap, refererObj, refererKey);
        this.trySetHibernateIdentifier(lr, genericNode, literalLazyObj, refMap);
        this.tryGetFromObjectsBySignature(lr, genericNode, literalLazyObj, refMap);

        if (lr.lazyLoadedObj) {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.group('LazyRef.lazyLoadedObj is already setted: ');
                console.debug(lr.lazyLoadedObj);
                console.groupEnd();
            }
        } else {
            lr.respObs = this.jsHbManager.httpLazyObservableGen.generateHttpObservable(lr.signatureStr);
            lr.flatMapCallback = 
                (response) => {
                    if (lr.lazyLoadedObj == null) {
                        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                            console.group('createNotLoadedLazyRef => lr.flatMapCallback: LazyRef.lazyLoadedObj is not setted yet: ');
                            console.debug(lr.lazyLoadedObj);
                            console.groupEnd();
                        }
                        let refMapFlatMapCallback: Map<Number, any> = new Map<Number, any>();
                        let literalLazyObj: any = response.json();
                        //literal.result
                        if (genericNode.gType !== LazyRefMTO) {
                            throw new Error('Wrong type: ' + genericNode.gType.name);
                        }
                        let lazyLoadedObjType: Type<any> = null;
                        if (genericNode.gParams[0] instanceof GenericNode) {
                            lazyLoadedObjType = (<GenericNode>genericNode.gParams[0]).gType;
                        } else {
                            lazyLoadedObjType = <Type<any>>genericNode.gParams[0];
                        }
                        if (this.isCollection(lazyLoadedObjType)) {
                            if (!(genericNode.gParams[0] instanceof GenericNode) || (<GenericNode>genericNode.gParams[0]).gParams.length <=0) {
                                throw new Error('LazyRef not defined: \'' + refererKey + '\' em ' + refererObj.constructor.name);
                            }
                            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                                console.debug('createNotLoadedLazyRef => lr.flatMapCallback: LazyRef is collection: ' + lazyLoadedObjType.name);
                            }
                            let collTypeParam: Type<any> =  null;
                            if ((<GenericNode>genericNode.gParams[0]).gParams[0] instanceof GenericNode) {
                                collTypeParam = (<GenericNode>(<GenericNode>genericNode.gParams[0]).gParams[0]).gType;
                            } else {
                                collTypeParam = <Type<any>>(<GenericNode>genericNode.gParams[0]).gParams[0];
                            }
                            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                                console.debug('createNotLoadedLazyRef => lr.flatMapCallback: LazyRef is collection of: ' + collTypeParam.name);
                            }

                            lr.lazyLoadedObj = this.createCollection(lazyLoadedObjType, refererObj, refererKey);
                            for (const literalItem of literalLazyObj.result) {
                                // let realItem = new collTypeParam();
                                // _.set(realItem, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
                                // this.removeNonUsedKeysFromLiteral(realItem, literalItem);
                                // _.set(realItem, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
                                // try {
                                //     _.mergeWith(realItem, literalItem, this.mergeWithCustomizerPropertyReplection(refMap));
                                // } finally {
                                //     _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                                // }                                
                                let realItem = this.processJsHbResultEntityPriv(collTypeParam, literalItem, refMap);

                                this.addOnCollection(lazyLoadedObjType, lr.lazyLoadedObj, realItem);
                            }
                        } else {
                            // lr.lazyLoadedObj = new lazyLoadedObjType();
                            // if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                            //     console.debug('createNotLoadedLazyRef => lr.flatMapCallback: LazyRef is not collection: ' + lazyLoadedObjType.name);
                            // }
                            // _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
                            // this.removeNonUsedKeysFromLiteral(lr.lazyLoadedObj, literalLazyObj.result);
                            // _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
                            // try {
                            //     _.mergeWith(lr.lazyLoadedObj, literalLazyObj.result, this.mergeWithCustomizerPropertyReplection(refMapFlatMapCallback));            
                            // } finally {
                            //     _.set(lr.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                            // }
                            lr.lazyLoadedObj = this.processJsHbResultEntityPriv(lazyLoadedObjType, literalLazyObj.result, refMap);
                            //foi a unica forma que encontrei de desacoplar o Observable<L> do Observable<Response>
                            // O efeito colateral disso eh que qualquer *Map() chamado antes dessa troca fica
                            // desatachado do novo Observable.
                        }
                    }
                    if (lr.signatureStr) {                        
                        if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                            console.group('createNotLoadedLazyRef => lr.flatMapCallback: keeping reference by signature ' + lr.signatureStr);
                            console.debug(lr.lazyLoadedObj);
                            console.groupEnd();
                        }
                        this.tryCacheInstanceBySignature(lr.lazyLoadedObj, literalLazyObj);
                        // this._objectsBySignature.set(lr.signatureStr, lr.lazyLoadedObj);
                    }
                    return Observable.of(lr.lazyLoadedObj);
                };
        }
        return lr;
    }

    private tryGetFromObjectsBySignature<L, I>(lr: LazyRefBase<L, I>, genericNode: GenericNode, literalLazyObj: any, refMap: Map<Number, any>) {
        let signatureStr: String = <String>_.get(literalLazyObj, this.jsHbManager.jsHbConfig.jsHbSignatureName);

        let entityValue: any = null;
        if (signatureStr) {
            lr.signatureStr = signatureStr;
            entityValue = this._objectsBySignature.get(signatureStr);
        } else {
            let originalObs: Observable<Response> = this.jsHbManager.httpLazyObservableGen.generateHttpObservable(signatureStr);
        }

        if (entityValue) {
            lr.lazyLoadedObj = entityValue;
        } else {
            //nada
        }
    }

    private createApropriatedLazyRefBase<L, I>(genericNode: GenericNode, literalLazyObj: any, refMap: Map<Number, any>, refererObj: any, refererKey: string): LazyRefBase<L, I> {
        let jsHbHibernateIdLiteral: any = _.get(literalLazyObj, this.jsHbManager.jsHbConfig.jsHbHibernateIdName);
        let lazyRef: LazyRefBase<L, any> = null;
        if (jsHbHibernateIdLiteral) {
            lazyRef = new LazyRefBase<L, I>();
        } else {
            lazyRef = new LazyRefBase<L, undefined>();
        }
        lazyRef.refererObj = refererObj;
        lazyRef.refererKey = refererKey;
        lazyRef.session = this;
        return lazyRef;
    }

    private metadaKeys: Set<String>;
    private isMetadataKey(keyName: String): boolean {
        if (this.metadaKeys == null) {
            this.metadaKeys = new Set<String>()
                .add(this.jsHbManager.jsHbConfig.jsHbHibernateIdName)
                .add(this.jsHbManager.jsHbConfig.jsHbIdName)
                .add(this.jsHbManager.jsHbConfig.jsHbIdRefName)
                .add(this.jsHbManager.jsHbConfig.jsHbIsLazyUninitializedName)
                .add(this.jsHbManager.jsHbConfig.jsHbSignatureName);
        }
        return this.metadaKeys.has(keyName);
    }

    private removeNonUsedKeysFromLiteral<L>(realObj: L, literalObj: any) {
        let literalKeys: string[] = _.clone(_.keys(literalObj));
        let realKeys: string[] = Object.keys(Object.getPrototypeOf(realObj));
        for (let index = 0; index < literalKeys.length; index++) {
            const keyItem = literalKeys[index];
            if (!this.isMetadataKey(keyItem) && realKeys.indexOf(keyItem) < 0) {
                delete literalObj[keyItem];
            }
        }
    }

    private trySetHibernateIdentifier<L, I>(lr: LazyRefBase<L, I>, genericNode: GenericNode, literalLazyObj: any, refMap: Map<Number, any>): void {
        let jsHbHibernateIdLiteral: any = _.get(literalLazyObj, this.jsHbManager.jsHbConfig.jsHbHibernateIdName);
        if (jsHbHibernateIdLiteral instanceof Object && !(jsHbHibernateIdLiteral instanceof Date)) {
            let hbIdType: Type<any> = null;
            if (genericNode.gParams[1] instanceof GenericNode) {
                hbIdType = (<GenericNode>genericNode.gParams[1]).gType;
            } else {
                hbIdType = <Type<any>>genericNode.gParams[1];
            }
            if (hbIdType) {
                if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                    console.group('There is a hbIdType on LazyRef. Is it many-to-one LazyRef?!. hbIdType: ' + hbIdType.name + ', genericNode:');
                    console.debug(genericNode);
                    console.groupEnd();
                }
                this.validatingControlFieldsExistence(hbIdType);
                // lr.hbId = new hbIdType();
                // _.set(lr.hbId, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
                // this.removeNonUsedKeysFromLiteral(lr.hbId, jsHbHibernateIdLiteral);
                // _.mergeWith(lr.hbId, jsHbHibernateIdLiteral, this.mergeWithCustomizerPropertyReplection(refMap));
                lr.hbId = this.processJsHbResultEntityPriv(hbIdType, jsHbHibernateIdLiteral, refMap);
            } else {
                if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                    console.group('Thre is no hbIdType on LazyRef. Is it a collection?!. hbIdType: ' + hbIdType.name + ', genericNode:');
                    console.debug(genericNode);
                    console.groupEnd();
                }
            }
        } else if (jsHbHibernateIdLiteral) {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.group('The hibernate id is a simple type value: ' + jsHbHibernateIdLiteral + '. genericNode:');
                console.debug(genericNode);
                console.groupEnd();
            }
            lr.hbId = jsHbHibernateIdLiteral;
        } else {
            if (JsHbLogLevel.Trace >= this.jsHbManager.jsHbConfig.logLevel) {
                console.group('The hibernate id is null! Is it a collection?!: ' + jsHbHibernateIdLiteral + '. genericNode:');
                console.debug(genericNode);
                console.groupEnd();
            }
        }
    }

    private createCollection(collType: Type<any>, refererObj: any, refererKey: string): any {
        if (collType === Set) {
            //return new JsHbSet(this, refererObj, refererKey);
            return new JsHbSetCreator(this, refererObj, refererKey).createByProxy();
        } else {
            throw new Error('Collection not supported: ' + collType);
        }
    }

    private isCollection(typeTested: Type<any>): any {
        return (typeTested === Array)
                || (typeTested === Set);
    }

    private addOnCollection(collType: Type<any>, collection: any, element: any) {
        if (collection instanceof Array) {
            (<Array<any>>collection).push(element);
        } else if (collection instanceof Set){
            (<Set<any>>collection).add(element);
        } else {
            throw new Error('Colecction nao suportada: ' + collection.prototype);
        }
    }

    private mergeWithCustomizerPropertyReplection(refMap: Map<Number, any>): MergeWithCustomizer {
        let thisLocal: JsHbSessionDefault = this;
        return function (value: any, srcValue: any, key?: string, object?: Object, source?: Object) {
            if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                console.group('mergeWithCustomizerPropertyReplection => function');
                console.debug(refMap); console.debug(value); console.debug(srcValue); console.debug(key); console.debug(object); console.debug(source);
                console.groupEnd();
            }
            let prpType: Type<any> = Reflect.getMetadata('design:type', object, key);
            let prpGenType: GenericNode = GenericTokenizer.resolveNode(object, key);
            let isJsHbHibernateIdAndIsObject: boolean = false;
            let isHibernateComponent: boolean = false;
            if (!prpType && srcValue instanceof Object && !(srcValue instanceof Date) && key === thisLocal.jsHbManager.jsHbConfig.jsHbHibernateIdName) {
                isJsHbHibernateIdAndIsObject = true;
                if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                    console.group('mergeWithCustomizerPropertyReplection => function: (!prpType && srcValue instanceof Object && !(srcValue instanceof Date) && key === thisLocal.jsHbManager.jsHbConfig.jsHbHibernateIdName)');
                    console.debug(srcValue);
                    console.groupEnd();
                }
                prpType = Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_ID_TYPE, object);
                if (!prpType) {
                    throw new Error('We are receiving ' +thisLocal.jsHbManager.jsHbConfig.jsHbHibernateIdName + ' as Object and ' + object.constructor.name + ' does not define a property with @NgJsHbDecorators.hibernateId()');
                }
            } else if (srcValue instanceof Object && !(srcValue instanceof Date) && prpGenType && prpGenType.gType !== LazyRefMTO) {
                isHibernateComponent = true;
            }
            let correctSrcValue = srcValue;
            let jsHbIdRef: Number = <Number>_.get(srcValue, thisLocal.jsHbManager.jsHbConfig.jsHbIdRefName);
            if (jsHbIdRef) {
                correctSrcValue = refMap.get(jsHbIdRef);
                if (!correctSrcValue) {
                    throw new Error('This should not happen 2');
                }
                if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                    console.group('mergeWithCustomizerPropertyReplection => function. Object resolved by ' + thisLocal.jsHbManager.jsHbConfig.jsHbIdRefName + ' field');
                    console.debug(correctSrcValue);
                    console.groupEnd();
                }
            } else if (isJsHbHibernateIdAndIsObject || isHibernateComponent) {
                if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                    console.group('mergeWithCustomizerPropertyReplection => function: (isJsHbHibernateIdAndIsObject)');
                    console.debug(srcValue);
                    console.groupEnd();
                }
                // correctSrcValue = new prpType(); 
                // _.set(correctSrcValue, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, this);
                // _.set(correctSrcValue, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
                // this.removeNonUsedKeysFromLiteral(correctSrcValue, srcValue);
                // try {
                //     _.mergeWith(correctSrcValue, srcValue, this.mergeWithCustomizerPropertyReplection(refMap));
                // } finally {
                //     _.set(correctSrcValue, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                // }
                correctSrcValue = thisLocal.processJsHbResultEntityPriv(prpType, srcValue, refMap);

                //here prpType 
            } else if (prpType) {
                if (prpGenType) {
                    if (thisLocal.isCollection(prpGenType.gType)) {
                        if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                            console.group('mergeWithCustomizerPropertyReplection => function. thisLocal.isCollection(prpGenType.gType) ');
                            console.debug(prpGenType); console.debug(prpGenType.gType);
                            console.groupEnd();
                        }
                        let correctSrcValueColl = thisLocal.createCollection(prpGenType.gType, value, key);
                        for (let index = 0; index < srcValue.length; index++) { 
                            let arrItemType: Type<any> = <Type<any>>prpGenType.gParams[0];
                            // let correctSrcValueCollItem = arrItemType;
                            // thisLocal.removeNonUsedKeysFromLiteral(correctSrcValueCollItem, srcValue);
                            // _.set(correctSrcValueCollItem, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME, thisLocal);
                            // _.set(correctSrcValueCollItem, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
                            // try {
                            //     _.mergeWith(correctSrcValueCollItem, srcValue[index], thisLocal.mergeWithCustomizerPropertyReplection(refMap));
                            // } finally {
                            //     _.set(correctSrcValueCollItem, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                            // }
                            let correctSrcValueCollItem = thisLocal.processJsHbResultEntityPriv(arrItemType, srcValue[index], refMap);

                            thisLocal.addOnCollection(prpGenType.gType, correctSrcValueColl, correctSrcValueCollItem);
                        }
                        correctSrcValue = correctSrcValueColl;
                        //nada por enquanto
                    } else if (prpGenType.gType === LazyRefMTO) {
                        // if (!_.has(source, thisLocal.jsHbManager.jsHbConfig.jsHbIsLazyUninitializedName)) {
                        //     throw new Error('Aqui deveria existir \'' + thisLocal.jsHbManager.jsHbConfig.jsHbIsLazyUninitializedName + '\'. ' + JSON.stringify(srcValue));
                        // }
                        if (!_.has(source, thisLocal.jsHbManager.jsHbConfig.jsHbIdName)) {
                            throw new Error('Aqui deveria existir \'' + thisLocal.jsHbManager.jsHbConfig.jsHbIdName + '\'. ' + JSON.stringify(srcValue));
                        }
                        let refId: Number = <Number>_.get(srcValue, thisLocal.jsHbManager.jsHbConfig.jsHbIdName);
                        if (_.get(srcValue, thisLocal.jsHbManager.jsHbConfig.jsHbIsLazyUninitializedName)) {
                            let lazyRef: LazyRefMTO<any, any> = thisLocal.createNotLoadedLazyRef(prpGenType, srcValue, refMap, object, key);
                            //there is no refId when 'jsHbIsLazyUninitialized'
                            //refMap.set(refId, lazyRef);
                            return lazyRef;
                        } else {
                            let lazyRef: LazyRefMTO<any, any> = thisLocal.createLoadedLazyRef(prpGenType, srcValue, refMap, object, key);
                            refMap.set(refId, lazyRef);
                            return lazyRef;
                        }
                    }
                } else if (srcValue instanceof Object && !(srcValue instanceof Date)){
                    throw new Error('This should not happen');
                } else {
                    if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                        console.group('mergeWithCustomizerPropertyReplection => function. Transformation is not necessary for property \''+key+'\'.');
                        console.debug(object);
                        console.groupEnd();
                    }
                }
            } else if (_.has(object, key)) {
                throw new Error('Sem anotacao de tipo. key: ' + key + ', ' + value);
            } else if (!_.has(object, key) && !thisLocal.isMetadataKey(key)) {
                if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('mergeWithCustomizerPropertyReplection => function. This property \''+key+'\' does not exists on this type.');
                }
                correctSrcValue = undefined;
            } else {
                if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                    console.group('mergeWithCustomizerPropertyReplection => function. Property \''+key+'\'. Using same value.');
                    console.debug(correctSrcValue);
                    console.groupEnd();
                }
            }
            if (JsHbLogLevel.Trace >= thisLocal.jsHbManager.jsHbConfig.logLevel) {
                console.group('mergeWithCustomizerPropertyReplection => function. return');
                console.debug(correctSrcValue);
                console.groupEnd();
            }

            return correctSrcValue;
        }
    }
}