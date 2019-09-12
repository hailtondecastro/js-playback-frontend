import { Observable, Subscription, Subscriber, of, PartialObserver, isObservable } from 'rxjs';
import { RecorderLogLevel } from '../api/recorder-config';
import { flatMap, map, tap, share, take } from 'rxjs/operators';
import { RecorderManagerDefault } from './recorder-manager-default';
import { flatMapJustOnceRxOpr } from './rxjs-util';
import { ResponseLike } from '../typeslike';
import { PlayerMetadatas } from '../api/player-metadatas';
import { LazyRefPrpMarker, LazyRefPrpImplementor } from '../api/lazy-ref';
import { TapeActionType, TapeAction } from '../api/tape';
import { TapeActionDefault } from './tape-default';
import { LodashLike } from './lodash-like';
import { LazyRefBase } from './lazy-ref-base';
import { RecorderSessionImplementor, PlayerSnapshot } from '../api/recorder-session';

/**
 * Default implementation!  
 * See {@link LazyRef}
 */
export class LazyRefPrpDefault<L extends object> extends LazyRefBase<L, undefined> implements LazyRefPrpImplementor<L> {
    iAmLazyRefPrp: true;
    iAmLazyRefPrpImplementor: true;

    constructor(session: RecorderSessionImplementor) {
        super(session);
    }

    private _isRealResponseDoneDirectRawWrite = false;
    isRealResponseDoneDirectRawWrite(): boolean { 
        return this._isRealResponseDoneDirectRawWrite;
    };
    setRealResponseDoneDirectRawWrite(value: boolean): void {
        this._isRealResponseDoneDirectRawWrite = value;
    };

    
    
    public setLazyObj(lazyLoadedObj: L, observerOriginal?: PartialObserver<L>): void {
        const thisLocal = this;
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
        if (fieldEtc.prpGenType.gType !== LazyRefPrpMarker) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not LazyRef. Me:\n' + this);
        }

        //null to response.
        this.respObs = null;
        const isValueByFieldProcessor: {value: boolean} = { value: false };

