import { Observable, OperatorFunction, ObservableInput, Subject, PartialObserver, Subscription } from 'rxjs';
import { ResponseLike } from '../typeslike';
import { LazyRefImplementor, LazyRefOTMMarker, LazyRefMTOMarker, LazyRefPrpMarker } from '../api/lazy-ref';
import { GenericNode } from '../api/generic-tokenizer';
import { IFieldProcessorEvents } from '../api/field-processor';
import { RecorderSessionImplementor, PlayerSnapshot } from '../api/recorder-session';
import { PlayerMetadatas } from '../api/player-metadatas';
import { FieldEtc } from '../api/field-etc';
import { ConsoleLike, RecorderLogLevel } from '../api/recorder-config';
import { RecorderLogger } from '../api/recorder-config';
import { flatMap, map, tap } from 'rxjs/operators';
import { RecorderManagerDefault } from './recorder-manager-default';

declare type OneOfSubscribeParam = PartialObserver<any> | ((err: any) => void) | (() => void);

export abstract class LazyRefBase<L extends object, I> extends Subject<L> implements LazyRefImplementor<L, I> {
    iAmLazyRef: true;
    iAmLazyRefImplementor: true;

    attachRefId: string;
    bMdRefererObj: PlayerMetadatas;
    bMdLazyLoadedObj: PlayerMetadatas;
    pbMdRefererPlayerObjectId: PlayerMetadatas;

    private notificationStartTime: number = Date.now();
    private notificationCount: number = 0;

    private _instanceId: number;
	public get instanceId(): number {
		return this._instanceId;
	}
	public set instanceId(value: number) {
		this._instanceId = value;
	}

    private _lazyLoadedObj: L;
    private _genericNode: GenericNode;
    private _signatureStr: string;
    private _respObs: Observable<ResponseLike<Object>>;
    private _refererObj: any;
    private _refererKey: string;
    private _session: RecorderSessionImplementor;
    consoleLike: ConsoleLike;
    consoleLikeProcResp: ConsoleLike;
    consoleLikeSubs: ConsoleLike;

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
    protected get isOnLazyLoading(): boolean {
        return this._isOnLazyLoading;
    }

    protected flatMapKeepAllFlagsRxOprPriv<T, R>(
        when: 'justOnce' | 'eachPipe',
        project: (value: T, index?: number) => ObservableInput<R>,
        concurrent?: number): OperatorFunction<T, R> {
        const thisLocal = this;
        const syncIsOn = thisLocal._isOnLazyLoading;
        const syncIsOn2 = this._needCallNextOnSetLazyObj;
        const isPipedCallbackDone = { value: false, result: null as ObservableInput<R> };
        let newOp: OperatorFunction<T, R> = (source) => {
            let projectExtentend = (value: T, index: number): ObservableInput<R> => {
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
                ) as Observable<R>;
        }

        return newOp;
    }
    protected flatMapKeepAllFlagsRxOpr<T, R>(project: (value: T, index?: number) => ObservableInput<R>): OperatorFunction<T, R> {
        return this.flatMapKeepAllFlagsRxOprPriv('eachPipe', project);
    }
    protected flatMapJustOnceKeepAllFlagsRxOpr<T, R>(project: (value: T, index?: number) => ObservableInput<R>): OperatorFunction<T, R> {
        return this.flatMapKeepAllFlagsRxOprPriv('justOnce', project);
    }

