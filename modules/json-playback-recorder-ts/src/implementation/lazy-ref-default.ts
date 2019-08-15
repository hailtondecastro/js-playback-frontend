import { Observable, Subscription, Subscriber, of, OperatorFunction, PartialObserver, ObservableInput } from 'rxjs';
import { RecorderLogLevel } from '../api/recorder-config';
import { flatMap, map, finalize, tap, share } from 'rxjs/operators';
import { RecorderConstants } from './recorder-constants';
import { RecorderManagerDefault } from './recorder-manager-default';
import { FieldEtc } from './field-etc';
import { flatMapJustOnceRxOpr, combineFirstSerial } from './rxjs-util';
import { TypeLike } from '../typeslike';
import { ResponseLike } from '../typeslike';
import { PlayerMetadatas } from '../api/player-metadatas';
import { LazyRef, LazyRefPrpMarker } from '../api/lazy-ref';
import { GenericNode } from '../api/generic-tokenizer';
import { RecorderSession, OriginalLiteralValueEntry, PlayerSnapshot } from '../api/session';
import { IFieldProcessorEvents } from '../api/field-processor';
import { RecorderSessionImplementor } from './recorder-session-default';
import { RecorderLogger } from '../api/recorder-config';
import { TapeActionType, TapeAction } from '../api/tape';
import { TapeActionDefault } from './tape-default';
import { LodashLike } from './lodash-like';

// export interface StringStream extends NodeJS.ReadableStream, NodeJS.WritableStream {
//            /**
//              * Event emitter
//              * The defined events on documents including:
//              * 1. close
//              * 2. data
//              * 3. end
//              * 4. readable
//              * 5. error
//              */
//             addListener(event: "close", listener: () => void): this;
//             addListener(event: "data", listener: (chunk: string) => void): this;
//             addListener(event: "end", listener: () => void): this;
//             addListener(event: "readable", listener: () => void): this;
//             addListener(event: "error", listener: (err: Error) => void): this;
//             addListener(event: string | symbol, listener: (...args: any[]) => void): this;

//             emit(event: "close"): boolean;
//             emit(event: "data", chunk: any): boolean;
//             emit(event: "end"): boolean;
//             emit(event: "readable"): boolean;
//             emit(event: "error", err: Error): boolean;
//             emit(event: string | symbol, ...args: any[]): boolean;

//             on(event: "close", listener: () => void): this;
//             on(event: "data", listener: (chunk: string) => void): this;
//             on(event: "end", listener: () => void): this;
//             on(event: "readable", listener: () => void): this;
//             on(event: "error", listener: (err: Error) => void): this;
//             on(event: string | symbol, listener: (...args: any[]) => void): this;

//             once(event: "close", listener: () => void): this;
//             once(event: "data", listener: (chunk: any) => void): this;
//             once(event: "end", listener: () => void): this;
//             once(event: "readable", listener: () => void): this;
//             once(event: "error", listener: (err: Error) => void): this;
//             once(event: string | symbol, listener: (...args: any[]) => void): this;

//             prependListener(event: "close", listener: () => void): this;
//             prependListener(event: "data", listener: (chunk: string) => void): this;
//             prependListener(event: "end", listener: () => void): this;
//             prependListener(event: "readable", listener: () => void): this;
//             prependListener(event: "error", listener: (err: Error) => void): this;
//             prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

//             prependOnceListener(event: "close", listener: () => void): this;
//             prependOnceListener(event: "data", listener: (chunk: string) => void): this;
//             prependOnceListener(event: "end", listener: () => void): this;
//             prependOnceListener(event: "readable", listener: () => void): this;
//             prependOnceListener(event: "error", listener: (err: Error) => void): this;
//             prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

//             removeListener(event: "close", listener: () => void): this;
//             removeListener(event: "data", listener: (chunk: string) => void): this;
//             removeListener(event: "end", listener: () => void): this;
//             removeListener(event: "readable", listener: () => void): this;
//             removeListener(event: "error", listener: (err: Error) => void): this;
//             removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
// }

// /**
//  * Base class to use as marker for {@link reflect-metadata#Reflect.metadata} with 
//  * {@link ./generic-tokenizer#GenericTokenizer GenericTokenizer}.
//  * 
//  * Do not use this as the field type, use {@link LazyRefMTO} or {@link LazyRefOTM}.
//  * Use this as 'interface like' to do your own implementation if you need! 
//  * See {@link RecorderSession#createApropriatedLazyRef}
//  * 
//  * Code sample:
//  * ```ts
//    ...
//    private _myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>>;
//    @RecorderDecorators.property()
//    @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(Set).lt().tp(MyChildEntity).gt().gt().tree))
//    public get myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>> {
//      return this._myChildEntitiesSet;
//    }
//    ...
//  * ```
//  * or
//  * ```ts
//    ...
//    private _myParentEntity(): LazyRefMTO<MyParentEntity, Number>;
//    @RecorderDecorators.property()
//    @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MyParentEntity).comma().tp(Number).gt().tree))
//    public get myParentEntity(): LazyRefMTO<MyParentEntity, Number> {
//      return this._myParentEntity;
//    }
//    ...
//  * ```
//  */
// export class JsHbLazyRef<L extends object, I> extends LazyRef<L, I> {
//     /**
//      * Alternative to instance of.
//      */
//     iAmLazyRef: boolean = true;
//     /**
//      * Attache id that will be used on lazyDirectRawRead and 
//      */
//     attachRefId: string;

//     /**
//      * Player object Id. This is accessible even before lazy loading.
//      */
//     playerObjectId: I;
//     /**
//      * Signature identifier generated by backend server.
//      */
//     signatureStr: string;
//     bMdRefererObj: PlayerMetadatas;
//     bMdLazyLoadedObj: PlayerMetadatas;
//     bMdPlayerObjectIdMetadata: PlayerMetadatas;

