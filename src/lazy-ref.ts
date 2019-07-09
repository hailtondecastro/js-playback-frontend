import { Observable, Subscription, Subject, Subscriber, of as observableOf, of, OperatorFunction } from 'rxjs';
import { PartialObserver } from 'rxjs/Observer';
import { GenericNode, GenericTokenizer } from './generic-tokenizer';
import { Type } from '@angular/core';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { IJsHbSession, OriginalLiteralValueEntry } from './js-hb-session';
import { JsHbLogLevel, FieldInfo } from './js-hb-config';
import { get as lodashGet, has as lodashHas, set as lodashSet } from 'lodash';
import { flatMap, map } from 'rxjs/operators';
import { JsHbContants } from './js-hb-constants';
import { JsHbBackendMetadatas } from './js-hb-backend-metadatas';
import { NgJsHbDecorators } from './js-hb-decorators';
import { IFieldProcessor, IFieldProcessorEvents } from './field-processor';
//import { ReadLine } from 'readline';
import { Stream, Readable } from 'stream';
import { JsHbManagerDefault } from './js-hb-manager';
import { request } from 'http';
import { FieldEtc } from './field-etc';
import { ResponseLike } from './js-hb-http-lazy-observable-gen';

export class StringStreamMarker {
}

export interface StringStream extends NodeJS.ReadableStream, NodeJS.WritableStream {
           /**
             * Event emitter
             * The defined events on documents including:
             * 1. close
             * 2. data
             * 3. end
             * 4. readable
             * 5. error
             */
            addListener(event: "close", listener: () => void): this;
            addListener(event: "data", listener: (chunk: string) => void): this;
            addListener(event: "end", listener: () => void): this;
            addListener(event: "readable", listener: () => void): this;
            addListener(event: "error", listener: (err: Error) => void): this;
            addListener(event: string | symbol, listener: (...args: any[]) => void): this;

            emit(event: "close"): boolean;
            emit(event: "data", chunk: any): boolean;
            emit(event: "end"): boolean;
            emit(event: "readable"): boolean;
            emit(event: "error", err: Error): boolean;
            emit(event: string | symbol, ...args: any[]): boolean;

            on(event: "close", listener: () => void): this;
            on(event: "data", listener: (chunk: string) => void): this;
            on(event: "end", listener: () => void): this;
            on(event: "readable", listener: () => void): this;
            on(event: "error", listener: (err: Error) => void): this;
            on(event: string | symbol, listener: (...args: any[]) => void): this;

            once(event: "close", listener: () => void): this;
            once(event: "data", listener: (chunk: any) => void): this;
            once(event: "end", listener: () => void): this;
            once(event: "readable", listener: () => void): this;
            once(event: "error", listener: (err: Error) => void): this;
            once(event: string | symbol, listener: (...args: any[]) => void): this;

            prependListener(event: "close", listener: () => void): this;
            prependListener(event: "data", listener: (chunk: string) => void): this;
            prependListener(event: "end", listener: () => void): this;
            prependListener(event: "readable", listener: () => void): this;
            prependListener(event: "error", listener: (err: Error) => void): this;
            prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

            prependOnceListener(event: "close", listener: () => void): this;
            prependOnceListener(event: "data", listener: (chunk: string) => void): this;
            prependOnceListener(event: "end", listener: () => void): this;
            prependOnceListener(event: "readable", listener: () => void): this;
            prependOnceListener(event: "error", listener: (err: Error) => void): this;
            prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

            removeListener(event: "close", listener: () => void): this;
            removeListener(event: "data", listener: (chunk: string) => void): this;
            removeListener(event: "end", listener: () => void): this;
            removeListener(event: "readable", listener: () => void): this;
            removeListener(event: "error", listener: (err: Error) => void): this;
            removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
}

export class LazyRefPrpMarker {    
}

/**
 * Base class to use as marker for {@link reflect-metadata#Reflect.metadata} with 
 * {@link ./generic-tokenizer#GenericTokenizer GenericTokenizer}.
 * 
 * Do not use this as the field type, use {@link LazyRefMTO} or {@link LazyRefOTM}.
 * Use this as 'interface like' to do your own implementation if you need! 
 * See {@link IJsHbSession#createApropriatedLazyRef}
 * 
 * Code sample:
 * ```ts
   ...
   private _myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>>;
   @NgJsHbDecorators.property()
   @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(Set).lt().tp(MyChildEntity).gt().gt().tree))
   public get myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>> {
     return this._myChildEntitiesSet;
   }
   ...
 * ```
 * or
 * ```ts
   ...
   private _myParentEntity(): LazyRefMTO<MyParentEntity, Number>;
   @NgJsHbDecorators.property()
   @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MyParentEntity).comma().tp(Number).gt().tree))
   public get myParentEntity(): LazyRefMTO<MyParentEntity, Number> {
     return this._myParentEntity;
   }
   ...
 * ```
 */
