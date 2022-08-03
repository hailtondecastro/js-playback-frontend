import { Observable, Subscription, Subscriber, of, PartialObserver, isObservable, timer } from 'rxjs';
import { RecorderLogLevel } from '../api/recorder-config';
import { flatMap, map, tap, share, take } from 'rxjs/operators';
import { RecorderManagerDefault } from './recorder-manager-default';
import { flatMapJustOnceRxOpr } from './rxjs-util';
import { ResponseLike } from '../typeslike';
import { PlayerMetadatas } from '../api/player-metadatas';
import { LazyRefPrpMarker, LazyRefPrpImplementor, BlobOrStream, BlobOrStreamMarker } from '../api/lazy-ref';
import { TapeActionType, TapeAction } from '../api/tape';
import { TapeActionDefault } from './tape-default';
import { LodashLike } from './lodash-like';
import { LazyRefBase } from './lazy-ref-base';
import { RecorderSessionImplementor, PlayerSnapshot } from '../api/recorder-session';
import { RecorderForDom } from './native-for-dom';

/**
 * Default implementation!  
 * See {@link LazyRef}
 */
export class LazyRefPrpDefault<L extends object> extends LazyRefBase<L, undefined> implements LazyRefPrpImplementor<L> {
    iAmLazyRefPrp: true = true;
    iAmLazyRefPrpImplementor: true = true;

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