//     consoleLike: ConsoleLike;
// 	consoleLikeSubs: ConsoleLike;
//     consoleLikeProcResp: ConsoleLike;
//     /**
//      * Unlike the common subscribe, which must be executed every time the data
//      * changed, it is only executed once and triggers a next to
//      * that all other subscriptions (pipe async's for example) are called.
//      * so it does not return Subscription, after all it does not subscribe permanently
//      * on the observer's list.  
//      * Call {@link RecorderSession#notifyAllLazyrefsAboutEntityModification} after modification and {@link Subscription#unsubscribe}.
//      * @param observerOrNext
//      * @param error
//      * @param complete
//      */
//     subscribeToModify(observer?: PartialObserver<L>): void;
//     subscribeToModify(next?: (value: L) => void, error?: (error: any) => void, complete?: () => void): void;
//     subscribeToModify(): void { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); }
//     /**
//      * TODO:
//      * @param lazyLoadedObj 
//      */
//     setLazyObj(lazyLoadedObj: L): Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
//     /** Framework internal use. */
//     setLazyObjOnLazyLoading(lazyLoadedObj: L): Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
//     /** Framework internal use. */
//     setLazyObjNoNext(lazyLoadedObj: L) : Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
//     /** Framework internal use. */
//     setLazyObjOnLazyLoadingNoNext(lazyLoadedObj: L) : Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
//     /** Framework internal use. */
//     notifyModification(lazyLoadedObj: L) : void { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
//     /**
//      * true if it is lazy loaded.
//      * @returns true if it is lazy loaded.
//      */
//     isLazyLoaded(): boolean { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
//     /** 
//      * TODO:  
//      * Framework internal use.
//      */
//     processResponse(responselike: { body: any }): Observable<L> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
//     /** Framework internal use. */
//     get genericNode(): GenericNode {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
//     set genericNode(value: GenericNode) {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
// 	public get refererObj(): any {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
// 	public set refererObj(value: any) {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
// 	public get refererKey(): string {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
// 	public set refererKey(value: string) {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
// 	public get session(): RecorderSession {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
// 	public set session(value: RecorderSession) {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
// 	public get lazyLoadedObj(): L {
// 		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
//     public get respObs(): Observable<HttpResponseLike<Object>> {
//         throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
//     public set respObs(value: Observable<HttpResponseLike<Object>>) {
//         throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }
//     /** Framework internal use. */
//     public get fieldProcessorEvents(): IFieldProcessorEvents<L> {
//         throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
//     }

//     public toString(): string {
//         let thisLocal = this;
//         return JSON.stringify(
//             {
//                 instanceId: (thisLocal as any).instanceId,
//                 iAmLazyRef: thisLocal.iAmLazyRef,
//                 refererKey: thisLocal.refererKey,
//                 refererObj:
//                     thisLocal.refererObj
//                         && thisLocal.refererObj.constructor
//                         && thisLocal.refererObj.constructor.name ?
//                     thisLocal.refererObj.constructor.name
//                     : null,
//                 "isLazyLoaded()": thisLocal.isLazyLoaded(),
//                 genericNode: thisLocal.genericNode? thisLocal.genericNode.toString(): null,
//                 signatureStr: thisLocal.signatureStr
//             },
//             null,
//             2);
//     }
// }

