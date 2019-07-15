import { LazyRef, LazyRefPrpMarker} from '../api/lazy-ref';
import { RecorderManagerDefault } from './recorder-manager-default';
import { catchError, map, flatMap, delay, finalize, mapTo } from 'rxjs/operators';
import { MergeWithCustomizer } from 'lodash';
import { throwError, Observable, of, OperatorFunction, combineLatest, concat, pipe, PartialObserver, ObservableInput } from 'rxjs';
import { RecorderContants } from './js-hb-constants';
import { SetCreator } from './js-hb-set-creator';
import { JSONHelper } from './json-helper';
import { set as lodashSet, get as lodashGet, has as lodashHas, mergeWith as lodashMergeWith, keys as lodashKeys, clone as lodashClone } from 'lodash';
import { Stream } from 'stream';
import { v1 as uuidv1} from 'uuid';
import { FieldEtc } from './field-etc';
import { flatMapJustOnceRxOpr, mapJustOnceRxOpr, combineFirstSerial } from './rxjs-util';
import { OriginalLiteralValueEntry, IRecorderSession, EntityRef, SessionState, PlayerSnapshot } from '../api/session';
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

declare type prptype = any;

/**
 * Contract
 */
export interface IRecorderSessionImplementor extends IRecorderSession {
    /** Framework internal use. */
    isOnRestoreEntireStateFromLiteral(): boolean;
    /** Framework internal use. */
    mapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R>;
    /** Framework internal use. */
    mapKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R>;
    /** Framework internal use. */
    flatMapJustOnceKeepAllFlagsRxOpr<T, R>(lazyLoadedObj: any, project: (value: T, index?: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R>;
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
    recordAtache(attach: Stream): string;
    /** Framework internal use. */
    fielEtcCacheMap: Map<Object, Map<String, FieldEtc<any, any>>>;
    /** Framework internal use. */
    logRxOpr<T>(id: string): OperatorFunction<T, T>;
    /** Framework internal use. All framework internal subscribe() is stored here.*/
    addSubscribedObsRxOpr<T>(): OperatorFunction<T, T>;
    /** Framework internal use. This Operator replace internal subscribe call.*/
    doSubriscribeWithProvidedObservableRxOpr<T>(observer?: PartialObserver<T>): OperatorFunction<T, T>;
    doSubriscribeWithProvidedObservableRxOpr<T>(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T>;
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
}

export class RecorderSessionDefault implements IRecorderSessionImplementor {
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
    private _currentRecordedAtaches: Map<String, Stream> = null;
    private _latestRecordedAtaches: Map<String, String | Stream> = null;
    private _isOnRestoreEntireStateFromLiteral = false;
    private _sessionId: string;
    private _asyncTasksWaitingArr: Set<Observable<any>> = new Set();

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

    addSubscribedObsRxOpr<T>(): OperatorFunction<T, T> {
        let thisLocal = this;
        const resultOpr: OperatorFunction<T, T> = (source: Observable<any>) => {
            const isDone = { value: false };
            const result$ = source.pipe(
                map((value) => {
                    isDone.value = true;
                    thisLocal._asyncTasksWaitingArr.delete(result$);
                    return value;
                })
            );
            if (!isDone.value) {
                thisLocal._asyncTasksWaitingArr.add(result$);
            }
            return result$;
        }
        return resultOpr;
    }

    createAsyncTasksWaiting(): Observable<void> {
        const thisLocal = this;
        let result$: Observable<void>;
        if (this._asyncTasksWaitingArr.size > 0) {
            result$ = combineLatest(Array.from(this._asyncTasksWaitingArr))
                .pipe(
                    map((value)=>{
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
                            thisLocal.consoleLike.debug('generateAsyncTasksWaiting -> map: ' + value);
                        }
                    })
                );
        } else {
            result$ = of(null);
        }

        return result$;
    }

    createSerialAsyncTasksWaiting(): Observable<void> {
        let result$: Observable<void>;

        if (this._asyncTasksWaitingArr.size > 0) {
            return combineFirstSerial(Array.from(this._asyncTasksWaitingArr))
                .pipe(this.logRxOpr('createSerialAsyncTasksWaiting'))
                .pipe(map(() => undefined));
        } else {
            result$ = of(null);
        }

        return result$;
    }

    constructor(private _jsHbManager: RecorderManager) {
        const thisLocal = this;
		if (!_jsHbManager) {
			throw new Error('_jsHbManager can not be null');
        }

        thisLocal.consoleLike = _jsHbManager.config.getConsole(RecorderLogger.RecorderSessionDefault);
		thisLocal.consoleLikeMerge = _jsHbManager.config.getConsole(RecorderLogger.RecorderSessionDefaultMergeWithCustomizerPropertyReplection);
        thisLocal.consoleLikeLogRxOpr = _jsHbManager.config.getConsole(RecorderLogger.RecorderSessionDefaultLogRxOpr);
        thisLocal.consoleLikeRestoreState = _jsHbManager.config.getConsole(RecorderLogger.RecorderSessionDefaultRestoreState);
        
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.constructor');
			thisLocal.consoleLike.debug(_jsHbManager as any as string);
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
        let createAsyncTasksWaiting$ = this.createAsyncTasksWaiting()
            .pipe(
                map(() => {
                    let jsHbSessionState: SessionState = {
                        sessionId: this._sessionId,
                        nextCreationId: thisLocal._nextCreationId,
                        latestPlaybackArrAsLiteral: [],
                        originalLiteralValueEntries: thisLocal._originalLiteralValueEntries
                    };
            
                    for (const tapeItem of thisLocal._latestTape) {
                        jsHbSessionState.latestPlaybackArrAsLiteral.push(thisLocal.getPlaybackAsLiteral(tapeItem));
                    }
                    if (thisLocal._currentTape) {
                        jsHbSessionState.currentTapeAsLiteral = thisLocal.getPlaybackAsLiteral(thisLocal._currentTape);
                    }
            
                    return jsHbSessionState;
                })
            );

        const isSynchronouslyDone = { value: false };
        createAsyncTasksWaiting$.subscribe(() =>{
            isSynchronouslyDone.value = true;
        });

        if (!isSynchronouslyDone.value) {
            return createAsyncTasksWaiting$;
        } else {
            return of(isSynchronouslyDone.value);
        }
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
            let lazyRefProcessResponseArr: Observable<any>[] = [];
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
                        throw new Error('the classe \'' + originalLiteralValueEntry.reflectFunctionMetadataTypeKey + ' is not using the decorator \'JsonPlayback.clazz\'. Entry:\n' + JSON.stringify(originalLiteralValueEntry, null, 2));
                    }
                    if (originalLiteralValueEntry.method === 'processResultEntity') {
                        lazyRefProcessResponseArr.push(thisLocal.processPlayerSnapshot(jsType, originalLiteralValueEntry.playerSnapshot));
                    } else if (originalLiteralValueEntry.method === 'processResultEntityArray') {
                        lazyRefProcessResponseArr.push(thisLocal.processPlayerSnapshotArray(jsType, originalLiteralValueEntry.playerSnapshot));
                    } else if (originalLiteralValueEntry.method === 'newEntityInstance') {
                        lazyRefProcessResponseArr.push(thisLocal.newEntityInstanceWithCreationId(jsType, originalLiteralValueEntry.ref.creationId));
                    } else {
                        throw new Error('This should not happen');
                    }
                } else if (originalLiteralValueEntry.method === 'lazyRef') {
                    originalLiteralValueEntry.ownerSignatureStr
                    if (originalLiteralValueEntry.ownerSignatureStr) {
                        if (thisLocal.consoleLikeRestoreState.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeRestoreState.debug('RecorderSessionDefault.restoreEntireStateFromLiteral: (ownerSignatureStr): ownerSignatureStr found for original literal value entry, the owner must be a hibernate component. Entry:\n' + JSON.stringify(originalLiteralValueEntry, null, 2));
                        }
                        let ownerEnt = this._objectsBySignature.get(originalLiteralValueEntry.ownerSignatureStr);
                        if (!ownerEnt) {
                            throw new Error('ownerEnt not found for signature: ' + originalLiteralValueEntry.ownerSignatureStr);                 
                        }
                        let lazyRef: LazyRefImplementor<any, any> = lodashGet(ownerEnt, originalLiteralValueEntry.ownerFieldName);
                        if (!lazyRef) {
                            throw new Error('ownerEnt has no field: ' + originalLiteralValueEntry.ownerFieldName);
                        }
                        if (!lazyRef.iAmLazyRef) {
                            throw new Error(originalLiteralValueEntry.ownerFieldName + ' is not a LazyRef for ' + ownerEnt);    
                        }
                        lazyRefProcessResponseArr.push(
                            lazyRef.processResponse({ body: originalLiteralValueEntry.playerSnapshot })
                        );
                    } else {
                        if (thisLocal.consoleLikeRestoreState.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeRestoreState.debug('RecorderSessionDefault.restoreEntireStateFromLiteral: (!ownerEnt): '+
                                'No owner entity for original literal value entry, the owner must be a\n'+
                                'hibernate component. Doing nothing, in any next literal value entry\n'+
                                'there will exist an action with type \'processResultEntity\' that will\n'+
                                'put the entity on cache. Entry:\n' +
                                JSON.stringify(originalLiteralValueEntry, null, 2));
                        }
                    }
                } else {
                    throw new Error('This should not happen');
                }
            }

