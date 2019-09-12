import { Observable, Subscription, Subscriber, of, OperatorFunction, PartialObserver, isObservable } from 'rxjs';
import { RecorderLogLevel } from '../api/recorder-config';
import { map, tap, share, take } from 'rxjs/operators';
import { RecorderManagerDefault } from './recorder-manager-default';
import { flatMapJustOnceRxOpr } from './rxjs-util';
import { ResponseLike } from '../typeslike';
import { PlayerMetadatas } from '../api/player-metadatas';
import { LazyRefPrpMarker, LazyRefMTOMarker, LazyRefMTOImplementor } from '../api/lazy-ref';
import { RecorderSessionImplementor, PlayerSnapshot } from '../api/recorder-session';
import { TapeActionType, TapeAction } from '../api/tape';
import { TapeActionDefault } from './tape-default';
import { LodashLike } from './lodash-like';
import { LazyRefBase } from './lazy-ref-base';

/**
 * Default implementation!  
 * See {@link LazyRef}
 */
export class LazyRefMTODefault<L extends object, I> extends LazyRefBase<L, I> implements LazyRefMTOImplementor<L, I> {
    iAmLazyRefMTO: true;
    iAmLazyRefMTOImplementor: true;
    constructor(session: RecorderSessionImplementor) {
        super(session);
    }

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
        if (fieldEtc.prpGenType.gType !== LazyRefMTOMarker) {
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
                throw new Error('LazyRefMTODefault.subscribe: thisLocal.attachRefId is not null but this is not lazyDirectRawWrite. Me:\n' +
                    this);
            }
            let localObs$ = thisLocal.respObs;
            const localObsL$ = (localObs$ as Observable<ResponseLike<NodeJS.ReadableStream>>).pipe(
                thisLocal.flatMapKeepAllFlagsRxOpr((respLikeStream) => {
                    const processResponseOnLazyLoading = thisLocal.processResponseOnLazyLoading(respLikeStream);
                    if (isObservable(processResponseOnLazyLoading)) {
                        const processResponseOnLazyLoading$ = processResponseOnLazyLoading as Observable<L>;
                        return processResponseOnLazyLoading$;
                    } else {
                        return this.thrownError(new Error('This should not happen soud not happen.This LazyRef is lazyDirectRawWrite'));
                    }
                }) as OperatorFunction<ResponseLike<NodeJS.ReadableStream>, L>,
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
            );
            return localObsL$;
        }
    }

    subscribe(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void): Subscription {
        const thisLocal = this;

        let resultSubs: Subscription = null;
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
            throw new Error('lazyDirectRawWrite can not be used with LazyRefMTO');
        }
        if (fieldEtc.propertyOptions.lazyDirectRawRead) {
            throw new Error('lazyDirectRawRead can not be used with LazyRefMTO');
        }
        //super.subscribe() only for non lazyDirectRawWrite
        if (observerOrNext instanceof Subscriber) {
            resultSubs = super.subscribe(observerOrNext);
        } else {
            resultSubs = super.subscribe(<(value: L) => void>observerOrNext, error, complete);
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
            } else if (this.session.getCachedBySignature(this.signatureStr)) {
                if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.debug(
                        '(this.lazyLoadedObj == null && this.respObs != null && this.session.getCachedBySignature(this.signatureStr)\n'
                        +'Means that we already loaded this object by signature with another lazyRef.\n'
                        +'We will get from session signature cache call next()');
                }
                thisLocalNextOnAsync.value = true;
                thisLocal.setLazyObjOnLazyLoading(<L> this.session.getCachedBySignature(this.signatureStr), observerOriginal);
                if (!observerNew.closed) {
                    observerNew.closed = true;
                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). !observerNew.closed');
                        thisLocal.consoleLikeSubs.debug('calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                        thisLocal.consoleLikeSubs.groupEnd();
                    }
                    //here the original method will be called
                    thisLocal.respObs = null;
                    thisLocal.nextProt(false, thisLocal.lazyLoadedObj, observerOriginal);
                } else {
                    if (thisLocal.consoleLikeSubs.enabledFor(RecorderLogLevel.Trace)) {
                    thisLocal.consoleLikeSubs.group('(Asynchronous of Asynchronous of...) LazyRef.subscribe() => setLazyObjOnLazyLoading$.pipe(tap()). observerNew.closed');
                        thisLocal.consoleLikeSubs.debug('NOT calling this.next()'); thisLocal.consoleLikeSubs.debug(thisLocal.lazyLoadedObj);
                        thisLocal.consoleLikeSubs.groupEnd();
                    }
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
            if (fieldEtc.prpGenType.gType === LazyRefPrpMarker && fieldEtc.propertyOptions.lazyDirectRawRead) {
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

    public processResponse(responselike: ResponseLike<PlayerSnapshot | NodeJS.ReadStream>): L | Observable<L> {
        const thisLocal = this;
        let mdRefererObj: PlayerMetadatas = { $iAmPlayerMetadatas$: true };
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        if (this.genericNode.gType !== LazyRefMTOMarker) {
            throw new Error('Wrong type: ' + this.genericNode.gType.name + '. Me:\n' + this);
        }
        let playerSnapshot: PlayerSnapshot | NodeJS.ReadStream;
        playerSnapshot = responselike.body;
        if (LodashLike.has(this.refererObj, this.session.manager.config.playerMetadatasName)) {
            mdRefererObj = LodashLike.get(this.refererObj, this.session.manager.config.playerMetadatasName);
        }


        if (this.lazyLoadedObj == null) {
            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef.lazyLoadedObj is not setted yet: Me:\n' + this);
            }
            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef for a relationship. Me:\n' + this);
            }
            let processedEntity = this.session.processWrappedSnapshotFieldInternal(fieldEtc.lazyLoadedObjType, (playerSnapshot as PlayerSnapshot).wrappedSnapshot)
            this.setLazyObjOnLazyLoadingNoNext(processedEntity as L);
            //was the only way I found to undock the Observable<L> from the Observable<Response>
            //  The side effect of this is that map() called before this exchange is
            //  not piped with new Observable.
        }
        if (this.signatureStr) {
            if (!this.session.isOnRestoreEntireStateFromLiteral()) {
                if (!mdRefererObj.$signature$ && !mdRefererObj.$isComponentPlayerObjectId$) {
                    throw new Error('The referer object has no mdRefererObj.$signature$. This should not happen. Me:\n' + this);
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
            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: IS LazyRefPrp, NOT keeping reference by signature. Me:\n' + this);
            }
        }
        return thisLocal.lazyLoadedObj;
    }
    
    private _playerObjectId: I;
    public get playerObjectId(): I {
        return this._playerObjectId;
    }
    public set playerObjectId(value: I) {
        this._playerObjectId = value;
    }
}