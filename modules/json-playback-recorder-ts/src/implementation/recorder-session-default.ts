import { LazyRef, LazyRefPrpMarker, LazyRefPrp, LazyRefPrpImplementor, LazyRefOTMMarker, LazyRefMTOMarker, LazyRefMTO, LazyRefMTOImplementor, BlobOrStream} from '../api/lazy-ref';
import { RecorderManagerDefault } from './recorder-manager-default';
import { map, flatMap, tap, share, timeout, catchError } from 'rxjs/operators';
import { Observable, of, OperatorFunction, ObservableInput, isObservable, timer, throwError, Subscription } from 'rxjs';
import { RecorderConstants } from './recorder-constants';
import { SetCreator } from './set-creator';
import { JSONHelper } from './json-helper';
import { v1 as uuidv1} from 'uuid';
import { FieldEtc } from '../api/field-etc';
import { mapJustOnceRxOpr, combineFirstSerial, WaitHolder } from './rxjs-util';
import { StringifiableOriginalValueEntry, RecorderSession as RecorderSession, EntityRef, SessionState, PlayerSnapshot, RecorderSessionImplementor } from '../api/recorder-session';
import { TypeLike } from '../typeslike';
import { PlayerMetadatas } from '../api/player-metadatas';
import { RecorderManager } from '../api/recorder-manager';
import { GenericNode } from '../api/generic-tokenizer';
import { LazyInfo } from '../api/lazy-observable-provider';
import { LazyRefImplementor } from '../api/lazy-ref';
import { RecorderDecorators } from '../api/recorder-decorators';
import { RecorderDecoratorsInternal } from './recorder-decorators-internal';
import { RecorderLogger, ConsoleLike, RecorderLogLevel } from '../api/recorder-config';
import { TapeAction, Tape, TapeActionType } from '../api/tape';
import { TapeActionDefault, TapeDefault } from './tape-default';
import { LodashLike } from './lodash-like';
import { ResponseLike } from '../typeslike';
import { LazyRefOTMDefault } from './lazy-ref-otm-default';
import { LazyRefMTODefault } from './lazy-ref-mto-default';
import { LazyRefPrpDefault } from './lazy-ref-prp-default';
import { RecorderForDom } from './native-for-dom';


interface ResolvedMetadataEtc {
    refererObjMd: PlayerMetadatas,
    objectMd: PlayerMetadatas,
    playerObjectIdMd: PlayerMetadatas,
    refererObjMdFound: boolean,
    objectMdFound: boolean,
    playerObjectIdMdFound: boolean
}

class UndefinedForMergeAsync {
    public toString(): string {
        return 'I am an instance of "UndefinedForMerge", just a temporary value before real value from async execution!';
    }
}

const DummyUndefinedForMergeAsync = new UndefinedForMergeAsync();

export class RecorderSessionDefault implements RecorderSessionImplementor {
    private _objectsBySignature: Map<string, any> = null;
    private _playerObjectsBySignature: Map<string, any> = null;
    private _objectsByCreationId: Map<number, any> = null;
    private _lazyrefsByEntityMap: Map<object, Set<LazyRefImplementor<any, any>>> = null;
    private _fielEtcCacheMap: Map<Object, Map<String, FieldEtc<any, any>>> = null;
    private _lazyInfoCacheMap: Map<LazyRefImplementor<any, any>, LazyInfo<any>> = null;

    private consoleLike: ConsoleLike;
	private consoleLikeLogRxOpr: ConsoleLike;
    private consoleLikeMerge: ConsoleLike;
    private consoleLikeRestoreState: ConsoleLike;

	get fielEtcCacheMap(): Map<Object, Map<String, FieldEtc<any, any>>>  {
		return this._fielEtcCacheMap;
	}

