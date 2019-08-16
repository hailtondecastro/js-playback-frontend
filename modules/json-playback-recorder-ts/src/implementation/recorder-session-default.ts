import { LazyRef, LazyRefPrpMarker} from '../api/lazy-ref';
import { RecorderManagerDefault } from './recorder-manager-default';
import { catchError, map, flatMap, delay, finalize, mapTo, tap, share, timeout } from 'rxjs/operators';
import { throwError, Observable, of, OperatorFunction, PartialObserver, ObservableInput, combineLatest } from 'rxjs';
import { RecorderConstants } from './recorder-constants';
import { SetCreator } from './set-creator';
import { JSONHelper } from './json-helper';
import { v1 as uuidv1} from 'uuid';
import { FieldEtc } from './field-etc';
import { flatMapJustOnceRxOpr, mapJustOnceRxOpr, combineFirstSerial, timeoutDecorateRxOpr } from './rxjs-util';
import { OriginalLiteralValueEntry, RecorderSession as RecorderSession, EntityRef, SessionState, PlayerSnapshot } from '../api/session';
import { TypeLike } from '../typeslike';
import { PlayerMetadatas } from '../api/player-metadatas';
import { RecorderManager } from '../api/recorder-manager';
import { GenericNode } from '../api/generic-tokenizer';
import { GenericTokenizer } from '../api/generic-tokenizer';
import { LazyInfo } from '../api/lazy-observable-provider';
import { LazyRefImplementor, LazyRefDefault } from './lazy-ref-default';
import { RecorderDecorators } from '../api/recorder-decorators';
import { RecorderDecoratorsInternal } from './recorder-decorators-internal';
import { RecorderLogger, ConsoleLike, RecorderLogLevel } from '../api/recorder-config';
import { TapeAction, Tape, TapeActionType } from '../api/tape';
import { TapeActionDefault, TapeDefault } from './tape-default';
import { EventEmitter } from 'events';
import { LodashLike } from './lodash-like';
import { ResponseLike } from '../typeslike';

declare type prptype = any;

interface ResolveMetadataReturn {
    refererObjMd: PlayerMetadatas,
    objectMd: PlayerMetadatas,
    playerObjectIdMd: PlayerMetadatas,
    refererObjMdFound: boolean,
    objectMdFound: boolean,
    playerObjectIdMdFound: boolean
}

/**
 * Contract
 */
export interface RecorderSessionImplementor extends RecorderSession {
    /** Framework internal use. */
    isOnRestoreEntireStateFromLiteral(): boolean;
    /** Framework internal use. */
    mapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R>;
    /** Framework internal use. */
    mapKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R>;
    /** Framework internal use. */
    flatMapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R>;
    ///** Framework internal use. */
    //combineFirstSerialPreserveAllFlags(obsArr: Observable<any>[], lazyLoadedObj?: any): Observable<any>;
    /** Framework internal use. */
    flatMapKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R>;
    /** Framework internal use. */
    getCachedBySignature<T extends object>(signatureStr: string): T;
    /** Framework internal use. */
    addTapeAction(action: TapeAction): void;
    /** Framework internal use. */
    isRecording(): boolean;
    /** Framework internal use. */
    storeOriginalLiteralEntry(originalValueEntry: OriginalLiteralValueEntry): void;
    /** Framework internal use. */
    tryCacheInstanceBySignature(
        tryOptions:
            {
                realInstance: any,
                playerSnapshot: PlayerSnapshot,
                lazySignature?: string
            }): void;
    validatePlayerSideLiteralObject(literalObject: {}): void;
    validatePlayerSideResponseLike(responseLike: ResponseLike<{} | NodeJS.ReadableStream>): void;
    /**
     * Framework internal use.
     */
    processWrappedSnapshotFieldInternal<L>(entityType: TypeLike<L>, wrappedSnapshotField: any): Observable<L>;
    /**
     * Framework internal use. Used exclusively in lazy load.
     */
    processWrappedSnapshotFieldArrayInternal<L>(entityType: TypeLike<L>, lazyLoadedColl: any, wrappedSnapshotField: any[]): Observable<void>;
    /** Framework internal use.  Collection utility. */
    createCollection(collType: TypeLike<any>, refererObj: any, refererKey: string): any;
    /** Framework internal use.  Collection utility. */
    isCollection(typeTested: TypeLike<any>): any;
    /** Framework internal use.  Collection utility. */
    addOnCollection(collection: any, element: any): void;
    /** Framework internal use.  Collection utility. */
    removeFromCollection(collection: any, element: any): void;
    /** Framework internal use. */
    registerEntityAndLazyref(entity: object, LazyRefImplementor: LazyRef<any, any>): void;
    /** Framework internal use. */
    unregisterEntityAndLazyref(entity: object, lazyRef: LazyRefImplementor<any, any>): void;
    /** Framework internal use. */
    nextMultiPurposeInstanceId(): number;
    /** Framework internal use. */
    notifyAllLazyrefsAboutEntityModification(entity: object, lazyRef: LazyRefImplementor<any, any>): void;
    /** Framework internal use. */
    recordAtache(attach: NodeJS.ReadableStream): string;
    /** Framework internal use. */
    fielEtcCacheMap: Map<Object, Map<String, FieldEtc<any, any>>>;
    /** Framework internal use. */
    logRxOpr<T>(id: string): OperatorFunction<T, T>;
    /** Framework internal use. All framework internal pipe over provided observables.  
     * Note that it is piped just for Observables that are provided for framework  
     * extension points, like IFieldProcessor.fromLiteralValue, are internaly subscribed.  
     * Observables from:  
     * - IFieldProcessor.fromLiteralValue
     * - IFieldProcessor.fromRecordedLiteralValue
     * - IFieldProcessor.fromDirectRaw
     * - IFieldProcessor.toLiteralValue
     * - IFieldProcessor.toDirectRaw
     * - CacheHandler.getFromCache
     * - CacheHandler.removeFromCache
     * - CacheHandler.putOnCache
     * - CacheHandler.clearCache
     * - LazyObservableProvider.generateObservable
     * - LazyObservableProvider.generateObservableForDirectRaw
     */
    // addSubscribedObsRxOpr<T>(): OperatorFunction<T, T>;
    registerProvidedObservablesRxOpr<T>(): OperatorFunction<T, T>;
    /** Framework internal use. This Operator replace internal subscribe call.*/
    // doSubriscribeWithProvidedObservableRxOpr<T>(observer?: PartialObserver<T>): OperatorFunction<T, T>;
    // doSubriscribeWithProvidedObservableRxOpr<T>(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T>;
    /**
     * Framework internal use.  
     * This put the PlayerMetadatas's on options.refMap by PlayerMetadatas#$id$  
     * and resolves PlayerMetadatas's by PlayerMetadatas#$idRef$ if it exists.
     */
    resolveMetadatas(
        options: 
            {
                object?: any,
                literalObject?: any,
                key?: string,
                refererObject?: Object,
                refererLiteralObject?: any,
                refMap?: Map<Number, any>
            }) :
            {
                refererObjMd: PlayerMetadatas,
                objectMd: PlayerMetadatas,
                playerObjectIdMd: PlayerMetadatas,
                refererObjMdFound: boolean,
                objectMdFound: boolean,
                playerObjectIdMdFound: boolean
            };
    processTapeActionAttachRefId(
        options:
            {
                action: TapeAction,
                fieldEtc: FieldEtc<any, any>,
                value: any,
                propertyKey: string
            }) : 
            Observable<
                {
                    asyncAddTapeAction: boolean,
                    newValue: any
                }
            >;
    jsonStringfyWithMax(literalObj: any): string;
    decorateCreateNotLoadedLazyRef(
        decoratorCb:
            (options:
                {
                    genericNode: GenericNode, 
                    literalLazyObj: any,
                    refMap: Map<Number, any>,
                    refererObj: any,
                    refererKey: string,
                    originalResult: Observable<LazyRef<any, any>>
                }
            ) => Observable<LazyRef<any, any>>
        ) : void;
}

class UndefinedForMergeAsync {
    public toString(): string {
        return 'I am an instance of "UndefinedForMerge", just a temporary value before real value from async execution!';
    }
}

const DummyUndefinedForMergeAsync = new UndefinedForMergeAsync();

export class RecorderSessionDefault implements RecorderSessionImplementor {
    private _objectsBySignature: Map<string, any> = null;
    private _objectsByCreationId: Map<number, any> = null;
    private _lazyrefsByEntityMap: Map<object, Set<LazyRefImplementor<any, any>>> = null;
    private _fielEtcCacheMap: Map<Object, Map<String, FieldEtc<any, any>>> = null;

    private consoleLike: ConsoleLike;
	private consoleLikeLogRxOpr: ConsoleLike;
    private consoleLikeMerge: ConsoleLike;
    private consoleLikeRestoreState: ConsoleLike;

	get fielEtcCacheMap(): Map<Object, Map<String, FieldEtc<any, any>>>  {
		return this._fielEtcCacheMap;
	}

    private _switchedOffNotificationEntitiesSet: Set<object> = null;
    private _originalLiteralValueEntries: Array<OriginalLiteralValueEntry> = null;
    private _nextCreationId: number = null;
    private _currentTape: Tape = null;
    private _latestTape: Array<Tape> = null;
    private _currentRecordedAtaches: Map<String, NodeJS.ReadableStream> = null;
    private _latestRecordedAtaches: Map<String, String | NodeJS.ReadableStream> = null;
    private _isOnRestoreEntireStateFromLiteral = false;
    private _sessionId: string;
    //private _asyncTasksWaitingArr: Set<Observable<any>> = new Set();
    private _asyncTasksWaitingArrNew: Set<Observable<any>> = new Set();
    private _asyncTasksWaitingSourcesArrNew: Set<Observable<any>> = new Set();
    

    deepFunctionsSource(obj: any, visitedSet: Set<any>): string {
        let result = '';
        for (var propt in obj) {
            let prpValue = obj[propt];
            if (typeof (prpValue) === 'object' || typeof (prpValue) === 'function') {
                if (!visitedSet.has(prpValue)) {
                    visitedSet.add(prpValue);
                    if (typeof (prpValue) === 'function') {
                        result += propt + ':\n' + prpValue.toString();
                    }
                    result += '\n' + this.deepFunctionsSource(prpValue, visitedSet);
                }
            }
        }
        return result;
    }

    testObservableHasCircle(obs: Observable<any>) {
        let visitedSet = new Set();
        let currObs = obs;
        while (currObs && currObs.source) {
            if (visitedSet.has(currObs)) {
                throw new Error('Observable Circle detected:\n' + this.deepFunctionsSource(currObs, new Set()));
            }
            visitedSet.add(obs);
        }
    }

    logRxOpr<T>(id: string): OperatorFunction<T, T> {
        let thisLocal = this;
        const resultOpr: OperatorFunction<T, T> = (source: Observable<any>) => {
            if (thisLocal.consoleLikeLogRxOpr.enabledFor(RecorderLogLevel.Trace)) {
                (source as any).logAllSourceStackRxOprId = 'source observable ' + this.nextMultiPurposeInstanceId();
                try {
                    throw new Error('logRxOpr(). "Issuer" Stack for id "'+id+'"\n');
                } catch (error) {
                    thisLocal.consoleLikeLogRxOpr.debug((error.stack as string).replace(/^Error: /, ''));
                }
            }
            const result$ = source
                .pipe(
                    map((value) => {
                        if (thisLocal.consoleLikeLogRxOpr.enabledFor(RecorderLogLevel.Trace)) {
                            (source as any).logAllSourceStackRxOprId = 'source observable ' + this.nextMultiPurposeInstanceId();
                            try {
                                throw new Error('logRxOpr(). "Project" Stack for id "'+id+'"\n');
                            } catch (error) {
                                thisLocal.consoleLikeLogRxOpr.debug((error.stack as string).replace(/^Error: /, ''));
                            }
                        }
                        return value;
                    })
                );
            return result$;
        }

        return resultOpr;
    }

    // addSubscribedObsRxOpr<T>(): OperatorFunction<T, T> {
    //     let thisLocal = this;

    //     //BEGIN: Used to find losted obs.subscribed()
    //     const stackSubscriberRef = {value: ''};
    //     try {
    //         throw new Error('TRACKING');
    //     } catch (error) {
    //         stackSubscriberRef.value = error.stack;
    //     }
    //     //END: Used to find losted obs.subscribed()
    //     const resultOpr: OperatorFunction<T, T> = (source: Observable<any>) => {
    //         const isDone = { value: false };
    //         const result$ = source.pipe(
    //             map((value) => {
    //                 isDone.value = true;
    //                 thisLocal._asyncTasksWaitingArr.delete(result$);
    //                 return value;
    //             })
    //         );
    //         if (!isDone.value) {
    //             //BEGIN: Used to find losted obs.subscribed()
    //             (result$ as any).stackSubscriberRef = stackSubscriberRef;
    //             //END: Used to find losted obs.subscribed()
    //             thisLocal._asyncTasksWaitingArr.add(result$);
    //         }
    //         return result$;
    //     }
    //     return resultOpr;
    // }

    registerProvidedObservablesRxOpr<T>(): OperatorFunction<T, T> {
        let thisLocal = this;

        //BEGIN: Used to find losted obs.subscribed()
        const stackSubscriberRef = {value: ''};
        try {
            throw new Error('TRACKING');
        } catch (error) {
            stackSubscriberRef.value = error.stack;
        }
        //END: Used to find losted obs.subscribed()
        const resultOpr: OperatorFunction<T, T> = (source: Observable<T>) => {
            const isDone = { value: false };
            const sourceRef = { value: source };
            //thisLocal.testObservableHasCircle(source);
            const result$ = of(null).pipe(
                tap(
                    {
                        next: () => {
                            thisLocal._asyncTasksWaitingArrNew.add(result$);
                            thisLocal._asyncTasksWaitingSourcesArrNew.add(sourceRef.value);
                        },
                        error: () => {
                            thisLocal._asyncTasksWaitingArrNew.add(result$);
                            thisLocal._asyncTasksWaitingSourcesArrNew.add(sourceRef.value);
                        }
                    }
                ),
                flatMap(() => {
                    sourceRef.value = source;
                    return source;
                }),
                map((value) => {
                    return value as T;
                }),
                tap(
                    {
                        next: (value) => {
                            thisLocal._asyncTasksWaitingArrNew.delete(result$);
                            thisLocal._asyncTasksWaitingSourcesArrNew.delete(sourceRef.value);
                        }
                        // ,
                        // error: (err) => {
                        //     thisLocal._asyncTasksWaitingArrNew.delete(result$);
                        // }
                    }
                )
                // ,
                // timeoutDecorateRxOpr()
            );
            return result$;
        }
        return resultOpr;
    }

    createSerialPendingTasksWaiting(): Observable<void> {
        const thisLocal = this;
        let result$: Observable<void>;

        if (thisLocal._asyncTasksWaitingArrNew.size > 0) {
            //result$ = thisLocal.combineFirstSerialPreserveAllFlags(Array.from(thisLocal._asyncTasksWaitingArrNew))
            result$ = combineFirstSerial(Array.from(thisLocal._asyncTasksWaitingArrNew))
                .pipe(
                    thisLocal.logRxOpr('createSerialAsyncTasksWaitingNew'),
                    map(() => { return undefined; }),
                    timeout(3000)
                    //,
                    // flatMap(() => {
                    //     return thisLocal.createSerialAsyncTasksWaitingNew();
                    // })
                );
        } else {
            result$ = of(null);
        }

        return result$;
    }

    // createAsyncTasksWaiting(): Observable<void> {
    //     const thisLocal = this;
    //     let combineLatest$: Observable<void>;
    //     if (thisLocal._asyncTasksWaitingArr.size > 0) {
    //         combineLatest$ = combineLatest(Array.from(this._asyncTasksWaitingArr))
    //             .pipe(
    //                 map((value)=>{
    //                     if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
    //                         thisLocal.consoleLike.debug('generateAsyncTasksWaiting -> map: ' + value);
    //                     }
    //                 }),
    //                 flatMap(() => {
    //                     return thisLocal.createAsyncTasksWaiting();
    //                 })
    //             );
    //     } else {
    //         combineLatest$ = of(null);
    //     }

    //     return combineLatest$;
    // }

    // createSerialAsyncTasksWaiting(): Observable<void> {
    //     const thisLocal = this;
    //     let result$: Observable<void>;

    //     if (thisLocal._asyncTasksWaitingArr.size > 0) {
    //         result$ = thisLocal.combineFirstSerialPreserveAllFlags(Array.from(thisLocal._asyncTasksWaitingArr))
    //             .pipe(
    //                 thisLocal.logRxOpr('createSerialAsyncTasksWaiting'),
    //                 flatMap(() => {
    //                     return thisLocal.createSerialAsyncTasksWaiting();
    //                 })
    //             );
    //     } else {
    //         result$ = of(null);
    //     }

    //     return result$;
    // }