    protected mapKeepAllFlagsRxOprHelper<T, R>(when: 'justOnce' | 'eachPipe', project: (value: T, index?: number) => R): OperatorFunction<T, R> {
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
    protected mapJustOnceKeepAllFlagsRxOpr<T, R>(project: (value: T, index?: number) => R): OperatorFunction<T, R> {
        return this.mapKeepAllFlagsRxOprHelper('justOnce', project);
    }

    public setLazyObjOnLazyLoading(lazyLoadedObj: L, observerOriginal: PartialObserver<L>): void {
        const thisLocal = this;
        this.lazyLoadingCallbackTemplate( () => {
            thisLocal.setLazyObjInternal(lazyLoadedObj, observerOriginal);
        });
    }

    public setLazyObjOnLazyLoadingProt(lazyLoadedObj: L, observerOriginal: PartialObserver<L>): void {
        const thisLocal = this;
        this.lazyLoadingCallbackTemplate( () => {
            thisLocal.setLazyObjInternal(lazyLoadedObj, observerOriginal);
        });
    }

    public isLazyLoaded(): boolean { 
        return this.respObs == null && this.lazyLoadedObj != null;
    };

    private _needCallNextOnSetLazyObj: boolean = true;

    public setLazyObjOnLazyLoadingNoNext(lazyLoadedObj: L): void {
        const thisLocal = this;
        this.noNextCallbackTemplate(() => {
            return this.lazyLoadingCallbackTemplate(() => {
                thisLocal.setLazyObjInternal(lazyLoadedObj, null);
            });
        });
    }

    public setLazyObjNoNext(lazyLoadedObj: L): void {
        const thisLocal = this;
        this.noNextCallbackTemplate(() => {
            thisLocal.setLazyObjInternal(lazyLoadedObj, null);
        });
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
        this.nextProt(true, lazyLoadedObj, null);
    }

    protected processResponseOnLazyLoading(responselike: { body: any }):  L | Observable<L>  {
        const thisLocal = this;
        return this.lazyLoadingCallbackTemplate(() => {
            return thisLocal.processResponse(responselike);
        });
    }

    private lazyLoadingCallbackTemplate<R>(callback: () => R): R {
        try {
            this._isOnLazyLoading = true;
            return callback();
        } finally {
            this._isOnLazyLoading = false;
        }
    }
    
    private noNextCallbackTemplate<R>(callback: () => R): R {
        try {
            this._needCallNextOnSetLazyObj = false;
            return callback();
        } finally {
            this._needCallNextOnSetLazyObj = true;
        }
    }

    protected setLazyObjInternal(lazyLoadedObj: L, observerOriginal: PartialObserver<L>): void {
        //const asyncCombineObsArr: Observable<any>[] = [];
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
        if (fieldEtc.lazyRefMarkerType !== LazyRefOTMMarker && fieldEtc.lazyRefMarkerType !== LazyRefMTOMarker && fieldEtc.lazyRefMarkerType !== LazyRefPrpMarker) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not LazyRef. Me:\n' + this);
        }
        if (fieldEtc.prpGenType.gType !== LazyRefOTMMarker && fieldEtc.prpGenType.gType !== LazyRefMTOMarker && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not LazyRef. Me:\n' + this);
        }
        if ((fieldEtc.otmCollectionType === Set || fieldEtc.otmCollectionType === Array) && !this._isOnLazyLoading) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' can not be changed because this is a collection: \'' + fieldEtc.otmCollectionType.name + '\'' + '. Me:\n' + this);
        }

        //null to response.
        this.setLazyObj(lazyLoadedObj, observerOriginal);
    }

    public abstract setLazyObj(lazyLoadedObj: L, observerOriginal?: PartialObserver<L>): void;

    protected setLazyObjMayDoNextHelper(isValueByFieldProcessor: {value: boolean}, fieldEtc: FieldEtc<L, any>, newLazyLoadedObj: L, observerOriginal: PartialObserver<L>) {
        const thisLocal = this;
        if (newLazyLoadedObj !== thisLocal._lazyLoadedObj) {
            thisLocal._lazyLoadedObj = newLazyLoadedObj;
            if (!isValueByFieldProcessor.value && fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
                if (thisLocal.lazyLoadedObj) {
                    thisLocal.session.registerEntityAndLazyref(thisLocal.lazyLoadedObj, thisLocal);
                }
            }

            if (thisLocal._needCallNextOnSetLazyObj) {
                thisLocal.nextProt(true, thisLocal.lazyLoadedObj, observerOriginal);
            }
        }
    }

    private _subscribeFromAsObservable: boolean = false;
    protected get subscribeFromAsObservable(): boolean {
        return this._subscribeFromAsObservable;
    }
    protected set subscribeFromAsObservable(value: boolean) {
        this._subscribeFromAsObservable = value;
    }

    asObservable(): Observable<L> {
        const thisLocal = this;
        return super.asObservable().pipe(
            tap(() => {
                thisLocal.subscribeFromAsObservable = true;
            })
        );
    }

    private DummyCurrNextValueClass = class {};
    protected readonly dummyCurrtNextValueInstance: L = new this.DummyCurrNextValueClass() as L;

    protected currNextValue: L = this.dummyCurrtNextValueInstance;
    protected firstSubscribeOcurrence = true;
    private _observerOriginalMap = new Map<OneOfSubscribeParam, PartialObserver<L>>();
    private _observerOriginalInverseMap = new Map<PartialObserver<L>, OneOfSubscribeParam>();
    protected createAndRegisterObserverOriginal(observerOrNext?: PartialObserver<L> | ((value: L) => void),
            error?: (error: any) => void,
            complete?: () => void): PartialObserver<L> {
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
        
        if (this.session.manager.config.tryReduceLazyRefSubescribersRerun) {
            while ((observerOrNext as any).destination) {
                observerOrNext = (observerOrNext as any).destination;
            }
            this._observerOriginalMap.set(observerOrNext || error || complete, observerOriginal);
            this._observerOriginalInverseMap.set(observerOriginal, observerOrNext || error || complete);
        }
        return observerOriginal;
    }
    /**
     * Do super.next only if is the first subscribe ocurred or is the value  
     * is diferent from the last value or is forceSuper.
     * @param forceSuper 
     * @param value 
     */
    protected nextProt(forceSuper: boolean, value: L, observerOriginal: PartialObserver<L>): void {
        let observerOriginalNotRunned = true;
        if (this.session.manager.config.tryReduceLazyRefSubescribersRerun) {
            observerOriginalNotRunned = this._observerOriginalMap.has(this._observerOriginalInverseMap.get(observerOriginal));
            this._observerOriginalMap.delete(this._observerOriginalInverseMap.get(observerOriginal));
            this._observerOriginalInverseMap.delete(observerOriginal);
        }

        if (this.firstSubscribeOcurrence) {
            this.next(value);
        } else if (value !== this.currNextValue) {
            this.next(value);
        } else if (forceSuper) {
            this.next(value);
        } else {
            try {
                if(observerOriginal.next && observerOriginalNotRunned) {
                    observerOriginal.next((value));
                }
            } catch (err) {
                if(observerOriginal.error) {
                    observerOriginal.error(err);
                }
            } finally {
                observerOriginal.closed = true;
                if(observerOriginal.complete) {
                    observerOriginal.complete();
                }
            }
        }
    }

    next(value?: L): void {
        this.firstSubscribeOcurrence = false;
        this.currNextValue = value;
        super.next(value);
    }

    subscribe(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void): Subscription {
        const thisLocal = this;
        thisLocal._subscribeFromAsObservable = false;
        return super.subscribe(observerOrNext as any, error, complete);
    }

    subscribeToModify(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void) {
        const thisLocal = this;

        let observerOriginal: PartialObserver<L> = this.createAndRegisterObserverOriginal(observerOrNext, error, complete);
        let observerNew: PartialObserver<L> = { ...observerOriginal };

        if (!this.isLazyLoaded()) {
            observerNew.next = (value: L) => {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.group('(Asynchronous) LazyRef.subscribeToChange() => modifiedNext, (thisLocal.respObs != null)');
                    thisLocal.consoleLikeSubs.debug('calling nextOriginal()'); thisLocal.consoleLikeSubs.debug('this.subscriptionToChange.unsubscribe()'); thisLocal.consoleLikeSubs.debug('this.next()\n' + this); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                    thisLocal.consoleLikeSubs.groupEnd();
                }
                thisLocal.setLazyObjOnLazyLoadingNoNext(value);
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
                thisLocal.nextProt(true, thisLocal.lazyLoadedObj, observerOriginal);
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
                thisLocal.nextProt(true, thisLocal.lazyLoadedObj, observerOriginal);
            } catch (err) {
                if (observerOriginal.error) {
                    observerOriginal.error(err);
                } else {
                    throw { ...new Error('unexpected'), reason: err, cause: err };
                }
            }
        }
    }

    private subscriptionToChange: Subscription;
    protected subscriptionToChangeUnsubscribe() {
        const thisLocal = this;
        if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLikeSubs.debug('LazyRefBase: unsubscribe after this.subscribeToChange. Me\n' + this);
        }
        this.subscriptionToChange.unsubscribe();
        this.session.notifyAllLazyrefsAboutEntityModification(this.lazyLoadedObj, thisLocal);
    }


    public abstract processResponse(responselike: ResponseLike<PlayerSnapshot | NodeJS.ReadStream>): L | Observable<L>;

    protected lazyRefPrpStoreOriginalliteralEntryIfNeeded(mdRefererObj: PlayerMetadatas, fieldEtc: FieldEtc<L, any>, playerSnapshot: PlayerSnapshot): void {
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

    public get lazyLoadedObj(): L {
        return this._lazyLoadedObj;
    }
    public set lazyLoadedObj(value: L) {
        this._lazyLoadedObj = value;
    }
    public get signatureStr(): string {
        return this._signatureStr;
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