        if (!this.session.isOnRestoreEntireStateFromLiteral() && !this.isOnLazyLoading) {
            if (!this.session.isRecording()) {
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
                action.attachRefId = thisLocal.attachRefId;
                if (mdRefererObj.$signature$) {
                    action.ownerSignatureStr = mdRefererObj.$signature$;
                } else if (LodashLike.has(this.refererObj, this.session.manager.config.creationIdName)) {
                    action.ownerCreationRefId = LodashLike.get(this.refererObj, this.session.manager.config.creationIdName) as number;
                } else if (!this.isOnLazyLoading && !mdRefererObj.$isComponentPlayerObjectId$) {
                    throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' has a not managed owner. Me:\n' + this);
                }

                if (lazyLoadedObj != null) {
                    if (mdLazyLoadedObj.$signature$) {
                        action.settedSignatureStr = mdLazyLoadedObj.$signature$;
                    } else if (LodashLike.has(lazyLoadedObj, this.session.manager.config.creationIdName)) {
                        action.settedCreationRefId = LodashLike.get(lazyLoadedObj, this.session.manager.config.creationIdName) as number;
                    } else if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
                        //nothing for now!
                    } else if (!this.isOnLazyLoading) {
                        throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\'.  lazyLoadedObj is not managed: \'' + lazyLoadedObj.constructor.name + '\'' + '. Me:\n' + this);
                    }
                }

                if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                    isValueByFieldProcessor.value = true;
                    let processTapeActionAttachRefId$ = thisLocal.session.processTapeActionAttachRefId({fieldEtc: fieldEtc, value: lazyLoadedObj, action: action, propertyKey: thisLocal.refererKey});
                    //processTapeActionAttachRefId$ = processTapeActionAttachRefId$.pipe(thisLocal.session.addSubscribedObsRxOpr());
                    processTapeActionAttachRefId$ = processTapeActionAttachRefId$.pipe(
                        thisLocal.mapJustOnceKeepAllFlagsRxOpr((ptaariValue) => {
                            if(!ptaariValue.asyncAddTapeAction) {
                                thisLocal.session.addTapeAction(action);
                            }
                            if (thisLocal.attachRefId !== action.attachRefId) {
                                throw new Error('This should not happen');
                            }
                            
                            this.setLazyObjMayDoNextHelper(isValueByFieldProcessor, fieldEtc, ptaariValue.newValue, observerOriginal);
                            return ptaariValue;
                        }),
                        thisLocal.session.registerProvidedObservablesRxOpr()
                    );
                    const subs = processTapeActionAttachRefId$.subscribe(() => {
                        if(subs) {
                            subs.unsubscribe();
                        }
                    });

                    thisLocal.lazyLoadedObj = null;
                    thisLocal.respObs = of(null).pipe(
                        flatMap(() => {
                            return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId);
                        }),
                        map((stream) => {
                            return { body: stream };
                        })
                    );
                    //asyncCombineObsArr.push(processTapeActionAttachRefId$);
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
                    //asyncCombineObsArr.push(toLiteralValue$);
                } else {
                    this.session.addTapeAction(action);
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
        this.setLazyObjMayDoNextHelper(isValueByFieldProcessor, fieldEtc, lazyLoadedObj, observerOriginal);
    }

    asObservable(): Observable<L> {
        const thisLocal = this;
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
            return super.asObservable();
        } else {
            //providing new readable (flipped) NodeJS.ReadableStream from cache
            //this.respObs is never null
            if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
                throw new Error('LazyRefBase.subscribe: thisLocal.attachRefId is not null but this is not lazyDirectRawWrite. Me:\n' +
                    this);
            }
            let localObs$ = thisLocal.respObs;
            const localObsL$: Observable<L> = (localObs$ as Observable<ResponseLike<NodeJS.ReadableStream>>).pipe(
                thisLocal.flatMapKeepAllFlagsRxOpr((respLikeStream) => {
                    const processResponseOnLazyLoading = thisLocal.processResponseOnLazyLoading(respLikeStream);
                    if (isObservable(processResponseOnLazyLoading)) {
                        const processResponseOnLazyLoading$ = processResponseOnLazyLoading as Observable<L>;
                        return processResponseOnLazyLoading$;
                    } else {
                        return this.thrownError(new Error('This should not happen soud not happen.This LazyRef is lazyDirectRawWrite'));
                    }
                }),
                //thisLocal.session.registerLazyRefSubscriptionRxOpr(thisLocal.signatureStr),
                thisLocal.session.registerProvidedObservablesRxOpr(),
                tap(
                    {
                        next: () => {
                            if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()).');
                                thisLocal.consoleLikeSubs.debug('calling this.next(). attachRefId is not null. Am I using lazyDirectRawWrite? Me:\n' + thisLocal.session.jsonStringfyWithMax(thisLocal));
                                thisLocal.consoleLikeSubs.groupEnd();
                            }
                        }
                    }
                ),
                share(),
            ) as Observable<L>;
            return localObsL$;
        }
    }

    subscribe(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void): Subscription {
        const thisLocal = this;

        let resultSubs: Subscription = null;
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
            //super.subscribe() only for non lazyDirectRawWrite
            if (observerOrNext instanceof Subscriber) {
                resultSubs = super.subscribe(observerOrNext);
            } else {
                resultSubs = super.subscribe(<(value: L) => void>observerOrNext, error, complete);
            }
        }
        let observerOriginal: PartialObserver<L> = this.createAndRegisterObserverOriginal(observerOrNext, error, complete);
        let observerNew: PartialObserver<L> = {...observerOriginal};

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
                        +'We will simply call the super.subscribe and call  next()');
                }
            } else if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                //lazyDirectRawWrite is always readed from cache.
                return this.asObservable().subscribe(observerOriginal as any, error, complete);
            } else {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.debug(
                        '(thisLocal.respObs != null)\n'
                        +'Means that we are not subscribed yet in the Observable of Reponse.\n'
                        +'this.respObs will be null after subscription, so we mark that '
                        +'there is already an inscription in the Response Observable, and we '+
                        'will not make two trips to the server');
                }
                //return thisLocal.processResponseOnLazyLoading(response);
                let localObs$: Observable<L> = 
                    thisLocal.respObs.pipe(
                        thisLocal.session.logRxOpr('LazyRef_subscribe_respObs'),
                        thisLocal.mapJustOnceKeepAllFlagsRxOpr((responseLike) => {
                            const processResponseOnLazyLoading = thisLocal.processResponseOnLazyLoading(responseLike);
                            return processResponseOnLazyLoading as L;
                        })
                    );

                thisLocalNextOnAsync.value = true;
                observerNew.next = (value: L) => {
                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => observerNew.next()');
                        thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                        thisLocal.consoleLikeSubs.groupEnd();
                    }

                    thisLocal.setLazyObjOnLazyLoadingNoNext(value);

                    if (!observerNew.closed) {
                        if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). !observerNew.closed');
                            thisLocal.consoleLikeSubs.debug('calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                            thisLocal.consoleLikeSubs.groupEnd();
                        }
                        observerNew.closed = true;
                        //here the original method will be called
                        thisLocal.nextProt(false, thisLocal.lazyLoadedObj, observerOriginal);
                    } else {
                        if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). observerNew.closed');
                            thisLocal.consoleLikeSubs.debug('NOT calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                            thisLocal.consoleLikeSubs.groupEnd();
                        }
                    }
                }

                thisLocalNextOnAsync.value = true;
                localObs$ = localObs$.pipe(
                    thisLocal.session.registerLazyRefSubscriptionRxOpr(thisLocal.signatureStr),
                    thisLocal.session.registerProvidedObservablesRxOpr(),
                    tap(() => {
                        //so we will mark that you already hear an entry in the Response Observable, and we will not make two trips to the server.
                        //lazyDirectRawWrite is always readed from cache.
                        if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
                            thisLocal.respObs = null;
                        }
                    }),
                    share()
                );
                localObs$.subscribe(observerNew);
            }
        } else {
            if (fieldEtc.propertyOptions.lazyDirectRawRead) {
                //providing new readable (flipped) NodeJS.ReadableStream from cache
                if (thisLocal.attachRefId) {
                    throw new Error('LazyRefBase.subscribe: thisLocal.attachRefId must be null when this.lazyLoadedObj is not null. Me:\n' +
                        this);
                }
                thisLocalNextOnAsync.value = true;
                let getFromCache$ = this.session.manager.config.cacheHandler.getFromCache(this.attachRefId);

                let fromDirectRaw$: Observable<ResponseLike<L>> =
                    getFromCache$
                        .pipe(
                            flatMapJustOnceRxOpr((stream) => {
                                return fieldEtc.fieldProcessorCaller.callFromDirectRaw(
                                    of(
                                        {
                                            body: stream,
                                        }
                                    ),
                                    fieldEtc.fieldInfo);
                            }),
                            map((respL) => {
                                return respL;
                            })
                        );
                // fromDirectRaw$ = fromDirectRaw$.pipe(thisLocal.session.addSubscribedObsRxOpr());
                fromDirectRaw$ = fromDirectRaw$.pipe(
                    tap(
                        {
                            next: (repValue: ResponseLike<L>) => {
                                thisLocal.setLazyObjOnLazyLoadingNoNext(repValue.body);
                                if (!observerNew.closed) {
                                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                        thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). !observerNew.closed');
                                        thisLocal.consoleLikeSubs.debug('calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                        thisLocal.consoleLikeSubs.groupEnd();
                                    }
                                    observerNew.closed = true;
                                    thisLocal.nextProt(true, thisLocal.lazyLoadedObj, observerOriginal);
                                } else {
                                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                        thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). observerNew.closed');
                                        thisLocal.consoleLikeSubs.debug('NOT calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                                        thisLocal.consoleLikeSubs.groupEnd();
                                    }
                                }
                            },
                            error: observerNew.error,
                            complete: observerNew.complete,
                            closed: observerNew.closed
                        }
                    )
                );
                fromDirectRaw$ = fromDirectRaw$.pipe(
                    thisLocal.session.registerProvidedObservablesRxOpr(),
                    take(1)
                );
                fromDirectRaw$.subscribe(() => {
                    //thisLocal.nextPriv(respValue.body);
                    //nothing
                })
            }
        }

        if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
            thisLocal.consoleLikeSubs.debug(
                '(thisLocal.lazyLoadedObj != null)\n'
                +'It may mean that we already have subscribed yet in the Observable of Response\n '
                +'or this was created with lazyLoadedObj already loaded.');
        }
        if (!observerNew.closed && !thisLocalNextOnAsync.value) {
            thisLocal.nextProt(false, thisLocal.lazyLoadedObj, observerOriginal);
        }

        return resultSubs;
    }

    private firstPutOnCacheRef = {value: undefined as Observable<void>};
    public processResponse(responselike: ResponseLike<PlayerSnapshot | NodeJS.ReadStream>): L | Observable<L> {
        const thisLocal = this;
        //const asyncCombineObsArr: Observable<any>[] = [];
        let lazyLoadedObj$: Observable<L>;
        let isLazyRefOfCollection = false;
        let mdRefererObj: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
            thisLocal.session.validatePlayerSideResponseLike(responselike);
        }
        let playerSnapshot: PlayerSnapshot | NodeJS.ReadStream;
        playerSnapshot = responselike.body;
        if (LodashLike.has(this.refererObj, this.session.manager.config.playerMetadatasName)) {
            mdRefererObj = LodashLike.get(this.refererObj, this.session.manager.config.playerMetadatasName);
        }

        if (this.genericNode.gType !== LazyRefPrpMarker) {
            throw new Error('Wrong type: ' + this.genericNode.gType.name + '. Me:\n' + this);
        }
        let isResponseBodyStream = fieldEtc.propertyOptions.lazyDirectRawWrite
            || ((responselike.body as NodeJS.ReadableStream).pipe && (responselike.body as NodeJS.ReadableStream));
        if (this.lazyLoadedObj == null) {
            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef.lazyLoadedObj is not setted yet: Me:\n' + this);
            }
            if (fieldEtc.propertyOptions.lazyDirectRawRead && isResponseBodyStream) {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead". Me:\n' + this);
                }
                if (!isResponseBodyStream) {
                    throw new Error('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" but "responselike.body" is not a NodeJS.ReadableStream. Me:\n' +
                        this + '\nresponselike.body.constructor.name: ' +
                        (responselike && responselike.body && responselike.body.constructor.name? responselike.body.constructor.name: 'null'));
                }
                if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                    thisLocal.lazyLoadedObj = null;
                    //setting next respObs
                    if (!LodashLike.isNil(responselike.body)) {
                        thisLocal.respObs = of(null).pipe(
                            flatMap(() => {
                                return thisLocal.firstPutOnCacheRef.value?
                                    thisLocal.firstPutOnCacheRef.value :
                                    of(null);
                            }),
                            flatMap(() => {
                                return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId);
                            }),
                            map((stream) => {
                                return { body: stream};
                            })
                        );
                    } else {
                        thisLocal.firstPutOnCacheRef.value = undefined;
                        thisLocal.setRealResponseDoneDirectRawWrite(true);
                        thisLocal.respObs = of({ body: null });
                    }

                    let putOnCache$: Observable<void>;
                    const isRealResponseDoneDirectRawWriteLocal = thisLocal.isRealResponseDoneDirectRawWrite();
                    if (!isRealResponseDoneDirectRawWriteLocal) {
                        thisLocal.attachRefId = this.session.manager.config.cacheStoragePrefix + this.session.nextMultiPurposeInstanceId().toString();
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: fieldEtc.propertyOptions.lazyDirectRawWrite.'+
                                ' (!thisLocal.isOriginalResponseDone()). There is no value yet on CacheHandler!"\n' + this);
                        }
                        thisLocal._isRealResponseDoneDirectRawWrite = true;
                        putOnCache$ = this.session.manager.config.cacheHandler.putOnCache(thisLocal.attachRefId, responselike.body as NodeJS.ReadStream).pipe(
                            tap(() => {
                                thisLocal.firstPutOnCacheRef.value = undefined;
                            })
                        );
                        thisLocal.firstPutOnCacheRef.value = putOnCache$;
                    } else {
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: fieldEtc.propertyOptions.lazyDirectRawWrite.'+
                                '(thisLocal.isOriginalResponseDone()). Already have value on CacheHandler or responselike.body is null!"\n' + this);
                        }
                        putOnCache$ = of(undefined);
                    }

                    let getFromCache$: Observable<NodeJS.ReadableStream>;
                    if (!isRealResponseDoneDirectRawWriteLocal) {
                        getFromCache$ = putOnCache$.pipe(
                            share(),
                            flatMap( () => {
                                return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId);
                            })
                        );
                    } else {
                        // in this case responselike.body already is from the cache!
                        getFromCache$ = of(responselike.body as NodeJS.ReadableStream);
                    }
                    let afterGetFromCache$: Observable<L>;
                    
                    if (!fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                        afterGetFromCache$ = putOnCache$.pipe(
                            map(() => {
                                return responselike.body as L;
                            })
                        );
                    } else {
                        afterGetFromCache$ = getFromCache$.pipe(
                            flatMap((respStream) => {
                                return fieldEtc.fieldProcessorCaller.callFromDirectRaw(of({ body: respStream}), fieldEtc.fieldInfo);
                            }),
                            map((respL) => {
                                return respL.body;
                            })
                        );
                    }
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: fieldEtc.propertyOptions.lazyDirectRawWrite.'+
                            ' thisLocal.lazyLoadedObj will never be setted, value will be always obtained from CacheHandler!"\n' + this);
                    }

                    return afterGetFromCache$;
                } else if (fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" and has "IFieldProcessor.fromDirectRaw".');
                    }           
                    let fromDirectRaw$ = fieldEtc.fieldProcessorCaller.callFromDirectRaw(of(responselike as ResponseLike<NodeJS.ReadableStream>), fieldEtc.fieldInfo);

                    lazyLoadedObj$ = 
                        fromDirectRaw$
                            .pipe(
                                thisLocal.mapJustOnceKeepAllFlagsRxOpr((respL) => {
                                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: Async on "IFieldProcessor.fromDirectRaw" result. Me:\n' + this);
                                    }
                                    thisLocal.setLazyObjOnLazyLoadingNoNext(respL.body);
                                    return this.lazyLoadedObj;
                                })
                            );
                    lazyLoadedObj$ = lazyLoadedObj$.pipe(
                        thisLocal.session.registerProvidedObservablesRxOpr(),
                        share()
                    );
                    return lazyLoadedObj$;
                } else {
                    if(Object.getOwnPropertyNames(fieldEtc.lazyLoadedObjType).lastIndexOf('pipe') < 0) {
                        throw new Error('LazyRefBase.processResponse: LazyRefPrp is "lazyDirectRawRead" and has no "IFieldProcessor.fromDirectRaw",'+
                            ' but this generic definition is LazyRepPrp<'+(fieldEtc.lazyLoadedObjType? fieldEtc.lazyLoadedObjType.name: '')+'>. Me:\n' +
                            this);
                    }
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef is "lazyDirectRawRead" and has NO "IFieldProcessor.fromDirectRaw". Using "responselike.body"');
                    }
                }
            } else if (
                    (!fieldEtc.propertyOptions.lazyDirectRawRead)
                    || (fieldEtc.propertyOptions.lazyDirectRawRead && !isResponseBodyStream)) {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Warn)) {
                    thisLocal.consoleLikeProcResp.warn('LazyRefBase.processResponse: (LazyRefPrp is NOT "lazyDirectRawRead") or '+
                        '(LazyRefPrp is "lazyDirectRawRead" and "responseLike.body" is not a NodeJS.ReadableStream). Is it rigth?! Me:\n' + this);
                }
                if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has "IFieldProcessor.fromLiteralValue".');
                    }
                    
                    const fromLiteralValue = fieldEtc.fieldProcessorCaller.callFromLiteralValue(responselike.body, fieldEtc.fieldInfo);
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: Async on "IFieldProcessor.fromLiteralValue" result. Me:\n' + this);
                    }
                    thisLocal.lazyRefPrpStoreOriginalliteralEntryIfNeeded(
                        mdRefererObj,
                        fieldEtc,
                        playerSnapshot as PlayerSnapshot);
                    thisLocal.setLazyObjOnLazyLoadingNoNext(fromLiteralValue);
                } else {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has NO "IFieldProcessor.fromLiteralValue". Using "responselike.body"');
                    }
                    this.setLazyObjOnLazyLoadingNoNext(responselike.body as L);
                }
            } else {
                throw new Error('ot supportted: lazyDirectRawRead: ' +
                    fieldEtc.propertyOptions.lazyDirectRawRead +
                    '; isResponseBodyStream: ' +
                    isResponseBodyStream +
                    '. Me:\n' + this);
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
            }
            
            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: IS LazyRefPrp, NOT keeping reference by signature. Me:\n' + this);
            }
        }

        if (lazyLoadedObj$) {
            lazyLoadedObj$ = lazyLoadedObj$.pipe(
                thisLocal.mapJustOnceKeepAllFlagsRxOpr(
                    (lazyLoadedObjValueB: L) => {
                        if (thisLocal.respObs && thisLocal.session.isOnRestoreEntireStateFromLiteral()) {
                            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeProcResp.group('LazyRefBase.processResponse: changing "this.respObs"'+
                                    ' to null because "this.session.isOnRestoreEntireStateFromLiteral()"\n' + this);
                                thisLocal.consoleLikeProcResp.debug(thisLocal.lazyLoadedObj);
                                thisLocal.consoleLikeProcResp.groupEnd();
                            }
                        }
                        return lazyLoadedObjValueB;
                    }
                ),
                thisLocal.session.registerProvidedObservablesRxOpr(),
                map((lazyLoadedObjValueC: L) => {
                    return lazyLoadedObjValueC;
                }),
                share()
            ),
            lazyLoadedObj$.subscribe((lazyLoadedObj) => {
                thisLocal.respObs = null;
                this.setLazyObjOnLazyLoadingNoNext(lazyLoadedObj);
            });
        }
        return thisLocal.lazyLoadedObj;
    }
}