        if (!this.session.isOnRestoreEntireState() && !this.isOnLazyLoading) {
            if (!this.session.isRecording()) {
                throw new Error('Invalid operation. It is not recording. Is this Error correct?! Me:\n' + this);
            }
            if (this.lazyLoadedObj !== lazyLoadedObj) {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('LazyRefDefault.setLazyObj()' +
                        '(this.lazyLoadedObj !== lazyLoadedObj)\n' +
                        'Recording action: ' + TapeActionType.SetField + '. actual and new value: ');
                    thisLocal.consoleLike.debug(this.lazyLoadedObj);
                    thisLocal.consoleLike.debug(lazyLoadedObj);
                    thisLocal.consoleLike.groupEnd();
                }

                let mdRefererObj = this.mdRefererObj;
                let mdLazyLoadedObj = this.mdLazyLoadedObj;

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
                    thisLocal.lazyLoadedObjResoved = true;
                    //thisLocal.respObs = null;
                    // thisLocal.respObs = of(null).pipe(
                    //     flatMap(() => {
                    //         return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId);
                    //     }),
                    //     map((stream) => {
                    //         return { body: stream };
                    //     })
                    // );
                    //asyncCombineObsArr.push(processTapeActionAttachRefId$);
                } else if (fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callToLiteralValue) {
                    isValueByFieldProcessor.value = true;
                    let toLiteralValue = fieldEtc.fieldProcessorCaller.callToLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo);
                    action.simpleSettedValue = toLiteralValue;
                    thisLocal.session.addTapeAction(action);
                    // let toLiteralValue$ = fieldEtc.fieldProcessorCaller.callToLiteralValue(action.simpleSettedValue, fieldEtc.fieldInfo);
                    // toLiteralValue$ = toLiteralValue$.pipe(
                    //     tap(
                    //         {
                    //             next: value => {
                    //                 action.simpleSettedValue = value;
                    //                 thisLocal.session.addTapeAction(action);
                    //             }
                    //         }
                    //     ),
                    //     thisLocal.session.registerProvidedObservablesRxOpr(),
                    //     share()
                    // );
                    //asyncCombineObsArr.push(toLiteralValue$);
                } else {
                    this.session.addTapeAction(action);
                }
            } else {
                if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLike.group('LazyRefDefault.setLazyObj()' +
                        '(this.lazyLoadedObj === lazyLoadedObj)\n'+
                        'Not recording action: ' + TapeActionType.SetField + '. value: ');
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
            // //providing new readable (flipped) BlobOrStream from cache
            // //this.respObs is never null
            // if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
            //     throw new Error('LazyRefPrpDefault.subscribe: thisLocal.attachRefId is not null but this is not lazyDirectRawWrite. Me:\n' +
            //         this);
            // }
            let localObs$: Observable<ResponseLike<Object>> = of(null).pipe(
                flatMap(() => {
                    if(thisLocal.respObs) {
                        const thisRespObs = thisLocal.respObs;
                        thisLocal.respObs = null;
                        this.waitFromResponseToProcess.beginWait(this);
                        return thisRespObs.pipe(
                            //thisLocal.session.registerLazyRefSubscriptionRxOpr(thisLocal.signatureStr),
                            thisLocal.session.registerProvidedObservablesRxOpr()
                        );
                    } else {
                        if(this.isLazyLoaded()) {
                            return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId).pipe(
                                map((stream) => {
                                    return { body: stream};
                                })
                            );
                        } else {
                            return thisLocal.waitFromResponseToProcess.getWait().pipe(
                                flatMap(() => {
                                    return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId);
                                }),
                                map((stream) => {
                                    return { body: stream};
                                })
                            );
                        }
                    }
                })
            );
            const localObsL$: Observable<L> = (localObs$ as Observable<ResponseLike<BlobOrStream>>).pipe(
                thisLocal.flatMapKeepAllFlagsRxOpr((respLikeStream) => {
                    const processResponseOnLazyLoading = thisLocal.processResponseOnLazyLoading(respLikeStream);
                    if (isObservable(processResponseOnLazyLoading)) {
                        const processResponseOnLazyLoading$ = processResponseOnLazyLoading as Observable<L>;
                        return processResponseOnLazyLoading$;
                    } else {
                        return this.thrownError(new Error('This should not happen. This LazyRef is lazyDirectRawWrite'));
                    }
                }),
                // //thisLocal.session.registerLazyRefSubscriptionRxOpr(thisLocal.signatureStr),
                // thisLocal.session.registerProvidedObservablesRxOpr(),
                tap(
                    {
                        next: () => {
                            if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => getFromCache$.subscribe() => fromDirectRaw$.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()).');
                                thisLocal.consoleLikeSubs.debug('calling this.next(). attachRefId is not null. Am I using lazyDirectRawWrite? Me:\n' + thisLocal);
                                thisLocal.consoleLikeSubs.groupEnd();
                            }
                        },
                        error: (err) => {
                            thisLocal.error(err);
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

        if (!thisLocal.isLazyLoaded()) {
            if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeSubs.debug(
                    '(!thisLocal.isLazyLoaded())\n'
                    +'It may mean that we have not subscribed yet in the Observable of Response');
            }
            //2020-12-04T20:45:14.054Z: This not not true now, we can have (!this.isLazyLoaded()) and (!this.respOb).
            //  there is four javascripts turns:
            //    1: Before response end  (here respObs becomes null);
            //    2: After 'response end' and before 'putOnCache';
            //    3: After 'putOnCache' end and before 'getFromCache';
            //    4: After 'getFromCache'. Here we have (thisLocal.isLazyLoaded()) and (this.respOb);
            // if (!thisLocal.respObs) {
            //     if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
            //         // thisLocal.consoleLikeSubs.debug(
            //         //     '(!thisLocal.respObs)\n'
            //         //     +'Means that we already subscribed to an earlier moment in the Observable of Reponse.\n'
            //         //     +'We will simply call the super.subscribe and call  next()');
            //     }
            //     throw new Error('(!thisLocal.respObs): This should not happen. Me:\n' + thisLocal);
            // } else 
            if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                //lazyDirectRawWrite is always readed from cache.
                return this.asObservable().subscribe(observerOriginal as any, error, complete);
            } else {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.debug(
                        '(thisLocal.respObs != null)\n'
                        +'Means that we are not subscribed yet in the Observable of Reponse.\n'
                        +'this.respObs will be null after subscription, so we mark that '
                        +'there is already an inscription in the Response Observable, and we '+
                        'will not make two server requests');
                }

                let localObs$: Observable<L> = of(null).pipe(
                    this.flatMapJustOnceKeepAllFlagsRxOpr(() => {
                        if(thisLocal.respObs) {
                            const thisRespObs = thisLocal.respObs;
                            thisLocal.respObs = null;
                            thisLocal.waitFromResponseToProcess.beginWait(this);
                            return thisRespObs.pipe(
                                //2020-12-08T06:12:03.862Z: There is no reason for it to exist, that I remember
                                //thisLocal.session.registerLazyRefSubscriptionRxOpr(thisLocal.signatureStr),
                                thisLocal.session.registerProvidedObservablesRxOpr(),
                                thisLocal.session.logRxOpr('LazyRef_subscribe_respObs'),
                                thisLocal.mapJustOnceKeepAllFlagsRxOpr((responseLike) => {
                                    const processResponseOnLazyLoading = thisLocal.processResponseOnLazyLoading(responseLike);
                                    return processResponseOnLazyLoading as L;
                                })
                            );
                        } else {
                            if(thisLocal.isLazyLoaded()) {
                                return of(thisLocal.lazyLoadedObj);
                            } else {
                                return thisLocal.waitFromResponseToProcess.getWait().pipe(
                                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(() => {
                                        return thisLocal.lazyLoadedObj;
                                    })
                                );
                            }
                        }
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
                    //this is to ensure that all the processes of asynchronous results can be done in this js turn before releasing all waiting callbacks.
                    timer(0).subscribe(() => {
                        thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal);
                    });

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
                };
                observerNew.error = (err: any) => {
                    //this is to ensure that all the processes of asynchronous results can be done in this js turn before releasing all waiting callbacks.
                    timer(0).subscribe(() => {
                        thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal, err);
                    });
                    observerOriginal.error(err);
                };

                thisLocalNextOnAsync.value = true;
                localObs$ = localObs$.pipe(
                    // thisLocal.session.registerLazyRefSubscriptionRxOpr(thisLocal.signatureStr),
                    // thisLocal.session.registerProvidedObservablesRxOpr(),
                    tap(() => {
                        //so we will mark that you already hear an entry in the Response Observable, and we will not make two trips to the server.
                        //lazyDirectRawWrite is always readed from cache.
                        // if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
                        //     thisLocal.respObs = null;
                        // }
                    }),
                    share()
                );
                resultSubs = localObs$.subscribe(observerNew);
            }
        } else {
            if (fieldEtc.propertyOptions.lazyDirectRawRead) {
                //providing new readable (flipped) BlobOrStream from cache
                if (thisLocal.attachRefId) {
                    throw new Error('LazyRefPrpDefault.subscribe: thisLocal.attachRefId must be null when lazyDirectRawRead and this.isLazyLoaded(). Me:\n' +
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
                resultSubs = fromDirectRaw$.subscribe(() => {
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

    private getObsRespLikeFromCache(): Observable<ResponseLike<Object>> {
        const thisLocal = this;
        return of(null).pipe(
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
    }

    private firstPutOnCacheRef = {value: undefined as Observable<void>};
    public processResponse(responselike: ResponseLike<PlayerSnapshot | NodeJS.ReadableStream>): L | Observable<L> {
        const thisLocal = this;
        try {
            //const asyncCombineObsArr: Observable<any>[] = [];
            let lazyLoadedObj$: Observable<L>;
            let isLazyRefOfCollection = false;
            let mdRefererObj: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
            let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
            if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
                thisLocal.session.validatePlayerSideResponseLike(responselike);
            }
            let playerSnapshot: PlayerSnapshot | NodeJS.ReadableStream;
            playerSnapshot = responselike.body;
            if (LodashLike.has(this.refererObj, this.session.manager.config.playerMetadatasName)) {
                mdRefererObj = LodashLike.get(this.refererObj, this.session.manager.config.playerMetadatasName);
            }
    
            if (this.genericNode.gType !== LazyRefPrpMarker) {
                throw new Error('Wrong type: ' + this.genericNode.gType.name + '. Me:\n' + this);
            }
            let isResponseBodyBlobOrStream = fieldEtc.propertyOptions.lazyDirectRawWrite
                || RecorderForDom.isBlobOrStream(responselike.body);
            if (!thisLocal.isLazyLoaded()) {
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: LazyRef.lazyLoadedObj is not setted yet: Me:\n' + thisLocal);
                }
                if (fieldEtc.propertyOptions.lazyDirectRawRead && isResponseBodyBlobOrStream) {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: LazyRefPrp is "lazyDirectRawRead". Me:\n' + thisLocal);
                    }
                    if (!isResponseBodyBlobOrStream) {
                        throw new Error('LazyRefPrpDefault.processResponse: LazyRefPrp is "lazyDirectRawRead" but "responselike.body" is not a '+(typeof Blob === 'undefined'? 'NodeJS.ReadableStream': 'Blob')+'. Me:\n' +
                            thisLocal + '\nresponselike.body.constructor.name: ' +
                            (responselike && responselike.body && responselike.body.constructor.name? responselike.body.constructor.name: 'null'));
                    }
                    if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                        thisLocal.lazyLoadedObj = null;
                        //setting next respObs
                        if (!LodashLike.isNil(responselike.body)) {
                            //thisLocal.respObs = null;
                            //thisLocal.respObs = thisLocal.getObsRespLikeFromCache();
                        } else {
                            thisLocal.firstPutOnCacheRef.value = undefined;
                            thisLocal.setRealResponseDoneDirectRawWrite(true);
                            thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal);
                            //thisLocal.respObs = null;
                            //thisLocal.respObs = of({ body: null });
                        }
    
                        let putOnCache$: Observable<void>;
                        const isRealResponseDoneDirectRawWriteLocal = thisLocal.isRealResponseDoneDirectRawWrite();
                        if (!isRealResponseDoneDirectRawWriteLocal) {
                            thisLocal.attachRefId = this.session.manager.config.cacheStoragePrefix + this.session.nextMultiPurposeInstanceId().toString();
                            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: fieldEtc.propertyOptions.lazyDirectRawWrite.'+
                                    ' (!thisLocal.isOriginalResponseDone()). There is no value yet on CacheHandler!"\n' + this);
                            }
                            thisLocal.setRealResponseDoneDirectRawWrite(true);
                            putOnCache$ = this.session.manager.config.cacheHandler.putOnCache(thisLocal.attachRefId, responselike.body as NodeJS.ReadableStream).pipe(
                                tap(() => {
                                    thisLocal.firstPutOnCacheRef.value = undefined;
                                })
                            );
                            thisLocal.firstPutOnCacheRef.value = putOnCache$;
                        } else {
                            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: fieldEtc.propertyOptions.lazyDirectRawWrite.'+
                                    '(thisLocal.isOriginalResponseDone()). Already have value on CacheHandler or responselike.body is null!"\n' + this);
                            }
                            putOnCache$ = of(undefined);
                        }
    
                        let getFromCache$: Observable<BlobOrStream>;
                        if (!isRealResponseDoneDirectRawWriteLocal) {
                            getFromCache$ = putOnCache$.pipe(
                                share(),
                                flatMap( () => {
                                    return thisLocal.session.manager.config.cacheHandler.getFromCache(thisLocal.attachRefId);
                                })
                            );
                        } else {
                            // in this case responselike.body already is from the cache!
                            getFromCache$ = of(responselike.body as BlobOrStream);
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
                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: fieldEtc.propertyOptions.lazyDirectRawWrite.'+
                                ' thisLocal.lazyLoadedObj will never be setted, value will be always obtained from CacheHandler!"\n' + this);
                        }
                        return afterGetFromCache$.pipe(
                            tap(
                                {
                                    complete: () => {
                                        thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal);
                                    },
                                    error: (err) => {
                                        thisLocal.error(err);
                                        thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal, err);
                                    }
                                }
                            )
                        );
                    } else if (fieldEtc.fieldProcessorCaller.callFromDirectRaw) {
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: LazyRefPrp is "lazyDirectRawRead" and has "IFieldProcessor.fromDirectRaw".');
                        }           
                        let fromDirectRaw$ = fieldEtc.fieldProcessorCaller.callFromDirectRaw(of(responselike as ResponseLike<BlobOrStream>), fieldEtc.fieldInfo);
    
                        lazyLoadedObj$ = 
                            fromDirectRaw$
                                .pipe(
                                    thisLocal.mapJustOnceKeepAllFlagsRxOpr((respL) => {
                                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: Async on "IFieldProcessor.fromDirectRaw" result. Me:\n' + this);
                                        }
                                        thisLocal.setLazyObjOnLazyLoadingNoNext(respL.body);
                                        this.waitFromResponseToProcess.emitEndWait(thisLocal);
                                        return thisLocal.lazyLoadedObj;
                                    }),
                                    tap(
                                        {
                                            error: (err) => {
                                                thisLocal.error(err);
                                                thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal, err);
                                            }
                                        }
                                    )
                                );
                        lazyLoadedObj$ = lazyLoadedObj$.pipe(
                            thisLocal.session.registerProvidedObservablesRxOpr(),
                            share()
                        );
                        return lazyLoadedObj$;
                    } else {
                        if(fieldEtc.lazyLoadedObjType
                            && typeof fieldEtc.lazyLoadedObjType === 'function'
                            && !(new fieldEtc.lazyLoadedObjType() as BlobOrStreamMarker).iAmBlobOrStreamMarker) {
                            throw new Error('LazyRefPrpDefault.processResponse: LazyRefPrp is "lazyDirectRawRead" and has no "IFieldProcessor.fromDirectRaw",'+
                                ' but this generic definition is LazyRepPrp<'+(fieldEtc.lazyLoadedObjType? fieldEtc.lazyLoadedObjType.name: '')+'>. Me:\n' +
                                this);
                        }
                        this.waitFromResponseToProcess.emitEndWait(thisLocal);
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Warn)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: LazyRef is "lazyDirectRawRead" and has NO "IFieldProcessor.fromDirectRaw". Using "responselike.body". You may only be able to read the content once!');
                        }
                    }
                } else if (
                        (!fieldEtc.propertyOptions.lazyDirectRawRead)
                        || (fieldEtc.propertyOptions.lazyDirectRawRead && !isResponseBodyBlobOrStream)) {
                    if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Warn)) {
                        thisLocal.consoleLikeProcResp.warn('LazyRefPrpDefault.processResponse: (LazyRefPrp is NOT "lazyDirectRawRead") or '+
                            '(LazyRefPrp is "lazyDirectRawRead" and "responseLike.body" is not a '+(typeof Blob === 'undefined'? 'NodeJS.ReadableStream': 'Blob')+'). Is it rigth?! Me:\n' + this);
                    }
                    if (fieldEtc.fieldProcessorCaller.callFromLiteralValue) {
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has "IFieldProcessor.fromLiteralValue".');
                        }
                        
                        const fromLiteralValue = fieldEtc.fieldProcessorCaller.callFromLiteralValue(responselike.body, fieldEtc.fieldInfo);
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: Async on "IFieldProcessor.fromLiteralValue" result. Me:\n' + this);
                        }
                        thisLocal.lazyRefPrpStoreOriginalliteralEntryIfNeeded(
                            mdRefererObj,
                            fieldEtc,
                            playerSnapshot as PlayerSnapshot);
                        thisLocal.setLazyObjOnLazyLoadingNoNext(fromLiteralValue);
                        this.waitFromResponseToProcess.emitEndWait(thisLocal);
                    } else {
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: ((LazyRefPrp is NOT "lazyDirectRawRead") or (...above...)) and has NO "IFieldProcessor.fromLiteralValue". Using "responselike.body"');
                        }
                        this.setLazyObjOnLazyLoadingNoNext(responselike.body as L);
                        this.waitFromResponseToProcess.emitEndWait(thisLocal);
                    }
                } else {
                    throw new Error('ot supportted: lazyDirectRawRead: ' +
                        fieldEtc.propertyOptions.lazyDirectRawRead +
                        '; isResponseBodyStream: ' +
                        isResponseBodyBlobOrStream +
                        '. Me:\n' + this);
                }
            }
            
            if (this.signatureStr && !lazyLoadedObj$) {
                if (!this.session.isOnRestoreEntireState()) {
                    if (!mdRefererObj.$signature$ && !mdRefererObj.$isComponentPlayerObjectId$) {
                        throw new Error('The referer object has no mdRefererObj.$signature$. This should not happen. Me:\n' + this);
                    } else {
                        if (isLazyRefOfCollection) {
    
                        }
                    }
                    if (!mdRefererObj.$signature$) {
                        if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                            thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: (!mdRefererObj.$signature$): owner entity not found for LazyRef, the owner must be a player side component. Me:\n' + this);
                        }
                    }
                }
                
                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                        thisLocal.consoleLikeProcResp.debug('LazyRefPrpDefault.processResponse: IS LazyRefPrp, NOT keeping reference by signature. Me:\n' + this);
                }
            }
    
            if (lazyLoadedObj$) {
                lazyLoadedObj$ = lazyLoadedObj$.pipe(
                    thisLocal.mapJustOnceKeepAllFlagsRxOpr(
                        (lazyLoadedObjValueB: L) => {
                            if (thisLocal.respObs && thisLocal.session.isOnRestoreEntireState()) {
                                if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                                    thisLocal.consoleLikeProcResp.group('LazyRefPrpDefault.processResponse: changing "this.respObs"'+
                                        ' to null because "this.session.isOnRestoreEntireState()"\n' + this);
                                    thisLocal.consoleLikeProcResp.debug(thisLocal.lazyLoadedObj);
                                    thisLocal.consoleLikeProcResp.groupEnd();
                                }
                                thisLocal.respObs = null;
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
                lazyLoadedObj$.subscribe(
                    {
                        next: (lazyLoadedObj) => {
                            //thisLocal.respObs = null;
                            thisLocal.setLazyObjOnLazyLoadingNoNext(lazyLoadedObj);
                            thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal);
                        },
                        error: (err) => {
                            thisLocal.error(err);
                            thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal, err);
                        }
                    }
                );
            }
            return thisLocal.lazyLoadedObj;
        } catch (err) {   
            const reThwErr = new Error('unespected!');
            reThwErr.stack += '\nCaused by:\n'+err.stack;
            (reThwErr as any).cause = err;
            thisLocal.error(err);
            thisLocal.waitFromResponseToProcess.emitEndWait(thisLocal, reThwErr);
            throw reThwErr;
        }
    }
}