export class LazyRefImplementor<L extends object, I> extends LazyRef<L, I> {
    setLazyObj(lazyLoadedObj: L): Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    setLazyObjOnLazyLoading(lazyLoadedObj: L): Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    setLazyObjNoNext(lazyLoadedObj: L) : Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    setLazyObjOnLazyLoadingNoNext(lazyLoadedObj: L) : Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** Framework internal use. */
    notifyModification(lazyLoadedObj: L) : void { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /** 
     * TODO:  
     * Framework internal use.
     */
    processResponse(responselike: ResponseLike<PlayerSnapshot | NodeJS.ReadStream>): Observable<L> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
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
	public get session(): RecorderSession {
		throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!');
    }
    /** Framework internal use. */
	public set session(value: RecorderSession) {
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
 * Default implementation!  
 * See {@link LazyRef}
 */
export class LazyRefDefault<L extends object, I> extends LazyRefImplementor<L, I> {

    private notificationStartTime: number = Date.now();
    private notificationCount: number = 0;

    private _instanceId: number;
	public get instanceId(): number {
		return this._instanceId;
	}
	public set instanceId(value: number) {
		this._instanceId = value;
	}

    private _playerObjectId: I;
    private _lazyLoadedObj: L;
    private _genericNode: GenericNode;
    private _signatureStr: string;
    private _respObs: Observable<ResponseLike<Object>>;
    private _refererObj: any;
    private _refererKey: string;
    private _session: RecorderSessionImplementor;

    constructor(session: RecorderSessionImplementor) {
        super();
        const thisLocal = this;
        this._session = session;
        thisLocal.consoleLike = this.session.manager.config.getConsole(RecorderLogger.LazyRef);
        thisLocal.consoleLikeProcResp = this.session.manager.config.getConsole(RecorderLogger.LazyRefBaseProcessResponse);
        thisLocal.consoleLikeSubs = this.session.manager.config.getConsole(RecorderLogger.LazyRefSubscribe);
        this._lazyLoadedObj = null;
    }

    private _isOnLazyLoading: boolean = false;

    private flatMapKeepAllFlagsRxOprPriv<T, R>(
        when: 'justOnce' | 'eachPipe',
        project: (value: T, index?: number) => ObservableInput<R>,
        concurrent?: number): OperatorFunction<T, R> {
        const thisLocal = this;
        const syncIsOn = thisLocal._isOnLazyLoading;
        const syncIsOn2 = this._needCallNextOnSetLazyObj;
        const isPipedCallbackDone = { value: false, result: null as ObservableInput<R> };
        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;

                    const asyncIsOn = thisLocal._isOnLazyLoading;
                    const asyncIsOn2 = thisLocal._needCallNextOnSetLazyObj;

                    thisLocal._isOnLazyLoading = syncIsOn;
                    thisLocal._needCallNextOnSetLazyObj = syncIsOn2;
                    try {
                        isPipedCallbackDone.result = project(value, index);
                    } finally {
                        thisLocal._isOnLazyLoading = asyncIsOn;
                        thisLocal._needCallNextOnSetLazyObj = asyncIsOn2;
                    }
                }
                return isPipedCallbackDone.result;
            };
            return source
                .pipe(
                    flatMap(projectExtentend, concurrent)
                );
        }

        return newOp;
    }
    private flatMapKeepAllFlagsRxOpr<T, R>(project: (value: T, index?: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R> {
        return this.flatMapKeepAllFlagsRxOprPriv('eachPipe', project);
    }
    private flatMapJustOnceKeepAllFlagsRxOpr<T, R>(project: (value: T, index?: number) => ObservableInput<R>,
    concurrent?: number): OperatorFunction<T, R> {
        return this.flatMapKeepAllFlagsRxOprPriv('justOnce', project);
    }

    private mapKeepAllFlagsRxOprHelper<T, R>(when: 'justOnce' | 'eachPipe', project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R> {
        const thisLocal = this;
        const syncIsOn = this._isOnLazyLoading;
        const syncIsOn2 = this._needCallNextOnSetLazyObj;
        const isPipedCallbackDone = { value: false, result: null as R};
        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;
                    const asyncIsOn = thisLocal._isOnLazyLoading;
                    const asyncIsOn2 = thisLocal._needCallNextOnSetLazyObj;
                    thisLocal._isOnLazyLoading = syncIsOn;
                    thisLocal._needCallNextOnSetLazyObj = syncIsOn2;
                    try {
                        isPipedCallbackDone.result = project(value, index);
                    } finally {
                        thisLocal._isOnLazyLoading = asyncIsOn;
                        thisLocal._needCallNextOnSetLazyObj = asyncIsOn2;
                    }
                }
                return isPipedCallbackDone.result;
            }
            return source
                .pipe(
                    map(projectExtentend)
                );

        }

        return newOp;
    }
    private mapKeepAllFlagsRxOpr<T, R>(project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R> {
        return this.mapKeepAllFlagsRxOprHelper('eachPipe', project);
    }
    private mapJustOnceKeepAllFlagsRxOpr<T, R>(project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R> {
        return this.mapKeepAllFlagsRxOprHelper('justOnce', project);
    }

    public setLazyObjOnLazyLoading(lazyLoadedObj: L): Observable<void> {
        const thisLocal = this;
        let result$ = this.lazyLoadingCallbackTemplate( () => {
            return of(null).pipe(
                thisLocal.flatMapKeepAllFlagsRxOpr(() => {
                    return thisLocal.setLazyObj(lazyLoadedObj);
                }),
                share()
            )
        });
        return result$;

        // const isSynchronouslyDone = { value: false, result: null as void};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );


        // if (isSynchronouslyDone.value) {
        //     return of(isSynchronouslyDone.result);
        // } else {
        //     return result$;
        // }
    }

    public isLazyLoaded(): boolean { 
        return this.respObs == null && this.lazyLoadedObj != null;
    };

    private _needCallNextOnSetLazyObj: boolean = true;

    public setLazyObjOnLazyLoadingNoNext(lazyLoadedObj: L): Observable<void> {
        const thisLocal = this;
        let result$ = this.noNextCallbackTemplate(() => {
            return this.lazyLoadingCallbackTemplate(() => {
                return of(null).pipe(
                    thisLocal.flatMapKeepAllFlagsRxOpr(() => {
                        return thisLocal.setLazyObj(lazyLoadedObj);
                    }),
                    share()
                );
            });
        });
        return result$;
        // const isSynchronouslyDone = { value: false, result: null as void};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        
        // if (isSynchronouslyDone.value) {
        //     return of(isSynchronouslyDone.result);
        // } else {
        //     return result$;
        // }
    }

    public setLazyObjNoNext(lazyLoadedObj: L): Observable<void> {
        const thisLocal = this;
        let result$ = this.noNextCallbackTemplate(() => {
            return of(null).pipe(
                thisLocal.flatMapKeepAllFlagsRxOpr(() => {
                    return thisLocal.setLazyObj(lazyLoadedObj);
                }),
                share()
            );
        });

        return result$;
        // const isSynchronouslyDone = { value: false, result: null as void};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (isSynchronouslyDone.value) {
        //     return of(isSynchronouslyDone.result);
        // } else {
        //     return result$;
        // }
    }

    public notifyModification(lazyLoadedObj: L) : void {
        this.notificationCount++;
        let currentLazyRefNotificationTimeMeasurement = Date.now() - this.notificationStartTime;
        if (currentLazyRefNotificationTimeMeasurement > this.session.manager.config.lazyRefNotificationTimeMeasurement 
                ||this.notificationCount > this.session.manager.config.lazyRefNotificationCountMeasurement) {
            let speedPerSecond = (this.notificationCount / currentLazyRefNotificationTimeMeasurement) * 1000;
            this.notificationStartTime = Date.now();
            this.notificationCount = 0;
            if (speedPerSecond > this.session.manager.config.maxLazyRefNotificationPerSecond) {
                throw new Error('Max notications per second exceded: ' +
                    speedPerSecond + '. Are you modifing any persistent '+
                    'entity or collection on subscribe() instead of '+
                    'subscribeToModify() or '+
                    'is IConfig.maxLazyRefNotificationPerSecond, '+
                    this.session.manager.config.maxLazyRefNotificationPerSecond +
                    ', misconfigured? Me:\n' +
                    this);
            }
        }
        this.next(lazyLoadedObj);
    }

    private processResponseOnLazyLoading(responselike: { body: any }): Observable<L> {
        const thisLocal = this;
        let result$ = this.lazyLoadingCallbackTemplate(() => {
            return thisLocal.processResponse(responselike);
        })

        return result$.pipe(
            share()
        )

        // const isSynchronouslyDone = { value: false, result: null as L};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (isSynchronouslyDone.value) {
        //     return of(isSynchronouslyDone.result);
        // } else {
        //     return result$;
        // }
    }

    private lazyLoadingCallbackTemplate<R>(callback: () => R): R {
        try {
            this._isOnLazyLoading = true;
            return callback();
        } finally {
            this._isOnLazyLoading = false;
        }
    }

    // private lazyLoadingCallbackAsyncTemplate<R>(callback: () => Observable<R>): Observable<R> {
    //     const thisLocal = this;
    //     this._isOnLazyLoading = true;
    //     return callback().pipe(finalize(() => {
    //         thisLocal._isOnLazyLoading = false;
    //     }));
    // }

    private noNextCallbackTemplate<R>(callback: () => R): R {
        try {
            this._needCallNextOnSetLazyObj = false;
            return callback();
        } finally {
            this._needCallNextOnSetLazyObj = true;
        }
    }

    // private noNextCallbackAsyncTemplate<R>(callback: () => Observable<R>): Observable<R> {
    //     const thisLocal = this;
    //     this._needCallNextOnSetLazyObj = false;
    //     return callback().pipe(finalize(() => {
    //         thisLocal._needCallNextOnSetLazyObj = false;
    //     }));
    // }

    public setLazyObj(lazyLoadedObj: L): Observable<void> {
        const thisLocal = this;
        const asyncCombineObsArr: Observable<any>[] = [];
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        if (!fieldEtc.propertyOptions){
            throw new Error('@RecorderDecorators.property() not defined for ' + this.refererObj.constructor.name + '.' + this.refererKey);
        }
        //Validating
        if (!this.refererObj || !this.refererKey) {
            throw new Error('The property \'' + this.refererKey + ' has no refererObj or refererKey' + '. Me:\n' + this);
        }
        if (fieldEtc.prpGenType == null) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not decorated with com \'@Reflect.metadata("design:generics", GenericTokenizer\'...' + '. Me:\n' + this);
        }
        if (fieldEtc.prpGenType.gType !== LazyRef && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not LazyRef. Me:\n' + this);
        }
        if ((fieldEtc.otmCollectionType === Set || fieldEtc.otmCollectionType === Array) && !this._isOnLazyLoading) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' can not be changed because this is a collection: \'' + fieldEtc.otmCollectionType.name + '\'' + '. Me:\n' + this);
        }

        //null to response.
        this.respObs = null;
        const isValueByFieldProcessor: {value: boolean} = { value: false };

        if (!this.session.isOnRestoreEntireStateFromLiteral() && !this._isOnLazyLoading) {
            if (!this.session.isRecording()){
                throw new Error('Invalid operation. It is not recording. Is this Error correct?! Me:\n' + this);
            }
            if (this.lazyLoadedObj !== lazyLoadedObj) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('LazyRefDefault.setLazyObj()' +
                        '(this.lazyLoadedObj === lazyLoadedObj)\n' +
                        'NOT recording action: ' + TapeActionType.SetField + '. actual and new value: ');
                    thisLocal.consoleLike.debug(this.lazyLoadedObj);
                    thisLocal.consoleLike.debug(lazyLoadedObj);
                    thisLocal.consoleLike.groupEnd();
                }

                let mdRefererObj = this.bMdRefererObj;
                let mdLazyLoadedObj = this.bMdLazyLoadedObj;

                //recording tape
                const action: TapeAction = new TapeActionDefault();
                action.fieldName = this.refererKey;
                action.actionType = TapeActionType.SetField;
                if (mdRefererObj.$signature$) {
                    action.ownerSignatureStr = mdRefererObj.$signature$;
                } else if (LodashLike.has(this.refererObj, this.session.manager.config.creationIdName)) {
                    action.ownerCreationRefId = LodashLike.get(this.refererObj, this.session.manager.config.creationIdName) as number;
                } else if (!this._isOnLazyLoading && !mdRefererObj.$isComponentPlayerObjectId$) {
                    throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' has a not managed owner. Me:\n' + this);
                }

                if (lazyLoadedObj != null) {
                    if (mdLazyLoadedObj.$signature$) {
                        action.settedSignatureStr = mdLazyLoadedObj.$signature$;
                    } else if (LodashLike.has(lazyLoadedObj, this.session.manager.config.creationIdName)) {
                        action.settedCreationRefId = LodashLike.get(lazyLoadedObj, this.session.manager.config.creationIdName) as number;
                    } else if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
                        //nothing for now!
                    } else if (!this._isOnLazyLoading) {
                        throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\'.  lazyLoadedObj is not managed: \'' + lazyLoadedObj.constructor.name + '\'' + '. Me:\n' + this);
                    }
                }

                if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {                    
                    if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                        isValueByFieldProcessor.value = true;
                        let processTapeActionAttachRefId$ = thisLocal.session.processTapeActionAttachRefId({fieldEtc: fieldEtc, value: lazyLoadedObj, action: action, propertyKey: thisLocal.refererKey});
                        //processTapeActionAttachRefId$ = processTapeActionAttachRefId$.pipe(thisLocal.session.addSubscribedObsRxOpr());
                        processTapeActionAttachRefId$ = processTapeActionAttachRefId$.pipe(
                            tap((ptaariValue) => {
                                if(!ptaariValue.asyncAddTapeAction) {
                                    thisLocal.session.addTapeAction(action);
                                }
                                this.mayDoNextHelper(isValueByFieldProcessor, fieldEtc, ptaariValue.newValue);
                            })
                        );
                        asyncCombineObsArr.push(processTapeActionAttachRefId$);
                    } else if (fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callToLiteralValue) {
                        isValueByFieldProcessor.value = true;
                        let toLiteralValue$ = fieldEtc.fieldProcessorCaller.callToLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo);
                        // toLiteralValue$ = toLiteralValue$.pipe(this.session.addSubscribedObsRxOpr());
                        toLiteralValue$ = toLiteralValue$.pipe(
                            tap(
                                {
                                    next: value => {
                                        action.simpleSettedValue = value;
                                        thisLocal.session.addTapeAction(action);
                                    }
                                }
                            ),
                            thisLocal.session.registerProvidedObservablesRxOpr(),
                            share()
                        );
                        asyncCombineObsArr.push(toLiteralValue$);
                    } else {
                        this.session.addTapeAction(action);
                    }
                }
            } else {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('LazyRefDefault.setLazyObj()' +
                        '(this.lazyLoadedObj !== lazyLoadedObj)\n'+
                        'Recording action: ' + TapeActionType.SetField + '. value: ');
                    thisLocal.consoleLike.debug(lazyLoadedObj);
                    thisLocal.consoleLike.groupEnd();
                }
            }
        }

        if (!isValueByFieldProcessor.value && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            if (this.lazyLoadedObj !== lazyLoadedObj) {
                if (this.lazyLoadedObj) {
                    this.session.unregisterEntityAndLazyref(this.lazyLoadedObj, this);
                }
            }
        } else {
        }
        this.mayDoNextHelper(isValueByFieldProcessor, fieldEtc, lazyLoadedObj);
        
        // this._lazyLoadedObj = lazyLoadedObj;
        // if (!isValueByFieldProcessor.value && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
        //     if (this.lazyLoadedObj) {
        //         this.session.registerEntityAndLazyref(this.lazyLoadedObj, this);
        //     }
        // }

        // if (this._needCallNextOnSetLazyObj) {
        //     this.next(lazyLoadedObj);
        // }
        
        let asyncCombineArr$ = thisLocal.session.combineFirstSerialPreserveAllFlags(asyncCombineObsArr);
        return asyncCombineArr$.pipe(
            map(() => {
                return undefined;
            }),
            share()
        )

        // const isSynchronouslyDone = { value: false, result: null as any};
        // let asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
        //     map(() => {
        //         return isSynchronouslyDone.result;
        //     })
        // );
        // asyncCombineArr$ = asyncCombineArr$.pipe(
        //     tap((result)=> {
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = undefined;
        //     })
        // );
        // if (!isSynchronouslyDone.value) {
        //     return asyncCombineArr$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }

        // let createSerialAsyncTasksWaiting$ = this.session.createSerialAsyncTasksWaiting();

        // const isSynchronouslyDone = { value: false, result: null as void};
        // createSerialAsyncTasksWaiting$.subscribe((result)=>{
        //     isSynchronouslyDone.value = true;
        //     isSynchronouslyDone.result = result;
        // });

        // if (isSynchronouslyDone.value) {
        //     return of(isSynchronouslyDone.result).pipe();
        // } else {
        //     return createSerialAsyncTasksWaiting$.pipe();
        // }
    }

    private mayDoNextHelper(isValueByFieldProcessor: {value: boolean}, fieldEtc: FieldEtc<L, any>, newLazyLoadedObj: L) {
        if (newLazyLoadedObj !== this._lazyLoadedObj) {
            this._lazyLoadedObj = newLazyLoadedObj;
            if (!isValueByFieldProcessor.value && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
                if (this.lazyLoadedObj) {
                    this.session.registerEntityAndLazyref(this.lazyLoadedObj, this);
                }
            }

            if (this._needCallNextOnSetLazyObj) {
                this.next(this.lazyLoadedObj);
            }
        }
    }

    subscribe(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void): Subscription {
        const thisLocal = this;
        let resultSubs: Subscription = null;
        if (observerOrNext instanceof Subscriber) {
            resultSubs = super.subscribe(observerOrNext);
        } else {
            resultSubs = super.subscribe(<(value: L) => void>observerOrNext, error, complete);
        }
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        let observerOriginal: PartialObserver<L>;
        if ((observerOrNext as PartialObserver<L>).next
            || (observerOrNext as PartialObserver<L>).complete
            || (observerOrNext as PartialObserver<L>).error
            || (observerOrNext as PartialObserver<L>).next) {
            if (error || complete) {
                throw new Error('observerOrNext is a PartialObserver and error or complete are passed as parameter');
            }
            observerOriginal = observerOrNext as PartialObserver<L>;
        } else {
            observerOriginal = {
                next: observerOrNext as (value: L) => void,
                error: error,
                complete: complete
            }
        }
        let observerNew: PartialObserver<L> = {...observerOriginal};

        let setLazyObjOnLazyLoading$: Observable<void>;
        const thisLocalNextOnAsync = {value: false};

        if (thisLocal.lazyLoadedObj == null) {
            if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeSubs.debug(
                    '(thisLocal.lazyLoadedObj == null)\n'
                    +'It may mean that we have not subscribed yet in the Observable of Response');
            }
            if (this.respObs == null) {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.debug(
                        '(this.respObs == null)\n'
                        +'Means that we already subscribed to an earlier moment in the Observable of Reponse.\n'
                        +'We will simply call the super.subscribe');
                }
            } else if (this.session.getCachedBySignature(this.signatureStr)) {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.debug(
                        '(this.lazyLoadedObj == null && this.respObs != null && this.session.getCachedBySignature(this.signatureStr)\n'
                        +'Means that we already loaded this object by signature with another lazyRef.\n'
                        +'We will get from session signature cache call next()');
                }
                thisLocal.respObs = null;
                thisLocalNextOnAsync.value = true;
                setLazyObjOnLazyLoading$ = thisLocal.setLazyObjOnLazyLoading(<L> this.session.getCachedBySignature(this.signatureStr));
                setLazyObjOnLazyLoading$ = setLazyObjOnLazyLoading$.pipe(
                    tap(
                        {
                            next: () => {
                                if (!observerNew.closed) {
                                    observerNew.closed = true;
                                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). !observerNew.closed');
                                        thisLocal.consoleLikeSubs.debug('calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                        thisLocal.consoleLikeSubs.groupEnd();
                                    }
                                    //aqui o metodo original sera chamado
                                    thisLocal.next(thisLocal.lazyLoadedObj);
                                } else {
                                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). observerNew.closed');
                                        thisLocal.consoleLikeSubs.debug('NOT calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                        thisLocal.consoleLikeSubs.groupEnd();
                                    }
                                }
                            },
                            error: observerNew.error,
                            closed: observerNew.closed,
                            complete: observerNew.complete
                        }                    
                        // () => {                    
                        //     thisLocal.next(thisLocal.lazyLoadedObj);
                        // }
                        )
                    );
            } else {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.debug(
                        '(thisLocal.respObs != null)\n'
                        +'Means that we are not subscribed yet in the Observable of Reponse.\n'
                        +'this.respObs will be null after subscription, so we mark that '
                        +'there is already an inscription in the Response Observable, and we '+
                        'will not make two trips to the server');
                }
                let localObs$: Observable<L> = 
                    thisLocal.respObs
                        .pipe(thisLocal.session.logRxOpr('LazyRef_subscribe_respObs'))
                        .pipe(
                            flatMapJustOnceRxOpr(thisLocal.createFlatMapCallback())
                        );
                //so we will mark that you already hear an entry in the Response Observable, and we will not make two trips to the server.
                thisLocal.respObs = null;

                thisLocalNextOnAsync.value = true;
                observerNew.next = (value: L) => {
                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => observerNew.next()');
                        thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                        thisLocal.consoleLikeSubs.groupEnd();
                    }

                    setLazyObjOnLazyLoading$ = thisLocal.setLazyObjOnLazyLoadingNoNext(value);
                    // setLazyObjOnLazyLoading$ = this.session.addSubscribedObservableForWaiting(setLazyObjOnLazyLoading$);
                    // setLazyObjOnLazyLoading$ = setLazyObjOnLazyLoading$.pipe(this.session.addSubscribedObsRxOpr());
                    setLazyObjOnLazyLoading$ = setLazyObjOnLazyLoading$.pipe(
                        tap(
                            {
                                next: () => {
                                    if (!observerNew.closed) {
                                        if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                            thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). !observerNew.closed');
                                            thisLocal.consoleLikeSubs.debug('calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                            thisLocal.consoleLikeSubs.groupEnd();
                                        }
                                        observerNew.closed = true;
                                        //here the original method will be called
                                        thisLocal.next(thisLocal.lazyLoadedObj);
                                    } else {
                                        if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                            thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). observerNew.closed');
                                            thisLocal.consoleLikeSubs.debug('NOT calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                            thisLocal.consoleLikeSubs.groupEnd();
                                        }
                                    }
                                },
                                error: observerNew.error,
                                closed: observerNew.closed,
                                complete: observerNew.complete
                            }
                        )
                    );
                    setLazyObjOnLazyLoading$ = setLazyObjOnLazyLoading$.pipe(
                        share()
                    )
                    setLazyObjOnLazyLoading$.subscribe(() => {
                        //completed
                    })
                }

                thisLocalNextOnAsync.value = true;
                localObs$ = localObs$.pipe(
                    thisLocal.session.registerProvidedObservablesRxOpr(),
                    share()
                );
                localObs$.subscribe(observerNew);
            }
        } else {
            if (this.attachRefId) {
                //providing new readable (flipped) NodeJS.ReadableStream from cache
                if (fieldEtc.prpGenType.gType !== LazyRefPrpMarker || !fieldEtc.propertyOptions.lazyDirectRawRead) {
                    throw new Error('LazyRefBase.subscribe: LazyRefPrp has attachRefId bute has is no "lazyDirectRawRead" nor "LazyRefPrpMarker". Me:\n' +
                        this);
                }
                thisLocalNextOnAsync.value = true;
                let getFromCache$ = this.session.manager.config.cacheHandler.getFromCache(this.attachRefId);
                let fromDirectRaw$: Observable<L> =
                    getFromCache$
                        .pipe(
                            flatMapJustOnceRxOpr((stream) => {
                                return fieldEtc.fieldProcessorCaller.callFromDirectRaw(stream, fieldEtc.fieldInfo);
                            })
                        );
                // fromDirectRaw$ = fromDirectRaw$.pipe(thisLocal.session.addSubscribedObsRxOpr());
                fromDirectRaw$ = fromDirectRaw$.pipe(
                    tap(
                        {
                            next: (fromDirectRawValue: L) => {
                                setLazyObjOnLazyLoading$ = thisLocal.setLazyObjOnLazyLoadingNoNext(fromDirectRawValue);
                                setLazyObjOnLazyLoading$ = setLazyObjOnLazyLoading$.pipe(
                                    tap(
                                        {
                                            next: () => {
                                                if (!observerNew.closed) {
                                                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                                        thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). !observerNew.closed');
                                                        thisLocal.consoleLikeSubs.debug('calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                                        thisLocal.consoleLikeSubs.groupEnd();
                                                    }
                                                    observerNew.closed = true;
                                                    thisLocal.next(thisLocal.lazyLoadedObj);
                                                } else {
                                                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                                        thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). observerNew.closed');
                                                        thisLocal.consoleLikeSubs.debug('NOT calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                                        thisLocal.consoleLikeSubs.groupEnd();
                                                    }
                                                }
                                            },
                                            error: observerNew.error,
                                            closed: observerNew.closed,
                                            complete: observerNew.complete
                                        }
                                    )
                                );
                            },
                            error: observerNew.error,
                            complete: observerNew.complete,
                            closed: observerNew.closed
                        }
                    )
                );
                fromDirectRaw$ = fromDirectRaw$.pipe(
                    thisLocal.session.registerProvidedObservablesRxOpr(),
                    share()
                );
                fromDirectRaw$.subscribe(() => {
                    //completed
                })
            }

            if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeSubs.debug(
                    '(thisLocal.lazyLoadedObj != null)\n'
                    +'It may mean that we already have subscribed yet in the Observable of Response\n '
                    +'or this was created with lazyLoadedObj already loaded.');
            }
            if (!observerNew.closed && !thisLocalNextOnAsync.value) {
                thisLocal.next(thisLocal.lazyLoadedObj);
            }
        }

        return resultSubs;
    }

    private subscriptionToChange: Subscription;

    private subscriptionToChangeUnsubscribe() {
        const thisLocal = this;
        if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLikeSubs.debug('LazyRefBase: unsubscribe after this.subscribeToChange. Me\n' + this);
        }
        this.subscriptionToChange.unsubscribe();
        this.session.notifyAllLazyrefsAboutEntityModification(this.lazyLoadedObj, this);
    }

    public processResponse(responselike: ResponseLike<PlayerSnapshot | NodeJS.ReadStream>): Observable<L> {
        const thisLocal = this;
        const asyncCombineObsArr: Observable<any>[] = [];
        let lazyLoadedObj$: Observable<L>;
        let isLazyRefOfCollection = false;
        let mdRefererObj: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        thisLocal.session.validatePlayerSideResponseLike(responselike);
        let playerSnapshot: PlayerSnapshot | NodeJS.ReadStream;
        playerSnapshot = responselike.body;
        if (LodashLike.has(this.refererObj, this.session.manager.config.playerMetadatasName)) {
            mdRefererObj = LodashLike.get(this.refererObj, this.session.manager.config.playerMetadatasName);
        }
        
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);

        let originalValueEntry: OriginalLiteralValueEntry;

        let isResponseBodyStream = (responselike.body as NodeJS.ReadableStream).pipe && (responselike.body as NodeJS.ReadableStream);
        if (this.lazyLoadedObj == null) {
            let allRespMD = thisLocal.session.resolveMetadatas({literalObject: responselike});
            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef.lazyLoadedObj is not setted yet: Me:\n' + this);
            }
            if (this.genericNode.gType !== LazyRef && this.genericNode.gType !== LazyRefPrpMarker) {
                throw new Error('Wrong type: ' + this.genericNode.gType.name + '. Me:\n' + this);
            }
            if (fieldEtc.otmCollectionType) {
                isLazyRefOfCollection = true;
                if (!(this.genericNode instanceof GenericNode) || (<GenericNode>this.genericNode.gParams[0]).gParams.length <=0) {
                    throw new Error('LazyRef not defined: \'' + this.refererKey + '\' of ' + this.refererObj.constructor.name + '. Me:\n' + this);
                }
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef is collection: ' + fieldEtc.lazyLoadedObjType.name);
                }
                let collTypeParam: TypeLike<any> =  null;
                if ((<GenericNode>this.genericNode.gParams[0]).gParams[0] instanceof GenericNode) {
                    collTypeParam = (<GenericNode>(<GenericNode>this.genericNode.gParams[0]).gParams[0]).gType;
                } else {
                    collTypeParam = <TypeLike<any>>(<GenericNode>this.genericNode.gParams[0]).gParams[0];
                }
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef is collection of: ' + collTypeParam.name);
                }

                let lazyLoadedColl: any = this.session.createCollection(fieldEtc.otmCollectionType, this.refererObj, this.refererKey)
                LodashLike.set(lazyLoadedColl, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, true);
                try {
                    let processResultEntityArrayInternal$ = this.session.processWrappedSnapshotFieldArrayInternal(collTypeParam, lazyLoadedColl, (playerSnapshot as PlayerSnapshot).wrappedSnapshot as any[]);
                    lazyLoadedObj$ = processResultEntityArrayInternal$
                        .pipe(
                            thisLocal.session.flatMapJustOnceKeepAllFlagsRxOpr(lazyLoadedColl, () => {
                                return this.setLazyObjOnLazyLoadingNoNext(lazyLoadedColl)
                                    .pipe(
                                        thisLocal.session.mapJustOnceKeepAllFlagsRxOpr(
                                            lazyLoadedColl, 
                                            () => {
                                                return thisLocal.lazyLoadedObj;
                                            }
                                        )
                                    )
                            })
                        );
                } finally {
                    LodashLike.set(this.lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                }
            } else if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker && fieldEtc.propertyOptions.lazyDirectRawRead && isResponseBodyStream) {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead". Me:\n' + this);
                }
                if (!isResponseBodyStream) {
                    throw new Error('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" but "responselike.body" is not a NodeJS.ReadableStream. Me:\n' +
                        this + '\nresponselike.body.constructor.name: ' +
                        (responselike && responselike.body && responselike.body.constructor.name? responselike.body.constructor.name: 'null'));
                }
                if (fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" and has "IFieldProcessor.fromDirectRaw".');
                    }
                    thisLocal.attachRefId = this.session.manager.config.cacheStoragePrefix + this.session.nextMultiPurposeInstanceId().toString();
                    let putOnCache$ = this.session.manager.config.cacheHandler.putOnCache(thisLocal.attachRefId, responselike.body as NodeJS.ReadStream);
                    let getFromCache$ = 
                        putOnCache$.pipe(
                            flatMapJustOnceRxOpr( () => {
                                return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId);
                            })
                        );

                    let fromDirectRaw$ = 
                        getFromCache$
                            .pipe(thisLocal.session.logRxOpr('LazyRef_processResponse_fromDirectRaw_getFromCache'))
                            .pipe(
                                flatMapJustOnceRxOpr( (cacheStream) => {
                                    return fieldEtc.fieldProcessorCaller.callFromDirectRaw(cacheStream, fieldEtc.fieldInfo);
                                }),
                                thisLocal.session.registerProvidedObservablesRxOpr(),
                                share()
                            );
                    
                    const isSynchronouslyDone = { value: false, result: null as L};
                    // fromDirectRaw$ = fromDirectRaw$.pipe(thisLocal.session.addSubscribedObsRxOpr());
                    // fromDirectRaw$ = fromDirectRaw$.pipe(
                    //     tap((fromDirectRaw) => {
                    //         isSynchronouslyDone.value = true;
                    //         isSynchronouslyDone.result = fromDirectRaw;
                    //     })
                    // );
                    // if (isSynchronouslyDone.value) {
                    //     fromDirectRaw$ = of(isSynchronouslyDone.result);
                    // } else {
                    //     fromDirectRaw$ = fromDirectRaw$;
                    // }

                    lazyLoadedObj$ = 
                        fromDirectRaw$
                            .pipe(
                                flatMapJustOnceRxOpr((fromStreamValue) => {
                                    return of(fromStreamValue)
                                        .pipe(thisLocal.session.logRxOpr('LazyRef_processResponse_fromDirectRaw'))
                                        .pipe(
                                            thisLocal.session.flatMapJustOnceKeepAllFlagsRxOpr(
                                                fromStreamValue,
                                                (fromStreamValueB) => {
                                                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: Async on "IFieldProcessor.fromDirectRaw" result. Me:\n' + this);
                                                    }
                                                    thisLocal.lazyRefPrpStoreOriginalliteralEntryIfNeeded(
                                                        mdRefererObj,
                                                        fieldEtc,
                                                        null);
                                                    return thisLocal.setLazyObjOnLazyLoadingNoNext(fromStreamValueB);
                                                }
                                            )
                                        )
                                })
                            )
                            .pipe(
                                map(() => {
                                    return this.lazyLoadedObj;
                                })
                            );
                } else {
                    if(Object.getOwnPropertyNames(fieldEtc.lazyLoadedObjType).lastIndexOf('pipe') < 0) {
                        throw new Error('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" and has no "IFieldProcessor.fromDirectRaw",'+
                            ' but this generic definition is LazyRepPrp<'+(fieldEtc.lazyLoadedObjType? fieldEtc.lazyLoadedObjType.name: '')+'>. Me:\n' +
                            this);
                    }
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef is "lazyDirectRawRead" and has NO "IFieldProcessor.fromDirectRaw". Using "responselike.body"');
                    }
                    lazyLoadedObj$ = 
                        this.setLazyObjOnLazyLoadingNoNext(responselike.body as L)
                            .pipe(
                                map(() => {
                                    return responselike.body as L;
                                })
                            );
                }
            } else if (
                    (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker && !fieldEtc.propertyOptions.lazyDirectRawRead)
                    || (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker && fieldEtc.propertyOptions.lazyDirectRawRead && !isResponseBodyStream)) {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: (LazyRefPrp is NOT "lazyDirectRawRead") or '+
                        '(LazyRefPrp is "lazyDirectRawRead" and "responseLike.body" is not a NodeJS.ReadableStream). Is it rigth?! Me:\n' + this);
                }
                if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has "IFieldProcessor.fromLiteralValue".');
                    }
                    
                    const fromLiteralValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(responselike.body, fieldEtc.fieldInfo);
                    lazyLoadedObj$ =
                        fromLiteralValue$.pipe(
                            flatMapJustOnceRxOpr((fromLiteralValue) => {
                                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: Async on "IFieldProcessor.fromLiteralValue" result. Me:\n' + this);
                                }
                                thisLocal.lazyRefPrpStoreOriginalliteralEntryIfNeeded(
                                    mdRefererObj,
                                    fieldEtc,
                                    playerSnapshot as PlayerSnapshot);
                                return thisLocal.setLazyObjOnLazyLoadingNoNext(fromLiteralValue)
                                    .pipe(
                                        map( () => {
                                            return fromLiteralValue;
                                        })
                                    );                             
                            })
                        );
                } else {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has NO "IFieldProcessor.fromLiteralValue". Using "responselike.body"');
                    }
                    lazyLoadedObj$ = 
                        this.setLazyObjOnLazyLoadingNoNext(responselike.body as L)
                            .pipe(map(() => {
                                return responselike.body as L;
                            }));
                }
            } else {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef for a relationship. Me:\n' + this);
                }
                let processedEntity$ = this.session.processWrappedSnapshotFieldInternal(fieldEtc.lazyLoadedObjType, (playerSnapshot as PlayerSnapshot).wrappedSnapshot)
                const processedEntityRef = {value: null as L};
                lazyLoadedObj$ = processedEntity$
                    .pipe(
                        flatMap((processedEntity) => {
                            processedEntityRef.value = processedEntity;
                            return this.setLazyObjOnLazyLoadingNoNext(processedEntity as L);
                        }),
                        map(() => {
                            return processedEntityRef.value as L;
                        })
                    );
                //was the only way I found to undock the Observable<L> from the Observable<Response>
                //  The side effect of this is that map() called before this exchange is
                //  not piped with new Observable.
            }
        }
        if (this.signatureStr && !lazyLoadedObj$) {
            if (!this.session.isOnRestoreEntireStateFromLiteral()) {
                if (!mdRefererObj.$signature$ && !mdRefererObj.$isComponentPlayerObjectId$) {
                    throw new Error('The referer object has no mdRefererObj.$signature$. This should not happen. Me:\n' + this);
                } else {
                    if (isLazyRefOfCollection) {

                    }
                }
                if (!mdRefererObj.$signature$) {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: (!mdRefererObj.$signature$): owner entity not found for LazyRef, the owner must be a player side component. Me:\n' + this);
                    }
                }
                this.session.storeOriginalLiteralEntry(
                    {
                        method: 'lazyRef',
                        ownerSignatureStr: mdRefererObj.$signature$,
                        ownerFieldName: this.refererKey,
                        playerSnapshot: playerSnapshot as PlayerSnapshot,
                        ref: {
                            iAmAnEntityRef: true,
                            signatureStr: thisLocal.signatureStr
                        }
                    }
                );
            }
            if (fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.group('LazyRefBase.processResponse: Not LazyRefPrp, keeping reference by signature ' + this.signatureStr);
                    thisLocal.consoleLikeProcResp.debug(this.lazyLoadedObj);
                    thisLocal.consoleLikeProcResp.groupEnd();
                }
                this.session.tryCacheInstanceBySignature(
                    {
                        realInstance: this.lazyLoadedObj,
                        playerSnapshot: playerSnapshot as PlayerSnapshot,
                        lazySignature: this.signatureStr
                    }
                );
            } else {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: IS LazyRefPrp, NOT keeping reference by signature. Me:\n' + this);
                }
            }
        }

        if (!lazyLoadedObj$) {
            lazyLoadedObj$ = of(this.lazyLoadedObj);
        }

        lazyLoadedObj$ = 
            lazyLoadedObj$
                .pipe(
                    map((lazyLoadedObjValue) => {
                        return of(lazyLoadedObjValue)
                            .pipe(
                                thisLocal.session.mapJustOnceKeepAllFlagsRxOpr(
                                    lazyLoadedObjValue,
                                    (lazyLoadedObjValueB: L) => {
                                        if (thisLocal.respObs && thisLocal.session.isOnRestoreEntireStateFromLiteral()) {
                                            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                                thisLocal.consoleLikeProcResp.group('LazyRefBase.processResponse: changing "this.respObs"'+
                                                    ' to null because "this.session.isOnRestoreEntireStateFromLiteral()"\n' + this);
                                                thisLocal.consoleLikeProcResp.debug(thisLocal.lazyLoadedObj);
                                                thisLocal.consoleLikeProcResp.groupEnd();
                                            }
                                            
                                            thisLocal.respObs = null;
                                        }
                                    }
                                )
                            );
                    })
                )
                .pipe(
                    flatMap(() => {
                        return of(thisLocal.lazyLoadedObj);
                    })
                );
        return lazyLoadedObj$.pipe(
            share()
        );
        // let result$ = lazyLoadedObj$;

        // const isSynchronouslyDone = { value: false, result: null as L};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (isSynchronouslyDone.value) {
        //     return of(isSynchronouslyDone.result);
        // } else {
        //     return result$;
        // }
    }

    private lazyRefPrpStoreOriginalliteralEntryIfNeeded(mdRefererObj: PlayerMetadatas, fieldEtc: FieldEtc<L, any>, playerSnapshot: PlayerSnapshot): void {
        const thisLocal = this;
        if (!this.session.isOnRestoreEntireStateFromLiteral()) {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('LazyRefBase.processResponse: Storing LazyRefPrp. Me:\n' + this);
            }
            if (this.attachRefId) {
                this.session.storeOriginalLiteralEntry(
                    {
                        method: 'lazyRef',
                        ownerSignatureStr: mdRefererObj.$signature$,
                        ownerFieldName: this.refererKey,
                        attachRefId: this.attachRefId,
                        ref: {
                            iAmAnEntityRef: true,
                            signatureStr: thisLocal.signatureStr
                        }
                    }
                );
            } else {
                this.session.storeOriginalLiteralEntry(
                    {
                        method: 'lazyRef',
                        ownerSignatureStr: mdRefererObj.$signature$,
                        ownerFieldName: this.refererKey,
                        playerSnapshot: playerSnapshot,
                        ref: {
                            iAmAnEntityRef: true,
                            signatureStr: thisLocal.signatureStr
                        }
                    }
                );
            }
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('LazyRefBase.processResponse: Storing LazyRefPrp, keeping reference by signature ' + this.signatureStr);
            thisLocal.consoleLike.debug(this.lazyLoadedObj);
            thisLocal.consoleLike.groupEnd();
        }
        if (fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            this.session.tryCacheInstanceBySignature(
                {
                    realInstance: this.lazyLoadedObj,
                    playerSnapshot: playerSnapshot,
                    lazySignature: this.signatureStr
                }
            );
        }
    }

    subscribeToModify(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void) {
        const thisLocal = this;

        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        let observerOriginal: PartialObserver<L>;
        if ((observerOrNext as PartialObserver<L>).next
            || (observerOrNext as PartialObserver<L>).complete
            || (observerOrNext as PartialObserver<L>).error
            || (observerOrNext as PartialObserver<L>).next) {
            if (error || complete) {
                throw new Error('observerOrNext is a PartialObserver and error or complete are passed as parameter');
            }
            observerOriginal = observerOrNext as PartialObserver<L>;
        } else {
            observerOriginal = {
                next: observerOrNext as (value: L) => void,
                error: error,
                complete: complete
            }
        }
        let observerNew: PartialObserver<L> = {...observerOriginal};

        if (!this.isLazyLoaded()) {
            observerNew.next = (value: L) => {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.group('(Asynchronous) LazyRef.subscribeToChange() => modifiedNext, (thisLocal.respObs != null)');
                    thisLocal.consoleLikeSubs.debug('calling nextOriginal()'); thisLocal.consoleLikeSubs.debug('this.subscriptionToChange.unsubscribe()'); thisLocal.consoleLikeSubs.debug('this.next()\n' + this); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                    thisLocal.consoleLikeSubs.groupEnd();
                }
                let setLazyObjOnLazyLoadingNoNext$ = thisLocal.setLazyObjOnLazyLoadingNoNext(value);
                setLazyObjOnLazyLoadingNoNext$ = setLazyObjOnLazyLoadingNoNext$.pipe(
                    share()
                );
                setLazyObjOnLazyLoadingNoNext$.subscribe(
                    {
                        next: () => {
                            // AAAAASYNCHRONOUS OF AAAAASYNCHRONOUS!!!
                            //propety set and collection add will call session.notifyAllLazyrefsAboutEntityModification()
                            // this will cause infinit recursion, so call session.switchOffNotifyAllLazyrefs
                            thisLocal.session.switchOffNotifyAllLazyrefs(thisLocal.lazyLoadedObj);
                            //call that will change the data Asynchronously
                            if (observerOriginal.next) {
                                observerOriginal.next(thisLocal.lazyLoadedObj);
                            }
                            //no more problems with infinite recursion
                            thisLocal.session.switchOnNotifyAllLazyrefs(thisLocal.lazyLoadedObj);
        
                            //this ensures that the change command will not be called twice.
                            this.subscriptionToChangeUnsubscribe();
                            //here all other previous subscribes will be called. Pipe async's for example
                            thisLocal.next(thisLocal.lazyLoadedObj);
                        },
                        complete: observerNew.complete,
                        error: observerNew.error,
                        closed: observerNew.closed
                    }
                );
            };

            if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeSubs.debug('Keeping Subscription from this.subscribe(observerOrNextNovo) on this.subscriptionToChange to make an unsubscribe() at the end of modifiedNext callback\n' + this);
            }
            this.subscriptionToChange = this.subscribe(observerNew);
            //this.subscriptionToChangeUnsubscribe();
            //thisLocal.next(thisLocal.lazyLoadedObj);

            //AAAAASYNCHRONOUS!!!
        } else {
            //SSSSSYNCHRONOUS!!!
            if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeSubs.group('(Synchronous) LazyRef.subscribeToChange()');
                thisLocal.consoleLikeSubs.debug('calling nextOriginal()'); thisLocal.consoleLikeSubs.debug('this.next()\n' + this);
                thisLocal.consoleLikeSubs.groupEnd();
            }
            try {
                //that will change the data Synchronously
                if (observerOriginal.next) {
                    observerOriginal.next(thisLocal.lazyLoadedObj);
                }
                //here all the other observer's will be called. Pipe async's for example
                thisLocal.next(thisLocal.lazyLoadedObj);
            } catch(err) {
                if (observerOriginal.error) {
                    observerOriginal.error(err);
                } else {
                    throw {...new Error('unexpected'), reason: err, cause: err};
                }
            }
        }
    }

    public get playerObjectId(): I {
        return this._playerObjectId;
    }
    public get lazyLoadedObj(): L {
        return this._lazyLoadedObj;
    }
    public get signatureStr(): string {
        return this._signatureStr;
    }
    public set playerObjectId(value: I) {
        this._playerObjectId = value;
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
    public get fieldProcessorEvents(): IFieldProcessorEvents<L> {
        return this._fieldProcessorEvents;
    }
    private createFlatMapCallback(): (response: ResponseLike<L>) => Observable<L> {
        const thisLocal = this;
        return (response) => {
            if (!response || !response.body) {
                throw new Error('response or response.body is null');
            }
            return thisLocal.processResponseOnLazyLoading(response);
        };
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
	public get session(): RecorderSessionImplementor {
		return this._session;
	}
	public set session(value: RecorderSessionImplementor) {
		this._session = value;
    }
    public get genericNode(): GenericNode {
		return this._genericNode;
	}
	public set genericNode(value: GenericNode) {
		this._genericNode = value;
	}    
}