            let combineLatest$: Observable<any[]>;
            if (lazyRefProcessResponseArr.length > 0) {
                combineLatest$ = combineLatest(lazyRefProcessResponseArr);
            } else {
                combineLatest$ = of([]);
            }
            
            const isPipedCallbackDone = { value: false, result: null as Observable<void>};
            return combineLatest$.pipe(
                flatMap( () => {
                    if (!isPipedCallbackDone.value) {
                        isPipedCallbackDone.value = true;
                        isPipedCallbackDone.result = thisLocal.rerunByPlaybacksIgnoreCreateInstance();
                    }
                    return isPipedCallbackDone.result;
                })
             );
        });

        const isSynchronouslyDone = { value: false };
        restoreEntireStateCallbackTemplate$.subscribe(() =>{
            isSynchronouslyDone.value = true;
        });

        if (!isSynchronouslyDone.value) {
            return restoreEntireStateCallbackTemplate$;
        } else {
            return of(null);
        }
        
    }

    public isOnRestoreEntireStateFromLiteral(): boolean {
        return this._isOnRestoreEntireStateFromLiteral;
    }

    private lazyLoadTemplateCallback<T>(lazyLoadedObj: any, originalCb: () => T|void): T|void {
        try {
            lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, true);
            return originalCb();
        } finally {
            lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, false);
        }
    }

    private createKeepAllFlagsTemplateCallback<T>(lazyLoadedObj: any): (originalCb: () => T|void) => T|void {
        const thisLocal = this;
        const syncIsOn = lodashGet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        return (originalCb: () => T) => {
            const asyncIsOn = lodashGet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME);
            const asyncIsOn2 = thisLocal._isOnRestoreEntireStateFromLiteral;
            lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
            thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;
            try {
                return originalCb();
            } finally {
                lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
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
        const syncIsOn = lodashGet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        const isPipedCallbackDone = { value: false, result: null as R};
        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;

                    const asyncIsOn = lodashGet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME);
                    const asyncIsOn2 = thisLocal._isOnRestoreEntireStateFromLiteral;
                    if (!turnOnMode || turnOnMode.lazyLoad === 'none') {
                        lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
                    } else {
                        lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, turnOnMode.lazyLoad);
                    }
                    if (!turnOnMode || turnOnMode.restoreStare === 'none') {
                        thisLocal._isOnRestoreEntireStateFromLiteral = syncIsOn2;
                    } else {
                        thisLocal._isOnRestoreEntireStateFromLiteral = turnOnMode.restoreStare as boolean;
                    }
                    try {
                        isPipedCallbackDone.result = project(value, index);
                    } finally {
                        lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
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
        const syncIsOn = lodashGet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME);
        const syncIsOn2 = this._isOnRestoreEntireStateFromLiteral;
        const isPipedCallbackDone = { value: false, result: null as ObservableInput<R>};
        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number) => {
                if (!isPipedCallbackDone.value || when === 'eachPipe') {
                    isPipedCallbackDone.value = true;

                    const asyncIsOn = lodashGet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME);
                    const asyncIsOn2 = thisLocal._isOnRestoreEntireStateFromLiteral;
                    if (!turnOnMode || turnOnMode.lazyLoad === 'none') {
                        lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, syncIsOn);
                    } else {
                        lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, turnOnMode.lazyLoad);
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
                        lodashSet(lazyLoadedObj, RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME, asyncIsOn);
                        thisLocal._isOnRestoreEntireStateFromLiteral = asyncIsOn2;
                    }
                }
                return isPipedCallbackDone.result;
            }
            return source
                .pipe(
                    flatMap(projectExtentend, concurrent)
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
            throw new Error('This should not happen. Action: ' + JSON.stringify(action));
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
                let newErr: any = new Error('This should not happen. action. Action ' + JSON.stringify(action));
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
        } else if (fieldEtc.lazyRefGenericParam === LazyRefPrpMarker){
            if(action.simpleSettedValue) {
                if(fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    resolvedSettedValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(
                        action.simpleSettedValue,
                        fieldEtc.fieldInfo);
                }
            } else if (action.attachRefId) {
                if (fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                    resolvedSettedValue$ = thisLocal.jsHbManager.config.cacheHandler.getFromCache(action.attachRefId)
                        .pipe(
                            flatMapJustOnceRxOpr((stream) => {
                                return fieldEtc.fieldProcessorCaller.callFromDirectRaw(stream, fieldEtc.fieldInfo);
                            })
                        );
                } else {
                    resolvedSettedValue$ = thisLocal.jsHbManager.config.cacheHandler.getFromCache(action.attachRefId) as any as Observable<P>;
                }
            } else {
                throw new Error('Invalid action. LazyRefPrp invalid values: ' + JSON.stringify(action));                
            }
        } else if (action.settedSignatureStr) {
            resolvedSettedValue$ = of(thisLocal._objectsBySignature.get(action.settedSignatureStr) as P);
        } else if (action.fieldName) {
            resolvedSettedValue$ = of(action.simpleSettedValue as P);
        }
        
        const isSynchronouslyDone = { value: false, result: null as P};
        resolvedSettedValue$.subscribe((resolvedSettedValue)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = resolvedSettedValue;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return resolvedSettedValue$;
        }
    }
    /**
     * Based on '[JsHbReplayable.java].replay()'
     */
    private rerunByPlaybacksIgnoreCreateInstance(): Observable<void> {
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
                        thisLocal.jsHbManager.config);
                    let resolvedSettedValue$: Observable<any> = thisLocal.actionResolveSettedValue(action, fieldEtc);

                    resolvedSettedValue$.subscribe((resolvedSettedValue) => {
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
                                        throw new Error('Invalid action. Collection was not loaded on current state: ' + JSON.stringify(action));
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
                                        throw new Error('Invalid action. Collection was not loaded on current state: ' + JSON.stringify(action));
                                    }
                                    break;
                                case TapeActionType.SetField:
                                    if (resolvedOwnerValue[resolvedFieldName] && (resolvedOwnerValue[resolvedFieldName] as LazyRef<any, any>).iAmLazyRef) {
                                        let setLazyObjNoNext$ = (resolvedOwnerValue[resolvedFieldName] as LazyRefImplementor<any, any>).setLazyObjNoNext(resolvedSettedValue);
                                        setLazyObjNoNext$ = setLazyObjNoNext$.pipe(thisLocal.addSubscribedObsRxOpr());
                                        setLazyObjNoNext$.subscribe(() => {});
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
                    });
                }
            }
        }

        let createAsyncTasksWaiting$ = this.createSerialAsyncTasksWaiting();
        const isSynchronouslyDone = { value: false };
        createAsyncTasksWaiting$.subscribe(() =>{
            isSynchronouslyDone.value = true;
        });

        if (!isSynchronouslyDone.value) {
            return createAsyncTasksWaiting$;
        } else {
            return of(null);
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
                }) :
                {
                    refererObjMd: PlayerMetadatas,
                    objectMd: PlayerMetadatas,
                    playerObjectIdMd: PlayerMetadatas,
                    refererObjMdFound: boolean,
                    objectMdFound: boolean,
                    playerObjectIdMdFound: boolean
                } {
        let valueOrliteral = options.object || options.literalObject || {};
        let refererObjectOrLiteral = options.refererObject || options.refererLiteralObject || {};
        
        let refererObjMd: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let objectMd: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let playerObjectIdMd: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let refererObjMdFound: boolean = false;
        let objectMdFound: boolean = false;
        let playerObjectIdMdFound: boolean = false;

        if (lodashHas(valueOrliteral, this.jsHbManager.config.jsHbMetadatasName)) {
            objectMdFound =true;
            objectMd = lodashGet(valueOrliteral, this.jsHbManager.config.jsHbMetadatasName);
        }
        if (lodashHas(refererObjectOrLiteral, this.jsHbManager.config.jsHbMetadatasName)) {
            refererObjMdFound = true;
            refererObjMd = lodashGet(refererObjectOrLiteral, this.jsHbManager.config.jsHbMetadatasName);
        }
        //we are processing the metadata
        if (options.key === this.jsHbManager.config.jsHbMetadatasName 
                && (valueOrliteral as PlayerMetadatas).$iAmPlayerMetadatas$
                && lodashHas((valueOrliteral as PlayerMetadatas).$playerObjectId$, this.jsHbManager.config.jsHbMetadatasName)) {
            if (lodashHas((valueOrliteral as PlayerMetadatas).$playerObjectId$, this.jsHbManager.config.jsHbMetadatasName)) {
                playerObjectIdMdFound = true;
                playerObjectIdMd = lodashGet((valueOrliteral as PlayerMetadatas).$playerObjectId$, this.jsHbManager.config.jsHbMetadatasName);
            }
        }

        if (options.refMap) {
            if (refererObjMd.$id$ && refererObjMd.$isLazyUninitialized$ && !options.refMap.has(refererObjMd.$id$)) {
                options.refMap.set(refererObjMd.$id$, refererObjMd);
            } else if (refererObjMd.$idRef$
                    && (options.refMap.get(refererObjMd.$idRef$) as PlayerMetadatas).$iAmPlayerMetadatas$) {
                refererObjMd = options.refMap.get(refererObjMd.$idRef$);
            }

            if (objectMd.$id$ && objectMd.$isLazyUninitialized$ && !options.refMap.has(objectMd.$id$)) {
                options.refMap.set(objectMd.$id$, objectMd);
            } else if (objectMd.$idRef$
                    && (options.refMap.get(objectMd.$idRef$) as PlayerMetadatas).$iAmPlayerMetadatas$) {
                objectMd = options.refMap.get(objectMd.$idRef$);
            }

            if (playerObjectIdMd.$id$ && playerObjectIdMd.$isLazyUninitialized$ && !options.refMap.has(playerObjectIdMd.$id$)) {
                options.refMap.set(playerObjectIdMd.$id$, playerObjectIdMd);
            } else if (playerObjectIdMd.$idRef$
                    && (options.refMap.get(playerObjectIdMd.$idRef$) as PlayerMetadatas).$iAmPlayerMetadatas$) {
                playerObjectIdMd = options.refMap.get(playerObjectIdMd.$idRef$);
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

    public createLiteralRefForEntity<T>(realEntity: T): any {
        if (!realEntity) {
            throw new Error('realEntity can not be null');
        }
        let allMD = this.resolveMetadatas({ object: realEntity });
        let jsHbEntityRefReturn: EntityRef;
        let bMd: PlayerMetadatas = allMD.objectMd;

        if (bMd.$signature$) {
            jsHbEntityRefReturn = {
                signatureStr: bMd.$signature$,
                iAmAnEntityRef: true
            }
        } else if (lodashHas(realEntity, this.jsHbManager.config.jsHbCreationIdName)) {
            jsHbEntityRefReturn = {
                creationId: lodashGet(realEntity, this.jsHbManager.config.jsHbCreationIdName),
                iAmAnEntityRef: true
            }
        } else {
            throw new Error('Invalid operation. Not managed entity. Entity: \'' + realEntity.constructor + '\'');
        }
        return jsHbEntityRefReturn;
    }

    public getEntityInstanceFromLiteralRef<T>(literalRef: any): T {
        let jsHbEntityRef: EntityRef = literalRef;
        if (jsHbEntityRef.iAmAnEntityRef && jsHbEntityRef.signatureStr) {
            return this._objectsBySignature.get(jsHbEntityRef.signatureStr);
        } else if (jsHbEntityRef.iAmAnEntityRef && jsHbEntityRef.creationId) {
            return this._objectsByCreationId.get(jsHbEntityRef.creationId);
        } else {
            throw new Error('Invalid operation. Not managed entity. literalRef: \'' + literalRef + '\'');
        }
    }

    /**
     * Getter jsHbManager
     * @return {RecorderManager}
     */
    public get jsHbManager(): RecorderManager {
        return this._jsHbManager;
    }

    /**
     * Setter jsHbManager
     * @param {RecorderManager} value
     */
    public set jsHbManager(value: RecorderManager) {
        const thisLocal = this;
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.jsHbManager set');
			thisLocal.consoleLike.debug(value as any as string);
            thisLocal.consoleLike.groupEnd();
		}
        this._jsHbManager = value;
    }

    public processPlayerSnapshot<L>(entityType: TypeLike<L>, playerSnapshot: PlayerSnapshot): Observable<L> {
        const thisLocal = this;
        let result$: Observable<L>;

        if (!playerSnapshot.wrappedSnapshot) {
            throw new Error('playerSnapshot.result existe' + JSON.stringify(playerSnapshot));
        }
        let clazzOptions: RecorderDecorators.clazzOptions = Reflect.getMetadata(RecorderContants.JSPB_REFLECT_METADATA_JAVA_CLASS, entityType);
        if (!clazzOptions) {
            throw new Error('the classe \'' + entityType + ' is not using the decorator \'JsonPlayback.clazz\'');
        }

        let allMD = this.resolveMetadatas({literalObject: playerSnapshot.wrappedSnapshot});
        let bMd = allMD.objectMd;

        if (!this.isOnRestoreEntireStateFromLiteral()) {
            if (!bMd.$isComponent$) {
                this.storeOriginalLiteralEntry(
                    {
                        method: 'processResultEntity',
                        reflectFunctionMetadataTypeKey: RecorderDecoratorsInternal.mountContructorByJavaClassMetadataKey(clazzOptions, entityType),
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
        result$ = this.processResultEntityPriv(entityType, playerSnapshot.wrappedSnapshot, refMap);
        result$.pipe(
            map((resultL) => {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntity<L>() => result$.pipe(). resultL:');
                    thisLocal.consoleLike.debug(resultL);
                    thisLocal.consoleLike.groupEnd();
                }
                return resultL;
            })
        );

        const isSynchronouslyDone = { value: false, result: null as L};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    public processPlayerSnapshotArray<L>(entityType: TypeLike<L>, playerSnapshot: PlayerSnapshot): Observable<Array<L>> {
        const thisLocal = this;
        if (!playerSnapshot.wrappedSnapshot) {
            throw new Error('playerSnapshot.result existe' + JSON.stringify(playerSnapshot));
        }
        let clazzOptions: RecorderDecorators.clazzOptions = Reflect.getMetadata(RecorderContants.JSPB_REFLECT_METADATA_JAVA_CLASS, entityType);
        if (!clazzOptions) {
            throw new Error('the classe \'' + entityType + ' is not using the decorator \'JsonPlayback.clazz\'');
        }
        if (!this.isOnRestoreEntireStateFromLiteral()) {
            this.storeOriginalLiteralEntry(
                {
                    method: 'processResultEntityArray',
                    reflectFunctionMetadataTypeKey: RecorderDecoratorsInternal.mountContructorByJavaClassMetadataKey(clazzOptions, entityType),
                    playerSnapshot: playerSnapshot
                });
        }

        let resultObsArr: Observable<L>[] = [];
        let refMap: Map<Number, any> = new Map<Number, any>();
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntityArray<L>()');
            thisLocal.consoleLike.debug(entityType); thisLocal.consoleLike.debug(playerSnapshot);
            thisLocal.consoleLike.groupEnd();
        }
        for (let index = 0; index < (playerSnapshot.wrappedSnapshot as any[]).length; index++) {
            const resultElement = (playerSnapshot.wrappedSnapshot as any[])[index];
            resultObsArr.push(this.processResultEntityPriv(entityType, resultElement, refMap));
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.group('RecorderSessionDefault.processResultEntityArray<L>(). wrappedSnapshot:');
            thisLocal.consoleLike.debug(resultObsArr);
            thisLocal.consoleLike.groupEnd();
        }
        let result$ = combineLatest(resultObsArr);

        const isSynchronouslyDone = { value: false, result: null as L[]};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    private newEntityInstanceWithCreationId<T extends object>(entityType: TypeLike<T>, creationId: number): Observable<T> {
        const thisLocal = this;
        if (!this.isOnRestoreEntireStateFromLiteral() && !this.isRecording()){
            throw new Error('Invalid operation. It is not recording. is this Error correct?!');
        }
        this.validatingMetaFieldsExistence(entityType);
        let entityObj = new entityType();
        lodashSet(entityObj, RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME, this);
        let realKeys: string[] = Object.keys(Object.getPrototypeOf(entityObj));
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
            thisLocal.consoleLike.debug('entityType: ' + entityType.name);
        }
        for (let index = 0; index < realKeys.length; index++) {
            const keyItem = realKeys[index];
            let prpGenType: GenericNode = GenericTokenizer.resolveNode(entityObj, keyItem);
            if (!prpGenType) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.debug('GenericNode not found for property key \'' + keyItem + '\' of ' + entityType.name);
                }
            } else if (prpGenType.gType !== LazyRef) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.debug('GenericNode found but it is not a LazyRef. Property key \'' + keyItem + '\' of ' + entityType.name);
                }
            } else {
                let lazyRefGenericParam: TypeLike<any> = null;
                if (prpGenType.gParams.length > 0) {
                    if (prpGenType.gParams[0] instanceof GenericNode) {
                        lazyRefGenericParam = (prpGenType.gParams[0] as GenericNode).gType;
                    } else {
                        lazyRefGenericParam = (prpGenType.gParams[0] as TypeLike<any>);
                    }

                    if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLike.debug('GenericNode found and it is a LazyRef, lazyRefGenericParam: ' + lazyRefGenericParam.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                    }

                    let allMD = this.resolveMetadatas({refererObject: entityObj, key: keyItem});
                    if (this.isCollection(lazyRefGenericParam)) {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('GenericNode found, it is a LazyRef, and it is a Collection, lazyRefGenericParam: ' + lazyRefGenericParam.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRefSet: LazyRefDefault<any, any> = new LazyRefDefault<any, any>(thisLocal);
                        let setLazyObjOnLazyLoading$ = lazyRefSet.setLazyObjOnLazyLoading(this.createCollection(lazyRefGenericParam, entityObj, keyItem));
                        setLazyObjOnLazyLoading$.subscribe(
                            {
                                next: () => {}
                            }
                        );

                        lazyRefSet.instanceId = this.nextMultiPurposeInstanceId();

                        lazyRefSet.refererObj = entityObj;
                        lazyRefSet.refererKey = keyItem;
                        lazyRefSet.session = this;
                        lazyRefSet.bMdLazyLoadedObj = allMD.objectMd;
                        lazyRefSet.bMdRefererObj = allMD.refererObjMd;
                        lazyRefSet.bMdPlayerObjectIdMetadata = allMD.playerObjectIdMd;
                        lodashSet(entityObj, keyItem, lazyRefSet);
                    } else {
                        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLike.debug('GenericNode found, it is a LazyRef, and it is not a Collection, lazyRefGenericParam: ' + lazyRefGenericParam.name + ' . Property key \'' + keyItem + '\' of ' + entityType.name);
                        }
                        let lazyRef: LazyRefDefault<any, any> = new LazyRefDefault<any, any>(thisLocal);
                        lazyRef.instanceId = this.nextMultiPurposeInstanceId();
                        lazyRef.refererObj = entityObj;
                        lazyRef.refererKey = keyItem;
                        lazyRef.session = this;
                        lazyRef.bMdLazyLoadedObj = allMD.objectMd;
                        lazyRef.bMdRefererObj = allMD.refererObjMd;
                        lazyRef.bMdPlayerObjectIdMetadata = allMD.playerObjectIdMd;
                        lodashSet(entityObj, keyItem, lazyRef);
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
        let clazzOptions: RecorderDecorators.clazzOptions = Reflect.getMetadata(RecorderContants.JSPB_REFLECT_METADATA_JAVA_CLASS, entityType);
        if (!clazzOptions) {
            throw new Error('the classe \'' + entityType + ' is not using the decorator \'JsonPlayback.clazz\'');
        }
        if (!this.isOnRestoreEntireStateFromLiteral()) {    
            this.storeOriginalLiteralEntry(
                {
                    method: 'newEntityInstance',
                    reflectFunctionMetadataTypeKey: RecorderDecoratorsInternal.mountContructorByJavaClassMetadataKey(clazzOptions, entityType),
                    ref: {
                        creationId: creationId,
                        iAmAnEntityRef: true
                    }
                });
        }
        
        lodashSet(entityObj, this.jsHbManager.config.jsHbCreationIdName, creationId);
        lodashSet(entityObj, RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME, this);

        if (!this.isOnRestoreEntireStateFromLiteral()) {
            //recording tape
            let action: TapeAction = new TapeActionDefault();
            action.fieldName = null;
            action.actionType = TapeActionType.Create;
            
            let clazzOptions: RecorderDecorators.clazzOptions = Reflect.getMetadata(RecorderContants.JSPB_REFLECT_METADATA_JAVA_CLASS, entityType);
            if (!clazzOptions) {
                throw new Error('the classe \'' + entityType + ' is not using the decorator \'JsonPlayback.clazz\'');
            }
            action.ownerPlayerType = clazzOptions.javaClass;
            action.ownerCreationId = this._nextCreationId;
            this.addTapeAction(action);
        }

        let result$ = this.createAsyncTasksWaiting()
            .pipe(
                map(() => {
                    return entityObj;
                })
            );

        const isSynchronouslyDone = { value: false, result: null as T};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
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
                })
            );

        const isSynchronouslyDone = { value: false, result: null as T};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
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
        let session: IRecorderSession = lodashGet(entity, RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME) as IRecorderSession;
        if (!session) {
            throw new Error('Invalid operation. \'' + entity.constructor.name + '\' not managed. \'' + RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME + '\' estah null');
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
        } else if (lodashHas(entity, this.jsHbManager.config.jsHbCreationIdName)) {
            action.ownerCreationRefId = lodashGet(entity, this.jsHbManager.config.jsHbCreationIdName) as number;
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
        let session: IRecorderSession = lodashGet(entity, RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME) as IRecorderSession;
        if (!session) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' not managed. \'' + RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME + '\' estah null');
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
        } else if (lodashHas(entity, this.jsHbManager.config.jsHbCreationIdName)) {
            throw new Error('Invalid operation. \'' + entity.constructor + '\' has id of creation, that is, is not persisted.');
        } else {
            throw new Error('Invalid operation. Not managed entity. Entity: \'' + entity.constructor + '\'');
        }
        if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLike.debug('action: ' + action);
        }
        this.addTapeAction(action);
    }

    recordAtache(attach: Stream): string {
        let name = this.jsHbManager.config.attachPrefix + this.nextMultiPurposeInstanceId();
        this._currentRecordedAtaches.set(name, attach);
        return name;
    }

    public storeOriginalLiteralEntry(originalValueEntry: OriginalLiteralValueEntry): void {
        this._originalLiteralValueEntries.push(originalValueEntry);
    }

    public clear(): void {
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
        
        let clearCache$: Observable<void> = this.jsHbManager.config.cacheHandler.clearCache();
        clearCache$ = clearCache$.pipe(this.addSubscribedObsRxOpr());
        clearCache$.subscribe(() => {});
    }

    getLastRecordedTape(): Observable<Tape> {
        const thisLocal = this;
        let result$ = this.createAsyncTasksWaiting().pipe(map(() => {
            return thisLocal._latestTape.length > 0? thisLocal._latestTape[thisLocal._latestTape.length - 1] : null;
        }));

        const isSynchronouslyDone = { value: false, result: null as Tape};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    getLastRecordedStreams(): Observable<Map<String, Stream>> {
        const thisLocal = this;
        let result$ = this.getLastRecordedTape()
            .pipe(
                flatMapJustOnceRxOpr((tape) => {
                    const idAndStreamObsArr: Observable<{attachRefId: String, stream: Stream}>[] = [];
                    if (tape && tape.actions){
                        for (const actionItem of tape.actions) {
                            if (actionItem.attachRefId) {
                                let idAndStream$: Observable<{attachRefId: String, stream: Stream}> = 
                                    thisLocal.jsHbManager.config.cacheHandler.getFromCache(actionItem.attachRefId)
                                        .pipe(
                                            mapJustOnceRxOpr((streamValue) => {
                                                return {
                                                    attachRefId: actionItem.attachRefId,
                                                    stream: streamValue
                                                }
                                            })
                                        );
                                idAndStreamObsArr.push(idAndStream$);
                            }
                        }
                        if (idAndStreamObsArr.length > 0) {
                            return combineLatest(idAndStreamObsArr);
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
                    const resultMap: Map<String, Stream> = new Map();
                    for (const idAndStreamItem of idAndStreamArr) {
                        resultMap.set(idAndStreamItem.attachRefId, idAndStreamItem.stream);
                    }
                    return resultMap;
                })
            );

        const isSynchronouslyDone = { value: false, result: null as Map<String, Stream>};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    getLastRecordedTapeAndStreams(): Observable<{tape: Tape, streams: Map<String, Stream>}> {
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

        const isSynchronouslyDone = { value: false, result: null as {tape: Tape, streams: Map<String, Stream>}};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    getLastRecordedTapeAsLiteralAndStreams(): Observable<{tapeLiteral: any, streams: Map<String, Stream>}> {
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

        const isSynchronouslyDone = { value: false, result: null as {tapeLiteral: any, streams: Map<String, Stream>}};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
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

        const isSynchronouslyDone = { value: false, result: null as any};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    getLastRecordedAtaches(): Map<String, Stream> {
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
            action = lodashMergeWith(
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
            this.jsHbManager.config.jsHbCreationIdName,
            this.jsHbManager.config.jsHbMetadatasName,
            RecorderContants.JSPB_ENTITY_IS_ON_LAZY_LOAD_NAME,
            RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME];
        for (let index = 0; index < camposControleArr.length; index++) {
            const internalKeyItem = camposControleArr[index];
            if (Object.keys(entityType.prototype).lastIndexOf(internalKeyItem.toString()) >= 0) {
                throw new Error('The Entity ' + entityType.name + ' already has the property \'' + internalKeyItem.toString() + '\' offined!');
            }            
        }
    }

    public processWrappedSnapshotFieldArrayInternal<L>(entityType: TypeLike<L>, lazyLoadedColl: any, snapshotField: any[]): Observable<void> {
        let thisLocal = this;
        let refMap: Map<Number, any> = new Map();

        let realItemObsArr: Observable<L>[] = []
        for (const literalItem of snapshotField) {                               
            let realItem$: Observable<L> = this.processResultEntityPriv(entityType, literalItem, refMap);
            realItemObsArr.push(realItem$);
        }
        let result$: Observable<void>;
        thisLocal.lazyLoadTemplateCallback(lazyLoadedColl, () => {
            result$ = combineFirstSerial(realItemObsArr)
                .pipe(
                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(lazyLoadedColl, (realItemArr) => {
                        for (const realItem of realItemArr) {                           
                            thisLocal.addOnCollection(lazyLoadedColl, realItem);
                        }
                    })
                );
        });        

        const isSynchronouslyDone = { value: false, result: null as void};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    public processWrappedSnapshotFieldInternal<L>(entityType: TypeLike<L>, snapshotField: any): Observable<L> {
        let refMap: Map<Number, any> = new Map();
        let result$ = this.processResultEntityPriv(entityType, snapshotField, refMap);

        const isSynchronouslyDone = { value: false, result: null as L};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    private processResultEntityPriv<L>(entityType: TypeLike<L>, snapshotField: any, refMap: Map<Number, any>): Observable<L> {
        const thisLocal = this;
        if (!snapshotField) {
            throw new Error('snapshotField can not be null');
        }
        let allMD = this.resolveMetadatas({literalObject: snapshotField, })
        let bMd = allMD.objectMd;
        let entityValue: L = this._objectsBySignature.get(bMd.$signature$);

        if (!entityValue) {
            if (bMd.$idRef$) {
                entityValue = refMap.get(bMd.$idRef$);
            }
        }
        
        if (!entityValue) {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('entity was not processed yet on this session. Not found by signature: ' + bMd.$signature$);
            }
            this.validatingMetaFieldsExistence(entityType);
            entityValue = new entityType();
            lodashSet(entityValue as any, RecorderContants.JSPB_ENTITY_SESION_PROPERTY_NAME, this);
            this.removeNonUsedKeysFromLiteral(entityValue as any, snapshotField);

            if (bMd.$id$) {
                refMap.set(bMd.$id$, entityValue);
            } else {
                throw new Error('This should not happen 1');
            }

            this.lazyLoadTemplateCallback(entityValue, () => {
                this.tryCacheInstanceBySignature(
                    {
                        realInstance: entityValue, 
                        playerSnapshot: { wrappedSnapshot: snapshotField }
                    }
                );
                lodashMergeWith(entityValue as any, snapshotField, this.mergeWithCustomizerPropertyReplection(refMap));
            });
        } else {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('entity already processed on this session. Found by signature: ' + bMd.$signature$);
            }
        }

        let result$ = this.createSerialAsyncTasksWaiting().pipe(
            map(() => {
                return entityValue;
            })
        );

        const isSynchronouslyDone = { value: false, result: null as L};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    private createLoadedLazyRef<L extends object, I>(
            genericNode: GenericNode,
            literalLazyObj: any,
            refMap: Map<Number, any>,
            refererObj: any,
            refererKey: string,): Observable<LazyRef<L, I>> {
        const thisLocal = this;
        let lr: LazyRefImplementor<L, I> = this.createApropriatedLazyRef<L, I>(genericNode, literalLazyObj, refererObj, refererKey, refMap);
        
        let trySetPlayerObjectIdentifier$ = this.trySetPlayerObjectIdentifier(lr, genericNode, literalLazyObj, refMap);
        let tryGetFromObjectsBySignature$ = this.tryGetFromObjectsBySignature(lr, literalLazyObj);
        let setLazyObjOnLazyLoading$: Observable<void> = of(null);
        let lazyLoadedObj$: Observable<void> = of(null);

        const isValueByFieldProcessor: {value: boolean} = { value: false };

        if (lr.lazyLoadedObj) {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.group('LazyRef.lazyLoadedObj is already setted: ');
                thisLocal.consoleLike.debug(lr.lazyLoadedObj);
                thisLocal.consoleLike.groupEnd();
            }
        } else {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('LazyRef.lazyLoadedObj is not setted yet');
            }
            let lazyLoadedObjType: TypeLike<any> = null;
            if (genericNode.gParams[0] instanceof GenericNode) {
                lazyLoadedObjType = (<GenericNode>genericNode.gParams[0]).gType;
            } else {
                lazyLoadedObjType = <TypeLike<any>>genericNode.gParams[0];
            }
            
            if (this.isCollection(lazyLoadedObjType)) {
                if (!(genericNode.gParams[0] instanceof GenericNode) || (<GenericNode>genericNode.gParams[0]).gParams.length <=0) {
                    throw new Error('LazyRef is not correctly defined: \'' + refererKey + '\' on ' + refererObj.constructor);
                }
                let collTypeParam: TypeLike<any> =  null;
                if ((<GenericNode>genericNode.gParams[0]).gParams[0] instanceof GenericNode) {
                    collTypeParam = (<GenericNode>(<GenericNode>genericNode.gParams[0]).gParams[0]).gType;
                } else {
                    collTypeParam = <TypeLike<any>>(<GenericNode>genericNode.gParams[0]).gParams[0];
                }
                const lazyCollection = this.createCollection(lazyLoadedObjType, refererObj, refererKey);
                
                thisLocal.lazyLoadTemplateCallback(lazyCollection, ()=> {
                    setLazyObjOnLazyLoading$ = lr.setLazyObjOnLazyLoadingNoNext(lazyCollection)
                        .pipe(
                            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(lazyCollection, () => {
                                let processResultEntityPrivObsArr: Observable<L>[] = [];
                                    for (const literalItem of literalLazyObj) {
                                        let processResultEntityPriv$ = thisLocal.processResultEntityPriv(collTypeParam, literalItem, refMap)
                                        processResultEntityPrivObsArr.push(processResultEntityPriv$);
                                    }
                                    return combineFirstSerial(processResultEntityPrivObsArr)
                                        .pipe(
                                            thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(lazyCollection, (entityArr) => {
                                                for (const entityItem of entityArr) {
                                                    thisLocal.addOnCollection(lazyCollection, entityItem);                                                    
                                                }
                                                return of(null);
                                            })
                                        );
                            })
                        );
                });
            } else {
                let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.fielEtcCacheMap, refererObj, refererKey, this.jsHbManager.config);
                if (fieldEtc.prpGenType.gType === LazyRefPrpMarker) {
                    if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                        isValueByFieldProcessor.value = true;
                        let callFromLiteralValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(literalLazyObj, fieldEtc.fieldInfo);
                        callFromLiteralValue$ = callFromLiteralValue$.pipe(this.addSubscribedObsRxOpr());
                        callFromLiteralValue$.subscribe(
                            {
                                next: (value) => {
                                    lr.setLazyObjOnLazyLoading(value);
                                }
                            }
                        );
                    } else {
                        setLazyObjOnLazyLoading$ = lr.setLazyObjOnLazyLoading(literalLazyObj);
                    }
                } else {
                    setLazyObjOnLazyLoading$ = this.processResultEntityPriv(lazyLoadedObjType, literalLazyObj, refMap)
                        .pipe(
                            flatMapJustOnceRxOpr((resultEntity) => {
                                return this.processResultEntityPriv(lazyLoadedObjType, literalLazyObj, refMap);
                            })
                        );
                }

                if (!isValueByFieldProcessor.value && genericNode.gType !== LazyRefPrpMarker) {
                    setLazyObjOnLazyLoading$ = this.processResultEntityPriv(lazyLoadedObjType, literalLazyObj, refMap)
                        .pipe(
                            flatMapJustOnceRxOpr((resultEntity) => {
                                return this.processResultEntityPriv(lazyLoadedObjType, literalLazyObj, refMap);
                            })
                        );
                }
            }
        }
        let result$ = this.createSerialAsyncTasksWaiting()
            .pipe(
                flatMap(() => {
                    return trySetPlayerObjectIdentifier$;
                })
            )
            .pipe(
                flatMap(() => {
                    return tryGetFromObjectsBySignature$;
                })
            )
            .pipe(
                flatMap(() => {
                    return setLazyObjOnLazyLoading$
                })
            )
            .pipe(
                flatMap(() => {
                    return lazyLoadedObj$;
                })
            )
            .pipe(
                map(() => {
                    return lr;
                })
            );

        const isSynchronouslyDone = { value: false, result: null as LazyRef<L, I>};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    public tryCacheInstanceBySignature(
            tryOptions:
                {
                    realInstance: any,
                    playerSnapshot: PlayerSnapshot,
                    lazySignature?: string
                }): void {
        if (!tryOptions){
            throw new Error('tryOptions nao pode ser nula');
        }
        if (!tryOptions.playerSnapshot){
            throw new Error('tryOptions.playerSnapshot nao pode ser nula');
        }
        let allMD = this.resolveMetadatas({literalObject: tryOptions.playerSnapshot});
        let bMd = allMD.objectMd;
        if (bMd.$signature$) {
            this._objectsBySignature.set(bMd.$signature$, tryOptions.realInstance);
        }
        if (tryOptions.lazySignature) {
            this._objectsBySignature.set(tryOptions.lazySignature, tryOptions.realInstance);
        }
    }


    private createNotLoadedLazyRef<L extends object, I>(
            genericNode: GenericNode, 
            literalLazyObj: any,
            refMap: Map<Number, any>,
            refererObj: any,
            refererKey: string): Observable<LazyRef<L, I>> {
        const thisLocal = this;
        let propertyOptions: RecorderDecorators.PropertyOptions<L> = Reflect.getMetadata(RecorderContants.JSPB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, refererObj, refererKey);
        if (!propertyOptions){
            throw new Error('@RecorderDecorators.property() not defined for ' + refererObj.constructor.name + '.' + refererKey);
        }
        let lr: LazyRefImplementor<L, I> = this.createApropriatedLazyRef<L, I>(genericNode, literalLazyObj, refererObj, refererKey, refMap);
        let trySetPlayerObjectIdentifier$ = this.trySetPlayerObjectIdentifier(lr, genericNode, literalLazyObj, refMap);
        let tryGetFromObjectsBySignature$ = this.tryGetFromObjectsBySignature(lr, literalLazyObj);

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
                lr.respObs = this.jsHbManager.httpLazyObservableGen.generateObservable(lr.signatureStr, lazyInfo)
                    .pipe(
                        //In case of an error, this allows you to try again
                        catchError((err) => {
                            lr.respObs = this.jsHbManager.httpLazyObservableGen.generateObservable(lr.signatureStr, lazyInfo);
                            return throwError(err);
                        })
                    );
            } else {
                lr.respObs = this.jsHbManager.httpLazyObservableGen.generateObservableForDirectRaw(lr.signatureStr, lazyInfo)
                    .pipe(
                        //In case of an error, this allows you to try again
                        catchError((err) => {
                            lr.respObs = this.jsHbManager.httpLazyObservableGen.generateObservableForDirectRaw(lr.signatureStr, lazyInfo);
                            return throwError(err);
                        })
                    );
            }
        }
        let result$ = this.createSerialAsyncTasksWaiting()
            .pipe(
                flatMap(() => {
                    return trySetPlayerObjectIdentifier$;
                })
            )
            .pipe(
                flatMap(() => {
                    return tryGetFromObjectsBySignature$;
                })
            )
            .pipe(
                map(() => {
                    return lr;
                })
            );

        const isSynchronouslyDone = { value: false, result: null as LazyRef<L, I>};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    private tryGetFromObjectsBySignature<L extends object, I>(lr: LazyRefImplementor<L, I>, literalLazyObj: any): Observable<void> {
        if (!literalLazyObj){
            throw new Error('literalLazyObj nao pode ser nula');
        }
        let allMD = this.resolveMetadatas({literalObject: literalLazyObj});
        let bMd = allMD.objectMd;

        let entityValue: any = null;
        if (bMd.$signature$) {
            lr.signatureStr = bMd.$signature$;
            entityValue = this._objectsBySignature.get(bMd.$signature$);
        } else {
        }

        let result$: Observable<void>;
        if (entityValue) {
            result$ = lr.setLazyObjOnLazyLoading(entityValue);
        } else {
            result$ = of(null);
        }

        const isSynchronouslyDone = { value: false, result: null as void};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(isSynchronouslyDone.result);
        } else {
            return result$;
        }
    }

    createApropriatedLazyRef<L extends object, I>(genericNode: GenericNode, literalLazyObj: any, refererObj: any, refererKey: string, refMap?: Map<Number, any>): LazyRefImplementor<L, I> {
        if (!literalLazyObj){
            throw new Error('literalLazyObj nao pode ser nula');
        }
        let allMD = this.resolveMetadatas({literalObject: literalLazyObj, refererObject: refererObj, key: refererKey, refMap: refMap});
        let bMd = allMD.objectMd;

        let jsHbPlayerObjectIdLiteral: any = bMd.$playerObjectId$;
        let lazyRef: LazyRefDefault<L, any> = null;
        if (jsHbPlayerObjectIdLiteral) {
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
        lazyRef.bMdPlayerObjectIdMetadata = allMD.refererObjMd;
        return lazyRef;
    }

    private metadaKeys: Set<string>;
    private isLiteralObjMetadataKey(keyName: string): boolean {
        if (this.metadaKeys == null) {
            this.metadaKeys = new Set<string>()
                .add(this.jsHbManager.config.jsHbMetadatasName);
                
        }
        return this.metadaKeys.has(keyName);
    }

    private removeNonUsedKeysFromLiteral<L extends object>(realObj: L, literalObj: any) {
        let literalKeys: string[] = lodashClone(lodashKeys(literalObj));
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
        let result$: Observable<void> = of(null);
        if (!literalLazyObj){
            throw new Error('literalLazyObj nao pode ser nula');
        }
        let allMD = this.resolveMetadatas({literalObject: literalLazyObj});
        let bMd = allMD.objectMd;

        let jsHbPlayerObjectIdLiteral: any = bMd.$playerObjectId$;
        if (jsHbPlayerObjectIdLiteral instanceof Object && !(jsHbPlayerObjectIdLiteral instanceof Date)) {
            let hbIdType: TypeLike<any> = null;
            if (genericNode.gParams[1] instanceof GenericNode) {
                hbIdType = (<GenericNode>genericNode.gParams[1]).gType;
            } else {
                hbIdType = <TypeLike<any>>genericNode.gParams[1];
            }
            if (hbIdType) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.debug('There is a hbIdType on LazyRef. Is it many-to-one LazyRef?!. hbIdType: ' + hbIdType.name + ', genericNode:'+genericNode);
                }
                this.validatingMetaFieldsExistence(hbIdType);
                result$ = this.processResultEntityPriv(hbIdType, jsHbPlayerObjectIdLiteral, refMap)
                    .pipe(
                        map((hbId) => {
                            lr.hbId = hbId;
                        })
                    );
            } else {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.debug('Thre is no hbIdType on LazyRef. Is it a collection?!. hbIdType: ' + hbIdType.name + ', genericNode:'+genericNode);
                }
            }
        } else if (jsHbPlayerObjectIdLiteral) {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('The hibernate id is a simple type value: ' + jsHbPlayerObjectIdLiteral + '. genericNode:'+ genericNode);
            }
            lr.hbId = jsHbPlayerObjectIdLiteral;
        } else {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('The hibernate id is null! Is it a collection?!: ' + jsHbPlayerObjectIdLiteral + '. genericNode:'+ genericNode);
            }
        }

        const isSynchronouslyDone = { value: false, result: null as void};
        result$.subscribe((result)=>{
            isSynchronouslyDone.value = true;
            isSynchronouslyDone.result = result;
        });

        if (isSynchronouslyDone.value) {
            return of(null);
        } else {
            return result$;
        }
    }

    /**
     * Returns an Observable with subscribe called.
     * @param observer 
     */
    doSubriscribeWithProvidedObservableRxOpr<T>(observer?: PartialObserver<T>): OperatorFunction<T, T>;
    doSubriscribeWithProvidedObservableRxOpr<T>(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T>;
    doSubriscribeWithProvidedObservableRxOpr<T>(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T> {
        return this.doSubriscribeObservableRxOpr('provided', observerOrNext, error, complete);
    }

    doSubriscribeWithInternalObservableRxOpr<T>(observer?: PartialObserver<T>): OperatorFunction<T, T>;
    doSubriscribeWithInternalObservableRxOpr<T>(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T>;
    doSubriscribeWithInternalObservableRxOpr<T>(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T> {
        return this.doSubriscribeObservableRxOpr('internal', observerOrNext, error, complete);
    }

    private doSubriscribeObservableRxOpr<T>(observableFrom: 'internal' | 'provided', observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): OperatorFunction<T, T> {
        let thisLocal = this;
        const resultOpr: OperatorFunction<T, T> = (source: Observable<any>) => {
            if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLike.debug('doSubriscribeWithProvidedObservableRxOpr(). source Observable jsHbTraceId: ' + (source as any).jsHbTraceId);
            }

            let observerOriginal: PartialObserver<T>;
            if ((observerOrNext as PartialObserver<T>).next
                || (observerOrNext as PartialObserver<T>).complete
                || (observerOrNext as PartialObserver<T>).error
                || (observerOrNext as PartialObserver<T>).next) {
                if (error || complete) {
                    throw new Error('observerOrNext is a PartialObserver and error or complete are passed as parameter');
                }
                observerOriginal = observerOrNext as PartialObserver<T>;
            } else {
                observerOriginal = {
                    next: observerOrNext as (value: T) => void,
                    error: error,
                    complete: complete
                }
            }

            let result$;
            if (observableFrom === 'provided') {
                result$ = source.pipe(this.addSubscribedObsRxOpr());
            } else {
                result$ = source;
            }

            const isSynchronouslyDone = { value: false, result: null as T};
            let observerNew: PartialObserver<T> = {...observerOriginal};
            observerNew.next = (value) => {
                isSynchronouslyDone.value = true;
                isSynchronouslyDone.result = value;

                if (!observerNew.closed) {
                    observerNew.closed;
                    if (observerOriginal.next) {
                        observerOriginal.next(value);
                    }
                }
            }
    
            result$.subscribe(observerNew);

            if (isSynchronouslyDone.value) {
                return of(isSynchronouslyDone.result);
            } else {
                return result$;
            }
        };

        return resultOpr;
    }

    public createCollection(collType: TypeLike<any>, refererObj: any, refererKey: string): any {
        if (collType === Set) {
            return new SetCreator(this, refererObj, refererKey).createByProxy();
        } else {
            throw new Error('Collection not supported: ' + collType);
        }
    }

    public isCollection(typeTested: TypeLike<any>): any {
        return (typeTested === Array)
                || (typeTested === Set);
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
            refMap: Map<Number, any>,
            ): MergeWithCustomizer {
        let thisLocal = this;
        return function (value: any, srcValue: any, key?: string, object?: Object, source?: Object) {
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
            let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc(thisLocal.fielEtcCacheMap, object, key, thisLocal.jsHbManager.config);
            if (mdPlayerObjectId.$isComponent$) {
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function: bMdPlayerObjectId.isComponent. bMdSrcValue.$playerObjectId$:');
                    thisLocal.consoleLikeMerge.debug(mdSrcValue.$playerObjectId$);
                    thisLocal.consoleLikeMerge.groupEnd();
                }
                fieldEtc.prpType = Reflect.getMetadata(RecorderContants.JSPB_REFLECT_METADATA_HIBERNATE_ID_TYPE, object);
                if (!fieldEtc.prpType) {
                    throw new Error('We are receiving mdSrcValue.$playerObjectId$ as Object and mdPlayerObjectId.$isComponent$, ' + object.constructor.name + ' does not define a property with @JsonPlayback.playerObjectId()');
                }
            }
            if (mdSrcValue.$isAssociative$ && fieldEtc.prpGenType && fieldEtc.prpGenType.gType !== LazyRef) {
                throw new Error('Key '+ object.constructor.name + '.' + key + ' is hibernate associative relation and is not LazyRef or not define GenericTokenizer');
            }
            if (mdSrcValue.$isComponent$ && fieldEtc.prpGenType && fieldEtc.prpGenType.gType === LazyRef) {
                throw new Error('Key '+ object.constructor.name + '.' + key + ' is hibernate component and is a LazyRef.');
            }
            const correctSrcValueRef = { value: srcValue };
            if (key === thisLocal.jsHbManager.config.jsHbMetadatasName) {
                correctSrcValueRef.value = mdSource;
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function: (key === thisLocal.jsHbManager.config.jsHbMetadatasName). srcValue and mdSource:');
                    thisLocal.consoleLikeMerge.debug(srcValue);
                    thisLocal.consoleLikeMerge.debug(mdSource);
                    thisLocal.consoleLikeMerge.groupEnd();
                }
                let correctSrcValueAsMetadata: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
                Object.assign(correctSrcValueAsMetadata, mdSource);
                if (mdPlayerObjectId.$isComponent$) {
                    correctSrcValueRef.value = new UndefinedForMergeAsync();
                    let processResultEntityPrivHbId$ = thisLocal.processResultEntityPriv(fieldEtc.prpType, correctSrcValueAsMetadata.$playerObjectId$, refMap)
                        .pipe(
                            thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (hbIdValue) => {
                                correctSrcValueAsMetadata.$playerObjectId$ = hbIdValue;
                                correctSrcValueRef.value = correctSrcValueAsMetadata;
                                lodashSet(object, key, correctSrcValueRef.value);
                                return hbIdValue;
                            })
                        );
                    processResultEntityPrivHbId$.subscribe((hbIdValue) => {
                        // nothing
                    });
                } 
            } else if (mdSrcValue.$idRef$) {
                correctSrcValueRef.value = new UndefinedForMergeAsync();
                let createSerialAsyncTasksWaiting$ = thisLocal.createSerialAsyncTasksWaiting()
                    .pipe(
                        thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, () => {
                            correctSrcValueRef.value = refMap.get(mdSrcValue.$idRef$);
                            if (!correctSrcValueRef.value) {
                                throw new Error('This should not happen 2');
                            }
                            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeMerge.group('(Async) mergeWithCustomizerPropertyReplection => function =>'+
                                    ' createSerialAsyncTasksWaiting().pipe() => this.mapJustOnceKeepAllFlagsRxOpr().'+
                                    ' Object resolved by mdSrcValue.$idRef$ field');
                                thisLocal.consoleLikeMerge.debug(correctSrcValueRef.value);
                                thisLocal.consoleLikeMerge.groupEnd();
                            }
                            lodashSet(object, key, correctSrcValueRef.value);
                        })
                    );
                createSerialAsyncTasksWaiting$.subscribe(() => {
                    //nothing
                })
            } else if (fieldEtc.prpType) {
                const isFromLiteralValue = {value: false};
                if (fieldEtc.prpGenType) {
                    if (thisLocal.isCollection(fieldEtc.prpGenType.gType)) {
                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function.'+
                                ' thisLocal.isCollection(prpGenType.gType) ');
                            thisLocal.consoleLikeMerge.debug(fieldEtc.prpGenType); thisLocal.consoleLikeMerge.debug(fieldEtc.prpGenType.gType);
                            thisLocal.consoleLikeMerge.groupEnd();
                        }
                        correctSrcValueRef.value = new UndefinedForMergeAsync();
                        let correctSrcValueColl = thisLocal.createCollection(fieldEtc.prpGenType.gType, object, key);
                        
                        let processResultEntityPrivObsArr: Observable<any>[] = [];
                        thisLocal.lazyLoadTemplateCallback(correctSrcValueColl, () => {
                            for (let index = 0; index < srcValue.length; index++) { 
                                let arrItemType: TypeLike<any> = <TypeLike<any>>fieldEtc.prpGenType.gParams[0];
                                let processResultEntityPriv$ = thisLocal.processResultEntityPriv(arrItemType, srcValue[index], refMap);
                                processResultEntityPrivObsArr.push(processResultEntityPriv$);

                                combineFirstSerial(processResultEntityPrivObsArr)
                                    .pipe(
                                        thisLocal.flatMapJustOnceKeepAllFlagsRxOpr(correctSrcValueColl, (entityArr) => {
                                            for (const entityItem of entityArr) {
                                                thisLocal.addOnCollection(correctSrcValueColl, entityItem);                                                    
                                            }
                                            return of(null);
                                        })
                                    ).subscribe(() => {
                                        correctSrcValueRef.value = correctSrcValueColl;
                                    });
                            }
                        });
                        //nothing for now
                    } else if (fieldEtc.prpGenType.gType === LazyRef || fieldEtc.prpGenType.gType === LazyRefPrpMarker) {
                        if (!mdSource.$id$) {
                            throw new Error('There is no mdSource.$id$ on ' + JSON.stringify(srcValue));
                        }
                        if (mdSrcValueFound && !mdSrcValue.$isAssociative$ && !mdSrcValue.$isLazyProperty$) {
                            throw new Error('Receiving object that is non associative an no lazy property but field is a LazyRef type. field: ' + object.constructor.name + '.' + key + '. Value' + + JSON.stringify(srcValue));
                        }
                        if (mdSrcValue.$isLazyUninitialized$) {
                            correctSrcValueRef.value = new UndefinedForMergeAsync();
                            let createNotLoadedLazyRef$ = thisLocal.createNotLoadedLazyRef(fieldEtc.prpGenType, srcValue, refMap, object, key)
                                .pipe(
                                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (lazyRef) => {
                                        if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                            thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                                                ' function => createNotLoadedLazyRef$.subscribe().'+
                                                ' createNotLoadedLazyRef, for property \''+key+'\'. lodashSet(object, key, lazyRef)');
                                            thisLocal.consoleLikeMerge.debug(object);
                                            thisLocal.consoleLikeMerge.groupEnd();
                                        }
                                        correctSrcValueRef.value = lazyRef;
                                        lodashSet(object, key, correctSrcValueRef.value);
                                        return lazyRef;
                                    })
                                );
                            createNotLoadedLazyRef$.subscribe((lazyRef) => {
                                //nothing
                            });
                            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function.'+
                                    ' Returning null because of createNotLoadedLazyRef$.subscribe().'+
                                    ' property \''+key+'\'.');
                                thisLocal.consoleLikeMerge.debug(object);
                                thisLocal.consoleLikeMerge.groupEnd();
                            }
                        } else {
                            correctSrcValueRef.value = new UndefinedForMergeAsync();
                            let createNotLoadedLazyRef$ = thisLocal.createLoadedLazyRef(fieldEtc.prpGenType, srcValue, refMap, object, key)
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
                                        correctSrcValueRef.value = lazyRef;
                                        keepAllFlagsTemplateCallback(() => {
                                            lodashSet(object, key, correctSrcValueRef.value);
                                        });
                                        return lazyRef;
                                    })
                                );
                            createNotLoadedLazyRef$.subscribe((lazyRef) => {
                                //nothing
                            });
                        }
                    }
                } else if (srcValue instanceof Object
                        && !(srcValue instanceof Date)
                        && !fieldEtc.propertyOptions.lazyDirectRawRead) {
                    correctSrcValueRef.value = new UndefinedForMergeAsync();
                    let processResultEntityPriv$ = thisLocal.processResultEntityPriv(fieldEtc.prpType, srcValue, refMap)
                        .pipe(
                            thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (correctSrcValueSubs) => {
                                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                                    ' function => processResultEntityPriv$.pipe() => thisLocal.mapJustOnceKeepAllFlagsRxOpr().'+
                                    ' createLoadedLazyRef, for property \''+key+'\'. lodashSet(object, key, correctSrcValue)');
                                    thisLocal.consoleLikeMerge.debug(object);
                                    thisLocal.consoleLikeMerge.groupEnd();
                                }
                                correctSrcValueRef.value = correctSrcValueSubs;
                                keepAllFlagsTemplateCallback(() => {
                                    lodashSet(object, key, correctSrcValueSubs);
                                });
                                return correctSrcValueSubs;
                            })
                        );
                    processResultEntityPriv$.subscribe((correctSrcValueSubs) => {
                        //nothing
                    });
                } else if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function.'+
                            ' Transformation by "IFieldProcessor.fromLiteralValue" for property \''+key+'\'.');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                    correctSrcValueRef.value = new UndefinedForMergeAsync();
                    isFromLiteralValue.value = true;
                    let fromLiteralValue$ = fieldEtc.fieldProcessorCaller.callFromLiteralValue(srcValue, fieldEtc.fieldInfo);
                    fromLiteralValue$ = fromLiteralValue$
                        .pipe(thisLocal.addSubscribedObsRxOpr())
                        .pipe(
                            thisLocal.mapJustOnceKeepAllFlagsRxOpr(object, (fromLiteralValue) => {
                                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeMerge.group('(Asynchronous of Asynchronous of...) mergeWithCustomizerPropertyReplection =>'+
                                        ' function => fromLiteralValue$.pipe() => thisLocal.mapJustOnceKeepAllFlagsRxOpr().'+
                                        ' fromLiteralValue, for property \''+key+'\'. lodashSet(object, key, correctSrcValue)');
                                    thisLocal.consoleLikeMerge.debug(object);
                                    thisLocal.consoleLikeMerge.groupEnd();
                                }
                                correctSrcValueRef.value = fromLiteralValue;
                                keepAllFlagsTemplateCallback(() => {
                                    lodashSet(object, key, correctSrcValueRef.value);
                                });
                                return fromLiteralValue;
                            }));
                    fromLiteralValue$.subscribe((correctSrcValueFlv) => {
                        //nothing
                    });
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Returning null because of fromLiteralValue$.subscribe(). property \''+key+'\'.');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                } else {
                    if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Transformation is not necessary for property \''+key+'\'.');
                        thisLocal.consoleLikeMerge.debug(object);
                        thisLocal.consoleLikeMerge.groupEnd();
                    }
                }
            } else if (lodashHas(object, key)) {
                throw new Error('No type decorator for '+ object.constructor.name + '.' + key);
            } else if (!lodashHas(object, key) && !thisLocal.isLiteralObjMetadataKey(key)) {
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.warn('mergeWithCustomizerPropertyReplection => function. This property \''+key+'\' does not exists on this type.');
                }
                correctSrcValueRef.value = undefined;
            } else {
                if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. Property \''+key+'\'. Using same value.');
                    thisLocal.consoleLikeMerge.debug(correctSrcValueRef.value);
                    thisLocal.consoleLikeMerge.groupEnd();
                }
            }
            if (thisLocal.consoleLikeMerge.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeMerge.group('mergeWithCustomizerPropertyReplection => function. return');
                thisLocal.consoleLikeMerge.debug(correctSrcValueRef.value);
                thisLocal.consoleLikeMerge.groupEnd();
            }

            return correctSrcValueRef.value;
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
}

class UndefinedForMergeAsync {
    public toString(): string {
        return 'I am an instance of "UndefinedForMerge", just a temporary value before real value from async execution!';
    }
}