    constructor(private _manager: RecorderManager) {
        const thisLocal = this;
		if (!_manager) {
			throw new Error('_manager can not be null');
        }

        thisLocal.consoleLike = _manager.config.getConsole(RecorderLogger.RecorderSessionDefault);
		thisLocal.consoleLikeMerge = _manager.config.getConsole(RecorderLogger.RecorderSessionDefaultMergeWithCustomizerPropertyReplection);
        thisLocal.consoleLikeLogRxOpr = _manager.config.getConsole(RecorderLogger.RecorderSessionDefaultLogRxOpr);
        thisLocal.consoleLikeRestoreState = _manager.config.getConsole(RecorderLogger.RecorderSessionDefaultRestoreState);
        
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.constructor');
			thisLocal.consoleLike.debug(_manager as any as string);
            thisLocal.consoleLike.groupEnd();
		}
        this._objectsBySignature = new Map();
        this._objectsByCreationId = new Map();
        this._lazyrefsByEntityMap = new Map();
        this._fielEtcCacheMap = new Map();
        this._switchedOffNotificationEntitiesSet = new Set();
        this._originalLiteralValueEntries = [];
        this._latestTape = [];
        this._sessionId = uuidv1();
    }

    public generateEntireStateAsLiteral(): Observable<any> {
        const thisLocal = this;
        let createSerialAsyncTasksWaitingNew$ = this.createSerialPendingTasksWaiting()
            .pipe(
                map(() => {
                    let sessionState: SessionState = {
                        sessionId: this._sessionId,
                        nextCreationId: thisLocal._nextCreationId,
                        latestPlaybackArrAsLiteral: [],
                        originalLiteralValueEntries: thisLocal._originalLiteralValueEntries
                    };
            
                    for (const tapeItem of thisLocal._latestTape) {
                        sessionState.latestPlaybackArrAsLiteral.push(thisLocal.getPlaybackAsLiteral(tapeItem));
                    }
                    if (thisLocal._currentTape) {
                        sessionState.currentTapeAsLiteral = thisLocal.getPlaybackAsLiteral(thisLocal._currentTape);
                    }
            
                    return sessionState;
                }),
            );
        return createSerialAsyncTasksWaitingNew$;

        // const isSynchronouslyDone = { value: false };
        // createSerialAsyncTasksWaitingNew$ = createSerialAsyncTasksWaitingNew$.pipe(
        //     tap(() => {
        //         isSynchronouslyDone.value = true;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return createSerialAsyncTasksWaitingNew$;
        // } else {
        //     return of(isSynchronouslyDone.value);
        // }
    }

    private restoreEntireStateCallbackTemplate<R>(callback: () => R): R {
        this._isOnRestoreEntireStateFromLiteral = true;
        try {
            return callback();
        } finally {
            this._isOnRestoreEntireStateFromLiteral = false;
        }
    }

    public restoreEntireStateFromLiteral(literalState: any): Observable<void> {
        const thisLocal = this;
        let restoreEntireStateCallbackTemplate$ = this.restoreEntireStateCallbackTemplate(() => {
            let asyncCombineObsArr: Observable<any>[] = [];
            let literalStateLocal: SessionState = literalState;
            thisLocal._nextCreationId = literalStateLocal.nextCreationId;
            thisLocal._originalLiteralValueEntries = literalStateLocal.originalLiteralValueEntries;
            if (literalStateLocal.currentTapeAsLiteral) {
                thisLocal._currentTape = thisLocal.getTapeFromLiteral(literalStateLocal.currentTapeAsLiteral);
            } else {
                thisLocal._currentTape = null;
            }
            this._latestTape = [];
            for (const tapeLiteral of literalStateLocal.latestPlaybackArrAsLiteral) {
                thisLocal._latestTape.push(thisLocal.getTapeFromLiteral(tapeLiteral));
            }
            let originalLiteralValueEntriesLengthInitial: number = thisLocal._originalLiteralValueEntries.length;
            for (const originalLiteralValueEntry of thisLocal._originalLiteralValueEntries) {
                if (originalLiteralValueEntriesLengthInitial !== thisLocal._originalLiteralValueEntries.length) {
                    throw new Error('There is some error on "this.storeOriginalLiteralEntry()"'+
                        ' manipulation. Initial length ' +originalLiteralValueEntriesLengthInitial+
                        ' is differrent of actual ' + thisLocal._originalLiteralValueEntries.length);
                }
                if (originalLiteralValueEntry.method === 'processResultEntity'
                        || originalLiteralValueEntry.method === 'processResultEntityArray'
                        || originalLiteralValueEntry.method === 'newEntityInstance') {
                    let jsType: TypeLike<any> = Reflect.getMetadata(originalLiteralValueEntry.reflectFunctionMetadataTypeKey, Function);
                    if (!jsType) {
                        throw new Error('the classe \'' + originalLiteralValueEntry.reflectFunctionMetadataTypeKey + ' is not using the decorator \'RecorderDecorators.playerType\'. Entry:\n' + this.jsonStringfyWithMax(originalLiteralValueEntry));
                    }
                    if (originalLiteralValueEntry.method === 'processResultEntity') {
                        asyncCombineObsArr.push(thisLocal.processPlayerSnapshot(jsType, originalLiteralValueEntry.playerSnapshot));
                    } else if (originalLiteralValueEntry.method === 'processResultEntityArray') {
                        asyncCombineObsArr.push(thisLocal.processPlayerSnapshotArray(jsType, originalLiteralValueEntry.playerSnapshot));
                    } else if (originalLiteralValueEntry.method === 'newEntityInstance') {
                        asyncCombineObsArr.push(thisLocal.newEntityInstanceWithCreationId(jsType, originalLiteralValueEntry.ref.creationId));
                    } else {
                        throw new Error('This should not happen');
                    }
                } else if (originalLiteralValueEntry.method === 'lazyRef') {
                    originalLiteralValueEntry.ownerSignatureStr
                    if (originalLiteralValueEntry.ownerSignatureStr) {
                        if (thisLocal.consoleLikeRestoreState.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeRestoreState.debug('RecorderSessionDefault.restoreEntireStateFromLiteral: (ownerSignatureStr): ownerSignatureStr found for original literal value entry, the owner must be a player side component. Entry:\n' + this.jsonStringfyWithMax(originalLiteralValueEntry));
                        }
                        let ownerEnt = this._objectsBySignature.get(originalLiteralValueEntry.ownerSignatureStr);
                        if (!ownerEnt) {
                            throw new Error('ownerEnt not found for signature: ' + originalLiteralValueEntry.ownerSignatureStr);                 
                        }
                        let lazyRef: LazyRefImplementor<any, any> = LodashLike.get(ownerEnt, originalLiteralValueEntry.ownerFieldName);
                        if (!lazyRef) {
                            throw new Error('ownerEnt has no field: ' + originalLiteralValueEntry.ownerFieldName);
                        }
                        if (!lazyRef.iAmLazyRef) {
                            throw new Error(originalLiteralValueEntry.ownerFieldName + ' is not a LazyRef for ' + ownerEnt);    
                        }
                        asyncCombineObsArr.push(
                            lazyRef.processResponse({ body: originalLiteralValueEntry.playerSnapshot })
                        );
                    } else {
                        if (thisLocal.consoleLikeRestoreState.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeRestoreState.debug('RecorderSessionDefault.restoreEntireStateFromLiteral: (!ownerEnt): '+
                                'No owner entity for original literal value entry, the owner must be a\n'+
                                'player side component. Doing nothing, in any next literal value entry\n'+
                                'there will exist an action with type \'processResultEntity\' that will\n'+
                                'put the entity on cache. Entry:\n' +
                                this.jsonStringfyWithMax(originalLiteralValueEntry));
                        }
                    }
                } else {
                    throw new Error('This should not happen');
                }
            }

            //let combineFirstSerial$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr);
            let combineFirstSerial$ = combineFirstSerial(asyncCombineObsArr);
            // if (asyncCombineObsArr.length > 0) {
            //     combineFirstSerial$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(share());
            // } else {
            //     combineFirstSerial$ = of([]);
            // }
            
            // const isPipedCallbackDone = { value: false, result: null as Observable<void>};
            return combineFirstSerial$.pipe(
                flatMap( () => {
                    // if (!isPipedCallbackDone.value) {
                    //     isPipedCallbackDone.value = true;
                    //     isPipedCallbackDone.result = thisLocal.rerunByPlaybacksIgnoreCreateInstance();
                    // }
                    return thisLocal.rerunByPlaybacksIgnoreCreateInstance();
                }),
                map(() => {
                    return undefined;
                }),
                share()
            )
        });

        return restoreEntireStateCallbackTemplate$.pipe(
            //thisLocal.registerExposedObservablesRxOpr(),
            share()
        );;

        // const isSynchronouslyDone = { value: false };
        // restoreEntireStateCallbackTemplate$ = restoreEntireStateCallbackTemplate$.pipe(
        //     tap(() =>{
        //         isSynchronouslyDone.value = true;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return restoreEntireStateCallbackTemplate$;
        // } else {
        //     return of(null);
        // }
        
    }

    public isOnRestoreEntireStateFromLiteral(): boolean {
        return this._isOnRestoreEntireStateFromLiteral;
    }

    private lazyLoadTemplateCallback<T>(lazyLoadedObj: any, originalCb: () => T|void): T|void {
        try {
            LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, true);
            return originalCb();
        } finally {
            LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, false);
        }
    }

    private createKeepAllFlagsTemplateCallback<T>(lazyLoadedObj: any): (originalCb: () => T|void) => T|void {
        const thisLocal = this;
        const syncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        return (originalCb: () => T) => {
            const asyncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
            const asyncIsOn2 = thisLocal._isOnRestoreEntireStateFromLiteral;
            LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
            thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;
            try {
                return originalCb();
            } finally {
                LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
                thisLocal._isOnRestoreEntireStateFromLiteral = asyncIsOn2;
            }
        }
    }

    private mapKeepAllFlagsRxOprPriv<T, R>(
            when: 'justOnce' | 'eachPipe',
            turnOnMode: 
                {
                    lazyLoad: boolean | 'none',
                    restoreStare: boolean | 'none'
                },
            lazyLoadedObj: any,
            project: (value: T, index?: number) => R,
            thisArg?: any): OperatorFunction<T, R> {
        const thisLocal = this;
        const syncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        const isPipedCallbackDone = { value: false, result: null as R};
        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;

                    const asyncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
                    const asyncIsOn2 = thisLocal._isOnRestoreEntireStateFromLiteral;
                    if (!turnOnMode || turnOnMode.lazyLoad === 'none') {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
                    } else {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, turnOnMode.lazyLoad);
                    }
                    if (!turnOnMode || turnOnMode.restoreStare === 'none') {
                        thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;
                    } else {
                        thisLocal._isOnRestoreEntireStateFromLiteral = turnOnMode.restoreStare as boolean;
                    }
                    try {
                        isPipedCallbackDone.result = project(value, index);
                    } finally {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
                        thisLocal._isOnRestoreEntireStateFromLiteral = asyncIsOn2;
                    }
                }
                return isPipedCallbackDone.result;
            }
            return source
                .pipe(
                    map(projectExtentend, thisArg)
                );
        }

        return newOp;
    }

    private repeatedValueSet = new Set();

    private flatMapKeepAllFlagsRxOprPriv<T, R>(
            when: 'justOnce' | 'eachPipe', 
            turnOnMode: 
                {
                    lazyLoad: boolean | 'none',
                    restoreStare: boolean | 'none'
                },
            lazyLoadedObj: any, 
            project: (value: T, index?: number) => ObservableInput<R>,
            concurrent?: number): OperatorFunction<T, R> {
        const thisLocal = this;
        const syncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        const isPipedCallbackDone = { value: false, result: null as ObservableInput<R>};

        const errorForStack = new Error('combineFirstSerial. Possible cycle!');

        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;

                    const asyncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
                    const asyncIsOn2 = thisLocal._isOnRestoreEntireStateFromLiteral;
                    if (!turnOnMode || turnOnMode.lazyLoad === 'none') {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
                    } else {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, turnOnMode.lazyLoad);
                    }
                    if (!turnOnMode || turnOnMode.restoreStare === 'none') {
                        thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;
                    } else {
                        thisLocal._isOnRestoreEntireStateFromLiteral = turnOnMode.restoreStare as boolean;
                    }

                    thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;
                    try {
                        isPipedCallbackDone.result = project(value, index);
                    } finally {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
                        thisLocal._isOnRestoreEntireStateFromLiteral = asyncIsOn2;
                    }
                }
                return isPipedCallbackDone.result;
            }
            return source
                .pipe(
                    flatMap(projectExtentend, concurrent),
                    (source) => {
                        if (!LodashLike.isNil(source)) {
                            let currSource = source;
                            do {
                                if(thisLocal.repeatedValueSet.has(currSource)) {
                                    //console.error(errorForStack + '\n' + errorForStack.stack);
                                } else {
                                    //thisLocal.repeatedValueSet.add(currSource);
                                }
                                currSource = currSource.source;
                            } while (currSource);
                            thisLocal.repeatedValueSet.add(source);
                        } 
                        return source;
                    }
                );
        }

        return newOp;
    }

    mapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R> {
        return this.mapKeepAllFlagsRxOprPriv('justOnce',  {lazyLoad: 'none', restoreStare: 'none'}, lazyLoadedObj, project);
    }

    mapKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R> {
        return this.mapKeepAllFlagsRxOprPriv('eachPipe',  {lazyLoad: 'none', restoreStare: 'none'}, lazyLoadedObj, project);
    }

    flatMapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R> {
        return this.flatMapKeepAllFlagsRxOprPriv('justOnce', {lazyLoad: 'none', restoreStare: 'none'}, lazyLoadedObj, project);
    }

    flatMapKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R> {
        return this.flatMapKeepAllFlagsRxOprPriv('eachPipe', {lazyLoad: 'none', restoreStare: 'none'}, lazyLoadedObj, project);
    }

    /**
     * Based on '[TapeAction.java].resolveOwnerValue(IRecorderManager, HashMap<Long, Object>)'
     * @param action 
     */
    private actionResolveOwnerValue(action: TapeAction): any {
        if (action.ownerSignatureStr) {
            return this._objectsBySignature.get(action.ownerSignatureStr);
        } else if (action.ownerCreationId) {
            throw new Error('This should not happen. Action: ' + action.actionType);
        } else if (action.ownerCreationRefId) {
            return this._objectsByCreationId.get(action.ownerCreationRefId);
        } else {
            throw new Error('This should not happen. Action: ' + this.jsonStringfyWithMax(action));
        }
    }

    /**
     * Based on '[TapeAction.java].resolveJavaPropertyName(ObjectMapper, IRecorderManager, HashMap<Long, Object>)'
     * @param action 
     */
    private actionResolveFieldName(action: TapeAction): any {
        return action.fieldName;
    }

    /**
     * Based on '[TapeAction.java].resolveColletion(ObjectMapper, IRecorderManager, HashMap<Long, Object>)'
     * @param action 
     */
    private actionResolveColletion(action: TapeAction): any {
		if (action.actionType == TapeActionType.CollectionAdd || action.actionType == TapeActionType.CollectionRemove) {
			try {
				return this.actionResolveOwnerValue(action)[this.actionResolveFieldName(action)];
			} catch (e) {
                let newErr: any = new Error('This should not happen. action. Action ' + this.jsonStringfyWithMax(action));
                newErr.reason = e;
                throw newErr;
			}
		} else {
            return null;
        }
    }



    /**
     * Based on '[TapeAction.java].resolveSettedValue(ObjectMapper, IRecorderManager, HashMap<Long, Object>)'
     * @param action 
     */
    private actionResolveSettedValue<P, GP>(action: TapeAction, fieldEtc: FieldEtc<P, GP>): Observable<P> {
        const thisLocal = this;
        let resolvedSettedValue$: Observable<P>;

        if (action.settedCreationRefId) {
            resolvedSettedValue$ = of(this._objectsByCreationId.get(action.settedCreationRefId) as P);
        } else if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
            if(!action.attachRefId) {
                if(fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    resolvedSettedValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(
                        action.simpleSettedValue,
                        fieldEtc.fieldInfo);
                }
            } else if (action.attachRefId) {
                if (fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                    resolvedSettedValue$ = thisLocal.manager.config.cacheHandler.getFromCache(action.attachRefId)
                        .pipe(
                            flatMapJustOnceRxOpr((stream) => {
                                return fieldEtc.fieldProcessorCaller.callFromDirectRaw(stream, fieldEtc.fieldInfo);
                            }),
                            thisLocal.registerProvidedObservablesRxOpr(),
                            share()
                        );
                } else {
                    resolvedSettedValue$ = 
                        (thisLocal.manager.config.cacheHandler.getFromCache(action.attachRefId) as any as Observable<P>).pipe(
                            thisLocal.registerProvidedObservablesRxOpr(),
                            share()
                        );
                }
            } else {
                throw new Error('Invalid action. LazyRefPrp invalid values: ' + this.jsonStringfyWithMax(action));                
            }
        } else if (action.settedSignatureStr) {
            resolvedSettedValue$ = of(thisLocal._objectsBySignature.get(action.settedSignatureStr) as P);
        } else if (action.fieldName) {
            if (fieldEtc.fieldProcessorCaller.callFromRecordedLiteralValue) {
                resolvedSettedValue$ = 
                    fieldEtc.fieldProcessorCaller.callFromRecordedLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo).pipe(
                        thisLocal.registerProvidedObservablesRxOpr(),
                        share()
                    );
            } else if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                resolvedSettedValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo);
            } else {
                resolvedSettedValue$ = of(action.simpleSettedValue as P);
            }
        }
        
        return resolvedSettedValue$;

        // const isSynchronouslyDone = { value: false, result: null as P};
        // resolvedSettedValue$ = resolvedSettedValue$.pipe(thisLocal.addSubscribedObsRxOpr());
        // resolvedSettedValue$ = resolvedSettedValue$.pipe(
        //     tap((resolvedSettedValue)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = resolvedSettedValue;
        //     })
        // );

        // return resolvedSettedValue$;
        // // if (!isSynchronouslyDone.value) {
        // //     return resolvedSettedValue$;
        // // } else {
        // //     return of(isSynchronouslyDone.result);
        // // }
    }
    /**
     * Based on '[ReplayableDefault.java].replay()'
     */
    private rerunByPlaybacksIgnoreCreateInstance(): Observable<void> {
        const thisLocal = this;
        const asyncCombineObsArr: Observable<any>[] = [];
        //let obsArr: Observable<void>[] = [];
        let allPlaybacks: Tape[] = [
            ...this._latestTape.slice(),
            ...(this._currentTape? [this._currentTape]: [])
        ];
        for (const tape of allPlaybacks) {
            for (const action of tape.actions) {
                if (action.actionType != TapeActionType.Create) {
                    let resolvedOwnerValue: any = thisLocal.actionResolveOwnerValue(action);
                    let resolvedFieldName: string = thisLocal.actionResolveFieldName(action);
                    let resolvedCollection: any = thisLocal.actionResolveColletion(action);
                    let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc(
                        thisLocal.fielEtcCacheMap,
                        resolvedOwnerValue, resolvedFieldName,
                        thisLocal.manager.config);
                    let resolvedSettedValue$: Observable<any> = thisLocal.actionResolveSettedValue(action, fieldEtc);
                    resolvedSettedValue$ = resolvedSettedValue$.pipe(
                        tap((resolvedSettedValue) => {
                            thisLocal.restoreEntireStateCallbackTemplate(()=> {
                                const wasCollectionAsyncronousModified = { value: true };
                                switch (action.actionType) {
                                    case TapeActionType.CollectionAdd:
                                        if (resolvedCollection && (resolvedCollection as LazyRef<any, any>).iAmLazyRef) {
                                            //in theory this should be synchronous because it is already created
                                            (resolvedOwnerValue[resolvedFieldName] as LazyRef<any, any>)
                                                .subscribeToModify(coll => {
                                                    thisLocal.addOnCollection(coll, resolvedSettedValue);
                                                    wasCollectionAsyncronousModified.value = false;
                                                });
                                        } else {
                                            thisLocal.addOnCollection(resolvedCollection, resolvedSettedValue);
                                            wasCollectionAsyncronousModified.value = false;
                                        }
                                        if (wasCollectionAsyncronousModified.value) {
                                            throw new Error('Invalid action. Collection was not loaded on current state: ' + this.jsonStringfyWithMax(action));
                                        }
                                        break;
                                    case TapeActionType.CollectionRemove:
                                        if (resolvedCollection && (resolvedCollection as LazyRef<any, any>).iAmLazyRef) {
                                            //in theory this should be synchronous because it is already created
                                            (resolvedOwnerValue[resolvedFieldName] as LazyRef<any, any>)
                                                .subscribeToModify(coll => {
                                                    thisLocal.restoreEntireStateCallbackTemplate(()=> {
                                                        thisLocal.removeFromCollection(coll, resolvedSettedValue);
                                                    })
                                                    wasCollectionAsyncronousModified.value = false;
                                                });
                                        } else {
                                            thisLocal.restoreEntireStateCallbackTemplate(()=> {
                                                thisLocal.removeFromCollection(resolvedCollection, resolvedSettedValue);
                                            })
                                            wasCollectionAsyncronousModified.value = false;
                                        }
                                        if (wasCollectionAsyncronousModified.value) {
                                            throw new Error('Invalid action. Collection was not loaded on current state: ' + this.jsonStringfyWithMax(action));
                                        }
                                        break;
                                    case TapeActionType.SetField:
                                        if (resolvedOwnerValue[resolvedFieldName] && (resolvedOwnerValue[resolvedFieldName] as LazyRef<any, any>).iAmLazyRef) {
                                            let setLazyObjNoNext$ = (resolvedOwnerValue[resolvedFieldName] as LazyRefImplementor<any, any>).setLazyObjNoNext(resolvedSettedValue);
                                            //setLazyObjNoNext$ = setLazyObjNoNext$.pipe(thisLocal.addSubscribedObsRxOpr());
                                            setLazyObjNoNext$;
                                            asyncCombineObsArr.push(setLazyObjNoNext$);
                                        } else {
                                            thisLocal.restoreEntireStateCallbackTemplate(()=> {
                                                resolvedOwnerValue[resolvedFieldName] = resolvedSettedValue;
                                            });
                                        }
                                        break;
                                    case TapeActionType.Delete:
                                        //nothing
                                        break;
                                    case TapeActionType.Save:
                                        //nothing
                                        break;
                                    default:
                                        throw new Error('This should not happen');
                                }
                            })
                        }),
                        flatMap((resolvedSettedValue) => {
                            let setLazyObjNoNext$ = of(resolvedSettedValue);
                            if(action.actionType === TapeActionType.SetField) {
                                if (resolvedOwnerValue[resolvedFieldName] && (resolvedOwnerValue[resolvedFieldName] as LazyRef<any, any>).iAmLazyRef) {
                                    setLazyObjNoNext$ = (resolvedOwnerValue[resolvedFieldName] as LazyRefImplementor<any, any>).setLazyObjNoNext(resolvedSettedValue);
                                    //setLazyObjNoNext$ = setLazyObjNoNext$.pipe(thisLocal.addSubscribedObsRxOpr());
                                    return setLazyObjNoNext$;
                                } else {
                                    thisLocal.restoreEntireStateCallbackTemplate(()=> {
                                        resolvedOwnerValue[resolvedFieldName] = resolvedSettedValue;
                                    });
                                }
                            }
                            return setLazyObjNoNext$;
                        })
                    );
                    asyncCombineObsArr.push(resolvedSettedValue$);
                    //.subscribe((resolvedSettedValue) => );
                }
            }
        }
        //const asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
        const asyncCombineArr$ = combineFirstSerial(asyncCombineObsArr).pipe(
            // thisLocal.registerExposedObservablesRxOpr(),
            // share(),
            map(() => {
                return undefined;
            })
        );
        return asyncCombineArr$;
        // const isSynchronouslyDone = { value: false, result: null as any};
        // const asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
        //     map(() => {
        //         return isSynchronouslyDone.result;
        //     })
        // );
        // asyncCombineArr$.subscribe((result)=> {
        //     isSynchronouslyDone.value = true;
        //     isSynchronouslyDone.result = undefined;
        // });
        // if (!isSynchronouslyDone.value) {
        //     return asyncCombineArr$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }

        // let createSerialAsyncTasksWaiting$ = this.createSerialAsyncTasksWaiting();
        // const isSynchronouslyDone = { value: false };
        // createSerialAsyncTasksWaiting$.subscribe(() =>{
        //     isSynchronouslyDone.value = true;
        // });

        // if (!isSynchronouslyDone.value) {
        //     return createSerialAsyncTasksWaiting$;
        // } else {
        //     return of(null);
        // }
    }

    resolveMetadatas(
            options: 
                {
                    object?: any,
                    literalObject?: any,
                    key?: string,
                    refererObject?: Object,
                    refererLiteralObject?: any,
                    refMap?: Map<Number, any>,
                }) : ResolveMetadataReturn {
        const thisLocal = this;
        let valueOrliteral = options.object || options.literalObject || {};
        let refererObjectOrLiteral = options.refererObject || options.refererLiteralObject || {};
        
        let refererObjMd: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let objectMd: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let playerObjectIdMd: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let refererObjMdFound: boolean = false;
        let objectMdFound: boolean = false;
        let playerObjectIdMdFound: boolean = false;

        if (LodashLike.has(valueOrliteral, this.manager.config.playerMetadatasName)) {
            objectMdFound = true;
            objectMd = LodashLike.get(valueOrliteral, this.manager.config.playerMetadatasName);
        }
        if (LodashLike.has(refererObjectOrLiteral, this.manager.config.playerMetadatasName)) {
            refererObjMdFound = true;
            refererObjMd = LodashLike.get(refererObjectOrLiteral, this.manager.config.playerMetadatasName);
        }
        //we are processing the metadata
        if (options.key === this.manager.config.playerMetadatasName 
                && (valueOrliteral as PlayerMetadatas).$iAmPlayerMetadatas$
                && LodashLike.has((valueOrliteral as PlayerMetadatas).$playerObjectId$, this.manager.config.playerMetadatasName)) {
            if (LodashLike.has((valueOrliteral as PlayerMetadatas).$playerObjectId$, this.manager.config.playerMetadatasName)) {
                playerObjectIdMdFound = true;
                playerObjectIdMd = LodashLike.get((valueOrliteral as PlayerMetadatas).$playerObjectId$, this.manager.config.playerMetadatasName);
            }
        }

        if (options.refMap) {
            if (refererObjMd.$id$ && refererObjMd.$isLazyUninitialized$ && !options.refMap.has(refererObjMd.$id$)) {
                const dummySignatureInstance = {};
                (dummySignatureInstance as any)[thisLocal.manager.config.playerMetadatasName] = refererObjMd;
                options.refMap.set(refererObjMd.$id$, dummySignatureInstance);
            } else if (refererObjMd.$idRef$) {
                const trackedInstance = options.refMap.get(refererObjMd.$idRef$);
                let trackedInstanceMd = LodashLike.get(trackedInstance, this.manager.config.playerMetadatasName) as PlayerMetadatas;
                if (!trackedInstanceMd.$iAmPlayerMetadatas$) {
                    throw new Error('There is something wrong with:\n' + 
                    this.jsonStringfyWithMax(trackedInstance));
                }
                //here sign ref to another isLazyUninitialized metadata, this shrink the json.
                if (trackedInstanceMd.$isLazyUninitialized$) {
                    refererObjMd = trackedInstanceMd;
                }
            }

            if (objectMd.$id$ && objectMd.$isLazyUninitialized$ && !options.refMap.has(objectMd.$id$)) {
                const dummySignatureInstance = {};
                (dummySignatureInstance as any)[thisLocal.manager.config.playerMetadatasName] = objectMd;
                options.refMap.set(objectMd.$id$, dummySignatureInstance);
            } else if (objectMd.$idRef$) {
                const trackedInstance = options.refMap.get(objectMd.$idRef$);
                let trackedInstanceMd = LodashLike.get(trackedInstance, this.manager.config.playerMetadatasName) as PlayerMetadatas;
                if (!trackedInstanceMd.$iAmPlayerMetadatas$) {
                    throw new Error('There is something wrong with:\n' + 
                        this.jsonStringfyWithMax(trackedInstance));
                }
                //here sign ref to another isLazyUninitialized metadata, this shrink the json.
                if (trackedInstanceMd.$isLazyUninitialized$) {
                    objectMd = trackedInstanceMd;
                }
            }

            if (playerObjectIdMd.$id$ && playerObjectIdMd.$isLazyUninitialized$ && !options.refMap.has(playerObjectIdMd.$id$)) {
                const dummySignatureInstance = {};
                (dummySignatureInstance as any)[thisLocal.manager.config.playerMetadatasName] = playerObjectIdMd;
                options.refMap.set(playerObjectIdMd.$id$, dummySignatureInstance);
            } else if (playerObjectIdMd.$idRef$) {
                const trackedInstance = options.refMap.get(playerObjectIdMd.$idRef$);
                let trackedInstanceMd = LodashLike.get(trackedInstance, this.manager.config.playerMetadatasName) as PlayerMetadatas;
                if (!trackedInstanceMd.$iAmPlayerMetadatas$) {
                    throw new Error('There is something wrong with:\n' + 
                        this.jsonStringfyWithMax(trackedInstance));
                }
                //here sign ref to another isLazyUninitialized metadata, this shrink the json.
                if (trackedInstanceMd.$isLazyUninitialized$) {
                    playerObjectIdMd = trackedInstanceMd;
                }
            }
        }

        return {
            refererObjMd: refererObjMd,
            objectMd: objectMd,
            playerObjectIdMd: playerObjectIdMd,
            refererObjMdFound: refererObjMdFound,
            objectMdFound: objectMdFound,
            playerObjectIdMdFound: playerObjectIdMdFound
        };
    }

    // private getFromRefMap<T>(objectMd: PlayerMetadatas, refMap: Map<number, any>): T {
    //     let result: T;
    //     if (objectMd.$idRef$) {
    //         result = refMap.get(objectMd.$idRef$) as T;
    //     } else if (objectMd.$id$) {
    //         result = refMap.get(objectMd.$id$) as T;
    //     }
    //     return result;
    // }

    public createLiteralRefForEntity<T>(realEntity: T): any {
        if (!realEntity) {
            throw new Error('realEntity can not be null');
        }
        let allMD = this.resolveMetadatas({ object: realEntity });
        let entityRefReturn: EntityRef;
        let bMd: PlayerMetadatas = allMD.objectMd;

        if (bMd.$signature$) {
            entityRefReturn = {
                signatureStr: bMd.$signature$,
                iAmAnEntityRef: true
            }
        } else if (LodashLike.has(realEntity, this.manager.config.creationIdName)) {
            entityRefReturn = {
                creationId: LodashLike.get(realEntity, this.manager.config.creationIdName),
                iAmAnEntityRef: true
            }
        } else {
            throw new Error('Invalid operation. Not managed entity. Entity: \'' + realEntity.constructor + '\'');
        }
        return entityRefReturn;
    }

    public getEntityInstanceFromLiteralRef<T>(literalRef: any): T {
        let entityRef: EntityRef = literalRef;
        if (entityRef.iAmAnEntityRef && entityRef.signatureStr) {
            return this._objectsBySignature.get(entityRef.signatureStr);
        } else if (entityRef.iAmAnEntityRef && entityRef.creationId) {
            return this._objectsByCreationId.get(entityRef.creationId);
        } else {
            throw new Error('Invalid operation. Not managed entity. literalRef: \'' + literalRef + '\'');
        }
    }

    /**
     * Getter manager
     * @return {RecorderManager}
     */
    public get manager(): RecorderManager {
        return this._manager;
    }

    /**
     * Setter manager
     * @param {RecorderManager} value
     */
    public set manager(value: RecorderManager) {
        const thisLocal = this;
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.manager set');
			thisLocal.consoleLike.debug(value as any as string);
            thisLocal.consoleLike.groupEnd();
		}
        this._manager = value;
    }

    public processPlayerSnapshot<L>(entityType: TypeLike<L>, playerSnapshot: PlayerSnapshot): Observable<L> {
        const thisLocal = this;
        let result$: Observable<L>;
        thisLocal.validatePlayerSideLiteralObject(playerSnapshot);
        if (!playerSnapshot.wrappedSnapshot) {
            throw new Error('playerSnapshot.result exists: ' + this.jsonStringfyWithMax(playerSnapshot));
        }
        let playerTypeOptions: RecorderDecorators.playerTypeOptions = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_TYPE, entityType);
        if (!playerTypeOptions) {
            throw new Error('the classe \'' + entityType + ' is not using the decorator \'RecorderDecorators.playerType\'');
        }

        let allMD = this.resolveMetadatas({literalObject: playerSnapshot.wrappedSnapshot});
        let bMd = allMD.objectMd;

        if (!this.isOnRestoreEntireStateFromLiteral()) {
            if (!bMd.$isComponent$) {
                this.storeOriginalLiteralEntry(
                    {
                        method: 'processResultEntity',
                        reflectFunctionMetadataTypeKey: RecorderDecoratorsInternal.mountContructorByPlayerTypeMetadataKey(playerTypeOptions, entityType),
                        playerSnapshot: playerSnapshot
                    });
            }
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntity<L>()');
            thisLocal.consoleLike.debug(entityType); thisLocal.consoleLike.debug(playerSnapshot);
            thisLocal.consoleLike.groupEnd();
        }
        let refMap: Map<Number, any> = new Map<Number, any>();
        result$ = this.processResultEntityPriv(entityType, playerSnapshot.wrappedSnapshot, refMap).pipe(
            tap((resultL) => {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntity<L>() => result$.pipe(). resultL:');
                    thisLocal.consoleLike.debug(resultL);
                    thisLocal.consoleLike.groupEnd();
                }
            })
        );
        return result$;
        // result$ = thisLocal.createSerialAsyncTasksWaitingNew().pipe(
        //     flatMap((resultL) => {
        //         if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
        //             thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntity<L>() => result$.pipe(). resultL:');
        //             thisLocal.consoleLike.debug(resultL);
        //             thisLocal.consoleLike.groupEnd();
        //         }
        //         return this.processResultEntityPriv(entityType, playerSnapshot.wrappedSnapshot, refMap);
        //     }),
        //     share()
        // );
        // return result$;
        // result$ = result$.pipe(
        //     tap((resultL) => {
        //         if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
        //             thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntity<L>() => result$.pipe(). resultL:');
        //             thisLocal.consoleLike.debug(resultL);
        //             thisLocal.consoleLike.groupEnd();
        //         }
        //     })
        // );

        // const isSynchronouslyDone = { value: false, result: null as L};
        // result$.subscribe((result)=>{
        //     isSynchronouslyDone.value = true;
        //     isSynchronouslyDone.result = result;
        // });

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    public processPlayerSnapshotArray<L>(entityType: TypeLike<L>, playerSnapshot: PlayerSnapshot): Observable<Array<L>> {
        const thisLocal = this;
        const asyncCombineObsArr: Observable<any>[] = [];
        if (!playerSnapshot.wrappedSnapshot) {
            throw new Error('playerSnapshot.result existe' + this.jsonStringfyWithMax(playerSnapshot));
        }
        let playerTypeOptions: RecorderDecorators.playerTypeOptions = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_TYPE, entityType);
        if (!playerTypeOptions) {
            throw new Error('the classe \'' + entityType + ' is not using the decorator \'RecorderDecorators.playerType\'');
        }
        if (!this.isOnRestoreEntireStateFromLiteral()) {
            this.storeOriginalLiteralEntry(
                {
                    method: 'processResultEntityArray',
                    reflectFunctionMetadataTypeKey: RecorderDecoratorsInternal.mountContructorByPlayerTypeMetadataKey(playerTypeOptions, entityType),
                    playerSnapshot: playerSnapshot
                });
        }

        let refMap: Map<Number, any> = new Map<Number, any>();
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntityArray<L>()');
            thisLocal.consoleLike.debug(entityType); thisLocal.consoleLike.debug(playerSnapshot);
            thisLocal.consoleLike.groupEnd();
        }
        for (let index = 0; index < (playerSnapshot.wrappedSnapshot as any[]).length; index++) {
            const resultElement = (playerSnapshot.wrappedSnapshot as any[])[index];
            asyncCombineObsArr.push(this.processResultEntityPriv(entityType, resultElement, refMap));
        }
        //const asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
        const asyncCombineArr$ = combineFirstSerial(asyncCombineObsArr).pipe(
            tap(() => {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntityArray<L>(). wrappedSnapshot:');
                    thisLocal.consoleLike.debug(playerSnapshot);
                    thisLocal.consoleLike.groupEnd();
                }
            }),
            share()
        );
        return asyncCombineArr$;
        // let combineFirstSerial$ = thisLocal.createSerialAsyncTasksWaitingNew().pipe(
        //     flatMap(() => {
        //         if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
        //             thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntityArray<L>(). wrappedSnapshot:');
        //             thisLocal.consoleLike.debug(playerSnapshot);
        //             thisLocal.consoleLike.groupEnd();
        //         }
        //         return thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(share());
        //     })
        // );

        // const isSynchronouslyDone = { value: false, result: null as L[]};
        // combineFirstSerial$.subscribe((result)=> {
        //     isSynchronouslyDone.value = true;
        //     isSynchronouslyDone.result = result;
        // });

        // if (!isSynchronouslyDone.value) {
        //     return combineFirstSerial$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    private newEntityInstanceWithCreationId<T extends object>(entityType: TypeLike<T>, creationId: number): Observable<T> {
        const thisLocal = this;
        const asyncCombineObsArr: Observable<any>[] = [];
        if (!this.isOnRestoreEntireStateFromLiteral() && !this.isRecording()){
            throw new Error('Invalid operation. It is not recording. is this Error correct?!');
        }
        this.validatingMetaFieldsExistence(entityType);
        let entityObj = new entityType();
        LodashLike.set(entityObj, RecorderConstants.ENTITY_SESION_PROPERTY_NAME, this);
        let realKeys: string[] = Object.keys(Object.getPrototypeOf(entityObj));
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.debug('entityType: ' + entityType.name);
        }
        for (let index = 0; index < realKeys.length; index++) {
            const keyItem = realKeys[index];
            let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<any, any>(thisLocal._fielEtcCacheMap, entityObj, keyItem, thisLocal.manager.config);
            //let prpGenType: GenericNode = GenericTokenizer.resolveNode(entityObj, keyItem);
            if (!fieldEtc.prpGenType) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.debug('GenericNode not found for property key \'' + keyItem + '\' of ' + entityType.name);
                }
            } else if (fieldEtc.lazyRefMarkerType) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.debug('GenericNode found but it is not a LazyRef. Property key \'' + keyItem + '\' of ' + entityType.name);
                }
            } else {
                if (fieldEtc.lazyLoadedObjType) {
                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLike.debug('GenericNode found and it is a LazyRef, fieldEtc.lazyLoadedObjType: ' + fieldEtc.lazyLoadedObjType.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                    }

                    let allMD = this.resolveMetadatas({refererObject: entityObj, key: keyItem});
                    if (fieldEtc.otmCollectionType) {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('GenericNode found, it is a LazyRef, and it is a Collection, fieldEtc.otmCollectionType: ' + fieldEtc.otmCollectionType.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRefSet: LazyRefDefault<any, any> = new LazyRefDefault<any, any>(thisLocal);
                        let setLazyObjOnLazyLoadingNoNext$ = lazyRefSet.setLazyObjOnLazyLoadingNoNext(this.createCollection(fieldEtc.otmCollectionType, entityObj, keyItem));
                        // setLazyObjOnLazyLoading$ = setLazyObjOnLazyLoading$.pipe(
                        //     tap(
                        //         {
                        //             next: () => {}
                        //         }
                        //     )
                        // );
                        asyncCombineObsArr.push(setLazyObjOnLazyLoadingNoNext$);

                        lazyRefSet.instanceId = this.nextMultiPurposeInstanceId();

                        lazyRefSet.refererObj = entityObj;
                        lazyRefSet.refererKey = keyItem;
                        lazyRefSet.session = this;
                        lazyRefSet.bMdLazyLoadedObj = allMD.objectMd;
                        lazyRefSet.bMdRefererObj = allMD.refererObjMd;
                        lazyRefSet.pbMdRefererPlayerObjectId = allMD.playerObjectIdMd;
                        LodashLike.set(entityObj, keyItem, lazyRefSet);
                    } else {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('GenericNode found, it is a LazyRef, and it is not a Collection, fieldEtc.lazyLoadedObjType: ' + fieldEtc.lazyLoadedObjType.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRef: LazyRefDefault<any, any> = new LazyRefDefault<any, any>(thisLocal);
                        lazyRef.instanceId = this.nextMultiPurposeInstanceId();
                        lazyRef.refererObj = entityObj;
                        lazyRef.refererKey = keyItem;
                        lazyRef.session = this;
                        lazyRef.bMdLazyLoadedObj = allMD.objectMd;
                        lazyRef.bMdRefererObj = allMD.refererObjMd;
                        lazyRef.pbMdRefererPlayerObjectId = allMD.playerObjectIdMd;
                        LodashLike.set(entityObj, keyItem, lazyRef);
                    }
                } else {
                    throw new Error('Property \'' + keyItem + ' of \'' + entityObj.constructor + '\'. LazyRef not properly defined on Reflect');
                }
            }
        }

        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.debug('isRecording, ');
        }

        this._objectsByCreationId.set(creationId, entityObj);
        let playerTypeOptions: RecorderDecorators.playerTypeOptions = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_TYPE, entityType);
        if (!playerTypeOptions) {
            throw new Error('the classe \'' + entityType + ' is not using the decorator \'RecorderDecorators.playerType\'');
        }
        if (!this.isOnRestoreEntireStateFromLiteral()) {    
            this.storeOriginalLiteralEntry(
                {
                    method: 'newEntityInstance',
                    reflectFunctionMetadataTypeKey: RecorderDecoratorsInternal.mountContructorByPlayerTypeMetadataKey(playerTypeOptions, entityType),
                    ref: {
                        creationId: creationId,
                        iAmAnEntityRef: true
                    }
                });
        }
        
        LodashLike.set(entityObj, this.manager.config.creationIdName, creationId);
        LodashLike.set(entityObj, RecorderConstants.ENTITY_SESION_PROPERTY_NAME, this);

        if (!this.isOnRestoreEntireStateFromLiteral()) {
            //recording tape
            let action: TapeAction = new TapeActionDefault();
            action.fieldName = null;
            action.actionType = TapeActionType.Create;
            
            let playerTypeOptions: RecorderDecorators.playerTypeOptions = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_TYPE, entityType);
            if (!playerTypeOptions) {
                throw new Error('the classe \'' + entityType + ' is not using the decorator \'RecorderDecorators.playerType\'');
            }
            action.ownerPlayerType = playerTypeOptions.playerType;
            action.ownerCreationId = this._nextCreationId;
            this.addTapeAction(action);
        }
        //let asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
        let asyncCombineArr$ = combineFirstSerial(asyncCombineObsArr).pipe(
            map(() => {
                return entityObj;
            })
        );
        return asyncCombineArr$;

        // const isSynchronouslyDone = { value: false, result: null as any};
        // let asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
        //     map(() => {
        //         return isSynchronouslyDone.result;
        //     })
        // );
        // asyncCombineArr$ = asyncCombineArr$.pipe(
        //     tap((result)=> {
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = entityObj;
        //     })
        // );
        // if (!isSynchronouslyDone.value) {
        //     return asyncCombineArr$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }

        // let createSerialAsyncTasksWaiting$ = this.createSerialAsyncTasksWaiting()
        //     .pipe(
        //         map(() => {
        //             return entityObj;
        //         })
        //     );

        // const isSynchronouslyDone = { value: false, result: null as T};
        // createSerialAsyncTasksWaiting$.subscribe((result)=>{
        //     isSynchronouslyDone.value = true;
        //     isSynchronouslyDone.result = result;
        // });

        // if (!isSynchronouslyDone.value) {
        //     return createSerialAsyncTasksWaiting$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    public newEntityInstance<T extends object>(entityType: TypeLike<T>): Observable<T> {
        const thisLocal = this;
        if (!this.isRecording()){
            throw new Error('Invalid operation. It is not recording.');
        }

        let newEntityInstanceWithCreationId$ = this.newEntityInstanceWithCreationId<T>(entityType, this._nextCreationId);
        let result$ = newEntityInstanceWithCreationId$
            .pipe(
                map((newEntityReturn) => {
                    this._nextCreationId++;
                    return newEntityReturn;
                }),
                share()
            );
        return result$;

        // const isSynchronouslyDone = { value: false, result: null as T};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    public startRecording(): void {
        const thisLocal = this;
        if (this.isRecording()) {
            throw new Error('I am already recording!');
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.debug('reseting this._currentTape, this._objectsCreationId and this._nextCreationId');
        }
        this._currentTape = new TapeDefault();
        this._nextCreationId = 1;
    }

    public stopRecording(): void {
        const thisLocal = this;
        if (this.isRecording()) {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
                thisLocal.consoleLike.debug('updating this.lastTape and resetting this.currentTape');
            }
            this._latestTape.push(this._currentTape);
            this._currentTape = null;
        } else {
            throw new Error('I am not recording!');
        }
    }
    
    public recordSave(entity: any): void {
        const thisLocal = this;
        if (!entity){
            throw new Error('entity can not be null');
        }
        if (!this.isRecording()){
            throw new Error('Invalid operation. It is not recording. entity: \'' + entity.constructor.name + '\'. Is this Error correct?!');
        }
        let session: RecorderSession = LodashLike.get(entity, RecorderConstants.ENTITY_SESION_PROPERTY_NAME) as RecorderSession;
        if (!session) {
            throw new Error('Invalid operation. \'' + entity.constructor.name + '\' not managed. \'' + RecorderConstants.ENTITY_SESION_PROPERTY_NAME + '\' estah null');
        } else if (session !== this) {
            throw new Error('Invalid operation. \'' + entity.constructor.name + '\' managed by another session.');
        }
        let allMD = this.resolveMetadatas({object: entity});
        let bMd = allMD.objectMd;

        //recording tape
        let action: TapeAction = new TapeActionDefault();
        action.actionType = TapeActionType.Save;
        if (bMd.$signature$) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' has a signature, that is, it has persisted');
        } else if (LodashLike.has(entity, this.manager.config.creationIdName)) {
            action.ownerCreationRefId = LodashLike.get(entity, this.manager.config.creationIdName) as number;
        } else {
            throw new Error('Invalid operation. Not managed entity. Entity: \'' + entity.constructor + '\'');
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('action: ');
            thisLocal.consoleLike.debug(action);
            thisLocal.consoleLike.groupEnd();
        }
        this.addTapeAction(action);
    }

    public recordDelete(entity: any): void {
        const thisLocal = this;
        if (!entity){
            throw new Error('Entity nao pode ser nula');
        }
        if (!this.isRecording()){
            throw new Error('Invalid operation. It is not recording. entity: \'' + entity.constructor.name + '\'. Is this Error correct?!');
        }
        let session: RecorderSession = LodashLike.get(entity, RecorderConstants.ENTITY_SESION_PROPERTY_NAME) as RecorderSession;
        if (!session) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' not managed. \'' + RecorderConstants.ENTITY_SESION_PROPERTY_NAME + '\' estah null');
        } else if (session !== this) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' managed by another session.');
        }
        let allMD = this.resolveMetadatas({object: entity});
        let bMd = allMD.objectMd;
        //recording tape
        let action: TapeAction = new TapeActionDefault();
        action.actionType = TapeActionType.Delete;
        if (bMd.$signature$) {
            action.ownerSignatureStr = bMd.$signature$;
        } else if (LodashLike.has(entity, this.manager.config.creationIdName)) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' has id of creation, that is, is not persisted.');
        } else {
            throw new Error('Invalid operation. Not managed entity. Entity: \'' + entity.constructor + '\'');
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.debug('action: ' + action);
        }
        this.addTapeAction(action);
    }

    recordAtache(attach: NodeJS.ReadableStream): string {
        let name = this.manager.config.attachPrefix + this.nextMultiPurposeInstanceId();
        this._currentRecordedAtaches.set(name, attach);
        return name;
    }

    public storeOriginalLiteralEntry(originalValueEntry: OriginalLiteralValueEntry): void {
        this._originalLiteralValueEntries.push(originalValueEntry);
    }

    public clear(): Observable<void> {
        const thisLocal = this;
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.debug('clearing: this.objectsBySignature, this.objectsCreationId, this.nextCreationId, this.currentTape, this.lastTape and this.objectsBySignature');
        }
        this._nextCreationId = null;
        this._currentTape = null;
        this._latestTape = null;
        this._nextMultiPurposeInstanceId = 1;
        this._objectsBySignature = new Map();
        this._objectsByCreationId = new Map();
        this._lazyrefsByEntityMap = new Map();
        this._fielEtcCacheMap = new Map();
        this._switchedOffNotificationEntitiesSet = new Set();
        this._originalLiteralValueEntries = [];
        this._latestTape = [];
        
        let clearCache$: Observable<void> = this.manager.config.cacheHandler.clearCache();
        // clearCache$ = clearCache$.pipe(this.addSubscribedObsRxOpr());
        return clearCache$.pipe(
            thisLocal.registerProvidedObservablesRxOpr(),
            share()
        );
    }

    getLastRecordedTape(): Observable<Tape> {
        const thisLocal = this;
        let createSerialAsyncTasksWaiting$ = this.createSerialPendingTasksWaiting().pipe(map(() => {
            return thisLocal._latestTape.length > 0? thisLocal._latestTape[thisLocal._latestTape.length - 1] : null;
        }));

        return createSerialAsyncTasksWaiting$;
        // const isSynchronouslyDone = { value: false, result: null as Tape};
        // createSerialAsyncTasksWaiting$ = createSerialAsyncTasksWaiting$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return createSerialAsyncTasksWaiting$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    getLastRecordedStreams(): Observable<Map<String, NodeJS.ReadableStream>> {
        const thisLocal = this;
        let result$ = this.getLastRecordedTape()
            .pipe(
                flatMapJustOnceRxOpr((tape) => {
                    const idAndStreamObsArr: Observable<{attachRefId: String, stream: NodeJS.ReadableStream}>[] = [];
                    if (tape && tape.actions){
                        for (const actionItem of tape.actions) {
                            if (actionItem.attachRefId) {
                                let idAndStream$: Observable<{attachRefId: String, stream: NodeJS.ReadableStream}> = 
                                    thisLocal.manager.config.cacheHandler.getFromCache(actionItem.attachRefId)
                                        .pipe(
                                            mapJustOnceRxOpr((streamValue) => {
                                                return {
                                                    attachRefId: actionItem.attachRefId,
                                                    stream: streamValue
                                                }
                                            }),
                                            thisLocal.registerProvidedObservablesRxOpr(),
                                            share()
                                        );
                                idAndStreamObsArr.push(idAndStream$);
                            }
                        }
                        if (idAndStreamObsArr.length > 0) {
                            //return thisLocal.combineFirstSerialPreserveAllFlags(idAndStreamObsArr).pipe(share());
                            return combineFirstSerial(idAndStreamObsArr).pipe(share());
                        } else {
                            return of([]);
                        }
                    } else {
                        return of([]);
                    }
                })
            )
            .pipe(
                map((idAndStreamArr) => {
                    const resultMap: Map<String, NodeJS.ReadableStream> = new Map();
                    for (const idAndStreamItem of idAndStreamArr) {
                        resultMap.set(idAndStreamItem.attachRefId, idAndStreamItem.stream);
                    }
                    return resultMap;
                })
            );

        return result$.pipe(
            // thisLocal.registerExposedObservablesRxOpr(),
            share()
        )

        // const isSynchronouslyDone = { value: false, result: null as Map<String, NodeJS.ReadableStream>};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    getLastRecordedTapeAndStreams(): Observable<{tape: Tape, streams: Map<String, NodeJS.ReadableStream>}> {
        const thisLocal = this;
        let result$ = this.getLastRecordedTape()
            .pipe(
                flatMapJustOnceRxOpr((tape) => {
                    return thisLocal.getLastRecordedStreams()
                        .pipe(
                            map((streamsMap) => {
                                return {
                                    tape: tape,
                                    streams: streamsMap
                                }
                            })
                        );
                })
            );

        return result$.pipe(
            // thisLocal.registerExposedObservablesRxOpr(),
            share()
        )
        // const isSynchronouslyDone = { value: false, result: null as {tape: Tape, streams: Map<String, NodeJS.ReadableStream>}};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    getLastRecordedTapeAsLiteralAndStreams(): Observable<{tapeLiteral: any, streams: Map<String, NodeJS.ReadableStream>}> {
        const thisLocal = this;
        let result$ = this.getLastRecordedTapeAsLiteral()
            .pipe(
                flatMapJustOnceRxOpr((tapeLiteral) => {
                    return this.getLastRecordedStreams()
                        .pipe(
                            map((streamsMap) => {
                                return {
                                    tapeLiteral: tapeLiteral,
                                    streams: streamsMap
                                }
                            })
                        );
                })
            );

        return result$.pipe(
            //thisLocal.registerExposedObservablesRxOpr(),
            share()
        )

        // const isSynchronouslyDone = { value: false, result: null as {tapeLiteral: any, streams: Map<String, NodeJS.ReadableStream>}};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    public addTapeAction(action: TapeAction): void {
        const thisLocal = this;
        if (!this.isRecording()) {
            throw new Error('The recording is not started!');
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('addTapeAction');
            thisLocal.consoleLike.debug(action as any as string);
            thisLocal.consoleLike.groupEnd();
        }

        this._currentTape.actions.push(action);
    }

    public isRecording(): boolean {
        return (this._currentTape != null);
    }

    public getLastRecordedTapeAsLiteral(): Observable<any> {
        const thisLocal = this;
        let result$: Observable<any> = this.getLastRecordedTape()
            .pipe(
                map((tape) => {
                    let resultLit =  thisLocal.getPlaybackAsLiteral(tape);
                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
                        thisLocal.consoleLike.group('getLastRecordedTapeAsLiteral');
                        thisLocal.consoleLike.debug(resultLit as any as string);
                        thisLocal.consoleLike.groupEnd();
                    }
                    return resultLit;
                })
            );

        return result$.pipe(
            // thisLocal.registerExposedObservablesRxOpr(),
            share()
        )
        // const isSynchronouslyDone = { value: false, result: null as any};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    getLastRecordedAtaches(): Map<String, NodeJS.ReadableStream> {
        return new Map(this._currentRecordedAtaches);
    }

    private getPlaybackAsLiteral(tape: Tape): any {
        const thisLocal = this;
        const literalReturn: any = JSONHelper.convertToLiteralObject(tape, true)
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('getPlaybackAsLiteral');
            thisLocal.consoleLike.debug(literalReturn as any as string);
            thisLocal.consoleLike.groupEnd();
        }
        return literalReturn;
    }

    private getTapeFromLiteral(tapeLiteral: any): Tape {
        const thisLocal = this;
        const playBackReturn: Tape = new TapeDefault();
        playBackReturn.actions = [];
        for (const actionLiteral of tapeLiteral.actions) {
            let action: TapeAction = new TapeActionDefault();
            action = LodashLike.mergeWith(
                action, 
                actionLiteral, 
                (value: any, srcValue: any) => {
                    return srcValue;
                }
            );
            playBackReturn.actions.push(action);
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('getPlaybackFromLiteral');
            thisLocal.consoleLike.debug(playBackReturn as any as string);
            thisLocal.consoleLike.groupEnd();
        }
        return playBackReturn;
    }

    public getCachedBySignature<T extends object>(signatureStr: string): T {
        if (this._objectsBySignature.get(signatureStr)) {
            return this._objectsBySignature.get(signatureStr);
        } else {
            return null;
        }
    }

    private validatingMetaFieldsExistence(entityType: TypeLike<any>): void {
        const camposControleArr = [
            this.manager.config.creationIdName,
            this.manager.config.playerMetadatasName,
            RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME,
            RecorderConstants.ENTITY_SESION_PROPERTY_NAME];
        for (let index = 0; index < camposControleArr.length; index++) {
            const internalKeyItem = camposControleArr[index];
            if (Object.keys(entityType.prototype).lastIndexOf(internalKeyItem.toString()) >= 0) {
                throw new Error('The Entity ' + entityType.name + ' already has the property \'' + internalKeyItem.toString() + '\' offined!');
            }            
        }
    }

    validatePlayerSideLiteralObject(literalObject: {}): void {
        let allMD = this.resolveMetadatas({literalObject: literalObject});
        if (!allMD.objectMd) {
            throw new Error('Invalid player side literal object: \n' + this.jsonStringfyWithMax(literalObject));
        }
    }
    validatePlayerSideResponseLike(responseLike: ResponseLike<{} | NodeJS.ReadableStream>): void {
        let isResponseBodyStream = responseLike.body && (responseLike.body as NodeJS.ReadableStream).pipe;
        if (!isResponseBodyStream) {
            if (!responseLike || !responseLike.body || !(responseLike.body as PlayerSnapshot).wrappedSnapshot) {
                throw new Error('Invalid player side responseLike body object: \n' + this.jsonStringfyWithMax(responseLike.body));
            }
        }
    }

    public processWrappedSnapshotFieldArrayInternal<L>(entityType: TypeLike<L>, lazyLoadedColl: any, wrappedSnapshotField: any[]): Observable<void> {
        const thisLocal = this;
        let refMap: Map<Number, any> = new Map();
        const asyncCombineObsArr: Observable<any>[] = [];

        let realItemObsArr: Observable<L>[] = []
        if (!Array.isArray(wrappedSnapshotField)) {
            throw new Error('wrappedSnapshotField is not an Array:\n' + this.jsonStringfyWithMax(wrappedSnapshotField));
        }
        for (const literalItem of wrappedSnapshotField) {                               
            let realItem$: Observable<L> = this.processResultEntityPriv(entityType, literalItem, refMap);
            realItemObsArr.push(realItem$);
        }
        let result$: Observable<void>;
        thisLocal.lazyLoadTemplateCallback(lazyLoadedColl, () => {
            //result$ = thisLocal.combineFirstSerialPreserveAllFlags(realItemObsArr)
            result$ = combineFirstSerial(realItemObsArr)
                .pipe(
                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(lazyLoadedColl, (realItemArr) => {
                        for (const realItem of realItemArr) {                           
                            thisLocal.addOnCollection(lazyLoadedColl, realItem);
                        }
                    })
                )
                .pipe(share());
        });        

        return result$.pipe(
            share()
        )

        // const isSynchronouslyDone = { value: false, result: null as void};
        // result$ = result$.pipe(
        //     tap((result)=>{
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = result;
        //     })
        // );

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    public processWrappedSnapshotFieldInternal<L>(entityType: TypeLike<L>, snapshotField: any): Observable<L> {
        const thisLocal = this;
        let refMap: Map<Number, any> = new Map();
        let result$ = this.processResultEntityPriv(entityType, snapshotField, refMap);

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

        // if (!isSynchronouslyDone.value) {
        //     return result$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }
    }

    private createAsyncCustomSetter(entity: any): LodashLike.AsyncCustomSetter {
        const thisLocal = this;

        const syncIsOn = LodashLike.get(entity, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        const asyncIsOnRef = { value: undefined as boolean };
        const asyncIsOn2Ref = { value: undefined as boolean };

        let asyncCustomSetter: LodashLike.AsyncCustomSetter = (object, key, value) => {
            asyncIsOnRef.value = LodashLike.get(object, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
            asyncIsOn2Ref.value = thisLocal._isOnRestoreEntireStateFromLiteral;
            LodashLike.set(object, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
            thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;

            const futureAsyncCustomSetterArgs = 
            {
                object: object,
                key: key,
                value: value
            };

            futureAsyncCustomSetterArgs.object = object;
            futureAsyncCustomSetterArgs.key = key;
            futureAsyncCustomSetterArgs.value = value;

            try {

                const asyncCustomSetterResult$ = of(undefined).pipe(
                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(entity, () => {
                        try {
                            if (entity !== futureAsyncCustomSetterArgs.object) {
                                throw new Error('This should not happen');
                            }
                            LodashLike.set(
                                futureAsyncCustomSetterArgs.object,
                                futureAsyncCustomSetterArgs.key, 
                                futureAsyncCustomSetterArgs.value);
                            return undefined as void;
                        } finally {
                            LodashLike.set(object, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOnRef.value);
                            thisLocal._isOnRestoreEntireStateFromLiteral = asyncIsOn2Ref.value;
                        }
                    })
                );
    
                // return asyncCustomSetterResult$.pipe(timeoutDecorateRxOpr());
                return asyncCustomSetterResult$;
            } finally {
                LodashLike.set(object, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOnRef.value);
                thisLocal._isOnRestoreEntireStateFromLiteral = asyncIsOn2Ref.value;
            }
        };

        return asyncCustomSetter;
    }

    private processResultEntityPriv<L>(entityType: TypeLike<L>, wrappedSnapshotField: any, refMap: Map<Number, any>): Observable<L> {
        const thisLocal = this;
        if (!wrappedSnapshotField) {
            throw new Error('snapshotField can not be null');
        }
        const resultEntityAlreadyProcessed = {
            alreadyProcessed: false,
            entityValue: undefined as L,
            allMD: undefined as ResolveMetadataReturn
        };
        //resolveMetadatas is synchronous, so everything here need to be into a
        // piped block! Can you see that?! Sometime i can't!
        return of(null).pipe(
            map(() => {
                this.validatePlayerSideLiteralObject(wrappedSnapshotField);

                let allMD = this.resolveMetadatas({literalObject: wrappedSnapshotField, refMap: refMap});
                let bMd = allMD.objectMd;
                let entityValue: L = this._objectsBySignature.get(bMd.$signature$);
        
                resultEntityAlreadyProcessed.allMD = allMD;

                if (!LodashLike.isNil(entityValue)) {
                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLike.debug('entity is already processed on this session. Found by signature: ' + bMd.$signature$);
                    }
                    resultEntityAlreadyProcessed.alreadyProcessed = true;
                    resultEntityAlreadyProcessed.entityValue = entityValue;
                } else {
                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLike.debug('entity was not processed yet on this session. Not found by signature: ' + bMd.$signature$);
                    }
                    if (bMd.$idRef$) {
                        entityValue = refMap.get(bMd.$idRef$);
                        if (LodashLike.isNil(entityValue)) {
                            throw new Error('entity not foun for idRef: ' + bMd.$idRef$);
                        }
                        if (!LodashLike.isNil(entityValue)) {
                            //
                            resultEntityAlreadyProcessed.alreadyProcessed = true;
                            resultEntityAlreadyProcessed.entityValue = entityValue;
                        }
                    }
                }
                if (LodashLike.isNil(entityValue)) {
                    resultEntityAlreadyProcessed.entityValue = new entityType();
                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLike.debug('entity was not processed yet on this session.' + 
                          ' Creating new instance for: ' + entityType.name);
                    }
                }
                return resultEntityAlreadyProcessed;
            }),
            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(resultEntityAlreadyProcessed.entityValue, (resultEntityAlreadyProcessed) => {
                const asyncCombineObsArr: Observable<any>[] = [];
                //const breackPointFlag = { fooid: ''};
                if (!wrappedSnapshotField) {
                    throw new Error('snapshotField can not be null');
                }
                //let allMD = this.resolveMetadatas({literalObject: snapshotField, refMap: refMap});
                let allMD = resultEntityAlreadyProcessed.allMD;
                let bMd = allMD.objectMd;
                let entityValue: L = resultEntityAlreadyProcessed.entityValue;
                
                if (!resultEntityAlreadyProcessed.alreadyProcessed) {
                    // if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    //     thisLocal.consoleLike.debug('entity was not processed yet on this session. Not found by signature: ' + bMd.$signature$);
                    // }
                    this.validatingMetaFieldsExistence(entityType);
                    entityValue = resultEntityAlreadyProcessed.entityValue;
                    LodashLike.set(entityValue as any, RecorderConstants.ENTITY_SESION_PROPERTY_NAME, this);
                    this.removeNonUsedKeysFromLiteral(entityValue as any, wrappedSnapshotField);
        
                    if (bMd.$id$) {
                        refMap.set(bMd.$id$, entityValue);
                    } else {
                        throw new Error('This should not happen 1');
                    }
                    
                    this.lazyLoadTemplateCallback(entityValue, () => {
                        this.tryCacheInstanceBySignature(
                            {
                                realInstance: entityValue, 
                                playerSnapshot: { wrappedSnapshot: wrappedSnapshotField }
                            }
                        );
                        const asyncMergeWith$ = of(null).pipe(
                            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(entityValue, () => {
                                return LodashLike.asyncMergeWith(
                                    entityValue as any,
                                    wrappedSnapshotField, 
                                    {
                                        customizer: this.mergeWithCustomizerPropertyReplection(entityValue, refMap),
                                        asyncCustomSetter: thisLocal.createAsyncCustomSetter(entityValue),
                                        noObjects: new Set([Date]),
                                        considerObjectProperties: true,
                                        ignorePropeties: [ 
                                            /^_.*/,
                                            RecorderConstants.ENTITY_CONTROL_PROPS_PATTERN
                                        ]
                                    }
                                );                                
                            })
                        );
                            // thisLocal.lazyLoadTemplateCallback(entityValue, () => {
                            //     return LodashLike.asyncMergeWith(
                            //         entityValue as any,
                            //         snapshotField, 
                            //         {
                            //             customizer: this.mergeWithCustomizerPropertyReplection(refMap),
                            //             asyncCustomSetter: thisLocal.createAsyncCustomSetter(entityValue),
                            //             noObjects: new Set([Date])
                            //         }
                            //     );
                            // }) as Observable<any>;
                        asyncCombineObsArr.push(
                            asyncMergeWith$
                        );
                        //lodashMergeWith(entityValue as any, snapshotField, this.mergeWithCustomizerPropertyReplection(refMap));
                    });
                } else {
                    // if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    //     thisLocal.consoleLike.debug('entity already processed on this session. Found by signature: ' + bMd.$signature$);
                    // }
                }
        
                //let asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
                let asyncCombineArr$ = combineFirstSerial(asyncCombineObsArr).pipe(
                    map(() => {
                        //console.log(breackPointFlag.fooid);
                        return entityValue;
                    }),
                    share()
                );
                // this.createSerialAsyncTasksWaiting().pipe(
                //     map(() => {
                //         //console.log(breackPointFlag.fooid);
                //         return entityValue;
                //     })
                // );
        
                return asyncCombineArr$;
        
                // const isSynchronouslyDone = { value: false, result: null as L};
                // asyncCombineArr$.subscribe((result)=>{
                //     isSynchronouslyDone.value = true;
                //     isSynchronouslyDone.result = result;
                // });
        
                // let finalResult$: Observable<L>;
                // if (!isSynchronouslyDone.value) {
                //     finalResult$ = asyncCombineArr$;
                // } else {
                //     finalResult$ = of(isSynchronouslyDone.result);
                // }
        
                // return finalResult$;
            }),
            share()
        );
    }

    private createLoadedLazyRef<L extends object, I>(
            fieldEtc: FieldEtc<L, any>,
            literalLazyObj: any,
            refMap: Map<Number, any>,
            refererObj: any,
            refererKey: string): Observable<LazyRef<L, I>> {
        const thisLocal = this;
        //const asyncCombineObsArr: Observable<any>[] = [];
        const errorForStack = new Error('combineFirstSerial. Possible cycle!');
        return of(null).pipe(
            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                let lr: LazyRefImplementor<L, I> = this.createApropriatedLazyRef<L, I>(fieldEtc.prpGenType, literalLazyObj, refererObj, refererKey, refMap);

                // return of(null).pipe(
                //     thisLocal.flatMapKeepAllFlagsRxOpr()
                // );

                let resultVoid$: Observable<void>;
        
                let allMD = thisLocal.resolveMetadatas({ literalObject: literalLazyObj, refererObject: refererObj, key: refererKey, refMap: refMap });
                
                let trySetPlayerObjectIdentifier$ = this.trySetPlayerObjectIdentifier(lr, fieldEtc.prpGenType, literalLazyObj, refMap);
                resultVoid$ = trySetPlayerObjectIdentifier$;
                //asyncCombineObsArr.push(trySetPlayerObjectIdentifier$);
                let tryGetFromObjectsBySignature$ = this.tryGetFromObjectsBySignature(lr, literalLazyObj, refMap);
                resultVoid$ = resultVoid$.pipe(
                    thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                        return tryGetFromObjectsBySignature$;
                    }),
                    share()
                )
                //asyncCombineObsArr.push(tryGetFromObjectsBySignature$);
                //let setLazyObjOnLazyLoadingNoNext$: Observable<void> = of(null);
                //let lazyLoadedObj$: Observable<void> = of(null);
                const isValueByFieldProcessor: {value: boolean} = { value: false };
        
                resultVoid$ = resultVoid$.pipe(
                    thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                        if (allMD.objectMd.$iAmPlayerMetadatas$) {
                            if (allMD.objectMd.$idRef$) {
                                let referedInstance = refMap.get(allMD.objectMd.$idRef$);
                                if (!literalLazyObj) {
                                    throw new Error('literalLazyObj.$iAmPlayerMetadatas$ and $idRef$ not found: \'' + refererKey + '\' on ' + refererObj.constructor);
                                }
                                return lr.setLazyObjOnLazyLoadingNoNext(referedInstance);
                                //asyncCombineObsArr.push(setLazyObjOnLazyLoadingNoNext$);
                            } else {
                                return of(undefined);
                            }
                        } else {
                            return of(undefined);
                        }
                    }),
                    share()
                );

                resultVoid$ = resultVoid$.pipe(
                    thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                        const resultVoidInnerResultRef = {value: of(undefined)};
                        if (LodashLike.isNil(literalLazyObj)) {
                            //LodashLike.isNil(srcValue) means LazyRef object instance is null.
                            let setLazyObjOnLazyLoadingNoNext$ = lr.setLazyObjOnLazyLoadingNoNext(null);
                            resultVoidInnerResultRef.value = setLazyObjOnLazyLoadingNoNext$;
                        } else {
                            if (lr.lazyLoadedObj) {
                                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLike.group('LazyRef.lazyLoadedObj is already setted: ');
                                    thisLocal.consoleLike.debug(lr.lazyLoadedObj);
                                    thisLocal.consoleLike.groupEnd();
                                }
                                resultVoidInnerResultRef.value = of(undefined);
                            } else {
                                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLike.debug('LazyRef.lazyLoadedObj is not setted yet');
                                }
                                //let lazyLoadedObjType: TypeLike<any> = null;
                                
                                if (fieldEtc.otmCollectionType) {
                                    // if (!(genericNode.gParams[0] instanceof GenericNode) || (<GenericNode>genericNode.gParams[0]).gParams.length <=0) {
                                    //     throw new Error('LazyRef is not correctly defined: \'' + refererKey + '\' on ' + refererObj.constructor);
                                    // }
                                    // let collTypeParam: TypeLike<any> =  null;
                                    // if ((<GenericNode>genericNode.gParams[0]).gParams[0] instanceof GenericNode) {
                                    //     collTypeParam = (<GenericNode>(<GenericNode>genericNode.gParams[0]).gParams[0]).gType;
                                    // } else {
                                    //     collTypeParam = <TypeLike<any>>(<GenericNode>genericNode.gParams[0]).gParams[0];
                                    // }
                                    const lazyCollection = this.createCollection(fieldEtc.otmCollectionType, refererObj, refererKey);
                                    
                                    thisLocal.lazyLoadTemplateCallback(lazyCollection, () => {
                                        const setLazyObjOnLazyLoadingNoNext$ = of(undefined).pipe(
                                                thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(lazyCollection, () => {
                                                    return lr.setLazyObjOnLazyLoadingNoNext(lazyCollection)
                                                }),
                                                thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(lazyCollection, () => {
                                                    let processResultEntityPrivObsArr: Observable<L>[] = [];
                                                        for (const literalItem of literalLazyObj) {
                                                            let processResultEntityPriv$ = thisLocal.processResultEntityPriv(fieldEtc.lazyLoadedObjType, literalItem, refMap)
                                                            processResultEntityPrivObsArr.push(processResultEntityPriv$);
                                                        }
                                                        //return thisLocal.combineFirstSerialPreserveAllFlags(processResultEntityPrivObsArr)
                                                        return combineFirstSerial(processResultEntityPrivObsArr)
                                                            .pipe(
                                                                thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(lazyCollection, (entityArr) => {
                                                                    for (const entityItem of entityArr) {
                                                                        thisLocal.addOnCollection(lazyCollection, entityItem);                                                    
                                                                    }
                                                                    return of(null);
                                                                })
                                                            )
                                                            .pipe(share());
                                                })
                                            );
                                            //asyncCombineObsArr.splice(0, asyncCombineObsArr.length)
                                        resultVoidInnerResultRef.value = setLazyObjOnLazyLoadingNoNext$;
                                    });
                                } else {
                                    let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.fielEtcCacheMap, refererObj, refererKey, this.manager.config);
                                    if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
                                        if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                                            isValueByFieldProcessor.value = true;
                                            let callFromLiteralValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(literalLazyObj, fieldEtc.fieldInfo);
                                            // callFromLiteralValue$ = callFromLiteralValue$.pipe(this.addSubscribedObsRxOpr());
                                            callFromLiteralValue$ = callFromLiteralValue$.pipe(
                                                thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, (value) => {
                                                    //here for debug purpose
                                                    refererKey === 'blobLazyA';
    
                                                    return lr.setLazyObjOnLazyLoadingNoNext(value).pipe(
                                                        map((slValue) => {
                                                            //here for debug purpose
                                                            refererKey === 'blobLazyA';
    
                                                            return value;
                                                        })
                                                    );
                                                })
                                            );
                                            resultVoidInnerResultRef.value = callFromLiteralValue$;
                                            //asyncCombineObsArr.push(setLazyObjOnLazyLoadingNoNext$);
                                        } else {
                                            let setLazyObjOnLazyLoadingNoNext$ = lr.setLazyObjOnLazyLoadingNoNext(literalLazyObj);
                                            resultVoidInnerResultRef.value = setLazyObjOnLazyLoadingNoNext$;
                                        }
                                    } else {
                                        let setLazyObjOnLazyLoadingNoNext$ = of(null)
                                            .pipe(
                                                flatMapJustOnceRxOpr((resultEntity) => {
                                                    return this.processResultEntityPriv(fieldEtc.lazyLoadedObjType as TypeLike<L>, literalLazyObj, refMap);
                                                }),
                                                map(() => {
                                                })
                                            );
                                        //asyncCombineObsArr.push(setLazyObjOnLazyLoadingNoNext$);
                                        resultVoidInnerResultRef.value = setLazyObjOnLazyLoadingNoNext$;
                                    }
                    
                                    if (!isValueByFieldProcessor.value && fieldEtc.lazyRefMarkerType !== LazyRefPrpMarker) {
                                        let setLazyObjOnLazyLoadingNoNext$ = of(null).pipe(
                                            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                                                return this.processResultEntityPriv(fieldEtc.lazyLoadedObjType, literalLazyObj, refMap);
                                            }),
                                            share(),
                                            map(() => {})
                                        );
                                        // .pipe(
                                        //     flatMapJustOnceRxOpr((resultEntity) => {
                                        //         return this.processResultEntityPriv(lazyLoadedObjType, literalLazyObj, refMap);
                                        //     })
                                        // )
                                        resultVoidInnerResultRef.value = setLazyObjOnLazyLoadingNoNext$;
                                    }
                                }
                            }
                        }
                        return resultVoidInnerResultRef.value;
                    })
                );

                return resultVoid$.pipe(
                    map(() => {
                        //for debug purpose
                        refererKey === 'detailAEntCol'; literalLazyObj === literalLazyObj;

                        return lr;
                    }),
                    share()
                    // ,
                    // (source) => {
                    //     if (!LodashLike.isNil(source)) {
                    //         let currSource = source;
                    //         do {
                    //             if(thisLocal.repeatedValueSet.has(currSource)) {
                    //                 //console.error(errorForStack + '\n' + errorForStack.stack);
                    //             } else {
                    //                 //thisLocal.repeatedValueSet.add(currSource);
                    //             }
                    //             currSource = currSource.source;
                    //         } while (currSource);
                    //         thisLocal.repeatedValueSet.add(source);
                    //     } 
                    //     return source;
                    // }
                );
        
                // asyncCombineArr$ = asyncCombineArr$.pipe(
                //     tap((result)=> {
                //         isSynchronouslyDone.value = true;
                //         isSynchronouslyDone.result = lr;
                //     })
                // );
                // if (!isSynchronouslyDone.value) {
                //     return asyncCombineArr$;
                // } else {
                //     return of(isSynchronouslyDone.result);
                // }
        
                // let createSerialAsyncTasksWaiting$ = this.createSerialAsyncTasksWaiting()
                //     // .pipe(
                //     //     flatMap(() => {
                //     //         return trySetPlayerObjectIdentifier$;
                //     //     })
                //     // )
                //     // .pipe(
                //     //     flatMap(() => {
                //     //         return tryGetFromObjectsBySignature$;
                //     //     })
                //     // )
                //     // .pipe(
                //     //     flatMap(() => {
                //     //         return setLazyObjOnLazyLoading$
                //     //     })
                //     // )
                //     // .pipe(
                //     //     flatMap(() => {
                //     //         return lazyLoadedObj$;
                //     //     })
                //     // )
                //     .pipe(
                //         map(() => {
                //             return lr;
                //         })
                //     );
        
                // const isSynchronouslyDone = { value: false, result: null as LazyRef<L, I>};
                // createSerialAsyncTasksWaiting$.subscribe((result)=>{
                //     isSynchronouslyDone.value = true;
                //     isSynchronouslyDone.result = result;
                // });
        
                // if (!isSynchronouslyDone.value) {
                //     return createSerialAsyncTasksWaiting$;
                // } else {
                //     return of(isSynchronouslyDone.result);
                // }
            }),
            share()
        );
    }

    public tryCacheInstanceBySignature(
            tryOptions:
                {
                    realInstance: any,
                    playerSnapshot: PlayerSnapshot,
                    lazySignature?: string
                }): void {
        if (!tryOptions){
            throw new Error('tryOptions can not be null');
        }
        if (!tryOptions.playerSnapshot){
            throw new Error('tryOptions.playerSnapshot can not be null');
        }
        let allMD = this.resolveMetadatas({literalObject: tryOptions.playerSnapshot.wrappedSnapshot});
        let bMd = allMD.objectMd;
        if (bMd.$signature$) {
            this._objectsBySignature.set(bMd.$signature$, tryOptions.realInstance);
        }
        if (tryOptions.lazySignature) {
            this._objectsBySignature.set(tryOptions.lazySignature, tryOptions.realInstance);
        }
    }

    protected createNotLoadedLazyRef<L extends object, I>(
            genericNode: GenericNode, 
            literalLazyObj: any,
            refMap: Map<Number, any>,
            refererObj: any,
            refererKey: string): Observable<LazyRef<L, I>> {
        const thisLocal = this;
        return of(null).pipe(
            this.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                //const asyncCombineObsArr: Observable<any>[] = [];
                let propertyOptions: RecorderDecorators.PropertyOptions<L> = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, refererObj, refererKey);
                if (!propertyOptions){
                    throw new Error('@RecorderDecorators.property() not defined for ' + refererObj.constructor.name + '.' + refererKey);
                }
                let lr: LazyRefImplementor<L, I> = this.createApropriatedLazyRef<L, I>(genericNode, literalLazyObj, refererObj, refererKey, refMap);
                let trySetPlayerObjectIdentifier$ = this.trySetPlayerObjectIdentifier(lr, genericNode, literalLazyObj, refMap);
                //asyncCombineObsArr.push(trySetPlayerObjectIdentifier$);
                let tryGetFromObjectsBySignature$ = trySetPlayerObjectIdentifier$.pipe(
                    this.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                        return this.tryGetFromObjectsBySignature(lr, literalLazyObj, refMap);
                    }),
                    share()
                );

                let result$ = tryGetFromObjectsBySignature$.pipe(
                    this.mapJustOnceKeepAllFlagsRxOpr(null, () => {
                        if (lr.lazyLoadedObj) {
                            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLike.group('LazyRef.lazyLoadedObj is already setted: ');
                                thisLocal.consoleLike.debug(lr.lazyLoadedObj);
                                thisLocal.consoleLike.groupEnd();
                            }
                        } else {
                            const lazyInfo: LazyInfo<L> = {
                                gNode: genericNode,
                                propertyOptions: propertyOptions,
                                literalLazyObj: literalLazyObj,
                                ownerType: refererObj.constructor,
                                lazyFieldType: genericNode.gParams[0] as TypeLike<any>,
                                fieldName: refererKey
                            }
                            
                            if (!propertyOptions.lazyDirectRawRead) {
                                if (!lr.signatureStr) {
                                    throw new Error('Signature not found\n' + lr.toString());
                                }
                                lr.respObs = this.manager.config.lazyObservableProvider.generateObservable(lr.signatureStr, lazyInfo)
                                    .pipe(
                                        // //In case of an error, this allows you to try again
                                        // catchError((err) => {
                                        //     lr.respObs = this.manager.config.lazyObservableProvider.generateObservable(lr.signatureStr, lazyInfo);
                                        //     return throwError(err);
                                        // }),
                                        thisLocal.registerProvidedObservablesRxOpr(),
                                        share()
                                    );
                            } else {
                                if (!lr.signatureStr) {
                                    throw new Error('Signature not found\n' + lr.toString());
                                }
                                lr.respObs = this.manager.config.lazyObservableProvider.generateObservableForDirectRaw(lr.signatureStr, lazyInfo)
                                    .pipe(
                                        //In case of an error, this allows you to try again
                                        // catchError((err) => {
                                        //     lr.respObs = this.manager.config.lazyObservableProvider.generateObservableForDirectRaw(lr.signatureStr, lazyInfo);
                                        //     return throwError(err);
                                        // }),
                                        thisLocal.registerProvidedObservablesRxOpr(),
                                        share()
                                    );
                            }
                        }

                        return lr;
                    }),
                    share()
                );

                if (thisLocal._decoratorCreateNotLoadedLazyRefCB) {
                    result$ = thisLocal._decoratorCreateNotLoadedLazyRefCB(
                        {
                            genericNode: genericNode,
                            literalLazyObj: literalLazyObj,
                            refMap: refMap,
                            refererObj: refererObj,
                            refererKey: refererKey,
                            originalResult: result$
                        }
                    ) as Observable<LazyRefImplementor<L, I>>;
                }

                return result$.pipe(
                    share()
                );
            })
        );
    }

    private tryGetFromObjectsBySignature<L extends object, I>(
            lr: LazyRefImplementor<L, I>,
            literalLazyObj: any,
            refMap: Map<Number, any>): Observable<void> {
        const thisLocal = this;
        const errorForStack = new Error('combineFirstSerial. Possible cycle!');
        return of(null).pipe(
            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                // if (!literalLazyObj){
                //     throw new Error('literalLazyObj nao pode ser nula');
                // }
                let allMD = this.resolveMetadatas({literalObject: literalLazyObj, refMap: refMap});
                //let allMD = this.resolveMetadatas({literalObject: literalLazyObj});
                let bMd = allMD.objectMd;
        
                let entityValue: any = null;
                if (bMd.$signature$) {
                    lr.signatureStr = bMd.$signature$;
                    entityValue = this._objectsBySignature.get(bMd.$signature$);
                } else {
                }
        
                let result$: Observable<void>;
                if (entityValue) {
                    result$ = lr.setLazyObjOnLazyLoadingNoNext(entityValue);
                } else {
                    result$ = of(null);
                }
        
                return result$.pipe(
                    share()
                    // ,
                    // (source) => {
                    //     if (!LodashLike.isNil(source)) {
                    //         let currSource = source;
                    //         do {
                    //             if(thisLocal.repeatedValueSet.has(currSource)) {
                    //                 console.error(errorForStack + '\n' + errorForStack.stack);
                    //             } else {
                    //                 //thisLocal.repeatedValueSet.add(currSource);
                    //             }
                    //             currSource = currSource.source;
                    //         } while (currSource);
                    //         thisLocal.repeatedValueSet.add(source);
                    //     } 
                    //     return source;
                    // }
                );
        
                // const isSynchronouslyDone = { value: false, result: null as void};
                // //result$ = result$.pipe(this.addSubscribedObsRxOpr());
                // result$ = result$.pipe(
                //     tap((result)=>{
                //         isSynchronouslyDone.value = true;
                //         isSynchronouslyDone.result = result;
                //     })
                // );
        
                // if (!isSynchronouslyDone.value) {
                //     return result$;
                // } else {
                //     return of(isSynchronouslyDone.result);
                // }
            }),
            share()
        );
    }

    createApropriatedLazyRef<L extends object, I>(genericNode: GenericNode, literalLazyObj: any, refererObj: any, refererKey: string, refMap?: Map<Number, any>): LazyRefImplementor<L, I> {
        // if (!literalLazyObj){
        //     throw new Error('literalLazyObj nao pode ser nula');
        // }
        let allMD = this.resolveMetadatas({literalObject: literalLazyObj, refererObject: refererObj, key: refererKey, refMap: refMap});
        let bMd = allMD.objectMd;

        let playerObjectIdLiteral: any = bMd.$playerObjectId$;
        let lazyRef: LazyRefDefault<L, any> = null;
        if (playerObjectIdLiteral) {
            lazyRef = new LazyRefDefault<L, I>(this);
        } else {
            lazyRef = new LazyRefDefault<L, undefined>(this);
        }
        lazyRef.instanceId = this.nextMultiPurposeInstanceId();
        lazyRef.refererObj = refererObj;
        lazyRef.refererKey = refererKey;
        lazyRef.session = this;
        lazyRef.genericNode = genericNode;
        lazyRef.bMdLazyLoadedObj = allMD.objectMd;
        lazyRef.bMdRefererObj = allMD.refererObjMd;
        lazyRef.pbMdRefererPlayerObjectId = allMD.refererObjMd;
        return lazyRef;
    }

    private metadaKeys: Set<string>;
    private isLiteralObjMetadataKey(keyName: string): boolean {
        if (this.metadaKeys == null) {
            this.metadaKeys = new Set<string>()
                .add(this.manager.config.playerMetadatasName);
                
        }
        return this.metadaKeys.has(keyName);
    }

    private removeNonUsedKeysFromLiteral<L extends object>(realObj: L, literalObj: any) {
        let literalKeys: string[] = LodashLike.clone(LodashLike.keys(literalObj));
        let realKeys: string[] = Object.keys(Object.getPrototypeOf(realObj));
        for (let index = 0; index < literalKeys.length; index++) {
            const keyItem = literalKeys[index];
            if (!this.isLiteralObjMetadataKey(keyItem) && realKeys.indexOf(keyItem) < 0) {
                delete literalObj[keyItem];
            }
        }
    }

    private trySetPlayerObjectIdentifier<L extends object, I>(
            lr: LazyRef<L, I>,
            genericNode: GenericNode,
            literalLazyObj: any,
            refMap: Map<Number, any>): Observable<void> {
        const thisLocal = this;
        return of(null).pipe(
            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(null, () => {
                let result$: Observable<void> = of(null);
                // if (!literalLazyObj){
                //     throw new Error('literalLazyObj nao pode ser nula');
                // }
                let allMD = this.resolveMetadatas({literalObject: literalLazyObj, refMap: refMap});
                let bMd = allMD.objectMd;
        
                const playerObjectIdLiteralRef = { value: undefined as any };
        
                if (bMd.$idRef$) {
                    let referedInstance = refMap.get(bMd.$idRef$);
                    let referedInstanceMd = LodashLike.get(referedInstance, thisLocal.manager.config.playerMetadatasName) as PlayerMetadatas;
                    if (!referedInstanceMd.$iAmPlayerMetadatas$) {
                        throw new Error('Where is the metadatas:\n' + 
                        this.jsonStringfyWithMax(referedInstance));
                    }
                    playerObjectIdLiteralRef.value = referedInstanceMd.$playerObjectId$;
                } else {
                    playerObjectIdLiteralRef.value = bMd.$playerObjectId$;            
                }
        
                if (LodashLike.isObject(playerObjectIdLiteralRef.value, new Set([Date, Buffer]))) {
                    let playerObjectIdType: TypeLike<any> = null;
                    if (genericNode.gParams[1] instanceof GenericNode) {
                        playerObjectIdType = (<GenericNode>genericNode.gParams[1]).gType;
                    } else {
                        playerObjectIdType = <TypeLike<any>>genericNode.gParams[1];
                    }
                    if (playerObjectIdType) {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('There is a playerObjectIdType on LazyRef. Is it many-to-one LazyRef?!. playerObjectIdType: ' + playerObjectIdType.name + ', genericNode:'+genericNode);
                        }
                        this.validatingMetaFieldsExistence(playerObjectIdType);
                        result$ = this.processResultEntityPriv(playerObjectIdType, playerObjectIdLiteralRef.value, refMap)
                            .pipe(
                                map((playerObjectId) => {
                                    lr.playerObjectId = playerObjectId;
                                })
                            );
                    } else {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('Thre is no playerObjectIdType on LazyRef. Is it a collection?!. playerObjectIdType: ' + playerObjectIdType.name + ', genericNode:'+genericNode);
                        }
                    }
                } else if (playerObjectIdLiteralRef.value) {
                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLike.debug('The player object Id is a simple type value: ' + playerObjectIdLiteralRef.value + '. genericNode:'+ genericNode);
                    }
                    lr.playerObjectId = playerObjectIdLiteralRef.value;
                } else {
                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLike.debug('The player object Id is null! Is it a collection?!: ' + playerObjectIdLiteralRef.value + '. genericNode:'+ genericNode);
                    }
                }
        
                return result$.pipe(
                    share()
                );
        
                // const isSynchronouslyDone = { value: false, result: null as void};
                // //result$ = result$.pipe(this.addSubscribedObsRxOpr());
                // result$ = result$.pipe(
                //     tap((result)=>{
                //         isSynchronouslyDone.value = true;
                //         isSynchronouslyDone.result = result;
                //     })
                // );
        
                // if (!isSynchronouslyDone.value) {
                //     return result$;
                // } else {
                //     return of(null);
                // }
            }),
            share()
        );
    }

    /**
     * Returns an Observable with subscribe called.
     * @param observer 
     */
    // doSubriscribeWithProvidedObservableRxOpr<T>(observer?: PartialObserver<T>): OperatorFunction<T, T>;
    // doSubriscribeWithProvidedObservableRxOpr<T>(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T>;
    // doSubriscribeWithProvidedObservableRxOpr<T>(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T> {
    //     return this.doSubriscribeObservableRxOpr('provided', observerOrNext, error, complete);
    // }

    // doSubriscribeWithInternalObservableRxOpr<T>(observer?: PartialObserver<T>): OperatorFunction<T, T>;
    // doSubriscribeWithInternalObservableRxOpr<T>(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T>;
    // doSubriscribeWithInternalObservableRxOpr<T>(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T> {
    //     return this.doSubriscribeObservableRxOpr('internal', observerOrNext, error, complete);
    // }

    // private doSubriscribeObservableRxOpr<T>(observableFrom: 'internal' | 'provided', observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T> {
    //     let thisLocal = this;
    //     const resultOpr: OperatorFunction<T, T> = (source: Observable<any>) => {
    //         if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
    //             thisLocal.consoleLike.debug('doSubriscribeWithProvidedObservableRxOpr(). source Observable traceId: ' + (source as any).traceId);
    //         }

    //         let observerOriginal: PartialObserver<T>;
    //         if ((observerOrNext as PartialObserver<T>).next
    //             || (observerOrNext as PartialObserver<T>).complete
    //             || (observerOrNext as PartialObserver<T>).error
    //             || (observerOrNext as PartialObserver<T>).next) {
    //             if (error || complete) {
    //                 throw new Error('observerOrNext is a PartialObserver and error or complete are passed as parameter');
    //             }
    //             observerOriginal = observerOrNext as PartialObserver<T>;
    //         } else {
    //             observerOriginal = {
    //                 next: observerOrNext as (value: T) => void,
    //                 error: error,
    //                 complete: complete
    //             }
    //         }

    //         let result$;
    //         if (observableFrom === 'provided') {
    //             result$ = source.pipe(this.addSubscribedObsRxOpr());
    //         } else {
    //             result$ = source;
    //         }

    //         const isSynchronouslyDone = { value: false, result: null as T};
    //         let observerNew: PartialObserver<T> = {...observerOriginal};
    //         observerNew.next = (value) => {
    //             isSynchronouslyDone.value = true;
    //             isSynchronouslyDone.result = value;

    //             if (!observerNew.closed) {
    //                 observerNew.closed;
    //                 if (observerOriginal.next) {
    //                     observerOriginal.next(value);
    //                 }
    //             }
    //         }
    
    //         result$.subscribe(observerNew);

    //         if (!isSynchronouslyDone.value) {
    //             return result$;
    //         } else {
    //             return of(isSynchronouslyDone.result);
    //         }
    //     };

    //     return resultOpr;
    // }

    public createCollection(collType: TypeLike<any>, refererObj: any, refererKey: string): any {
        if (collType === Set) {
            return new SetCreator(this, refererObj, refererKey).createByProxy();
        } else {
            throw new Error('Collection not supported: ' + collType);
        }
    }

    public isCollection(typeTested: TypeLike<any>): any {
        return RecorderManagerDefault.isCollection(typeTested);
    }

    public addOnCollection(collection: any, element: any) {
        if (collection instanceof Array) {
            throw new Error('Collection not supported: ' + (collection as any).prototype);
        } else if (collection instanceof Set){
            (<Set<any>>collection).add(element);
        } else {
            throw new Error('Collection not supported: ' + collection.prototype);
        }
    }
    public removeFromCollection(collection: any, element: any) {
        if (collection instanceof Array) {
            throw new Error('Collection not supported: ' + (collection as any).prototype);
        } else if (collection instanceof Set){
            (<Set<any>>collection).delete(element);
        } else {
            throw new Error('Collection not supported: ' + collection.prototype);
        }
    }

    /**
     * Used exclusively in lazy load or processing literal values from server, it does not create tape actions.
     * @param refMap 
     */
    private mergeWithCustomizerPropertyReplection(
            objectValue: any,
            refMap: Map<Number, any>,
            ): LodashLike.AsyncMergeWithCustomizer {
        const thisLocal = this;

        const syncIsOn = LodashLike.get(objectValue, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        const asyncIsOnRef = { value: undefined as boolean };
        const asyncIsOn2Ref = { value: undefined as boolean };

        return (value: any, srcValue: any, key?: string, object?: Object, source?: Object): Observable<any> => {
            asyncIsOnRef.value = LodashLike.get(objectValue, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
            asyncIsOn2Ref.value = thisLocal._isOnRestoreEntireStateFromLiteral;
            LodashLike.set(objectValue, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
            thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;

            //resolveMetadatas is synchronous, so everything here need to be into a
            // piped block! Can you see that?! Sometimes i can't!
            return of(null).pipe(
                thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(object, () => {
                    const asyncCombineObsArr: Observable<any>[] = [];
                    const keepAllFlagsTemplateCallback = thisLocal.createKeepAllFlagsTemplateCallback(object);
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function');
                        thisLocal.consoleLikeMerge.debug(refMap);
                        thisLocal.consoleLikeMerge.debug(value);
                        thisLocal.consoleLikeMerge.debug(srcValue);
                        thisLocal.consoleLikeMerge.debug(key);
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.debug(source);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
        
                    let allMD = thisLocal.resolveMetadatas({literalObject: srcValue, refererLiteralObject: source, key: key, refMap: refMap});
                    let mdSource = allMD.refererObjMd;
                    let mdSrcValue = allMD.objectMd;
                    let mdPlayerObjectId = allMD.playerObjectIdMd;
                    let mdSrcValueFound = allMD.objectMdFound;
                    let fieldEtc: FieldEtc<any, any> = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc(thisLocal.fielEtcCacheMap, object, key, thisLocal.manager.config);
                    const isLazyRefField = 
                        (fieldEtc 
                            && fieldEtc.prpGenType
                            && (
                                fieldEtc.lazyRefMarkerType === LazyRef
                                || fieldEtc.lazyRefMarkerType === LazyRefPrpMarker)
                        );
        
                    if (mdPlayerObjectId.$isComponent$) {
                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function: bMdPlayerObjectId.isComponent. bMdSrcValue.$playerObjectId$:');
                            thisLocal.consoleLikeMerge.debug(mdSrcValue.$playerObjectId$);
                            thisLocal.consoleLikeMerge.groupEnd();
                        }
                        //fieldEtc.prpType = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_ID_TYPE, object);
                        if (!fieldEtc.objectIdPrpType) {
                            throw new Error('We are receiving mdSrcValue.$playerObjectId$ as Object and mdPlayerObjectId.$isComponent$, ' + object.constructor.name + ' does not define a property with @JsonPlayback.playerObjectId()');
                        }
                    }
                    if (mdSrcValue.$isAssociative$ && fieldEtc.prpGenType && fieldEtc.lazyRefMarkerType !== LazyRef) {
                        throw new Error('Key '+ object.constructor.name + '.' + key + ' is player side associative relation and is not LazyRef or not define GenericTokenizer');
                    }
                    if (mdSrcValue.$isComponent$ && fieldEtc.prpGenType && fieldEtc.lazyRefMarkerType === LazyRef) {
                        throw new Error('Key '+ object.constructor.name + '.' + key + ' is player side component and is a LazyRef.');
                    }
                    const isDoneRef = { value: false, result: null as any};
        
                    if (key === thisLocal.manager.config.playerMetadatasName) {
                        isDoneRef.result = mdSource;
                        isDoneRef.value = true;
                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function: (key === thisLocal.manager.config.playerMetadatasName). srcValue and mdSource:');
                            thisLocal.consoleLikeMerge.debug(srcValue);
                            thisLocal.consoleLikeMerge.debug(mdSource);
                            thisLocal.consoleLikeMerge.groupEnd();
                        }
                        let correctSrcValueAsMetadata: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
                        Object.assign(correctSrcValueAsMetadata, mdSource);
        
                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeMerge.debug('mergeWithCustomizerPropertyReplection => function: (key === thisLocal.manager.config.playerMetadatasName). '+
                                'Immediately assign metadatas on ' +
                                'final instance because resolveMetadatas() is synchronous: \n' + 
                                JSON.stringify(correctSrcValueAsMetadata, null, 2));
                        }
                        LodashLike.set(object as any, key, correctSrcValueAsMetadata);
        
                        if (mdPlayerObjectId.$isComponent$) {
                            isDoneRef.result = DummyUndefinedForMergeAsync;
                            //let processResultEntityPrivPlayerObjectId$ = combineFirstSerial(asyncCombineObsArr).pipe(
                            let processResultEntityPrivPlayerObjectId$ = thisLocal.processResultEntityPriv(fieldEtc.objectIdPrpType, mdSource.$playerObjectId$, refMap).pipe(
                                thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (playerObjectIdValue) => {
                                    correctSrcValueAsMetadata.$playerObjectId$ = playerObjectIdValue;
                                    isDoneRef.result = correctSrcValueAsMetadata;
                                    //isDoneRef.result = mdPlayerObjectId;
                                    isDoneRef.value = true;   
                                    //mdPlayerObjectId.$playerObjectId$ = playerObjectIdValue;
                                    //LodashLike.set(object, key, isDoneRef.result);
                                    return playerObjectIdValue;
                                })
                            );
                            asyncCombineObsArr.push(processResultEntityPrivPlayerObjectId$);
                        } 
                    } else if (!mdSrcValue.$idRef$ && !isLazyRefField && fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                        isDoneRef.result = DummyUndefinedForMergeAsync;
                        let callFromLiteralValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(srcValue, fieldEtc.fieldInfo)
                            .pipe(
                                thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (callFromLiteralValue) => {
                                    isDoneRef.result = callFromLiteralValue;
                                    isDoneRef.value = true;  
                                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                        thisLocal.consoleLikeMerge.debug('(Async) mergeWithCustomizerPropertyReplection => function =>'+
                                            ' createSerialAsyncTasksWaiting().pipe() => this.mapJustOnceKeepAllFlagsRxOpr().'+
                                            ' Object resolved by fieldEtc.fieldProcessorCaller.callFromLiteralValue:\n' + 
                                            this.jsonStringfyWithMax(srcValue));
                                    }
                                    LodashLike.set(object, key, isDoneRef.result);
                                })
                            );
                        asyncCombineObsArr.push(callFromLiteralValue$);
                    } else if (mdSrcValue.$idRef$ && !isLazyRefField) {
                        isDoneRef.result = DummyUndefinedForMergeAsync;
                        //const previousCombine$ = combineFirstSerial(asyncCombineObsArr).pipe(
                        const previousCombine$ = of(null).pipe(
                            thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, () => {
                                isDoneRef.result = refMap.get(mdSrcValue.$idRef$);
                                isDoneRef.value = true;
                                if (!isDoneRef.result) {
                                    throw new Error('This should not happen 2');
                                }
                                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeMerge.group('(Async) mergeWithCustomizerPropertyReplection => function =>'+
                                        ' createSerialAsyncTasksWaiting().pipe() => this.mapJustOnceKeepAllFlagsRxOpr().'+
                                        ' Object resolved by mdSrcValue.$idRef$ field. owner type: ' +
                                        object.constructor.name + '; owner field: ' + key);
                                    thisLocal.consoleLikeMerge.groupEnd();
                                }
                                LodashLike.set(object, key, isDoneRef.result);
                            })
                        );
                        //asyncCombineObsArr.splice(0, asyncCombineObsArr.length);
                        asyncCombineObsArr.push(previousCombine$);
                    } else if (fieldEtc.prpType) {
                        const isFromLiteralValue = {value: false};
                        if (fieldEtc.prpGenType) {
                            if (fieldEtc.otmCollectionType && !(fieldEtc.lazyRefMarkerType === LazyRef || fieldEtc.lazyRefMarkerType === LazyRefPrpMarker)) {
                                if (1 === 1) {
                                    throw new Error('Not pesrsistent collection is not supported yet!');
                                }
                                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeMerge.debug('mergeWithCustomizerPropertyReplection => function.'+
                                        ' fieldEtc.otmCollectionType ' + fieldEtc.otmCollectionType.name);
                                }
                                isDoneRef.result = DummyUndefinedForMergeAsync;
                                let correctSrcValueColl = thisLocal.createCollection(fieldEtc.otmCollectionType, object, key);
                                
                                let processResultEntityPrivObsArr: Observable<any>[] = [];
                                thisLocal.lazyLoadTemplateCallback(correctSrcValueColl, () => {
                                    for (let index = 0; index < srcValue.length; index++) { 
                                        let arrItemType: TypeLike<any> = <TypeLike<any>>fieldEtc.lazyLoadedObjType;
                                        let processResultEntityPriv$ = thisLocal.processResultEntityPriv(arrItemType, srcValue[index], refMap);
                                        processResultEntityPrivObsArr.push(processResultEntityPriv$);
                                    }
                                    //let processResultEntityPrivArr$ = thisLocal.combineFirstSerialPreserveAllFlags(processResultEntityPrivObsArr)
                                    let processResultEntityPrivArr$ = combineFirstSerial(processResultEntityPrivObsArr)
                                        .pipe(
                                            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(correctSrcValueColl, (entityArr) => {
                                                for (const entityItem of entityArr) {
                                                    thisLocal.addOnCollection(correctSrcValueColl, entityItem);                                                    
                                                }
                                                return of(null);
                                                isDoneRef.result = DummyUndefinedForMergeAsync;correctSrcValueColl
                                            })
                                        )
                                        .pipe(share());
                                    asyncCombineObsArr.push(processResultEntityPrivArr$);
                                });
                                //nothing for now
                            } else if (fieldEtc.lazyRefMarkerType === LazyRef || fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
                                if (!mdSource.$id$) {
                                    throw new Error('There is no mdSource.$id$ on ' + this.jsonStringfyWithMax(srcValue));
                                }
                                if (mdSrcValueFound && !mdSrcValue.$idRef$ && !mdSrcValue.$isAssociative$ && !mdSrcValue.$isLazyProperty$) {
                                    throw new Error('Receiving object that is non associative, no lazy property and has no $idRef$, but field is a LazyRef type. field: ' + object.constructor.name + '.' + key + '. Value' + + this.jsonStringfyWithMax(srcValue));
                                }
                                if (mdSrcValue.$isLazyUninitialized$) {
                                    isDoneRef.result = DummyUndefinedForMergeAsync;
                                    let createNotLoadedLazyRef$ = thisLocal.createNotLoadedLazyRef(fieldEtc.prpGenType, srcValue, refMap, object, key)
                                        .pipe(
                                            thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (lazyRef) => {
                                                //for debug purpose
                                                srcValue === srcValue;

                                                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                                    thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                                                        ' function => createNotLoadedLazyRef$.pipe(thisLocal.mapJustOnceKeepAllFlagsRxOpr()).'+
                                                        ' createNotLoadedLazyRef, for property \''+key+'\'. lodashSet(object, key, lazyRef)');
                                                    thisLocal.consoleLikeMerge.debug(object);
                                                    thisLocal.consoleLikeMerge.groupEnd();
                                                }
                                                isDoneRef.result = lazyRef;
                                                isDoneRef.value = true;
                                                //LodashLike.set(object, key, isDoneRef.result);
                                                return lazyRef;
                                            })
                                        );
                                    //createNotLoadedLazyRef$ = createNotLoadedLazyRef$.pipe(thisLocal.addSubscribedObsRxOpr());
                                    asyncCombineObsArr.push(createNotLoadedLazyRef$);
                                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function.'+
                                            ' Returning null because of createNotLoadedLazyRef$.subscribe().'+
                                            ' property \''+key+'\'.');
                                        thisLocal.consoleLikeMerge.debug(object);
                                        thisLocal.consoleLikeMerge.groupEnd();
                                    }
                                } else {
                                    isDoneRef.result = DummyUndefinedForMergeAsync;
                                    let createLoadedLazyRef$ = thisLocal.createLoadedLazyRef(fieldEtc, srcValue, refMap, object, key)
                                        .pipe(
                                            thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (lazyRef) => {
                                                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                                    thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...)'+
                                                        ' mergeWithCustomizerPropertyReplection => function =>'+
                                                        ' createLoadedLazyRef$.subscribe(). createLoadedLazyRef,'+
                                                        ' for property \''+key+'\'. lodashSet(object, key, lazyRef)');
                                                    thisLocal.consoleLikeMerge.debug(object);
                                                    thisLocal.consoleLikeMerge.groupEnd();
                                                }
                                                isDoneRef.result = lazyRef;
                                                isDoneRef.value = true;
                                                keepAllFlagsTemplateCallback(() => {
                                                    LodashLike.set(object, key, isDoneRef.result);
                                                });
                                                return lazyRef;
                                            })
                                        );
                                    //createNotLoadedLazyRef$ = createNotLoadedLazyRef$.pipe(thisLocal.addSubscribedObsRxOpr());
                                    asyncCombineObsArr.push(createLoadedLazyRef$);
                                }
                            }
                        } else if (LodashLike.isObject(srcValue, new Set([Date, Buffer]))
                                && !fieldEtc.propertyOptions.lazyDirectRawRead) {
                            isDoneRef.result = DummyUndefinedForMergeAsync;
                            let processResultEntityPriv$ = thisLocal.processResultEntityPriv(fieldEtc.prpType, srcValue, refMap)
                                .pipe(
                                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (correctSrcValueSubs) => {
                                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                            thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                                            ' function => processResultEntityPriv$.pipe() => thisLocal.mapJustOnceKeepAllFlagsRxOpr().'+
                                            ' createLoadedLazyRef, for property \''+key+'\'. LodashLike.set(object, key, correctSrcValue)');
                                            thisLocal.consoleLikeMerge.debug(object);
                                            thisLocal.consoleLikeMerge.groupEnd();
                                        }
                                        isDoneRef.result = correctSrcValueSubs;
                                        isDoneRef.value = true;
                                        keepAllFlagsTemplateCallback(() => {
                                            LodashLike.set(object, key, correctSrcValueSubs);
                                        });
                                        return correctSrcValueSubs;
                                    })
                                );
                            asyncCombineObsArr.push(processResultEntityPriv$);
                        } else if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function.'+
                                    ' Transformation by "IFieldProcessor.fromLiteralValue" for property \''+key+'\'.');
                                thisLocal.consoleLikeMerge.debug(object);
                                thisLocal.consoleLikeMerge.groupEnd();
                            }
                            isDoneRef.result = DummyUndefinedForMergeAsync;
                            isFromLiteralValue.value = true;
                            let fromLiteralValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(srcValue, fieldEtc.fieldInfo);
                            fromLiteralValue$ = fromLiteralValue$
                                // .pipe(thisLocal.addSubscribedObsRxOpr())
                                .pipe(
                                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (fromLiteralValue) => {
                                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                            thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                                                ' function => fromLiteralValue$.pipe() => thisLocal.mapJustOnceKeepAllFlagsRxOpr().'+
                                                ' fromLiteralValue, for property \''+key+'\'. LodashLike.set(object, key, correctSrcValue)');
                                            thisLocal.consoleLikeMerge.debug(object);
                                            thisLocal.consoleLikeMerge.groupEnd();
                                        }
                                        isDoneRef.result = fromLiteralValue;
                                        isDoneRef.value = true;
                                        keepAllFlagsTemplateCallback(() => {
                                            LodashLike.set(object, key, isDoneRef.result);
                                        });
                                        return fromLiteralValue;
                                    }));
                            fromLiteralValue$ = fromLiteralValue$.pipe(
                                tap((correctSrcValueFlv) => {
                                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Returning null because of fromLiteralValue$.pipe(tap()). property \''+key+'\'.');
                                        thisLocal.consoleLikeMerge.debug(correctSrcValueFlv);
                                        thisLocal.consoleLikeMerge.groupEnd();
                                    }
                                })
                            );
                            asyncCombineObsArr.push(fromLiteralValue$);
                        } else {
                            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Transformation is not necessary for property \''+key+'\'.');
                                thisLocal.consoleLikeMerge.debug(object);
                                thisLocal.consoleLikeMerge.groupEnd();
                            }
                            isDoneRef.result = srcValue;
                            isDoneRef.value = true;
                            let noTranslation$ = of(isDoneRef.result)
                                .pipe(
                                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (correctSrcValue) => {
                                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                            thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. noTranslation$.pipe(thisLocal.mapJustOnceKeepAllFlagsRxOpr()). Transformation is not necessary for property \''+key+'\'.');
                                            thisLocal.consoleLikeMerge.debug(object);
                                            thisLocal.consoleLikeMerge.groupEnd();
                                        }
                                        LodashLike.set(object, key, correctSrcValue);
                                        return correctSrcValue;
                                    })
                                );       
                            asyncCombineObsArr.push(noTranslation$);
                        }
                    } else if (LodashLike.has(object, key)) {
                        throw new Error('No type decorator for '+ object.constructor.name + '.' + key);
                    } else if (!LodashLike.has(object, key) && !thisLocal.isLiteralObjMetadataKey(key)) {
                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeMerge.warn('mergeWithCustomizerPropertyReplection => function. This property \''+key+'\' does not exists on this type.');
                        }
                        isDoneRef.result = undefined;
                        isDoneRef.value = true;
                    } else {
                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Property \''+key+'\'. Using same value.');
                            thisLocal.consoleLikeMerge.debug(isDoneRef.result);
                            thisLocal.consoleLikeMerge.groupEnd();
                        }
                    }
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. return');
                        thisLocal.consoleLikeMerge.debug(isDoneRef.result);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
        
                    // if (!LodashLike.isNil(isDoneRef.result) && isDoneRef.result !== DummyUndefinedForMergeAsync) {
                    //     return of(isDoneRef.result);
                    // } else {
                    //return thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
                    return combineFirstSerial(asyncCombineObsArr).pipe(
                        map(() => {
                            //for debug purpose
                            key === 'detailAEntCol';

                            return isDoneRef.result;
                        })
                        // ,
                        // timeoutDecorateRxOpr()
                    );
                    // }
                }),
                tap(() => {
                    //for debug purpose
                    key === 'detailAEntCol';

                    LodashLike.set(objectValue, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOnRef.value);
                    thisLocal._isOnRestoreEntireStateFromLiteral = asyncIsOn2Ref.value;
                })
            );
        }
    }

    // combineFirstSerialPreserveAllFlags(obsArr: Observable<any>[], lazyLoadedObj?: any): Observable<any> {
    //     let obsArrNew = obsArr.slice();
    //     for (let index = 0; index < obsArrNew.length; index++) {
    //         obsArrNew[index] = obsArrNew[index].pipe(
    //             this.mapJustOnceKeepAllFlagsRxOpr(lazyLoadedObj, (value: any) => {
    //                 return value;
    //             })
    //         );            
    //     }
    //     return combineFirstSerial(obsArrNew);
    // }

    public registerEntityAndLazyref(entity: object, lazyRef: LazyRefImplementor<any, any>): void {
        if (!lazyRef.isLazyLoaded()) {
            throw new Error('Can not register: !lazyRef.isLazyLoaded(). \n' + this.toString());
        }
        if (lazyRef.lazyLoadedObj !== entity) {
            throw new Error('Can not register: entity !== lazyRef.lazyLoadedObj. \n' + this.toString());
        }
        if (!this._lazyrefsByEntityMap.has(entity)) {
            this._lazyrefsByEntityMap.set(entity, new Set());
        }

        this._lazyrefsByEntityMap.get(entity).add(lazyRef);
    }
    public unregisterEntityAndLazyref(entity: object, lazyRef: LazyRefImplementor<any, any>): void {
        if (!lazyRef.isLazyLoaded()) {
            throw new Error('Can not unregister: !lazyRef.isLazyLoaded(). \n' + this.toString());
        }
        if (lazyRef.lazyLoadedObj === entity) {
            throw new Error('Can not unregister: entity === lazyRef.lazyLoadedObj. \n' + this.toString());
        }
        if (!this._lazyrefsByEntityMap.has(entity)
                || this._lazyrefsByEntityMap.get(entity).size <= 0) {
            throw new Error('Can not unregister: entity has no lazyRef associated. \n' + this.toString());
        }
        this._lazyrefsByEntityMap.get(entity).delete(lazyRef);
    }
    public notifyAllLazyrefsAboutEntityModification(entity: object, lazyRefSource: LazyRefImplementor<any, any>): void {
        const thisLocal = this;
        if (this._switchedOffNotificationEntitiesSet.has(entity)) {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.group('RecorderSessionDefault.notifyLazyrefAboutEntityModification: this._switchOffEntitiesSet.has(entity): entity modified but modifying notification is switched off!. entity:');
                thisLocal.consoleLike.debug(entity);
                thisLocal.consoleLike.groupEnd();
            }
        } else {
            if (!lazyRefSource) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('RecorderSessionDefault.notifyLazyrefAboutEntityModification: !lazyRefSource: Am I been notified from a property set?!. entity:');
                    thisLocal.consoleLike.debug(entity);
                    thisLocal.consoleLike.groupEnd();
                }
            }
            if (lazyRefSource && !lazyRefSource.isLazyLoaded()) {
                throw new Error('Can not notify: !lazyRefSource.isLazyLoaded(). \n' + this.toString());
            }
            if (lazyRefSource && lazyRefSource.lazyLoadedObj !== entity) {
                throw new Error('Can not notify: entity !== lazyRefSource.lazyLoadedObj. \n' + this.toString());
            }
            if (this._lazyrefsByEntityMap.has(entity)) {
                let lazyrefsArr: Array<LazyRefImplementor<any,any>> = Array.from(this._lazyrefsByEntityMap.get(entity));
                for (const lazyrefItem of lazyrefsArr) {
                    if (lazyRefSource === lazyrefItem) {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.group('RecorderSessionDefault.notifyLazyrefAboutEntityModification: Not notifing: lazyRefSource === lazyrefItem. entity:');
                            thisLocal.consoleLike.debug(entity);
                            thisLocal.consoleLike.groupEnd();
                        }
                    } else {
                        if (!lazyrefItem.isLazyLoaded()) {
                            throw new Error('Can not notify: !lazyrefItem.isLazyLoaded(). \n' + this.toString());
                        }
                        if (lazyrefItem.lazyLoadedObj !== entity) {
                            throw new Error('Can not notify: lazyrefItem.lazyLoadedObj !== entity. \n' + this.toString());
                        }
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.group('RecorderSessionDefault.notifyLazyrefAboutEntityModification: Notifing: lazyRefSource !== lazyrefItem.\n lazyRefSource and lazyrefItem:\n'+lazyRefSource+'\n'+lazyrefItem+'\n an . entity:');
                            thisLocal.consoleLike.debug(entity);
                            thisLocal.consoleLike.groupEnd();
                        }
                        lazyrefItem.notifyModification(entity);
                    }
                }
            }
        }
    }

    switchOffNotifyAllLazyrefs(entity: object): void {
        this._switchedOffNotificationEntitiesSet.add(entity);
    }
    switchOnNotifyAllLazyrefs(entity: object): void {
        this._switchedOffNotificationEntitiesSet.delete(entity);
    }

    private _nextMultiPurposeInstanceId = 1;
    /** Framework internal use. */
    nextMultiPurposeInstanceId(): number {
        return this._nextMultiPurposeInstanceId++;
    }

    processTapeActionAttachRefId(
        options:
            {
                action: TapeAction,
                fieldEtc: FieldEtc<any, any>,
                value: any,
                propertyKey: string
            }) : 
            Observable<
                {
                    asyncAddTapeAction: boolean,
                    newValue: any
                }
            > {
        const thisLocal = this;
        const resultObservableValue = {
            asyncAddTapeAction: false,
            newValue: undefined as any
        }
        const asyncCombineObsArr: Observable<any>[] = [];
        //let putOnCache$: Observable<void> = of(undefined);
        //let toDirectRaw$: Observable<NodeJS.ReadableStream> = of(null);
        //let getFromCache$: Observable<NodeJS.ReadableStream> = of(null);
        options.action.attachRefId = thisLocal.manager.config.cacheStoragePrefix + thisLocal.nextMultiPurposeInstanceId();
        if (options.fieldEtc.fieldProcessorCaller && options.fieldEtc.fieldProcessorCaller.callToDirectRaw) {
            let toDirectRaw$ = options.fieldEtc.fieldProcessorCaller.callToDirectRaw(options.value, options.fieldEtc.fieldInfo);
            // toDirectRaw$ = toDirectRaw$.pipe(thisLocal.addSubscribedObsRxOpr());
            resultObservableValue.asyncAddTapeAction = true;
            toDirectRaw$ = toDirectRaw$.pipe(
                flatMap((stream) => {
                    let putOnCacheGetFromCache$ = of(undefined);
                    if (stream) {
                        putOnCacheGetFromCache$ = thisLocal.manager.config.cacheHandler.putOnCache(options.action.attachRefId, stream);
                        // putOnCacheGetFromCache$ = putOnCacheGetFromCache$.pipe(thisLocal.addSubscribedObsRxOpr());
                        putOnCacheGetFromCache$ = putOnCacheGetFromCache$.pipe(
                            flatMap(() => {
                                thisLocal.addTapeAction(options.action);
                                let getFromCache$ = thisLocal.manager.config.cacheHandler.getFromCache(options.action.attachRefId);
                                // getFromCache$ = getFromCache$.pipe(thisLocal.addSubscribedObsRxOpr());
                                getFromCache$ = getFromCache$.pipe(
                                    tap((stream) => {
                                        // oldSet.call(this, stream);
                                        resultObservableValue.newValue = stream;
                                    })
                                );
                                return getFromCache$;
                            })
                        );
                    } else {
                        if (options.value) {
                            throw new Error('The property \'' + options.propertyKey.toString() + ' of \'' + this.constructor + '\'. NodeJS.ReadableStream is null but value is not null. value: ' + options.value.constructor);
                        }
                        options.action.simpleSettedValue = null;
                        options.action.attachRefId = null;
                        thisLocal.addTapeAction(options.action);
                    }

                    return putOnCacheGetFromCache$;
                }),
                thisLocal.registerProvidedObservablesRxOpr(),
                share()
            );
            asyncCombineObsArr.push(toDirectRaw$);
        } else {
            if (!((options.value as any as NodeJS.ReadableStream).addListener && (options.value as any as NodeJS.ReadableStream).pipe)) {
                throw new Error('The property \'' + options.propertyKey.toString() +
                    ' of \'' + this.constructor + '\'. There is no "IFieldProcessor.toDirectRaw"' + 
                    ' defined and value is not a NodeJS.ReadableStream. value: ' + options.value.constructor);
            } else {
                let putOnCacheGetFromCache$ = thisLocal.manager.config.cacheHandler.putOnCache(options.action.attachRefId, options.value as any as NodeJS.ReadStream);
                // putOnCacheGetFromCache$ = putOnCacheGetFromCache$.pipe(thisLocal.addSubscribedObsRxOpr());
                resultObservableValue.asyncAddTapeAction = true;
                putOnCacheGetFromCache$ = putOnCacheGetFromCache$.pipe(
                    tap(() => {
                        thisLocal.addTapeAction(options.action);
                    }),
                    flatMap(() => {
                        let getFromCache$ = thisLocal.manager.config.cacheHandler.getFromCache(options.action.attachRefId);
                        // getFromCache$ = getFromCache$.pipe(thisLocal.addSubscribedObsRxOpr());
                        getFromCache$ = getFromCache$.pipe(
                            tap(
                                {
                                    next: (stream) => {
                                        //oldSet.call(this, stream);
                                        resultObservableValue.newValue = stream;
                                    }
                                }
                            )
                        );
                        return getFromCache$; 
                    }),
                    map(() => {
                        return undefined;
                    }),
                    thisLocal.registerProvidedObservablesRxOpr(),
                    share()
                );
                asyncCombineObsArr.push(putOnCacheGetFromCache$);
            }
        }
        //let asyncCombineArr$ = thisLocal.combineFirstSerialPreserveAllFlags(asyncCombineObsArr).pipe(
        let asyncCombineArr$ = combineFirstSerial(asyncCombineObsArr).pipe(
            map(() => {
                return resultObservableValue;
            })
        );
        return asyncCombineArr$.pipe(
            share()
        );
        // const isSynchronouslyDone = { value: false, result: null as any};
        // asyncCombineArr$ = asyncCombineArr$.pipe(
        //     tap((result)=> {
        //         isSynchronouslyDone.value = true;
        //         isSynchronouslyDone.result = resultObservableValue;
        //     })
        // );
        // if (!isSynchronouslyDone.value) {
        //     return asyncCombineArr$;
        // } else {
        //     return of(isSynchronouslyDone.result);
        // }

        // let createSerialAsyncTasksWaitings$ = this.createSerialAsyncTasksWaiting()
        //     .pipe(
        //         map(() => {
        //             return resultObservableValue;
        //         })
        //     );

        // const isSynchronouslyDone = { value: false, result: null as any};
        // //result$ = result$.pipe(thisLocal.addSubscribedObsRxOpr());
        // createSerialAsyncTasksWaitings$.subscribe((result)=> {
        //     isSynchronouslyDone.value = true;
        //     isSynchronouslyDone.result = resultObservableValue;
        // });

        // if (!isSynchronouslyDone.value) {
        //     return createSerialAsyncTasksWaitings$;
        // } else {
        //     return of(resultObservableValue);
        // }
    }

    private _decoratorCreateNotLoadedLazyRefCB: 
        (options:
            {
                genericNode: GenericNode, 
                literalLazyObj: any,
                refMap: Map<Number, any>,
                refererObj: any,
                refererKey: string,
                originalResult: Observable<LazyRef<any, any>>
            }
        ) => Observable<LazyRef<any, any>>;

    decorateCreateNotLoadedLazyRef(
        decoratorCb:
            (options:
                {
                    genericNode: GenericNode, 
                    literalLazyObj: any,
                    refMap: Map<Number, any>,
                    refererObj: any,
                    refererKey: string,
                    originalResult: Observable<LazyRef<any, any>>
                }
            ) => Observable<LazyRef<any, any>>
        ) : void {
            this._decoratorCreateNotLoadedLazyRefCB = decoratorCb;
        }

    
    jsonStringfyWithMax(literalObj: any): string {
        let result = '';
        if (literalObj) {
            let literalObjStr = JSON.stringify(literalObj, null, 2);
            if (literalObjStr.length > this.manager.config.maxJsonStringifyForDiagnostic) {
                result += literalObjStr.substr(0, this.manager.config.maxJsonStringifyForDiagnostic) + '\n...';
            } else {
                result += literalObjStr.substr(0, this.manager.config.maxJsonStringifyForDiagnostic) + '\n...';
            }
        }
        return result;
    }
}