    private _switchedOffNotificationEntitiesSet: Set<object> = null;
    private _stringifiableOriginalValueEntries: Array<StringifiableOriginalValueEntry> = null;
    private _stringifiableOriginalValueEntriesBySign: Map<string, StringifiableOriginalValueEntry> = null;
    private _nextCreationId: number = null;
    private _currentTape: Tape = null;
    private _latestTape: Array<Tape> = null;
    private _currentRecordedAtaches: Map<String, Observable<BlobOrStream>> = null;
    private _isOnRestoreEntireState = false;
    private _sessionId: string;
    //private _asyncTasksWaitingArr: Set<Observable<any>> = new Set();
    //private _asyncTasksWaitingArrNew: Set<Observable<any>> = new Set();
    //private _asyncTasksWaitingSourcesArrNew: Set<Observable<any>> = new Set();
    

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
                    tap((value) => {
                        if (thisLocal.consoleLikeLogRxOpr.enabledFor(RecorderLogLevel.Trace)) {
                            (source as any).logAllSourceStackRxOprId = 'source observable ' + this.nextMultiPurposeInstanceId();
                            try {
                                throw new Error('logRxOpr(). "Project" Stack for id "'+id+'"\n');
                            } catch (error) {
                                thisLocal.consoleLikeLogRxOpr.debug((error.stack as string).replace(/^Error: /, ''));
                            }
                        }
                    })
                );
            return result$;
        }

        return resultOpr;
    }

    private _waitForPendingTasks: WaitHolder;

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
            const sourceRef = { value: source };

            const beginWaitDone = { ref: undefined as boolean};
            const sourceSubRef: { ref: Subscription } = { ref: undefined};
            // const result2$ = new Observable<T>(
            //     (subscriber) => {
            //         if(!beginWaitDone.ref) {
            //             beginWaitDone.ref = true;
            //             thisLocal._waitForPendingTasks.beginWait(sourceRef.value);
            //         }
            //         sourceSubRef.ref = source.subscribe(
            //             {
            //                 next: (value: T) => {
            //                     //this is to ensure that all the processes of asynchronous results can be done in this js turn before releasing all waiting callbacks.
            //                     timer(0).subscribe(() => {
            //                         thisLocal._waitForPendingTasks.emitEndWait(sourceRef.value);
            //                     });
            //                     subscriber.next(value);
            //                 },
            //                 error: (err) => {
            //                     //this is to ensure that all the processes of asynchronous results can be done in this js turn before releasing all waiting callbacks.
            //                     const reThwErr = new Error('unespected!');
            //                     reThwErr.stack += '\nCaused by:\n'+err.stack + '\nSubscribed on:\n' + stackSubscriberRef.value;
            //                     (reThwErr as any).cause = err;
            //                     timer(0).subscribe(() => {
            //                         thisLocal._waitForPendingTasks.emitEndWait(sourceRef.value, reThwErr);
            //                     });
            //                     subscriber.error(reThwErr);
            //                 },
            //                 complete: () => {
            //                     subscriber.complete();
            //                 }
            //             }
            //         );
            //         return (
            //             {
            //                 unsubscribe: () => {
            //                     thisLocal._waitForPendingTasks.emitEndWait(sourceRef.value);
            //                     sourceSubRef.ref.unsubscribe();
            //                 }
            //             }
            //         );
            //     }
            // );

            //thisLocal.testObservableHasCircle(source);
            const result$ = of(null).pipe(
                tap(
                    {
                        next: () => {
                            if(!beginWaitDone.ref) {
                                beginWaitDone.ref = true;
                                thisLocal._waitForPendingTasks.beginWait(sourceRef.value);
                            }
                        },
                    }
                ),
                catchError((err, caught) => {
                    const reThwErr = new Error('unespected!');
                    reThwErr.stack += '\nCaused by:\n'+err.stack + '\nSubscribed on:\n' + stackSubscriberRef.value;
                    (reThwErr as any).cause = err;
                    return throwError(reThwErr);
                }),
                flatMap(() => {
                    sourceRef.value = source;
                    return source;
                }),
                map((value) => {
                    return value as T;
                }),
                tap(
                    {
                        next: () => {
                            //this is to ensure that all the processes of asynchronous results can be done in this js turn before releasing all waiting callbacks.
                            timer(0).subscribe(() => {
                                thisLocal._waitForPendingTasks.emitEndWait(sourceRef.value);
                            });
                        },
                        error: (err) => {
                            //this is to ensure that all the processes of asynchronous results can be done in this js turn before releasing all waiting callbacks.
                            timer(0).subscribe(() => {
                                thisLocal._waitForPendingTasks.emitEndWait(sourceRef.value, err);
                            })
                        }
                    }
                )
            );
            return result$;
        }
        return resultOpr;
    }

    // registerProvidedObservablesRxOpr<T>(): OperatorFunction<T, T> {
    //     let thisLocal = this;

    //     //BEGIN: Used to find losted obs.subscribed()
    //     const stackSubscriberRef = {value: ''};
    //     try {
    //         throw new Error('TRACKING');
    //     } catch (error) {
    //         stackSubscriberRef.value = error.stack;
    //     }
    //     //END: Used to find losted obs.subscribed()
    //     const resultOpr: OperatorFunction<T, T> = (source: Observable<T>) => {
    //         const sourceRef = { value: source };
    //         //thisLocal.testObservableHasCircle(source);
    //         const result$ = of(null).pipe(
    //             tap(
    //                 {
    //                     next: () => {
    //                         thisLocal._asyncTasksWaitingArrNew.add(result$);
    //                         thisLocal._asyncTasksWaitingSourcesArrNew.add(sourceRef.value);
    //                     },
    //                     //this is never going to happen!
    //                     // error: () => {
    //                     //     thisLocal._asyncTasksWaitingArrNew.add(result$);
    //                     //     thisLocal._asyncTasksWaitingSourcesArrNew.add(sourceRef.value);
    //                     // }
    //                 }
    //             ),
    //             flatMap(() => {
    //                 sourceRef.value = source;
    //                 return source;
    //             }),
    //             map((value) => {
    //                 return value as T;
    //             }),
    //             tap(
    //                 {
    //                     next: () => {
    //                         thisLocal._asyncTasksWaitingArrNew.delete(result$);
    //                         thisLocal._asyncTasksWaitingSourcesArrNew.delete(sourceRef.value);
    //                     }
    //                 }
    //             )
    //         );
    //         return result$;
    //     }
    //     return resultOpr;
    // }

    createPendingTasksWaiting(): Observable<void> {
        const thisLocal = this;
        return this._waitForPendingTasks.getWait();
    }

    // createSerialPendingTasksWaiting(): Observable<void> {
    //     const thisLocal = this;
    //     let result$: Observable<void>;

    //     if (thisLocal._asyncTasksWaitingArrNew.size > 0) {
    //         //result$ = thisLocal.combineFirstSerialPreserveAllFlags(Array.from(thisLocal._asyncTasksWaitingArrNew))
    //         result$ = combineFirstSerial(Array.from(thisLocal._asyncTasksWaitingArrNew))
    //             .pipe(
    //                 thisLocal.logRxOpr('createSerialAsyncTasksWaitingNew'),
    //                 map(() => { return undefined; }),
    //                 timeout(3000)
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
        this._playerObjectsBySignature = new Map();
        this._objectsByCreationId = new Map();
        this._lazyrefsByEntityMap = new Map();
        this._fielEtcCacheMap = new Map();
        this._lazyInfoCacheMap = new Map();
        this._switchedOffNotificationEntitiesSet = new Set();
        this._stringifiableOriginalValueEntries = [];
        this._stringifiableOriginalValueEntriesBySign = new Map();
        this._latestTape = [];
        this._sessionId = uuidv1();

        this._waitForPendingTasks = new WaitHolder(this.consoleLike);
    }

    public generateEntireStringifiableState(): Observable<SessionState> {
        const thisLocal = this;
        let createSerialAsyncTasksWaitingNew$: Observable<SessionState> = this.createPendingTasksWaiting()
            .pipe(
                map(() => {
                    let sessionState: SessionState = {
                        sessionId: this._sessionId,
                        nextCreationId: thisLocal._nextCreationId,
                        latestStringifiablePlaybackArr: [],
                        stringifiableOriginalValueEntries: thisLocal._stringifiableOriginalValueEntries
                    };
            
                    for (const tapeItem of thisLocal._latestTape) {
                        sessionState.latestStringifiablePlaybackArr.push(thisLocal.getStringifiableTape(tapeItem));
                    }
                    if (thisLocal._currentTape) {
                        sessionState.currentStringifiableTape = thisLocal.getStringifiableTape(thisLocal._currentTape);
                    }
            
                    return sessionState;
                }),
            );
        return createSerialAsyncTasksWaitingNew$;
    }

    private restoreEntireStateCallbackTemplate<R>(callback: () => R): R {
        this._isOnRestoreEntireState = true;
        try {
            return callback();
        } finally {
            this._isOnRestoreEntireState = false;
        }
    }

    public restoreEntireState(literalState: any): void {
        const thisLocal = this;
        thisLocal.restoreEntireStateCallbackTemplate(() => {
            let literalStateLocal: SessionState = literalState;
            thisLocal._nextCreationId = literalStateLocal.nextCreationId;
            thisLocal._stringifiableOriginalValueEntries = literalStateLocal.stringifiableOriginalValueEntries;
            if (literalStateLocal.currentStringifiableTape) {
                thisLocal._currentTape = thisLocal.getTapeFromStringifiable(literalStateLocal.currentStringifiableTape);
            } else {
                thisLocal._currentTape = null;
            }
            this._latestTape = [];
            for (const stringifiableTape of literalStateLocal.latestStringifiablePlaybackArr) {
                thisLocal._latestTape.push(thisLocal.getTapeFromStringifiable(stringifiableTape));
            }
            let stringifiableOriginalValueEntriesLengthInitial: number = thisLocal._stringifiableOriginalValueEntries.length;
            for (const stringifiableOriginalValueEntry of thisLocal._stringifiableOriginalValueEntries) {
                if (stringifiableOriginalValueEntriesLengthInitial !== thisLocal._stringifiableOriginalValueEntries.length) {
                    throw new Error('There is some error on "this.storeOriginalStringifiableEntry()"'+
                        ' manipulation. Initial length ' +stringifiableOriginalValueEntriesLengthInitial+
                        ' is differrent of actual ' + thisLocal._stringifiableOriginalValueEntries.length);
                }
                if (stringifiableOriginalValueEntry.method === 'processResultEntity'
                        || stringifiableOriginalValueEntry.method === 'processResultEntityArray'
                        || stringifiableOriginalValueEntry.method === 'newEntityInstance') {
                    let jsType: TypeLike<any> = Reflect.getMetadata(stringifiableOriginalValueEntry.reflectFunctionMetadataTypeKey, Function);
                    if (!jsType) {
                        throw new Error('the classe \'' + stringifiableOriginalValueEntry.reflectFunctionMetadataTypeKey + ' is not using the decorator \'RecorderDecorators.playerType\'. Entry:\n' + this.jsonStringfyWithMax(stringifiableOriginalValueEntry));
                    }
                    if (stringifiableOriginalValueEntry.method === 'processResultEntity') {
                        thisLocal.processPlayerSnapshot(jsType, stringifiableOriginalValueEntry.playerSnapshot);
                    } else if (stringifiableOriginalValueEntry.method === 'processResultEntityArray') {
                        thisLocal.processPlayerSnapshotArray(jsType, stringifiableOriginalValueEntry.playerSnapshot);
                    } else if (stringifiableOriginalValueEntry.method === 'newEntityInstance') {
                        thisLocal.newEntityInstanceWithCreationId(jsType, stringifiableOriginalValueEntry.ref.creationId);
                    } else {
                        throw new Error('This should not happen');
                    }
                } else if (stringifiableOriginalValueEntry.method === 'lazyRef') {
                    stringifiableOriginalValueEntry.ownerSignatureStr
                    if (stringifiableOriginalValueEntry.ownerSignatureStr) {
                        if (thisLocal.consoleLikeRestoreState.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeRestoreState.debug('RecorderSessionDefault.restoreEntireState: (ownerSignatureStr): ownerSignatureStr found for original literal value entry, the owner must be a player side component. Entry:\n' + this.jsonStringfyWithMax(stringifiableOriginalValueEntry));
                        }
                        let ownerEnt = this._objectsBySignature.get(stringifiableOriginalValueEntry.ownerSignatureStr);
                        if (!ownerEnt) {
                            throw new Error('ownerEnt not found for signature: ' + stringifiableOriginalValueEntry.ownerSignatureStr);                 
                        }
                        let lazyRef: LazyRefImplementor<any, any> = LodashLike.get(ownerEnt, stringifiableOriginalValueEntry.ownerFieldName);
                        if (!lazyRef) {
                            throw new Error('ownerEnt has no field: ' + stringifiableOriginalValueEntry.ownerFieldName);
                        }
                        if (!lazyRef.iAmLazyRef) {
                            throw new Error(stringifiableOriginalValueEntry.ownerFieldName + ' is not a LazyRef for ' + ownerEnt);    
                        }
                        const processResponseResult = lazyRef.processResponse({ body: stringifiableOriginalValueEntry.playerSnapshot });
                        if (isObservable(processResponseResult)) {
                            const processResponseResult$ = (processResponseResult as Observable<any>).pipe(
                                thisLocal.registerProvidedObservablesRxOpr(),
                                share()
                            );
                            processResponseResult$.subscribe(() => {
                                thisLocal.consoleLikeRestoreState.debug(
                                    'RecorderSessionDefault.restoreEntireState\n'+
                                    '  -> processResponseResult$.subscribe(): (!ownerEnt): '+
                                    'No owner entity for original literal value entry, and lazyRef.processResponse() returned Observable. '+
                                    'This must be an LazyRefPrp marked with lazyDirectRawRead, it meas tgis LazytRef is usink cache.\n'+
                                    'lazyRef:\n' +
                                    lazyRef);
                            });
                        }
                    } else {
                        if (thisLocal.consoleLikeRestoreState.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeRestoreState.debug('RecorderSessionDefault.restoreEntireState: (!ownerEnt): '+
                                'No owner entity for original literal value entry, the owner must be a\n'+
                                'player side component. Doing nothing, in any next literal value entry\n'+
                                'there will exist an action with type \'processResultEntity\' that will\n'+
                                'put the entity on cache. Entry:\n' +
                                this.jsonStringfyWithMax(stringifiableOriginalValueEntry));
                        }
                    }
                } else {
                    throw new Error('This should not happen');
                }
            }    
            thisLocal.rerunByPlaybacksIgnoreCreateInstance();
        });
    }

    public isOnRestoreEntireState(): boolean {
        return this._isOnRestoreEntireState;
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
        const syncIsOn2 = this._isOnRestoreEntireState;
        return (originalCb: () => T) => {
            const asyncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
            const asyncIsOn2 = thisLocal._isOnRestoreEntireState;
            LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
            thisLocal._isOnRestoreEntireState = syncIsOn2;
            try {
                return originalCb();
            } finally {
                LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
                thisLocal._isOnRestoreEntireState = asyncIsOn2;
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
        const syncIsOn2 = this._isOnRestoreEntireState;
        const isPipedCallbackDone = { value: false, result: null as R};
        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;

                    const asyncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
                    const asyncIsOn2 = thisLocal._isOnRestoreEntireState;
                    if (!turnOnMode || turnOnMode.lazyLoad === 'none') {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
                    } else {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, turnOnMode.lazyLoad);
                    }
                    if (!turnOnMode || turnOnMode.restoreStare === 'none') {
                        thisLocal._isOnRestoreEntireState = syncIsOn2;
                    } else {
                        thisLocal._isOnRestoreEntireState = turnOnMode.restoreStare as boolean;
                    }
                    try {
                        isPipedCallbackDone.result = project(value, index);
                    } finally {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
                        thisLocal._isOnRestoreEntireState = asyncIsOn2;
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
        const syncIsOn2 = this._isOnRestoreEntireState;
        const isPipedCallbackDone = { value: false, result: null as ObservableInput<R>};

        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;

                    const asyncIsOn = LodashLike.get(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
                    const asyncIsOn2 = thisLocal._isOnRestoreEntireState;
                    if (!turnOnMode || turnOnMode.lazyLoad === 'none') {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
                    } else {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, turnOnMode.lazyLoad);
                    }
                    if (!turnOnMode || turnOnMode.restoreStare === 'none') {
                        thisLocal._isOnRestoreEntireState = syncIsOn2;
                    } else {
                        thisLocal._isOnRestoreEntireState = turnOnMode.restoreStare as boolean;
                    }

                    thisLocal._isOnRestoreEntireState = syncIsOn2;
                    try {
                        isPipedCallbackDone.result = project(value, index);
                    } finally {
                        LodashLike.set(lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
                        thisLocal._isOnRestoreEntireState = asyncIsOn2;
                    }
                }
                return isPipedCallbackDone.result;
            }
            return source
                .pipe(
                    flatMap(projectExtentend, concurrent)
                ) as Observable<R>;
        }

        return newOp;
    }

    mapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R): OperatorFunction<T, R> {
        return this.mapKeepAllFlagsRxOprPriv('justOnce',  {lazyLoad: 'none', restoreStare: 'none'}, lazyLoadedObj, project);
    }

    mapKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R): OperatorFunction<T, R> {
        return this.mapKeepAllFlagsRxOprPriv('eachPipe',  {lazyLoad: 'none', restoreStare: 'none'}, lazyLoadedObj, project);
    }

    flatMapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => ObservableInput<R>): OperatorFunction<T, R> {
        return this.flatMapKeepAllFlagsRxOprPriv('justOnce', {lazyLoad: 'none', restoreStare: 'none'}, lazyLoadedObj, project);
    }

    flatMapKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => ObservableInput<R>): OperatorFunction<T, R> {
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
    private actionResolveSettedValue<P, GP>(action: TapeAction, fieldEtc: FieldEtc<P, GP>): P | Observable<ResponseLike<P>> {
        const thisLocal = this;
        let resolvedSettedValue: P | Observable<ResponseLike<P>>;

        if (action.settedCreationRefId) {
            resolvedSettedValue = this._objectsByCreationId.get(action.settedCreationRefId) as P;
        } else if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
            if(!action.attachRefId) {
                if(fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    resolvedSettedValue = fieldEtc.fieldProcessorCaller.callFromLiteralValue(
                        action.simpleSettedValue,
                        fieldEtc.fieldInfo);
                }
            } else if (action.attachRefId) {
                if (fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                    let getFromCache$ = thisLocal.manager.config.cacheHandler.getFromCache(action.attachRefId);
                    let callFromDirectRawRL$: Observable<ResponseLike<P>> = fieldEtc.fieldProcessorCaller.callFromDirectRaw(
                        getFromCache$.pipe(
                            map((stream) => {
                                return (
                                    {
                                        body: stream
                                    }
                                );
                            })
                        ),
                        fieldEtc.fieldInfo
                    );
                    resolvedSettedValue = callFromDirectRawRL$;
                } else {
                    let getFromCache$ = thisLocal.manager.config.cacheHandler.getFromCache(action.attachRefId);
                    resolvedSettedValue = getFromCache$.pipe(
                        map((stream) => {
                            return (
                                {
                                    body: stream as any as P
                                }
                            );
                        })
                    );
                }
            } else {
                throw new Error('Invalid action. LazyRefPrp invalid values: ' + this.jsonStringfyWithMax(action));                
            }
        } else if (action.settedSignatureStr) {
            resolvedSettedValue = thisLocal._objectsBySignature.get(action.settedSignatureStr) as P;
        } else if (action.fieldName) {
            if (fieldEtc.fieldProcessorCaller.callFromRecordedStringifiableValue) {
                resolvedSettedValue = 
                    fieldEtc.fieldProcessorCaller.callFromRecordedStringifiableValue(action.simpleSettedValue, fieldEtc.fieldInfo);
            } else if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                resolvedSettedValue = fieldEtc.fieldProcessorCaller.callFromLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo);
            } else {
                resolvedSettedValue = action.simpleSettedValue as P;
            }
        }
        
        return resolvedSettedValue;
    }
    /**
     * Based on '[ReplayableDefault.java].replay()'
     */
    private rerunByPlaybacksIgnoreCreateInstance(): void {
        const thisLocal = this;
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
                    let resolvedSettedValue: any = thisLocal.actionResolveSettedValue(action, fieldEtc);
                    resolvedSettedValue = thisLocal.restoreEntireStateCallbackTemplate(()=> {
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
                                    let lr = (resolvedOwnerValue[resolvedFieldName] as LazyRefImplementor<any, any>);
                                    if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                                        lr.respObs = resolvedSettedValue;
                                    } else {
                                        lr.setLazyObjNoNext(resolvedSettedValue);
                                    }
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
                    });
                }
            }
        }
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
                }) : ResolvedMetadataEtc {
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
            if (!LodashLike.isNil(refererObjMd.$id$) && refererObjMd.$isLazyUninitialized$ && !options.refMap.has(refererObjMd.$id$)) {
                const dummySignatureInstance = {};
                (dummySignatureInstance as any)[thisLocal.manager.config.playerMetadatasName] = refererObjMd;
                options.refMap.set(refererObjMd.$id$, dummySignatureInstance);
            } else if (!LodashLike.isNil(refererObjMd.$idRef$)) {
                const trackedInstance = options.refMap.get(refererObjMd.$idRef$);
                let trackedInstanceMd = LodashLike.get(trackedInstance, this.manager.config.playerMetadatasName) as PlayerMetadatas;
                if (!trackedInstanceMd.$iAmPlayerMetadatas$) {
                    throw new Error('There is something wrong with metadatas on refered object by $idRef$:\n' + refererObjMd.$idRef$);
                }
                //here sign ref to another isLazyUninitialized metadata, this shrink the json.
                if (trackedInstanceMd.$isLazyUninitialized$) {
                    refererObjMd = trackedInstanceMd;
                }
            }

            if (!LodashLike.isNil(objectMd.$id$) && objectMd.$isLazyUninitialized$ && !options.refMap.has(objectMd.$id$)) {
                const dummySignatureInstance = {};
                (dummySignatureInstance as any)[thisLocal.manager.config.playerMetadatasName] = objectMd;
                options.refMap.set(objectMd.$id$, dummySignatureInstance);
            } else if (!LodashLike.isNil(objectMd.$idRef$)) {
                const trackedInstance = options.refMap.get(objectMd.$idRef$);
                let trackedInstanceMd = LodashLike.get(trackedInstance, this.manager.config.playerMetadatasName) as PlayerMetadatas;
                if (!trackedInstanceMd.$iAmPlayerMetadatas$) {
                    throw new Error('There is something wrong with refered object by $idRef$:\n' + 
                        objectMd.$idRef$);
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
            } else if (!LodashLike.isNil(playerObjectIdMd.$idRef$)) {
                const trackedInstance = options.refMap.get(playerObjectIdMd.$idRef$);
                let trackedInstanceMd = LodashLike.get(trackedInstance, this.manager.config.playerMetadatasName) as PlayerMetadatas;
                if (!trackedInstanceMd.$iAmPlayerMetadatas$) {
                    throw new Error('There is something wrong with refered object by $idRef$:\n' + 
                        playerObjectIdMd.$idRef$);
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

    public createStringifiableRefForEntity<T>(realEntity: T): EntityRef {
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

    public getEntityInstanceFromRef<T>(literalRef: any): T {
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

    public processPlayerSnapshot<L>(entityType: TypeLike<L>, playerSnapshot: PlayerSnapshot): L {
        const thisLocal = this;
        let result: L;
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

        if (!this.isOnRestoreEntireState()) {
            if (!bMd.$isComponent$) {
                let signatureStr;
                if(allMD.objectMdFound && allMD.objectMd.$signature$) {
                    signatureStr = allMD.objectMd.$signature$
                }
                this.storeOriginalStringifiableEntry(
                    {
                        method: 'processResultEntity',
                        reflectFunctionMetadataTypeKey: RecorderDecoratorsInternal.mountContructorByPlayerTypeMetadataKey(playerTypeOptions, entityType),
                        playerSnapshot: playerSnapshot
                    },
                    signatureStr);
            }
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntity<L>()');
            thisLocal.consoleLike.debug(entityType); thisLocal.consoleLike.debug(playerSnapshot);
            thisLocal.consoleLike.groupEnd();
        }
        let refMap: Map<Number, any> = new Map<Number, any>();
        result = this.processResultEntityPriv(entityType, playerSnapshot.wrappedSnapshot, refMap);
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntity<L>(). result:');
            thisLocal.consoleLike.debug(result);
            thisLocal.consoleLike.groupEnd();
        }
        return result;
    }

    public processPlayerSnapshotArray<L>(entityType: TypeLike<L>, playerSnapshot: PlayerSnapshot): Array<L> {
        const thisLocal = this;
        const resultArr: Array<L> = [];
        if (!playerSnapshot.wrappedSnapshot) {
            throw new Error('playerSnapshot.result existe' + this.jsonStringfyWithMax(playerSnapshot));
        }
        let playerTypeOptions: RecorderDecorators.playerTypeOptions = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_TYPE, entityType);
        if (!playerTypeOptions) {
            throw new Error('the classe \'' + entityType + ' is not using the decorator \'RecorderDecorators.playerType\'');
        }
        if (!this.isOnRestoreEntireState()) {
            this.storeOriginalStringifiableEntry(
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
            resultArr.push(this.processResultEntityPriv(entityType, resultElement, refMap));
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntityArray<L>(). wrappedSnapshot:');
            thisLocal.consoleLike.debug(playerSnapshot);
            thisLocal.consoleLike.groupEnd();
        }
        return resultArr;
    }

    private newEntityInstanceWithCreationId<T extends object>(entityType: TypeLike<T>, creationId: number): T {
        const thisLocal = this;
        if (!this.isOnRestoreEntireState() && !this.isRecording()){
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
                    if (fieldEtc.lazyRefMarkerType === LazyRefOTMMarker) {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('GenericNode found, it is a LazyRef, and it is a Collection, fieldEtc.otmCollectionType: ' + fieldEtc.otmCollectionType.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRefSet: LazyRefOTMDefault<any> = new LazyRefOTMDefault<any>(thisLocal);
                        lazyRefSet.setLazyObjOnLazyLoadingNoNext(this.createCollection(fieldEtc.otmCollectionType, entityObj, keyItem));

                        lazyRefSet.instanceId = this.nextMultiPurposeInstanceId();

                        lazyRefSet.refererObj = entityObj;
                        lazyRefSet.refererKey = keyItem;
                        lazyRefSet.session = this;
                        lazyRefSet.mdLazyLoadedObj = allMD.objectMd;
                        lazyRefSet.mdRefererObj = allMD.refererObjMd;
                        lazyRefSet.mdRefererPlayerObjectId = allMD.playerObjectIdMd;
                        LodashLike.set(entityObj, keyItem, lazyRefSet);
                    } else if (fieldEtc.lazyRefMarkerType === LazyRefMTOMarker) {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('GenericNode found, it is a LazyRefMTO, and it is not a Collection, fieldEtc.lazyLoadedObjType: ' + fieldEtc.lazyLoadedObjType.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRef: LazyRefMTODefault<any, any> = new LazyRefMTODefault<any, any>(thisLocal);
                        lazyRef.instanceId = this.nextMultiPurposeInstanceId();
                        lazyRef.refererObj = entityObj;
                        lazyRef.refererKey = keyItem;
                        lazyRef.session = this;
                        lazyRef.mdLazyLoadedObj = allMD.objectMd;
                        lazyRef.mdRefererObj = allMD.refererObjMd;
                        lazyRef.mdRefererPlayerObjectId = allMD.playerObjectIdMd;
                        LodashLike.set(entityObj, keyItem, lazyRef);
                    } else if (fieldEtc.lazyRefMarkerType === LazyRefMTOMarker) {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('GenericNode found, it is a LazyRefMTO, and it is not a Collection, fieldEtc.lazyLoadedObjType: ' + fieldEtc.lazyLoadedObjType.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRef: LazyRefPrpDefault<any> = new LazyRefPrpDefault<any>(thisLocal);
                        lazyRef.instanceId = this.nextMultiPurposeInstanceId();
                        lazyRef.refererObj = entityObj;
                        lazyRef.refererKey = keyItem;
                        lazyRef.session = this;
                        lazyRef.mdLazyLoadedObj = allMD.objectMd;
                        lazyRef.mdRefererObj = allMD.refererObjMd;
                        lazyRef.mdRefererPlayerObjectId = allMD.playerObjectIdMd;
                        LodashLike.set(entityObj, keyItem, lazyRef);
                    } else {
                        throw new Error('Property \'' + keyItem + ' of \'' + entityObj.constructor + '\'. LazyRef not properly defined on Reflect');
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
        if (!this.isOnRestoreEntireState()) {    
            this.storeOriginalStringifiableEntry(
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

        if (!this.isOnRestoreEntireState()) {
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
        return entityObj;
    }

    public newEntityInstance<T extends object>(entityType: TypeLike<T>): T {
        if (!this.isRecording()){
            throw new Error('Invalid operation. It is not recording.');
        }

        let newEntityInstanceWithCreationId = this.newEntityInstanceWithCreationId<T>(entityType, this._nextCreationId);
        this._nextCreationId++;
        return newEntityInstanceWithCreationId;
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

    recordAtache(attach: Observable<BlobOrStream>): string {
        let name = this.manager.config.attachPrefix + this.nextMultiPurposeInstanceId();
        this._currentRecordedAtaches.set(name, attach);
        return name;
    }

    public storeOriginalStringifiableEntry(originalValueEntry: StringifiableOriginalValueEntry, signature?: string): void {
        this._stringifiableOriginalValueEntries.push(originalValueEntry);
        if(signature) {
            this._stringifiableOriginalValueEntriesBySign.set(signature, originalValueEntry);
        }
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
        this._playerObjectsBySignature = new Map();
        this._objectsByCreationId = new Map();
        this._lazyrefsByEntityMap = new Map();
        this._fielEtcCacheMap = new Map();
        this._lazyInfoCacheMap = new Map();
        this._switchedOffNotificationEntitiesSet = new Set();
        this._stringifiableOriginalValueEntries = [];
        this._latestTape = [];

        this._waitForPendingTasks = new WaitHolder(this.consoleLike);
        
        let clearCache$: Observable<void> = this.manager.config.cacheHandler.clearCache();
        // clearCache$ = clearCache$.pipe(this.addSubscribedObsRxOpr());
        return clearCache$.pipe(
            thisLocal.registerProvidedObservablesRxOpr(),
            share()
        );
    }

    getLastRecordedTape(): Tape {
        const thisLocal = this;
        return thisLocal._latestTape.length > 0? thisLocal._latestTape[thisLocal._latestTape.length - 1] : null;
    }

    getLastRecordedStreams(): Map<String, Observable<BlobOrStream>> {
        const thisLocal = this;
        let tape = this.getLastRecordedTape();
        const idAndStreamArr: {attachRefId: String, stream: Observable<BlobOrStream>}[] = [];
        if (tape && tape.actions){
            for (const actionItem of tape.actions) {
                if (actionItem.attachRefId) {
                    let stream$: Observable<BlobOrStream> = 
                        thisLocal.manager.config.cacheHandler.getFromCache(actionItem.attachRefId)
                            .pipe(
                                mapJustOnceRxOpr((streamValue) => {
                                    return streamValue;
                                }),
                                share()
                            );
                    idAndStreamArr.push(
                        {
                            attachRefId: actionItem.attachRefId,
                            stream: stream$
                        }
                    );
                }
            }
        }
        const resultMap: Map<String, Observable<BlobOrStream>> = new Map();
        for (const idAndStreamItem of idAndStreamArr) {
            resultMap.set(idAndStreamItem.attachRefId, idAndStreamItem.stream);
        }

        return resultMap;
    }

    getLastRecordedTapeAndStreams(): {tape: Tape, streams: Map<String, Observable<BlobOrStream>>} {
        const thisLocal = this;
        let tape = this.getLastRecordedTape();
        let streamsMap = thisLocal.getLastRecordedStreams();
        return {
            tape: tape,
            streams: streamsMap
        }
    }

    getLastRecordedStringifiableTapeAndStreams(): {stringifiableTape: Tape, streams: Map<String, Observable<BlobOrStream>>} {
        const thisLocal = this;
        let tapeLiteral = this.getLastRecordedStringifiableTape();
        let streamsMap = thisLocal.getLastRecordedStreams();
        return {
            stringifiableTape: tapeLiteral,
            streams: streamsMap
        }         
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

    public getLastRecordedStringifiableTape(): Tape {
        const thisLocal = this;
        const tape = this.getLastRecordedTape();
        let stringifiableTape =  thisLocal.getStringifiableTape(tape);
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('getLastRecordedStringifiableTape');
            thisLocal.consoleLike.debug(stringifiableTape as any as string);
            thisLocal.consoleLike.groupEnd();
        }
        return stringifiableTape;
    }

    getLastRecordedAtaches(): Map<String, Observable<BlobOrStream>> {
        return new Map(this._currentRecordedAtaches);
    }

    private getStringifiableTape(tape: Tape): Tape {
        const thisLocal = this;
        const literalReturn: Tape = JSONHelper.convertToStringifiableObject(tape, true)
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('getStringifiableTape');
            thisLocal.consoleLike.debug(literalReturn as any as string);
            thisLocal.consoleLike.groupEnd();
        }
        return literalReturn;
    }

    private getTapeFromStringifiable(tapeLiteral: any): Tape {
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
            thisLocal.consoleLike.group('getTapeFromStringifiable');
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
    validatePlayerSideResponseLike(responseLike: ResponseLike<{} | BlobOrStream>): void {
        let isResponseBodyBlobOrStream = responseLike.body && RecorderForDom.isBlobOrStream(responseLike.body);
        if (!isResponseBodyBlobOrStream) {
            if (!responseLike || !responseLike.body || !(responseLike.body as PlayerSnapshot).wrappedSnapshot) {
                throw new Error('Invalid player side responseLike body object: \n' + this.jsonStringfyWithMax(responseLike.body));
            }
        }
    }

    public processWrappedSnapshotFieldArrayInternal<L>(entityType: TypeLike<L>, lazyLoadedColl: any, wrappedSnapshotField: any[]): void {
        const thisLocal = this;
        let refMap: Map<Number, any> = new Map();

        let realItemObsArr: L[] = [];
        if (!Array.isArray(wrappedSnapshotField)) {
            throw new Error('wrappedSnapshotField is not an Array:\n' + this.jsonStringfyWithMax(wrappedSnapshotField));
        }
        for (const literalItem of wrappedSnapshotField) {                               
            let realItem: L = this.processResultEntityPriv(entityType, literalItem, refMap);
            realItemObsArr.push(realItem);
        }
        thisLocal.lazyLoadTemplateCallback(lazyLoadedColl, () => {
            for (const realItem of realItemObsArr) {                           
                thisLocal.addOnCollection(lazyLoadedColl, realItem);
            }
        });
    }

    public processWrappedSnapshotFieldInternal<L>(entityType: TypeLike<L>, snapshotField: any): L {
        let refMap: Map<Number, any> = new Map();
        let result = this.processResultEntityPriv(entityType, snapshotField, refMap);
        return result;
    }

    private processResultEntityPriv<L>(entityType: TypeLike<L>, wrappedSnapshotField: any, refMap: Map<Number, any>): L {
        const thisLocal = this;
        if (!wrappedSnapshotField) {
            throw new Error('snapshotField can not be null');
        }
        this.validatePlayerSideLiteralObject(wrappedSnapshotField);

        let allMD = this.resolveMetadatas({literalObject: wrappedSnapshotField, refMap: refMap});
        let bMd = allMD.objectMd;
        let entityValue: L = this._objectsBySignature.get(bMd.$signature$);

        if(!allMD.objectMdFound) {
            throw new Error('wrappedSnapshotField has no metadata. wrappedSnapshotField:\n' +
                JSON.stringify(
                    wrappedSnapshotField,
                    null,
                    2).substring(0, 400)
            );
        }

        //resultEntityAlreadyProcessed.allMD = allMD;

        if (!LodashLike.isNil(entityValue)) {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('entity is already processed on this session. Found by signature: ' + bMd.$signature$);
            }
            if(LodashLike.isNil(bMd.$id$)) {
                throw new Error('entity is already processed on this session. But thre is no metadatas.$id$. signature: ' + bMd.$signature$);
            }
            refMap.set(bMd.$id$, entityValue);
            
            LodashLike.set(entityValue, RecorderConstants.ENTITY_EXISTS_BY_SIGN_FROM_PREVIOUS_PROCESSING, true);
        } else {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('entity was not processed yet on this session. Not found by signature: ' + bMd.$signature$);
            }
            if (!LodashLike.isNil(bMd.$idRef$)) {
                entityValue = refMap.get(bMd.$idRef$);
                if (LodashLike.isNil(entityValue)) {
                    throw new Error('entity not foun for idRef: ' + bMd.$idRef$);
                }
            }
        }
        if (LodashLike.isNil(entityValue)) {
            entityValue = new entityType();
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('entity was not processed yet on this session.' + 
                  ' Creating new instance for: ' + entityType.name);
            }
        }
        //const breackPointFlag = { fooid: ''};
        if (!wrappedSnapshotField) {
            throw new Error('snapshotField can not be null');
        }

        // if (LodashLike.get(entityValue, RecorderConstants.ENTITY_EXISTS_BY_SIGN_FROM_PREVIOUS_PROCESSING)) {
        this.validatingMetaFieldsExistence(entityType);
        // entityValue = resultEntityAlreadyProcessed.entityValue;
        LodashLike.set(entityValue as any, RecorderConstants.ENTITY_SESION_PROPERTY_NAME, this);
        this.removeNonUsedKeysFromLiteral(entityValue as any, wrappedSnapshotField);

        if (!LodashLike.isNil(bMd.$id$)) {
            refMap.set(bMd.$id$, entityValue);
        } else {
            if (LodashLike.isNil(bMd.$idRef$)) {
                throw new Error('This should not happen 1');
            }
        }
        
        if (LodashLike.isNil(bMd.$idRef$)) {
            //literal source values with no $idRef$ no need deep processing!
            entityValue = this.lazyLoadTemplateCallback(entityValue, () => {
                this.tryCacheInstanceBySignature(
                    {
                        realInstance: entityValue, 
                        playerSnapshot: { wrappedSnapshot: wrappedSnapshotField }
                    }
                );
                return LodashLike.asyncMergeWith(
                    entityValue as any,
                    wrappedSnapshotField, 
                    {
                        customizer: this.mergeWithCustomizerPropertyReplection(refMap),
                        noObjects: new Set([Date]),
                        considerObjectProperties: true,
                        ignorePropeties: [ 
                            /^_.*/,
                            RecorderConstants.ENTITY_CONTROL_PROPS_PATTERN
                        ]
                    }
                );   
            });
        }
        return entityValue;
    }

    private processSingleInstanceForPlayerObjectId<E, I>(entType: TypeLike<E>, parenteRMEtc: ResolvedMetadataEtc, refMap: Map<Number, any>, literalPlayerObjectId?: I): I {
        if (this._playerObjectsBySignature.has(parenteRMEtc.objectMd.$signature$)) {
            return this._playerObjectsBySignature.get(parenteRMEtc.objectMd.$signature$);
        } else {
            let literalPlayerObjectIdLocal: any = parenteRMEtc.objectMd.$playerObjectId$;
            if(!LodashLike.isNil(parenteRMEtc.objectMd.$playerObjectId$)) {
                //Are we processing the value from $metadatas$
                literalPlayerObjectIdLocal = parenteRMEtc.objectMd.$playerObjectId$;
            } else if (!LodashLike.isNil(literalPlayerObjectId)) {
                //Are we processing the value from entity
                literalPlayerObjectIdLocal = literalPlayerObjectId;
            } else {
                throw new Error("This should not happen");
            }
            let allMD = this.resolveMetadatas(
                {
                    literalObject: literalPlayerObjectIdLocal,
                    refMap: refMap
                });

            const entDummyInstance = new entType();
            let objectIdPrpInfo:  RecorderDecoratorsInternal.PlayerObjectIdInfo = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_ID_INFO, entDummyInstance);
            const fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<I, any>(this.fielEtcCacheMap, entDummyInstance, objectIdPrpInfo.fieldName, this.manager.config);
            
            const playerObjectIdRef = { value: undefined as I };
    
            if (!LodashLike.isNil(parenteRMEtc.playerObjectIdMd.$idRef$)) {
                if (this.consoleLikeRestoreState.enabledFor(RecorderLogLevel.Warn)) {
                    this.consoleLikeRestoreState.warn('RecorderSessionDefault.processPlayerObjectIdForSingleInstance: playerObjectIdMd.$idRef$ found. It is not usual!. literalPlayerObjectId:\n' + this.jsonStringfyWithMax(literalPlayerObjectIdLocal));
                }
                let referedInstance = refMap.get(parenteRMEtc.playerObjectIdMd.$idRef$);
                let referedInstanceMd = LodashLike.get(referedInstance, this.manager.config.playerMetadatasName) as PlayerMetadatas;
                if (!referedInstanceMd.$iAmPlayerMetadatas$) {
                    throw new Error('Where is the metadatas fot $idRef$:\n' + parenteRMEtc.playerObjectIdMd.$idRef$);
                }
                playerObjectIdRef.value = referedInstanceMd.$playerObjectId$;
            } else {
                playerObjectIdRef.value = parenteRMEtc.objectMd.$playerObjectId$;            
            }

            if(fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                if(allMD.objectMdFound && allMD.objectMd.$isComponentPlayerObjectId$) {
                    throw new Error('playerObjectId.$isComponentPlayerObjectId$, it can not use fromLiteralValue on FieldProcessor');
                }
                playerObjectIdRef.value = 
                    fieldEtc.fieldProcessorCaller.callFromLiteralValue(
                        playerObjectIdRef.value,
                        fieldEtc.fieldInfo);
            } else if(allMD.objectMdFound && allMD.objectMd.$isComponentPlayerObjectId$) {
                if (fieldEtc.objectIdPrpInfo.idType) {
                    this.validatingMetaFieldsExistence(fieldEtc.objectIdPrpInfo.idType);
                    playerObjectIdRef.value = this.processResultEntityPriv(fieldEtc.objectIdPrpInfo.idType, playerObjectIdRef.value, refMap);
                } else {
                    throw new Error('There is no playerObjectIdType on LazyRef. Is it a collection?!. playerObjectIdType: ' + fieldEtc.prpType + ', genericNode:'+ fieldEtc.prpGenType);
                }
            } else if (!LodashLike.isNil(playerObjectIdRef.value)) {
                if (this.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    this.consoleLike.debug('The player object Id is a simple type value: ' + playerObjectIdRef.value);
                }
            } else {
                throw new Error('This should not happen. ');
            }
            this._playerObjectsBySignature.set(parenteRMEtc.objectMd.$signature$, playerObjectIdRef.value);
        }
        return this._playerObjectsBySignature.get(parenteRMEtc.objectMd.$signature$);
    }

    private createLoadedLazyRef<L extends object, I>(
            fieldEtc: FieldEtc<L, any>,
            literalLazyObj: any,
            refMap: Map<Number, any>,
            refererObj: any,
            refererKey: string): LazyRef<L, I> {
        const thisLocal = this;
        let lr: LazyRefImplementor<L, I> = this.createApropriateLazyRef<L, I>(fieldEtc.prpGenType, literalLazyObj, refererObj, refererKey, refMap);

        let allMD = thisLocal.resolveMetadatas({ literalObject: literalLazyObj, refererObject: refererObj, key: refererKey, refMap: refMap });
        
        this.trySetPlayerObjectIdentifier(lr, fieldEtc.prpGenType, literalLazyObj, refMap);
        this.tryGetFromObjectsBySignature(lr, literalLazyObj, refMap);
        const isValueByFieldProcessor: {value: boolean} = { value: false };

        if (allMD.objectMd.$iAmPlayerMetadatas$) {
            if (!LodashLike.isNil(allMD.objectMd.$idRef$)) {
                let referedInstance = refMap.get(allMD.objectMd.$idRef$);
                if (!literalLazyObj) {
                    throw new Error('literalLazyObj.$iAmPlayerMetadatas$ and $idRef$ not found: \'' + refererKey + '\' on ' + refererObj.constructor);
                }
                lr.setLazyObjOnLazyLoadingNoNext(referedInstance);
                //asyncCombineObsArr.push(setLazyObjOnLazyLoadingNoNext$);
            } else {
                //nothing
            }
        } else {
            //nothing
        };

        if (LodashLike.isNil(literalLazyObj)) {
            //LodashLike.isNil(srcValue) means LazyRef object instance is null.
            if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
                lr.setLazyObjOnLazyLoadingNoNext(null);
            } else {
                (lr as LazyRefPrpImplementor<L>).setRealResponseDoneDirectRawWrite(true);
                lr.respObs = of({ body: null });
            }
        } else {
            if (lr.lazyLoadedObj) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('LazyRef.lazyLoadedObj is already setted: ');
                    thisLocal.consoleLike.debug(lr.lazyLoadedObj);
                    thisLocal.consoleLike.groupEnd();
                }
                //nothing
            } else {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.debug('LazyRef.lazyLoadedObj is not setted yet');
                }
                //let lazyLoadedObjType: TypeLike<any> = null;
                
                if (fieldEtc.lazyRefMarkerType === LazyRefOTMMarker) {
                    if (!fieldEtc.otmCollectionType) {
                        throw new Error('Property \'' + refererKey + ' of \'' + refererObj.constructor.name + '\'. . LazyRefOTM not properly defined on Reflect. Collection Type no denined!');
                    }
                    const lazyCollection = this.createCollection(fieldEtc.otmCollectionType, refererObj, refererKey);
                    
                    thisLocal.lazyLoadTemplateCallback(lazyCollection, () => {
                        lr.setLazyObjOnLazyLoadingNoNext(lazyCollection);
                        let processResultEntityPrivArr: L[] = [];
                        for (const literalItem of literalLazyObj) {
                            let processResultEntityPriv = thisLocal.processResultEntityPriv(fieldEtc.lazyLoadedObjType, literalItem, refMap)
                            processResultEntityPrivArr.push(processResultEntityPriv);
                        }
                        for (const entityItem of processResultEntityPrivArr) {
                            thisLocal.addOnCollection(lazyCollection, entityItem);                                                    
                        }
                    });
                } else {
                    let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.fielEtcCacheMap, refererObj, refererKey, this.manager.config);
                    if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
                        if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                            isValueByFieldProcessor.value = true;
                            let fromLiteralValue = fieldEtc.fieldProcessorCaller.callFromLiteralValue(literalLazyObj, fieldEtc.fieldInfo);
                            // callFromLiteralValue$ = callFromLiteralValue$.pipe(this.addSubscribedObsRxOpr());
                            //here for debug purpose
                            refererKey === 'blobLazyA';
                            if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
                                lr.setLazyObjOnLazyLoadingNoNext(fromLiteralValue);
                            } else {
                                (lr as LazyRefPrpImplementor<L>).attachRefId = thisLocal.manager.config.cacheStoragePrefix + thisLocal.nextMultiPurposeInstanceId();
                                (lr as LazyRefPrpImplementor<L>).setRealResponseDoneDirectRawWrite(true);
                                lr.respObs = fieldEtc.fieldProcessorCaller.callToDirectRaw(fromLiteralValue, fieldEtc.fieldInfo).pipe(
                                    flatMap((respDirRaw) => {
                                        return thisLocal.manager.config.cacheHandler.putOnCache((lr as LazyRefPrpImplementor<L>).attachRefId, respDirRaw.body);
                                    }),
                                    share(),
                                    flatMap(() => {
                                        return thisLocal.manager.config.cacheHandler.getFromCache((lr as LazyRefPrpImplementor<L>).attachRefId);
                                    }),
                                    map((stream) => {
                                        return { body: stream } as ResponseLike<BlobOrStream>;
                                    })
                                );
                            }
                        } else {
                            if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
                                lr.setLazyObjOnLazyLoadingNoNext(literalLazyObj);
                            } else {
                                throw new Error('LazyRef is lazyDirectRawWrite and has no fromLiteralValue processor.\n' + lr.toString());
                            }
                        }
                    } else if (!isValueByFieldProcessor.value) {
                        let resultEntityPriv = this.processResultEntityPriv(fieldEtc.lazyLoadedObjType, literalLazyObj, refMap);
                        lr.setLazyObjOnLazyLoadingNoNext(resultEntityPriv);
                    }
                }
            }
        }

        return lr;
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

    public setLazyRefRespObs<L extends Object, I>(lazyRef: LazyRefImplementor<L, I>): void {
        let originalValueEntry: StringifiableOriginalValueEntry = this._stringifiableOriginalValueEntriesBySign.get(lazyRef.signatureStr);
        //if(!this._lazyInfoCacheMap.get(lazyRef)) {
        if (!this._lazyInfoCacheMap.has(lazyRef)
                || this._stringifiableOriginalValueEntriesBySign.has(lazyRef.signatureStr)) {
            let originalValueEntry: StringifiableOriginalValueEntry = this._stringifiableOriginalValueEntriesBySign.get(lazyRef.signatureStr);
            let originalValueEntryMsgFragment: String;
            if (originalValueEntry) {
                originalValueEntryMsgFragment = "\nOriginal value from response:\n" +
                    JSON.stringify(
                        originalValueEntry,
                        null,
                        2);
            }
            throw new Error('You are trying to set Observable<Response> for an already loaded LazyRef value.\nLazyRef:\n' + lazyRef + originalValueEntryMsgFragment);
        }
        const lazyInfo: LazyInfo<L> = this._lazyInfoCacheMap.get(lazyRef);
        if (!lazyInfo.propertyOptions.lazyDirectRawRead) {
            if (!lazyRef.signatureStr) {
                throw new Error('Signature not found\n' + lazyRef.toString());
            }
            lazyRef.respObs = this.manager.config.lazyObservableProvider.generateObservable(lazyRef.signatureStr, lazyInfo);
        } else {
            if (!lazyRef.signatureStr) {
                throw new Error('Signature not found\n' + lazyRef.toString());
            }
            lazyRef.respObs = this.manager.config.lazyObservableProvider.generateObservableForDirectRaw(lazyRef.signatureStr, lazyInfo);
        }
    }

    protected createNotLoadedLazyRef<L extends object, I>(
            genericNode: GenericNode, 
            literalLazyObj: any,
            refMap: Map<Number, any>,
            refererObj: any,
            refererKey: string): LazyRef<L, I> {
        const thisLocal = this;
        //const asyncCombineObsArr: Observable<any>[] = [];
        let propertyOptions: RecorderDecorators.PropertyOptions<L> = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, refererObj, refererKey);
        if (!propertyOptions) {
            throw new Error('@RecorderDecorators.property() not defined for ' + refererObj.constructor.name + '.' + refererKey);
        }
        let lr: LazyRefImplementor<L, I> = this.createApropriateLazyRef<L, I>(genericNode, literalLazyObj, refererObj, refererKey, refMap);
        this.trySetPlayerObjectIdentifier(lr, genericNode, literalLazyObj, refMap);
        this.tryGetFromObjectsBySignature(lr, literalLazyObj, refMap);

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
                //literalLazyObj: literalLazyObj,
                ownerType: refererObj.constructor,
                lazyFieldType: genericNode.gParams[0] as TypeLike<any>,
                fieldName: refererKey
            }
            this._lazyInfoCacheMap.set(lr, lazyInfo);
            
            this.setLazyRefRespObs(lr);
        }

        return lr;
    }

    private tryGetFromObjectsBySignature<L extends object, I>(
            lr: LazyRefImplementor<L, I>,
            literalLazyObj: any,
            refMap: Map<Number, any>): void {
        let allMD = this.resolveMetadatas({ literalObject: literalLazyObj, refMap: refMap });
        //let allMD = this.resolveMetadatas({literalObject: literalLazyObj});
        let bMd = allMD.objectMd;

        let entityValue: any = null;
        if (bMd.$signature$) {
            lr.signatureStr = bMd.$signature$;
            entityValue = this._objectsBySignature.get(bMd.$signature$);
            if (entityValue) {
                lr.setLazyObjOnLazyLoadingNoNext(entityValue);
            }
        } else {
        }
    }

    createApropriateLazyRef<L extends object, I>(genericNode: GenericNode, literalLazyObj: any, refererObj: any, refererKey: string, refMap?: Map<Number, any>): LazyRefImplementor<L, I> {
        let allMD = this.resolveMetadatas({literalObject: literalLazyObj, refererObject: refererObj, key: refererKey, refMap: refMap});
        let bMd = allMD.objectMd;

        //let stringifiablePlayerObjectIdLiteral: any = bMd.$playerObjectId$;
        let lazyRef: LazyRefImplementor<L, I> = null;
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<any, any>(this._fielEtcCacheMap, refererObj, refererKey, this.manager.config);

        if (fieldEtc.lazyRefMarkerType === LazyRefMTOMarker) {
            lazyRef = new LazyRefMTODefault<L, I>(this);
            lazyRef.mdRefererPlayerObjectId
        } else if (fieldEtc.lazyRefMarkerType === LazyRefOTMMarker) {
            if (!fieldEtc.otmCollectionType) {
                throw new Error('Property \'' + refererKey + ' of \'' + refererObj.constructor.name + '\'. . LazyRefOTM not properly defined on Reflect. Collection Type no defined!');
            }
            lazyRef = new LazyRefOTMDefault<L>(this);
        } else if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
            lazyRef = new LazyRefPrpDefault<L>(this);
        } else {
            throw new Error('Property \'' + refererKey + '\' of \'' + refererObj.constructor.name + '\'. LazyRef not properly defined on Reflect');
        }
        lazyRef.instanceId = this.nextMultiPurposeInstanceId();
        lazyRef.refererObj = refererObj;
        lazyRef.refererKey = refererKey;
        lazyRef.session = this;
        lazyRef.genericNode = genericNode;
        lazyRef.mdLazyLoadedObj = allMD.objectMd;
        lazyRef.mdRefererObj = allMD.refererObjMd;
        lazyRef.mdRefererPlayerObjectId = allMD.refererObjMd;
        lazyRef.propertyOptions;
        return lazyRef;
    }

    private metadaKeys: Set<string>;
    private isStringifiableObjMetadataKey(keyName: string): boolean {
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
            if (!this.isStringifiableObjMetadataKey(keyItem) && realKeys.indexOf(keyItem) < 0) {
                delete literalObj[keyItem];
            }
        }
    }

    private trySetPlayerObjectIdentifier<L extends object, I>(
            lr: LazyRefImplementor<L, I>,
            genericNode: GenericNode,
            literalLazyObj: any,
            refMap: Map<Number, any>): void {
        const thisLocal = this;
        let allMD = this.resolveMetadatas(
            {
                literalObject: literalLazyObj,
                refererObject: lr.refererObj,
                key: lr.refererKey,
                refMap: refMap
            });
        let objectMd = allMD.objectMd;

        const stringifiablePlayerObjectIdLiteralRef = { value: undefined as any };

        if (!LodashLike.isNil(objectMd.$idRef$)) {
            let referedInstance = refMap.get(objectMd.$idRef$);
            let referedInstanceMd = LodashLike.get(referedInstance, thisLocal.manager.config.playerMetadatasName) as PlayerMetadatas;
            if (!referedInstanceMd.$iAmPlayerMetadatas$) {
                throw new Error('Where is the metadatas fot $idRef$:\n' + objectMd.$idRef$);
            }
            stringifiablePlayerObjectIdLiteralRef.value = referedInstanceMd.$playerObjectId$;
        } else {
            stringifiablePlayerObjectIdLiteralRef.value = objectMd.$playerObjectId$;            
        }

        if (genericNode.gType === LazyRefMTOMarker) {
            let playerObjectidOwnerType: TypeLike<any> = null;
            if (genericNode.gParams[0] instanceof GenericNode) {
                playerObjectidOwnerType = (<GenericNode>genericNode.gParams[0]).gType;
            } else {
                playerObjectidOwnerType = <TypeLike<any>>genericNode.gParams[0];
            }

            (lr as LazyRefMTOImplementor<L, I>).playerObjectId =
                thisLocal.processSingleInstanceForPlayerObjectId(
                    playerObjectidOwnerType,
                    allMD,
                    refMap
                );
            // let playerObjectIdType: TypeLike<any> = null;
            // if (genericNode.gParams[1] instanceof GenericNode) {
            //     playerObjectIdType = (<GenericNode>genericNode.gParams[1]).gType;
            // } else {
            //     playerObjectIdType = <TypeLike<any>>genericNode.gParams[1];
            // }
            // let playerObjectidOwnerType: TypeLike<any> = null;
            // if (genericNode.gParams[0] instanceof GenericNode) {
            //     playerObjectidOwnerType = (<GenericNode>genericNode.gParams[0]).gType;
            // } else {
            //     playerObjectidOwnerType = <TypeLike<any>>genericNode.gParams[0];
            // }
    
            // let objectIdPrpInfo: RecorderDecoratorsInternal.PlayerObjectIdInfo = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_ID_INFO, new playerObjectidOwnerType());
            // if(!objectIdPrpInfo) {
            //     throw new Error('We are receiving $playerObjectId$ and ' + playerObjectidOwnerType.name + ' does not define a property with @RecorderDecorators.playerObjectId()');
            // }

            // let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<I, any>(this.fielEtcCacheMap, new playerObjectidOwnerType(), objectIdPrpInfo.fieldName, this.manager.config);
            
            // if(fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
            //     (lr as LazyRefMTOImplementor<L, I>).playerObjectId = 
            //         fieldEtc.fieldProcessorCaller.callFromLiteralValue(
            //             stringifiablePlayerObjectIdLiteralRef.value,
            //             fieldEtc.fieldInfo);
            // } else if (LodashLike.isObject(stringifiablePlayerObjectIdLiteralRef.value, new Set([Date, Buffer]))) {
            //     if (playerObjectIdType) {
            //         if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            //             thisLocal.consoleLike.debug('There is a playerObjectIdType on LazyRef. Is it many-to-one LazyRef?!. playerObjectIdType: ' + playerObjectIdType.name + ', genericNode:'+genericNode);
            //         }
            //         this.validatingMetaFieldsExistence(playerObjectIdType);
            //         (lr as LazyRefMTOImplementor<L, I>).playerObjectId = this.processResultEntityPriv(playerObjectIdType, stringifiablePlayerObjectIdLiteralRef.value, refMap);
            //     } else {
            //         if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            //             thisLocal.consoleLike.debug('Thre is no playerObjectIdType on LazyRef. Is it a collection?!. playerObjectIdType: ' + playerObjectIdType.name + ', genericNode:'+genericNode);
            //         }
            //     }
            // } else if (!LodashLike.isNil(stringifiablePlayerObjectIdLiteralRef.value)) {
            //     if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            //         thisLocal.consoleLike.debug('The player object Id is a simple type value: ' + stringifiablePlayerObjectIdLiteralRef.value + '. genericNode:'+ genericNode);
            //     }
            //     (lr as LazyRefMTOImplementor<L, I>).playerObjectId = stringifiablePlayerObjectIdLiteralRef.value;
            // } else {
            //     throw new Error('This should not happen. ');
            // }
        }
    }

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
    private mergeWithCustomizerPropertyReplection<T>(
            refMap: Map<Number, any>,
            ): LodashLike.AsyncMergeWithCustomizer {
        const thisLocal = this;

        return (
                value: any,
                srcValue: any,
                key?: string,
                object?: Object,
                source?: Object): LodashLike.AsyncMergeWithCustomizerResult<T> => {
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
                        fieldEtc.lazyRefMarkerType === LazyRefMTOMarker
                        || fieldEtc.lazyRefMarkerType === LazyRefOTMMarker
                        || fieldEtc.lazyRefMarkerType === LazyRefPrpMarker)
                );

            if (mdPlayerObjectId.$isComponent$) {
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function: bMdPlayerObjectId.isComponent. bMdSrcValue.$playerObjectId$:');
                    thisLocal.consoleLikeMerge.debug(mdSrcValue.$playerObjectId$);
                    thisLocal.consoleLikeMerge.groupEnd();
                }
                //fieldEtc.prpType = Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_ID_TYPE, object);
                if (!fieldEtc.objectIdPrpInfo) {
                    throw new Error('We are receiving mdSrcValue.$playerObjectId$ as Object and mdPlayerObjectId.$isComponent$, ' + object.constructor.name + ' does not define a property with @RecorderDecorators.playerObjectId()');
                }
            }
            if (mdSrcValue.$isAssociative$ && fieldEtc.prpGenType 
                && fieldEtc.lazyRefMarkerType !== LazyRefMTOMarker
                && fieldEtc.lazyRefMarkerType !== LazyRefOTMMarker
                && fieldEtc.lazyRefMarkerType !== LazyRefPrpMarker) {
                throw new Error('Key '+ object.constructor.name + '.' + key + ' is player side associative relation and is not LazyRef or not define GenericTokenizer');
            }
            if (mdSrcValue.$isComponent$
                && fieldEtc.prpGenType
                && (fieldEtc.lazyRefMarkerType === LazyRefMTODefault
                    || fieldEtc.lazyRefMarkerType === LazyRefOTMMarker
                    || fieldEtc.lazyRefMarkerType === LazyRefPrpMarker)) {
                throw new Error('Key '+ object.constructor.name + '.' + key + ' is player side component and is a LazyRef.');
            }
            const customizerResult = { needSet: true, value: null as any};
            const existsBySignFromPreviousProcessing = LodashLike.get(object, RecorderConstants.ENTITY_EXISTS_BY_SIGN_FROM_PREVIOUS_PROCESSING);
            if (key === thisLocal.manager.config.playerMetadatasName) {
                customizerResult.value = mdSource;
                customizerResult.needSet = false;
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
                if(!existsBySignFromPreviousProcessing) {
                    LodashLike.set(object as any, key, correctSrcValueAsMetadata);
                }

                if (mdPlayerObjectId.$isComponent$) {
                    customizerResult.value = DummyUndefinedForMergeAsync;
                    //let processResultEntityPrivPlayerObjectId$ = combineFirstSerial(asyncCombineObsArr).pipe(
                    let playerObjectIdValue = thisLocal.processSingleInstanceForPlayerObjectId(
                        object.constructor as TypeLike<any>,
                        allMD,
                        refMap);
                    //let playerObjectIdValue = thisLocal.processResultEntityPriv(fieldEtc.objectIdPrpInfo.idType, mdSource.$playerObjectId$, refMap);
                    correctSrcValueAsMetadata.$playerObjectId$ = playerObjectIdValue;
                    customizerResult.value = correctSrcValueAsMetadata;
                    //isDoneRef.result = mdPlayerObjectId;
                    customizerResult.needSet = false;   
                    //mdPlayerObjectId.$playerObjectId$ = playerObjectIdValue;
                    if(!existsBySignFromPreviousProcessing) {
                        LodashLike.set(object, key, customizerResult.value);
                    }
                } 
            } else if (!LodashLike.isNil(mdSrcValue.$idRef$) && !isLazyRefField && fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                customizerResult.value = DummyUndefinedForMergeAsync;
                let callFromLiteralValue = fieldEtc.fieldProcessorCaller.callFromLiteralValue(srcValue, fieldEtc.fieldInfo);
                customizerResult.value = callFromLiteralValue;
                customizerResult.needSet = false;  
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.debug('(Async) mergeWithCustomizerPropertyReplection => function =>'+
                        ' createSerialAsyncTasksWaiting().pipe() => this.mapJustOnceKeepAllFlagsRxOpr().'+
                        ' Object resolved by fieldEtc.fieldProcessorCaller.callFromLiteralValue:\n' + 
                        this.jsonStringfyWithMax(srcValue));
                }
                if(!existsBySignFromPreviousProcessing) {
                    LodashLike.set(object, key, customizerResult.value);
                }
            } else if (!LodashLike.isNil(mdSrcValue.$idRef$) && !isLazyRefField) {
                customizerResult.value = DummyUndefinedForMergeAsync;
                customizerResult.value = refMap.get(mdSrcValue.$idRef$);
                customizerResult.needSet = false;
                if (!customizerResult.value) {
                    throw new Error('This should not happen 2');
                }
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.group('(Async) mergeWithCustomizerPropertyReplection => function =>'+
                        ' createSerialAsyncTasksWaiting().pipe() => this.mapJustOnceKeepAllFlagsRxOpr().'+
                        ' Object resolved by mdSrcValue.$idRef$ field. owner type: ' +
                        object.constructor.name + '; owner field: ' + key);
                    thisLocal.consoleLikeMerge.groupEnd();
                }
                if(!existsBySignFromPreviousProcessing) {
                    LodashLike.set(object, key, customizerResult.value);
                }
            } else if (fieldEtc.objectIdPrpInfo.fieldName === key.toString()) {
                customizerResult.value = srcValue;
                customizerResult.needSet = false;
                let correctSrcValue = customizerResult.value;
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Debug)) {
                    thisLocal.consoleLikeMerge.debug('mergeWithCustomizerPropertyReplection => function. fieldEtc.objectIdPrpInfo.fieldName === key.toString(). calling .processSingleInstanceForPlayerObjectId(). Here playerObjectId is probably a simple non $isComponentPlayerObjectId$ value, because when it is $isComponentPlayerObjectId$ is processed before on $metadatas$.$playerObjectId$. \''+key+'\'. srcValue: ' + this.jsonStringfyWithMax(srcValue) );
                }
                customizerResult.value = thisLocal.processSingleInstanceForPlayerObjectId(
                    object.constructor as TypeLike<any>,
                    allMD,
                    refMap);
                if(!existsBySignFromPreviousProcessing) {
                    LodashLike.set(object, key, correctSrcValue);
                }
            } else if (fieldEtc.prpType) {
                const isFromLiteralValue = {value: false};
                if (fieldEtc.prpGenType) {
                    if (fieldEtc.otmCollectionType &&
                        !(fieldEtc.lazyRefMarkerType === LazyRefMTOMarker
                            || fieldEtc.lazyRefMarkerType === LazyRefOTMMarker
                            || fieldEtc.lazyRefMarkerType === LazyRefPrpMarker)) {
                        if (1 === 1) {
                            throw new Error('This pesrsistent collection is not supported yet!');
                        }
                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeMerge.debug('mergeWithCustomizerPropertyReplection => function.'+
                                ' fieldEtc.otmCollectionType ' + fieldEtc.otmCollectionType.name);
                        }
                        customizerResult.value = DummyUndefinedForMergeAsync;
                        let correctSrcValueColl = thisLocal.createCollection(fieldEtc.otmCollectionType, object, key);
                        
                        thisLocal.lazyLoadTemplateCallback(correctSrcValueColl, () => {
                            const entityArr: T[] = [];
                            for (let index = 0; index < srcValue.length; index++) { 
                                let arrItemType: TypeLike<any> = <TypeLike<any>>fieldEtc.lazyLoadedObjType;
                                entityArr.push(thisLocal.processResultEntityPriv(arrItemType, srcValue[index], refMap));
                            }
                            for (const entityItem of entityArr) {
                                thisLocal.addOnCollection(correctSrcValueColl, entityItem);                                                    
                            }
                            customizerResult.value = correctSrcValueColl;
                        });
                        //nothing for now
                    } else if (fieldEtc.lazyRefMarkerType === LazyRefOTMMarker
                        || fieldEtc.lazyRefMarkerType === LazyRefMTOMarker
                        || fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
                        if (LodashLike.isNil(mdSource.$id$)) {
                            throw new Error('There is no mdSource.$id$ on ' + this.jsonStringfyWithMax(srcValue));
                        }
                        if (mdSrcValueFound && LodashLike.isNil(mdSrcValue.$idRef$) && !mdSrcValue.$isAssociative$ && !mdSrcValue.$isLazyProperty$) {
                            throw new Error('Receiving object that is non associative, no lazy property and has no $idRef$, but field is a LazyRef type. field: ' + object.constructor.name + '.' + key + '. Value' + this.jsonStringfyWithMax(srcValue));
                        }
                        if (mdSrcValue.$isLazyUninitialized$) {
                            customizerResult.value = DummyUndefinedForMergeAsync;
                            let lazyRef = thisLocal.createNotLoadedLazyRef(fieldEtc.prpGenType, srcValue, refMap, object, key);
                            //for debug purpose
                            srcValue === srcValue;

                            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                                    ' function => createNotLoadedLazyRef$.pipe(thisLocal.mapJustOnceKeepAllFlagsRxOpr()).'+
                                    ' createNotLoadedLazyRef, for property \''+key+'\'. lodashSet(object, key, lazyRef)');
                                thisLocal.consoleLikeMerge.debug(object);
                                thisLocal.consoleLikeMerge.groupEnd();
                            }
                            customizerResult.value = lazyRef;
                            customizerResult.needSet = true;
                            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function.'+
                                    ' Returning null because of createNotLoadedLazyRef$.subscribe().'+
                                    ' property \''+key+'\'.');
                                thisLocal.consoleLikeMerge.debug(object);
                                thisLocal.consoleLikeMerge.groupEnd();
                            }
                        } else {
                            customizerResult.value = DummyUndefinedForMergeAsync;
                            let lazyRef = thisLocal.createLoadedLazyRef(fieldEtc, srcValue, refMap, object, key);
                            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...)'+
                                    ' mergeWithCustomizerPropertyReplection => function =>'+
                                    ' createLoadedLazyRef$.subscribe(). createLoadedLazyRef,'+
                                    ' for property \''+key+'\'. lodashSet(object, key, lazyRef)');
                                thisLocal.consoleLikeMerge.debug(object);
                                thisLocal.consoleLikeMerge.groupEnd();
                            }
                            customizerResult.value = lazyRef;
                            customizerResult.needSet = true;
                            keepAllFlagsTemplateCallback(() => {
                                LodashLike.set(object, key, customizerResult.value);
                            });                            
                        }
                    } else if (thisLocal.isCollection(fieldEtc.prpType)) {
                        if (!fieldEtc.prpGenType.gParams[0]) {
                            throw new Error('Ivalid non persistent collection with por property ' + 
                                object.constructor.name + '.' + key +':\n' + fieldEtc.prpGenType);
                        }
                        const nonPersistentCollection = this.createCollection(fieldEtc.prpType, object, key);
                        thisLocal.lazyLoadTemplateCallback(nonPersistentCollection, () => {
                            for (const item of srcValue) {
                                if (!LodashLike.isNil(item)) {
                                    thisLocal.addOnCollection(
                                        nonPersistentCollection,
                                        thisLocal.processResultEntityPriv(
                                            fieldEtc.prpGenType.gParams[0] as TypeLike<any>,
                                            item,
                                            refMap));
                                } else {
                                    thisLocal.addOnCollection(nonPersistentCollection, null);
                                }
                            }
                        });
                        customizerResult.value = nonPersistentCollection;
                        customizerResult.needSet = true;                         
                    }
                } else if (LodashLike.isObject(srcValue, new Set([Date, Buffer]))
                        && !fieldEtc.propertyOptions.lazyDirectRawRead) {
                    customizerResult.value = DummyUndefinedForMergeAsync;
                    let correctSrcValueSubs = thisLocal.processResultEntityPriv(fieldEtc.prpType, srcValue, refMap);
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                        ' function => processResultEntityPriv$.pipe() => thisLocal.mapJustOnceKeepAllFlagsRxOpr().'+
                        ' createLoadedLazyRef, for property \''+key+'\'. LodashLike.set(object, key, correctSrcValue)');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                    customizerResult.value = correctSrcValueSubs;
                    customizerResult.needSet = true;
                    keepAllFlagsTemplateCallback(() => {
                        LodashLike.set(object, key, correctSrcValueSubs);
                    });
                } else if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function.'+
                            ' Transformation by "IFieldProcessor.fromLiteralValue" for property \''+key+'\'.');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                    customizerResult.value = DummyUndefinedForMergeAsync;
                    isFromLiteralValue.value = true;
                    let fromLiteralValue = fieldEtc.fieldProcessorCaller.callFromLiteralValue(srcValue, fieldEtc.fieldInfo);
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                            ' function => fromLiteralValue$.pipe() => thisLocal.mapJustOnceKeepAllFlagsRxOpr().'+
                            ' fromLiteralValue, for property \''+key+'\'. LodashLike.set(object, key, correctSrcValue)');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                    customizerResult.value = fromLiteralValue;
                    customizerResult.needSet = false;
                    if(!existsBySignFromPreviousProcessing) {
                        keepAllFlagsTemplateCallback(() => {
                            LodashLike.set(object, key, customizerResult.value);
                        });
                    }
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Returning null because of fromLiteralValue$.pipe(tap()). property \''+key+'\'.');
                        thisLocal.consoleLikeMerge.debug(fromLiteralValue);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                } else {
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Transformation is not necessary for property \''+key+'\'.');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                    customizerResult.value = srcValue;
                    customizerResult.needSet = false;
                    let correctSrcValue = customizerResult.value;
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. noTranslation$.pipe(thisLocal.mapJustOnceKeepAllFlagsRxOpr()). Transformation is not necessary for property \''+key+'\'.');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                    if(!existsBySignFromPreviousProcessing) {
                        LodashLike.set(object, key, correctSrcValue);
                    }
                }
            } else if (LodashLike.has(object, key)) {
                throw new Error('No type decorator for '+ object.constructor.name + '.' + key);
            } else if (!LodashLike.has(object, key) && !thisLocal.isStringifiableObjMetadataKey(key)) {
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Warn)) {
                    thisLocal.consoleLikeMerge.warn('mergeWithCustomizerPropertyReplection => function. This property \''+key+'\' does not exists on this type.');
                }
                customizerResult.value = undefined;
                customizerResult.needSet = false;
            } else {
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Property \''+key+'\'. Using same value.');
                    thisLocal.consoleLikeMerge.debug(customizerResult.value);
                    thisLocal.consoleLikeMerge.groupEnd();
                }
            }
            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. return');
                thisLocal.consoleLikeMerge.debug(customizerResult.value);
                thisLocal.consoleLikeMerge.groupEnd();
            }
            if (customizerResult.needSet && existsBySignFromPreviousProcessing) {
                customizerResult.needSet = false;
            }
            return customizerResult;
        }
    }

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

    processTapeActionAttachRefId<T>(
        options:
            {
                action: TapeAction,
                fieldEtc: FieldEtc<T, any>,
                value: T,
                propertyKey: string
            }) : 
            Observable<
                {
                    asyncAddTapeAction: boolean,
                    newValue: T
                }
            > {
        const thisLocal = this;
        const resultObservableValue = {
            asyncAddTapeAction: false,
            newValue: undefined as T
        }
        let resultObservableValue$: Observable<{asyncAddTapeAction: boolean,newValue: T}> = of(resultObservableValue);
        if (!options.action.attachRefId) {
            //non LazyRef lazyDirectRawWrite fields has not unchengable attachRefId.
            options.action.attachRefId = thisLocal.manager.config.cacheStoragePrefix + thisLocal.nextMultiPurposeInstanceId();
        }
        if (options.fieldEtc.fieldProcessorCaller && options.fieldEtc.fieldProcessorCaller.callToDirectRaw) {
            let toDirectRaw$ = options.fieldEtc.fieldProcessorCaller.callToDirectRaw(options.value, options.fieldEtc.fieldInfo);
            // toDirectRaw$ = toDirectRaw$.pipe(thisLocal.addSubscribedObsRxOpr());
            resultObservableValue.asyncAddTapeAction = true;
            resultObservableValue$ = toDirectRaw$.pipe(
                flatMap((respStream) => {
                    let putOnCacheGetFromCache$ = of(undefined);
                    if (respStream.body) {
                        putOnCacheGetFromCache$ = thisLocal.manager.config.cacheHandler.putOnCache(options.action.attachRefId, respStream.body);
                        // putOnCacheGetFromCache$ = putOnCacheGetFromCache$.pipe(thisLocal.addSubscribedObsRxOpr());
                        putOnCacheGetFromCache$ = putOnCacheGetFromCache$.pipe(
                            flatMap(() => {
                                thisLocal.addTapeAction(options.action);
                                let getFromCache$ = thisLocal.manager.config.cacheHandler.getFromCache(options.action.attachRefId);
                                // getFromCache$ = getFromCache$.pipe(thisLocal.addSubscribedObsRxOpr());
                                getFromCache$ = getFromCache$.pipe(
                                    tap((stream) => {
                                        // oldSet.call(this, stream);
                                        resultObservableValue.newValue = stream as any as T;
                                    })
                                );
                                return getFromCache$;
                            }),
                            map((stream) => {
                                resultObservableValue.newValue = stream as any as T;
                                return resultObservableValue;
                            })
                        );
                        return putOnCacheGetFromCache$;
                    } else {
                        if (options.value) {
                            throw new Error('The property \'' + options.propertyKey.toString() + ' of \'' + this.constructor + '\'. '+(typeof Blob === 'undefined'? 'NodeJS.ReadableStream': 'Blob')+' is null but value is not null. value: ' + options.value.constructor);
                        }
                        options.action.simpleSettedValue = null;
                        options.action.attachRefId = null;
                        thisLocal.addTapeAction(options.action);
                        return of(resultObservableValue);
                    }
                }),
                share()
            );
            return resultObservableValue$;
        } else {

            if (!RecorderForDom.isBlobOrStream(options.value)) {
                throw new Error('The property \'' + options.propertyKey.toString() +
                    ' of \'' + this.constructor + '\'. There is no "IFieldProcessor.toDirectRaw"' + 
                    ' defined and value is not a '+(typeof Blob === 'undefined'? 'NodeJS.ReadableStream': 'Blob')+'. value: ' + options.value.constructor);
            } else {
                let putOnCacheGetFromCache$ = thisLocal.manager.config.cacheHandler.putOnCache(options.action.attachRefId, options.value as any as NodeJS.ReadableStream);
                // putOnCacheGetFromCache$ = putOnCacheGetFromCache$.pipe(thisLocal.addSubscribedObsRxOpr());
                resultObservableValue.asyncAddTapeAction = true;
                resultObservableValue$ = putOnCacheGetFromCache$.pipe(
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
                                        resultObservableValue.newValue = stream as any as T;
                                    }
                                }
                            )
                        );
                        return getFromCache$; 
                    }),
                    map(() => {
                        return resultObservableValue;
                    }),
                    share()
                );
            }
        }
    }

    //2020-12-08T06:12:03.862Z: There is no reason for it to exist, that I remember
    // private pendingLazyRefSubscriptionBySign: Map<string, Observable<any>> = new Map();
    // registerLazyRefSubscriptionRxOpr<L>(signature: string):  OperatorFunction<L, L> {
    //     let thisLocal = this;

    //     //BEGIN: Used to find losted obs.subscribed()
    //     const stackSubscriberRef = {value: ''};
    //     try {
    //         throw new Error('TRACKING');
    //     } catch (error) {
    //         stackSubscriberRef.value = error.stack;
    //     }
    //     ;
    //     //END: Used to find losted obs.subscribed()
    //     const resultOpr: OperatorFunction<L, L> = (source: Observable<L>) => {
    //         const sourceRef = { value: source };
    //         //thisLocal.testObservableHasCircle(source);
    //         let result$ = source;
    //         const pendingLazyRefSubscription = thisLocal.pendingLazyRefSubscriptionBySign.get(signature);
    //         if (pendingLazyRefSubscription) {
    //             result$ = pendingLazyRefSubscription;
    //         } else {
    //             result$ = of(null).pipe(
    //                 tap(
    //                     {
    //                         next: () => {
    //                             thisLocal.pendingLazyRefSubscriptionBySign.set(signature, source);
    //                         },
    //                         error: () => {
    //                             thisLocal.pendingLazyRefSubscriptionBySign.set(signature, source);
    //                         }
    //                     }
    //                 ),
    //                 flatMap(() => {
    //                     sourceRef.value = source;
    //                     return source;
    //                 }),
    //                 tap(
    //                     {
    //                         next: () => {
    //                             thisLocal.pendingLazyRefSubscriptionBySign.delete(signature);
    //                         },
    //                         error: () => {
    //                             thisLocal.pendingLazyRefSubscriptionBySign.delete(signature);
    //                         }
    //                     }
    //                 )
    //                 // ,
    //                 // timeoutDecorateRxOpr()
    //             );
    //         }
    //         return result$;
    //     }
    //     return resultOpr;
    // }

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