export class LazyRef<L extends object, I> extends Subject<L> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRef: boolean = true;
    /**
     * Hibernate id. This is accessible even before lazy loading.
     */
    hbId: I;
    //lazyLoadedObj: L;
    /**
     * Signature identifier generated by backend server.
     */
    signatureStr: string;
    /**
     * Unlike the common subscribe, which must be executed every time the data
     * changed, it is only executed once and triggers a next to
     * that all other subscriptions (pipe async's for example) are called.
     * so it does not return Subscription, after all it does not subscribe permanently
     * on the observer's list.  
     * Call {@link IJsHbSession#notifyAllLazyrefsAboutEntityModification} after modification and {@link Subscription#unsubscribe}.
     * @param observerOrNext
     * @param error
     * @param complete
     */
    subscribeToModify(observer?: PartialObserver<L>): void;
    subscribeToModify(next?: (value: L) => void, error?: (error: any) => void, complete?: () => void): void;
    subscribeToModify(): void { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); }
    /**
     * TODO:
     * @param lazyLoadedObj 
     */
    setLazyObj(lazyLoadedObj: L): Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    setLazyObjOnLazyLoading(lazyLoadedObj: L): Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    setLazyObjNoNext(lazyLoadedObj: L) : Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    notifyModification(lazyLoadedObj: L) : void { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /**
     * true if it is lazy loaded.
     * @returns true if it is lazy loaded.
     */
    isLazyLoaded(): boolean { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    // isOnSubscribeToModify(): boolean { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** 
     * TODO:  
     * Framework internal use.
     */
    processResponse(responselike: { body: any }): Observable<L> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    get genericNode(): GenericNode {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
    set genericNode(value: GenericNode) {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public get refererObj(): any {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public set refererObj(value: any) {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public get refererKey(): string {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public set refererKey(value: string) {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public get session(): IJsHbSession {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public set session(value: IJsHbSession) {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public get lazyLoadedObj(): L {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
    public get respObs(): Observable<ResponseLike<Object>> {
        throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
    public set respObs(value: Observable<ResponseLike<Object>>) {
        throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
    public get fieldProcessorEvents(): IFieldProcessorEvents<L> {
        throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }

    public toString(): string {
        let thisLocal = this;
        return JSON.stringify(
            {
                instanceId: (thisLocal as any).instanceId,
                iAmLazyRef: thisLocal.iAmLazyRef,
                refererKey: thisLocal.refererKey,
                refererObj:
                    thisLocal.refererObj
                        && thisLocal.refererObj.constructor
                        && thisLocal.refererObj.constructor.name ?
                    thisLocal.refererObj.constructor.name
                    : null,
                "isLazyLoaded()": thisLocal.isLazyLoaded(),
                genericNode: thisLocal.genericNode? thisLocal.genericNode.toString(): null,
                signatureStr: thisLocal.signatureStr
            },
            null,
            2);
    }
}

/**
 * One-to-one.  
 * See {@link LazyRef}
 */
export declare type LazyRefOTM<L extends object> = LazyRef<L, undefined>;

/**
 * One-to-one.  
 * See {@link LazyRef}
 */
export declare type LazyRefMTO<L extends object, I> = LazyRef<L, I>;

export declare type LazyRefPrp<L extends object> = LazyRef<L, undefined>;

/**
 * Default implementation!  
 * See {@link LazyRef}
 */
export class LazyRefDefault<L extends object, I> extends LazyRef<L, I> {

    private notificationStartTime: number = Date.now();
    private notificationCount: number = 0;

    private _instanceId: number;
	public get instanceId(): number {
		return this._instanceId;
	}
	public set instanceId(value: number) {
		this._instanceId = value;
	}

    private _hbId: I;
    private _lazyLoadedObj: L;
    private _genericNode: GenericNode;
    private _signatureStr: string;
    private _respObs: Observable<ResponseLike<Object>>;
    private _flatMapCallback: (response: ResponseLike<L>) => Observable<L>;
    private _refererObj: any;
    private _refererKey: string;
    private _session: IJsHbSession;

    constructor() {
        super();
        this._lazyLoadedObj = null;
    }

    private _isOnLazyLoading: boolean = false;

    private keepIsOnLazyLoadRxOpr<T, A>(originalOp: OperatorFunction<T, A>): OperatorFunction<T, A> {
        const syncIsOn = this._isOnLazyLoading;
        let newOp: OperatorFunction<T, A> = (source) => {
            const asyncIsOn = this._isOnLazyLoading;
            this._isOnLazyLoading = syncIsOn;
            try {
                return originalOp(source);
            } finally {
                this._isOnLazyLoading = asyncIsOn;
            }
        }

        return newOp;
    }

    public setLazyObjOnLazyLoading(lazyLoadedObj: L): Observable<void> {
        return this.onLazyLoadingCallbackTemplate( () => {
            return this.setLazyObj(lazyLoadedObj)
                .pipe(
                    this.keepIsOnLazyLoadRxOpr(
                        this.session.keepIsOnLazyLoadRxOpr(
                            lazyLoadedObj,
                            this.session.keepIsOnRestoreRxOpr(
                                map( (lazyLoadedObjB) => {
                                    return lazyLoadedObjB;
                                })
                            )
                        )
                    )
                );
        })
        // try {
        //     this._isOnLazyLoading = true;
        //     this.setLazyObj(lazyLoadedObj);
        // } finally {
        //     this._isOnLazyLoading = false;
        // }
    }

    public isLazyLoaded(): boolean { 
        return this.respObs == null && this.lazyLoadedObj != null;
    };

    private _needCallNextOnSetLazyObj: boolean = true;

    public setLazyObjOnLazyLoadingNoNext(lazyLoadedObj: L): Observable<void> {
        return this.onLazyLoadingCallbackTemplate(() => {
            return this.setLazyObjNoNext(lazyLoadedObj)
                .pipe(
                    this.session.keepIsOnLazyLoadRxOpr(
                        lazyLoadedObj,
                        this.session.keepIsOnRestoreRxOpr(
                            map( (lazyLoadedObjB) => {
                                return lazyLoadedObjB;
                            })
                        )
                    )
                );
        });
    }

    public setLazyObjNoNext(lazyLoadedObj: L): Observable<void> {
        return this.onLazyLoadingCallbackTemplate(() => {
            return this.setLazyObj(lazyLoadedObj)
                .pipe(
                    this.session.keepIsOnLazyLoadRxOpr(
                        lazyLoadedObj,
                        this.session.keepIsOnRestoreRxOpr(
                            map( (lazyLoadedObjB) => {
                                return lazyLoadedObjB;
                            })
                        )
                    )
                );
        });
    }

    public notifyModification(lazyLoadedObj: L) : void {
        this.notificationCount++;
        let currentLazyRefNotificationTimeMeasurement = Date.now() - this.notificationStartTime;
        if (currentLazyRefNotificationTimeMeasurement > this.session.jsHbManager.jsHbConfig.lazyRefNotificationTimeMeasurement 
                ||this.notificationCount > this.session.jsHbManager.jsHbConfig.lazyRefNotificationCountMeasurement) {
            let speedPerSecond = (this.notificationCount / currentLazyRefNotificationTimeMeasurement) * 1000;
            this.notificationStartTime = Date.now();
            this.notificationCount = 0;
            if (speedPerSecond > this.session.jsHbManager.jsHbConfig.maxLazyRefNotificationPerSecond) {
                throw new Error('Max notications per second exceded: ' +
                    speedPerSecond + '. Are you modifing any persistent '+
                    'entity or collection on subscribe() instead of '+
                    'subscribeToModify() or '+
                    'is IJsHbConfig.maxLazyRefNotificationPerSecond, '+
                    this.session.jsHbManager.jsHbConfig.maxLazyRefNotificationPerSecond +
                    ', misconfigured? Me:\n' +
                    this);
            }
        }
        this.next(lazyLoadedObj);
    }

    private processResponseOnLazyLoading(responselike: { body: any }): Observable<L> {
        return this.onLazyLoadingCallbackTemplate(() => {
            return this.processResponse(responselike);
        })
        // try {
        //     this._isOnLazyLoading = true;
        //     return this.processResponse(responselike);
        // } finally {
        //     this._isOnLazyLoading = false;
        // }
    }

    private onLazyLoadingCallbackTemplate<R>(callback: () => R): R {
        try {
            this._isOnLazyLoading = true;
            return callback();
        } finally {
            this._isOnLazyLoading = false;
        }
    }

    public setLazyObj(lazyLoadedObj: L): Observable<void> {
        let resultSub: Subject<void> = new Subject();
        let result$= resultSub.asObservable();
        // let propertyOptions: NgJsHbDecorators.PropertyOptions<L> = Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, this.refererObj, this.refererKey);
        let fieldEtc = JsHbManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.jsHbManager.jsHbConfig);
        if (!fieldEtc.propertyOptions){
            throw new Error('@NgJsHbDecorators.property() not defined for ' + this.refererObj.constructor.name + '.' + this.refererKey);
        }
        //Validating
        if (!this.refererObj || !this.refererKey) {
            throw new Error('The property \'' + this.refererKey + ' has no refererObj or refererKey' + '. Me:\n' + this);
        }
        // let genericNode: GenericNode = GenericTokenizer.resolveNode(this.refererObj, this.refererKey);
        if (fieldEtc.prpGenType == null) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not decorated with com \'@Reflect.metadata("design:generics", GenericTokenizer\'...' + '. Me:\n' + this);
        }
        if (fieldEtc.prpGenType.gType !== LazyRef && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not LazyRef. Me:\n' + this);
        }
        // let lazyRefGenericParam: Type<any> = null;
        // if (genericNode.gParams.length > 0) {
        //     if (genericNode.gParams[0] instanceof GenericNode) {
        //         lazyRefGenericParam = (genericNode.gParams[0] as GenericNode).gType;
        //     } else {
        //         lazyRefGenericParam = (genericNode.gParams[0] as Type<any>);
        //     }
        // }
        if ((fieldEtc.lazyRefGenericParam === Set || fieldEtc.lazyRefGenericParam === Array) && !this._isOnLazyLoading) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' can not be changed because this is a collection: \'' + fieldEtc.lazyRefGenericParam.name + '\'' + '. Me:\n' + this);
        }

        // let fieldProcessor: IFieldProcessor<L>; 
        //if (propertyOptions.isLazyProperty ) {
        // if (genericNode.gType === LazyRefPrpMarker) {
        //     if (propertyOptions.fieldProcessorResolver) {
        //         fieldProcessor = propertyOptions.fieldProcessorResolver();
        //     } else {
        //         fieldProcessor = this.session.jsHbManager.jsHbConfig.getTypeProcessor(lazyRefGenericParam);
        //     }
        // }
        // let info: FieldInfo = {
        //     fieldName: this.refererKey as string,
        //     fieldType: lazyRefGenericParam,
        //     ownerType: this.refererObj.constructor as Type<any>,
        //     ownerValue: this.refererObj
        // }

        //null to response.
        this.respObs = null;
        const isValueByFieldProcessor: {value: boolean} = { value: false };

        if (!this.session.isOnRestoreEntireStateFromLiteral() && !this._isOnLazyLoading) {
            if (!this.session.isRecording()){
                throw new Error('Invalid operation. It is not recording. Is this Error correct?! Me:\n' + this);
            }
            if (this.lazyLoadedObj !== lazyLoadedObj) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.group('LazyRefDefault.setLazyObj()' +
                        '(this.lazyLoadedObj === lazyLoadedObj)\n' +
                        'NOT recording action: ' + JsHbPlaybackActionType.SetField + '. actual and new value: ');
                    console.debug(this.lazyLoadedObj);
                    console.debug(lazyLoadedObj);
                    console.groupEnd();
                }

                let backendMetadatasRefererObj: JsHbBackendMetadatas = { $iAmJsHbBackendMetadatas$: true };
                if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                    backendMetadatasRefererObj = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                }
                let backendMetadatasLazyLoadedObj: JsHbBackendMetadatas = { $iAmJsHbBackendMetadatas$: true };
                if (lazyLoadedObj && lodashHas(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                    backendMetadatasLazyLoadedObj = lodashGet(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                }

                //recording playback
                const action: JsHbPlaybackAction = new JsHbPlaybackAction();
                action.fieldName = this.refererKey;
                action.actionType = JsHbPlaybackActionType.SetField;
                //if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                if (backendMetadatasRefererObj.$signature$) {
                    //action.ownerSignatureStr = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                    action.ownerSignatureStr = backendMetadatasRefererObj.$signature$;
                } else if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.ownerCreationRefId = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else if (!this._isOnLazyLoading && !backendMetadatasRefererObj.$isComponentHibernateId$) {
                    throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' has a not managed owner. Me:\n' + this);
                }

                if (lazyLoadedObj != null) {
                    //if (lodashHas(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                    if (backendMetadatasLazyLoadedObj.$signature$) {
                        //action.settedSignatureStr = lodashGet(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                        action.settedSignatureStr = backendMetadatasLazyLoadedObj.$signature$;
                    } else if (lodashHas(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                        action.settedCreationRefId = lodashGet(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                    //} else if (propertyOptions.isLazyProperty) {
                    } else if (fieldEtc.prpGenType.gType === LazyRefPrpMarker) {
                        //nothing for now
                    } else if (!this._isOnLazyLoading) {
                        throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\'.  lazyLoadedObj is not managed: \'' + lazyLoadedObj.constructor.name + '\'' + '. Me:\n' + this);
                    }
                }

                //if (propertyOptions.isLazyProperty) {
                if (fieldEtc.prpGenType.gType === LazyRefPrpMarker) {                    
                    if (fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callToLiteralValue) {
                        isValueByFieldProcessor.value = true;
                        let toLiteralValue$ = fieldEtc.fieldProcessorCaller.callToLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo);
                        // if (this.fieldProcessorEvents.onToLiteralValue) {
                        //     this.fieldProcessorEvents.onToLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo, toLiteralValue$);
                        // }
                        toLiteralValue$ = this.session.addAsyncTaskWaiting(toLiteralValue$);
                        toLiteralValue$.subscribe(
                            {
                                next: value => {
                                    action.simpleSettedValue = value;
                                    this.session.addPlaybackAction(action);
                                    resultSub.next(null);
                                }
                                // ,complete: () => {
                                //     sub.unsubscribe();
                                // }
                            }
                        );
                    } else {
                        this.session.addPlaybackAction(action);
                    }
                }
            } else {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.group('LazyRefDefault.setLazyObj()' +
                        '(this.lazyLoadedObj !== lazyLoadedObj)\n'+
                        'Recording action: ' + JsHbPlaybackActionType.SetField + '. value: ');
                    console.debug(lazyLoadedObj);
                    console.groupEnd();
                }
            }
        }
        // else {
        //     if (fieldProcessor) {
        //         if (propertyOptions.lazyDirectRawRead) {
        //             const needCallNextOnSetLazyFieldProcessor = this._needCallNextOnSetLazyObj;
        //             if(fieldProcessor.fromDirectRaw) {
        //                 isValueByFieldProcessor.value = true;
        //                 let fromDirectRaw$ = 
        //                     fieldProcessor.fromDirectRaw(
        //                         this._lazyLoadedObj as (Stream|String), 
        //                         info);
        //                 if (this.fieldProcessorEvents.onFromDirectRaw) {
        //                     this.fieldProcessorEvents.onFromDirectRaw(lazyLoadedObj as (Stream|String), info, fromDirectRaw$)
        //                 }
        //                 const subs =
        //                     fromDirectRaw$.subscribe(
        //                         {
        //                             next: (value) => {
        //                                 this._lazyLoadedObj = value;
        //                                 if (needCallNextOnSetLazyFieldProcessor) {
        //                                     this.next(value);
        //                                 }
        //                             },
        //                             complete: () => {
        //                                 subs.unsubscribe();
        //                             }
        //                         });
        //             }
        //         } else {
        //             if(fieldProcessor.fromLiteralValue) {
        //                 isValueByFieldProcessor.value = true;
        //                 let fromLiteralValue$ = fieldProcessor.fromLiteralValue(lazyLoadedObj, info);
        //                 if (propertyOptions.fieldProcessorEvents.onFromLiteralValue) {
        //                     propertyOptions.fieldProcessorEvents.onFromLiteralValue(lazyLoadedObj, info, (fromLiteralValue$ as any) as Observable<L>)
        //                 }
        //                 const subs = fromLiteralValue$.subscribe(
        //                     {
        //                         next: (value) => {
        //                             this._lazyLoadedObj = value;
        //                         },
        //                         complete: () => {
        //                             subs.unsubscribe();
        //                         }
        //                     }
        //                 )
        //             }
        //         }
        //     }
        // }

        if (!isValueByFieldProcessor.value && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            if (this.lazyLoadedObj !== lazyLoadedObj) {
                if (this.lazyLoadedObj) {
                    this.session.unregisterEntityAndLazyref(this.lazyLoadedObj, this);
                }
            }
            // this._lazyLoadedObj = lazyLoadedObj;
        } else {
        }
        this._lazyLoadedObj = lazyLoadedObj;
        
        //if (prpGenType.gType !== LazyRefPrpMarker) {
        if (!isValueByFieldProcessor.value && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            if (this.lazyLoadedObj) {
                this.session.registerEntityAndLazyref(this.lazyLoadedObj, this);
            }
        }

        // if (!isValueByFieldProcessor.value && genericNode.gType !== LazyRefPrpMarker) {
        if (this._needCallNextOnSetLazyObj) {
            this.next(lazyLoadedObj);
            //this.session.notifyAllLazyrefsAboutEntityModification(this.lazyLoadedObj, this);
        }
        // }
        return result$;
    }

    subscribe(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void): Subscription {
        const thisLocal = this;
        let resultSubs: Subscription = null;
        //here overwritten but nothing will happen because we have not done the next() yet
        //this.session.addAsyncTaskWaiting(this);
        if (observerOrNext instanceof Subscriber) {
            resultSubs = super.subscribe(observerOrNext);
        } else {
            resultSubs = super.subscribe(<(value: L) => void>observerOrNext, error, complete);
        }

        let nextModifierCallback: (value: L) => void = null;
        let setLazyObjOnLazyLoading$: Observable<void>;

        if (thisLocal.lazyLoadedObj == null) {
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.debug(
                    '(thisLocal.lazyLoadedObj == null)\n'
                    +'It may mean that we have not subscribed yet in the Observable of Response');
            }
            if (this.respObs == null) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug(
                        '(this.respObs == null)\n'
                        +'Means that we already subscribed to an earlier moment in the Observable of Reponse.\n'
                        +'We will simply call the super.subscribe');
                }
            } else if (this.session.getCachedBySignature(this.signatureStr)) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug(
                        '(this.lazyLoadedObj == null && this.respObs != null && this.session.getCachedBySignature(this.signatureStr)\n'
                        +'Means that we already loaded this object by signature with another lazyRef.\n'
                        +'We will get from session signature cache call next()');
                }
                thisLocal.respObs = null;
                setLazyObjOnLazyLoading$ = thisLocal.setLazyObjOnLazyLoading(<L> this.session.getCachedBySignature(this.signatureStr));
                setLazyObjOnLazyLoading$ = this.session.addAsyncTaskWaiting(setLazyObjOnLazyLoading$);
                setLazyObjOnLazyLoading$.subscribe(() => {
                    thisLocal.next(thisLocal.lazyLoadedObj);
                });
            } else {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug(
                        '(thisLocal.respObs != null)\n'
                        +'Means that we are not subscribed yet in the Observable of Reponse.\n'
                        +'this.respObs will be null after subscription, so we mark that '
                        +'there is already an inscription in the Response Observable, and we '+
                        'will not make two trips to the server');
                }
                let localObs: Observable<L> = 
                    thisLocal.respObs
                        .pipe(
                            flatMap(thisLocal.flatMapCallback)
                        );
                //assim marcaremos que ja ouve inscricao no Observable de response, e nao faremos duas idas ao servidor.
                thisLocal.respObs = null;

                let nextModifierNewCallback: PartialObserver<L> | ((value: L) => void) = null;
                if (observerOrNext instanceof Subscriber) {
                    nextModifierNewCallback = observerOrNext;
                    nextModifierCallback = (<Subscriber<L>>observerOrNext).next;
                    (<Subscriber<L>>observerOrNext).next = (value: L) => {
                        let setLazyObjOnLazyLoading$ = thisLocal.setLazyObjOnLazyLoading(value);
                        if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                            console.group('(Asynchronous) LazyRef.subscribe() => modifiedNext (thisLocal.respObs != null)');
                            console.debug('calling nextOriginal()'); console.debug('this.next()'); console.debug(thisLocal.lazyLoadedObj);
                            console.groupEnd();
                        }
                        setLazyObjOnLazyLoading$ = this.session.addAsyncTaskWaiting(setLazyObjOnLazyLoading$);
                        setLazyObjOnLazyLoading$.subscribe(() => {
                            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                                console.group('(Asynchronous of Asynchronous) LazyRef.subscribe() => setLazyObjOnLazyLoading$.subscribe() => modifiedNext (thisLocal.respObs != null)');
                                console.debug('calling nextOriginal()'); console.debug('this.next()'); console.debug(thisLocal.lazyLoadedObj);
                                console.groupEnd();
                            }
                            nextModifierCallback(thisLocal.lazyLoadedObj);
                            //aqui o metodo original sera chamado
                            thisLocal.next(thisLocal.lazyLoadedObj);
                        });
                    };

                    //o retorno disso nunca mais sera usado
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('(thisLocal.respObs != null)');
                        console.debug('localObs.subscribe() <-- The Subscription returned here will never be used again.'); console.debug(nextModifierNewCallback);
                        console.groupEnd();
                    }
                    localObs = this.session.addAsyncTaskWaiting(localObs);
                    localObs.subscribe(nextModifierNewCallback);
                } else {
                    nextModifierCallback = <(value: L) => void>observerOrNext;
                    nextModifierNewCallback = (value: L) => {
                        if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                            console.group('(Asynchronous) LazyRef.subscribe() => observerOrNextNew, (thisLocal.respObs != null)');
                            console.debug('calling nextOriginal()'); console.debug('this.next()'); console.debug(thisLocal.lazyLoadedObj);
                            console.groupEnd();
                        }

                        setLazyObjOnLazyLoading$ = thisLocal.setLazyObjOnLazyLoading(value);
                        setLazyObjOnLazyLoading$ = this.session.addAsyncTaskWaiting(setLazyObjOnLazyLoading$);
                        setLazyObjOnLazyLoading$.subscribe(() => {
                            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                                console.group('(Asynchronous of Asynchronous) LazyRef.subscribe() => setLazyObjOnLazyLoading$.subscribe() => observerOrNextNew, (thisLocal.respObs != null)');
                                console.debug('calling nextOriginal()'); console.debug('this.next()'); console.debug(thisLocal.lazyLoadedObj);
                                console.groupEnd();
                            }
                            nextModifierCallback(thisLocal.lazyLoadedObj);
                            //aqui o metodo original sera chamado
                            thisLocal.next(thisLocal.lazyLoadedObj);
                        })
                    };


                    //o retorno disso nunca mais sera usado
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('(thisLocal.respObs != null)');
                        console.debug('localObs.subscribe() <-- The Subscription returned here will never be used again.'); console.debug(nextModifierNewCallback); console.debug(error); console.debug(complete);
                        console.groupEnd();
                    }
                    localObs = this.session.addAsyncTaskWaiting(localObs);
                    localObs.subscribe(<(value: L) => void>nextModifierNewCallback, error, complete);
                }
            }
        } else {
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.debug(
                    '(thisLocal.lazyLoadedObj != null)\n'
                    +'It may mean that we already have subscribed yet in the Observable of Response\n '
                    +'or this was created with lazyLoadedObj already loaded.');
            }
            if (observerOrNext instanceof Subscriber) {
                nextModifierCallback = (<Subscriber<L>>observerOrNext).next;
                (<Subscriber<L>>observerOrNext).next = () => {
                    nextModifierCallback(thisLocal.lazyLoadedObj);
                };

                thisLocal.next(thisLocal.lazyLoadedObj);
            } else {
                nextModifierCallback = <(value: L) => void>observerOrNext;

                thisLocal.next(thisLocal.lazyLoadedObj);
            }
        }

        return resultSubs;
    }

    private subscriptionToChange: Subscription;

    private subscriptionToChangeUnsubscribe() {
        if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
            console.debug('LazyRefBase: unsubscribe after this.subscribeToChange. Me\n' + this);
        }
        this.subscriptionToChange.unsubscribe();
        this.session.notifyAllLazyrefsAboutEntityModification(this.lazyLoadedObj, this);
    }

    public processResponse(responselike: { body: any }): Observable<L> {
        let lazyLoadedObj$: Observable<L>;
        let literalJsHbResult: {result: any};
        let isLazyRefOfCollection = false;
        let backendMetadatasRefererObj: JsHbBackendMetadatas = { $iAmJsHbBackendMetadatas$: true };
        if (lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
            backendMetadatasRefererObj = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbMetadatasName);
        }
        
        let fieldEtc = JsHbManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.jsHbManager.jsHbConfig);

        let originalValueEntry: OriginalLiteralValueEntry;

        let isResponseBodyStream = (responselike.body as Stream).pipe && (responselike.body as Stream);
        if (this.lazyLoadedObj == null) {
            literalJsHbResult = responselike.body;
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.debug('LazyRefBase.processResponse: LazyRef.lazyLoadedObj is not setted yet: Me:\n' + this);
            }
            //literal.result
            if (this.genericNode.gType !== LazyRef && this.genericNode.gType !== LazyRefPrpMarker) {
                throw new Error('Wrong type: ' + this.genericNode.gType.name + '. Me:\n' + this);
            }
            //let lazyLoadedObjType: Type<any> = null;
            // if (this.genericNode.gParams[0] instanceof GenericNode) {
            //     lazyLoadedObjType = (<GenericNode>this.genericNode.gParams[0]).gType;
            // } else {
            //     lazyLoadedObjType = <Type<any>>this.genericNode.gParams[0];
            // }
            if (this.session.isCollection(fieldEtc.lazyLoadedObjType)) {
                isLazyRefOfCollection = true;
                if (!(this.genericNode instanceof GenericNode) || (<GenericNode>this.genericNode.gParams[0]).gParams.length <=0) {
                    throw new Error('LazyRef not defined: \'' + this.refererKey + '\' of ' + this.refererObj.constructor.name + '. Me:\n' + this);
                }
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('LazyRefBase.processResponse: LazyRef is collection: ' + fieldEtc.lazyLoadedObjType.name);
                }
                let collTypeParam: Type<any> =  null;
                if ((<GenericNode>this.genericNode.gParams[0]).gParams[0] instanceof GenericNode) {
                    collTypeParam = (<GenericNode>(<GenericNode>this.genericNode.gParams[0]).gParams[0]).gType;
                } else {
                    collTypeParam = <Type<any>>(<GenericNode>this.genericNode.gParams[0]).gParams[0];
                }
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('LazyRefBase.processResponse: LazyRef is collection of: ' + collTypeParam.name);
                }

                let lazyLoadedColl: any = this.session.createCollection(fieldEtc.lazyLoadedObjType, this.refererObj, this.refererKey)
                lodashSet(lazyLoadedColl, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
                try {
                    this.session.processJsHbResultEntityArrayInternal(collTypeParam, lazyLoadedColl, literalJsHbResult.result);
                    lazyLoadedObj$ = 
                        this.setLazyObjOnLazyLoadingNoNext(lazyLoadedColl)
                            .pipe(
                                this.session.keepIsOnLazyLoadRxOpr(
                                    lazyLoadedColl, 
                                    map(() => {
                                        return lazyLoadedColl;
                                    })
                                )
                            );
                } finally {
                    lodashSet(this.lazyLoadedObj, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                }
            } else if (fieldEtc.prpGenType.gType === LazyRefPrpMarker && fieldEtc.propertyOptions.lazyDirectRawRead && isResponseBodyStream) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead". Me:\n' + this);
                }
                if (!isResponseBodyStream) {
                    throw new Error('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" but "responselike.body" is not a Stream. Me:\n' +
                        this + '\nresponselike.body.constructor.name: ' +
                        (responselike && responselike.body && responselike.body.constructor.name? responselike.body.constructor.name: 'null'));
                }
                if (fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.debug('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" and has "IFieldProcessor.fromDirectRaw".');
                    }
                    let attachRefId = this.session.jsHbManager.jsHbConfig.cacheStoragePrefix + this.session.nextMultiPurposeInstanceId().toString();
                    let putOnCache$ = this.session.jsHbManager.jsHbConfig.cacheHandler.putOnCache(attachRefId, responselike.body as Stream);
                    let getFromCache$ = 
                        putOnCache$.pipe(
                            flatMap( () => {
                                return this.session.jsHbManager.jsHbConfig.cacheHandler.getFromCache(attachRefId);
                            })
                        );
                    const fromDirectRaw$ = 
                        getFromCache$.pipe(
                            flatMap( (cacheStream) => {
                                return fieldEtc.fieldProcessorCaller.callFromDirectRaw(cacheStream, fieldEtc.fieldInfo);
                            })
                        );
                    // lazyLoadedObj$ =
                    //     fromDirectRaw$
                    //         .pipe(
                    //             map((fromStreamValue) => {
                    //                 if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    //                     console.debug('LazyRefBase.processResponse: Async on "IFieldProcessor.fromDirectRaw" result. Me:\n' + this);
                    //                 }
                    //                 this.lazyRefPrpStoreOriginalliteralEntryIfNeeded(
                    //                     backendMetadatasRefererObj,
                    //                     fieldEtc,
                    //                     null,
                    //                     attachRefId);
                    //                 this.setLazyObjOnLazyLoadingNoNext(fromStreamValue);
                    //                 return fromStreamValue;
                    //             })
                    //         )
                    //         .pipe();
                    lazyLoadedObj$ =
                        fromDirectRaw$
                            .pipe(
                                this.session.keepIsOnRestoreRxOpr(
                                    flatMap((fromStreamValue) => {
                                        if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                                            console.debug('LazyRefBase.processResponse: Async on "IFieldProcessor.fromDirectRaw" result. Me:\n' + this);
                                        }
                                        this.lazyRefPrpStoreOriginalliteralEntryIfNeeded(
                                            backendMetadatasRefererObj,
                                            fieldEtc,
                                            null,
                                            attachRefId);
                                        return this.setLazyObjOnLazyLoadingNoNext(fromStreamValue)
                                            .pipe(
                                                map(() => {
                                                    return fromStreamValue;
                                                })
                                            );
                                    })
                                )
                            );
                } else {
                    if(Object.getOwnPropertyNames(fieldEtc.lazyRefGenericParam).lastIndexOf('pipe') < 0) {
                        throw new Error('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" and has no "IFieldProcessor.fromDirectRaw",'+
                            ' but this generic definition is LazyRepPrp<'+(fieldEtc.lazyRefGenericParam? fieldEtc.lazyRefGenericParam.name: '')+'>. Me:\n' +
                            this);
                    }
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.debug('LazyRefBase.processResponse: LazyRef is "lazyDirectRawRead" and has NO "IFieldProcessor.fromDirectRaw". Using "responselike.body"');
                    }
                    lazyLoadedObj$ = 
                        this.setLazyObjOnLazyLoadingNoNext(responselike.body as L)
                            .pipe(
                                map(() => {
                                    return responselike.body;
                                })
                            );
                }
            } else if (
                    (fieldEtc.prpGenType.gType === LazyRefPrpMarker && !fieldEtc.propertyOptions.lazyDirectRawRead)
                    || (fieldEtc.prpGenType.gType === LazyRefPrpMarker && fieldEtc.propertyOptions.lazyDirectRawRead && !isResponseBodyStream)) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('LazyRefBase.processResponse: (LazyRefPrp is NOT "lazyDirectRawRead") or '+
                        '(LazyRefPrp is "lazyDirectRawRead" and "responseLike.body" is not a Stream). Is it rigth?! Me:\n' + this);
                }
                if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.debug('LazyRefBase.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has "IFieldProcessor.fromLiteralValue".');
                    }
                    const fromLiteralValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(responselike.body, fieldEtc.fieldInfo);
                    lazyLoadedObj$ =
                        fromLiteralValue$.pipe(
                            flatMap((fromLiteralValue) => {
                                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                                    console.debug('LazyRefBase.processResponse: Async on "IFieldProcessor.fromLiteralValue" result. Me:\n' + this);
                                }
                                this.lazyRefPrpStoreOriginalliteralEntryIfNeeded(
                                    backendMetadatasRefererObj,
                                    fieldEtc,
                                    literalJsHbResult,
                                    null);
                                return this.setLazyObjOnLazyLoadingNoNext(fromLiteralValue)
                                    .pipe(
                                        map( () => {
                                            return fromLiteralValue;
                                        })
                                    );
                            })
                        );
                } else {
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.debug('LazyRefBase.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has NO "IFieldProcessor.fromLiteralValue". Using "responselike.body"');
                    }
                    lazyLoadedObj$ = 
                        this.setLazyObjOnLazyLoadingNoNext(responselike.body)
                            .pipe(map(() => {
                                return responselike.body;
                            }));
                }
            } else {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('LazyRefBase.processResponse: LazyRef for a relationship. Me:\n' + this);
                }
                let processedEntity = this.session.processJsHbResultEntityInternal(fieldEtc.lazyLoadedObjType, literalJsHbResult.result)
                lazyLoadedObj$ = 
                    this.setLazyObjOnLazyLoadingNoNext(processedEntity)
                        .pipe(
                            map(() => {
                                return processedEntity;
                            })
                        );
                //was the only way I found to undock the Observable<L> from the Observable<Response>
                //  The side effect of this is that map() called before this exchange is
                //  not piped with new Observable.
            }
        }
        if (this.signatureStr && !lazyLoadedObj$) {
            if (!this.session.isOnRestoreEntireStateFromLiteral()) {
                //if (!lodashHas(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                if (!backendMetadatasRefererObj.$signature$ && !backendMetadatasRefererObj.$isComponentHibernateId$) {
                    throw new Error('The referer object has no backendMetadatasRefererObj.signature. This should not happen. Me:\n' + this);
                } else {
                    //this.refererObj is a component.
                    if (isLazyRefOfCollection) {

                    }
                }
                //let ownerSignatureStr = lodashGet(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName);
                //if (!ownerSignatureStr) {
                if (!backendMetadatasRefererObj.$signature$) {
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.debug('LazyRefBase.processResponse: (!backendMetadatasRefererObj.signature): owner entity not found for LazyRef, the owner must be a hibernate component. Me:\n' + this);
                    }
                }
                let thisLocal = this;
                this.session.storeOriginalLiteralEntry(
                    {
                        method: 'lazyRef',
                        //ownerSignatureStr: ownerSignatureStr,
                        ownerSignatureStr: backendMetadatasRefererObj.$signature$,
                        ownerFieldName: this.refererKey,
                        literalJsHbResult: literalJsHbResult,
                        ref: {
                            iAmAJsHbEntityRef: true,
                            signatureStr: thisLocal.signatureStr
                        }
                    }
                );
            }
            if (fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.group('LazyRefBase.processResponse: Not LazyRefPrp, keeping reference by signature ' + this.signatureStr);
                    console.debug(this.lazyLoadedObj);
                    console.groupEnd();
                }
                this.session.tryCacheInstanceBySignature(
                    {
                        realInstance: this.lazyLoadedObj,
                        literalJsHbResult: literalJsHbResult,
                        lazySignature: this.signatureStr
                    }
                );
            } else {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.trace('LazyRefBase.processResponse: IS LazyRefPrp, NOT keeping reference by signature. Me:\n' + this);
                }
            }
        }

        if (!lazyLoadedObj$) {
            lazyLoadedObj$ = of(this.lazyLoadedObj);
        }

        lazyLoadedObj$ = 
            lazyLoadedObj$.pipe(
                this.session.keepIsOnRestoreRxOpr(
                    map( (lazyLoadedObjValue) => {
                        if (this.respObs && this.session.isOnRestoreEntireStateFromLiteral()) {
                            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                                console.group('LazyRefBase.processResponse: changing "this.respObs"'+
                                    ' to null because "this.session.isOnRestoreEntireStateFromLiteral()"\n' + this);
                                console.debug(this.lazyLoadedObj);
                                console.groupEnd();
                            }
                            this.respObs = null;
                        }
    
                        return lazyLoadedObjValue;
                    })
                )
            );

        return lazyLoadedObj$;
    }

    private lazyRefPrpStoreOriginalliteralEntryIfNeeded(backendMetadatasRefererObj: JsHbBackendMetadatas, fieldEtc: FieldEtc<L, any>, literalJsHbResult: any, attachRefId: string): void {
        let result$: Observable<void>;
        if (!this.session.isOnRestoreEntireStateFromLiteral()) {
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.debug('LazyRefBase.processResponse: Storing LazyRefPrp. Me:\n' + this);
            }
            let thisLocal = this;
            if (attachRefId) {
                this.session.storeOriginalLiteralEntry(
                    {
                        method: 'lazyRef',
                        ownerSignatureStr: backendMetadatasRefererObj.$signature$,
                        ownerFieldName: this.refererKey,
                        attachRefId: attachRefId,
                        ref: {
                            iAmAJsHbEntityRef: true,
                            signatureStr: thisLocal.signatureStr
                        }
                    }
                );
            } else {
                this.session.storeOriginalLiteralEntry(
                    {
                        method: 'lazyRef',
                        ownerSignatureStr: backendMetadatasRefererObj.$signature$,
                        ownerFieldName: this.refererKey,
                        literalJsHbResult: literalJsHbResult,
                        ref: {
                            iAmAJsHbEntityRef: true,
                            signatureStr: thisLocal.signatureStr
                        }
                    }
                );
            }
        }
        if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
            console.group('LazyRefBase.processResponse: Storing LazyRefPrp, keeping reference by signature ' + this.signatureStr);
            console.debug(this.lazyLoadedObj);
            console.groupEnd();
        }
        if (fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            this.session.tryCacheInstanceBySignature(
                {
                    realInstance: this.lazyLoadedObj,
                    literalJsHbResult: literalJsHbResult,
                    lazySignature: this.signatureStr
                }
            );
        }
    }

    subscribeToModify(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void) {
        const thisLocal = this;

        let nextModifierCallback: (value: L) => void = null;

        let nextModifierNewCallback: PartialObserver<L> | ((value: L) => void) = null;
        if (!this.isLazyLoaded()) { //isso sim significa que ainda nao foi carregado.
            //AAAAASYNCHRONOUS!!!
            if (observerOrNext instanceof Subscriber) {
                nextModifierNewCallback = observerOrNext;
                nextModifierCallback = (<Subscriber<L>>observerOrNext).next;
                (<Subscriber<L>>observerOrNext).next = (value: L) => {
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('(Asynchronous) LazyRef.subscribeToChange() => modifiedNext, (thisLocal.respObs != null)');
                        console.debug('calling nextOriginal()'); console.debug('this.subscriptionToChange.unsubscribe()'); console.debug('this.next()\n' + this); console.debug(thisLocal.lazyLoadedObj);
                        console.groupEnd();
                    }
                    thisLocal.setLazyObjOnLazyLoadingNoNext(value);
                    //propety set and collection add will call session.notifyAllLazyrefsAboutEntityModification()
                    // this will cause infinit recursion, so call session.switchOffNotifyAllLazyrefs
                    thisLocal.session.switchOffNotifyAllLazyrefs(thisLocal.lazyLoadedObj);
                    //call that will change the data Asynchronously
                    nextModifierCallback(thisLocal.lazyLoadedObj);
                    //no more problems with infinite recursion
                    thisLocal.session.switchOnNotifyAllLazyrefs(thisLocal.lazyLoadedObj);

                    //this ensures that the change command will not be called twice.
                    this.subscriptionToChangeUnsubscribe();
                    //here all other previous subscribes will be called. Pipe async's for example
                    thisLocal.next(thisLocal.lazyLoadedObj);
                };
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('Keeping Subscription from this.subscribe(observerOrNextNovo) on this.subscriptionToChange to make an unsubscribe() at the end of modifiedNext callback\n' + this);
                }
                //this.session.addAsyncTaskWaiting(this);
                this.subscriptionToChange = this.subscribe(nextModifierNewCallback);
            } else {
                nextModifierCallback = <(value: L) => void>observerOrNext;
                nextModifierNewCallback = (value: L) => {
                    //isso garante que o comando de alteracao nao sera chamado duas vezes.
                    thisLocal.subscriptionToChangeUnsubscribe();
                    thisLocal.setLazyObjOnLazyLoadingNoNext(value);
                    //propety set and collection add will call session.notifyAllLazyrefsAboutEntityModification()
                    // this will cause infinit recursion, so call session.switchOffNotifyAllLazyrefs
                    thisLocal.session.switchOffNotifyAllLazyrefs(thisLocal.lazyLoadedObj);
                    //call that will change the data Asynchronously
                    nextModifierCallback(thisLocal.lazyLoadedObj);
                    //no more problems with infinite recursion
                    thisLocal.session.switchOnNotifyAllLazyrefs(thisLocal.lazyLoadedObj);

                    //aqui todos os outros subscribes anteriores serao chamados. Os pipe async's por exemplo
                    thisLocal.next(thisLocal.lazyLoadedObj);
                };
                //this.session.addAsyncTaskWaiting(this);
                this.subscriptionToChange = this.subscribe(<(value: L) => void>nextModifierNewCallback, error, complete);
            }
        } else {
            //SSSSSYNCHRONOUS!!!
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.group('(Synchronous) LazyRef.subscribeToChange()');
                console.debug('calling nextOriginal()'); console.debug('this.next()\n' + this);;
                console.groupEnd();
            }
            if (observerOrNext instanceof Subscriber) {
                nextModifierNewCallback = observerOrNext;
                nextModifierCallback = (<Subscriber<L>>observerOrNext).next;
                //chamada que ira alterar os dados Sincronamente
                nextModifierCallback(thisLocal.lazyLoadedObj);
                //aqui todos os outros observer's anteriores serao chamados. Os pipe async's por exemplo
                thisLocal.next(thisLocal.lazyLoadedObj);
            } else {
                nextModifierCallback = <(value: L) => void>observerOrNext;
                //chamada que ira alterar os dados Sincronamente
                nextModifierCallback(thisLocal.lazyLoadedObj);
                //aqui todos os outros observer's anteriores serao chamados. Os pipe async's por exemplo
                thisLocal.next(thisLocal.lazyLoadedObj);
            }
        }
    }
    public get hbId(): I {
        return this._hbId;
    }
    public get lazyLoadedObj(): L {
        return this._lazyLoadedObj;
    }
    public get signatureStr(): string {
        return this._signatureStr;
    }
    public set hbId(value: I) {
        this._hbId = value;
    }
    public set signatureStr(value: string) {
        this._signatureStr = value;
    }
    public get respObs(): Observable<ResponseLike<Object>> {
        return this._respObs;
    }
    public set respObs(value: Observable<ResponseLike<Object>>) {
        this._respObs = value;
    }

    private _fieldProcessorEvents: IFieldProcessorEvents<L> = {}

    /** Framework internal use. */
    public get fieldProcessorEvents():
        {
            onFromDirectRaw?: (streamResponse: Stream|String, info: FieldInfo, obs: Observable<L>) => void,
            onToLiteralValue?: (value: any, info: FieldInfo, obs: Observable<L>) => void
        } { return this._fieldProcessorEvents; }

    private set flatMapCallback(value: (response: ResponseLike<L>) => Observable<L>) {
        this._flatMapCallback = value;
    }

    private get flatMapCallback(): (response: ResponseLike<L>) => Observable<L> {
        if (!this._flatMapCallback) {
            this._flatMapCallback = (response) => {
                let lReturn = this.processResponseOnLazyLoading(response);
                return lReturn;
            };
        }
        return this._flatMapCallback;
    }
    
	public get refererObj(): any {
		return this._refererObj;
	}
	public set refererObj(value: any) {
		this._refererObj = value;
	}
	public get refererKey(): string {
		return this._refererKey;
	}
	public set refererKey(value: string) {
		this._refererKey = value;
    }
	public get session(): IJsHbSession {
		return this._session;
	}
	public set session(value: IJsHbSession) {
		this._session = value;
    }
    public get genericNode(): GenericNode {
		return this._genericNode;
	}
	public set genericNode(value: GenericNode) {
		this._genericNode = value;
	}    
}