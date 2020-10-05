import { Observable, Subscription, Subscriber, of, PartialObserver, isObservable } from 'rxjs';
import { RecorderLogLevel } from '../api/recorder-config';
import { flatMap, map, tap, share } from 'rxjs/operators';
import { RecorderConstants } from './recorder-constants';
import { RecorderManagerDefault } from './recorder-manager-default';
import { TypeLike } from '../typeslike';
import { ResponseLike } from '../typeslike';
import { LazyRefPrpMarker, LazyRefOTM, LazyRefOTMMarker } from '../api/lazy-ref';
import { GenericNode } from '../api/generic-tokenizer';
import { PlayerSnapshot, RecorderSessionImplementor } from '../api/recorder-session';
import { TapeActionType, TapeAction } from '../api/tape';
import { TapeActionDefault } from './tape-default';
import { LodashLike } from './lodash-like';
import { LazyRefBase } from './lazy-ref-base';

/**
 * Default implementation!  
 * See {@link LazyRef}
 */
export class LazyRefOTMDefault<L extends object> extends LazyRefBase<L, undefined> implements LazyRefOTM<L> {
    iAmLazyRefOTM: true = true;

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
        if (fieldEtc.prpGenType.gType !== LazyRefOTMMarker) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not LazyRef. Me:\n' + this);
        }
        if ((fieldEtc.otmCollectionType === Set || fieldEtc.otmCollectionType === Array) && !this.isOnLazyLoading) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' can not be changed because this is a collection: \'' + fieldEtc.otmCollectionType.name + '\'' + '. Me:\n' + this);
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

                if (fieldEtc.lazyRefMarkerType === LazyRefPrpMarker) {
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
                                
                                this.setLazyObjMayDoNextHelper(isValueByFieldProcessor, fieldEtc, ptaariValue.newValue, null);
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
                throw new Error('LazyRefBase.subscribe: thisLocal.attachRefId is not null but this is not lazyDirectRawWrite. Me:\n' +
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
        if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
            throw new Error('lazyDirectRawWrite can not be used with LazyRefOTM');
        }
        if (fieldEtc.propertyOptions.lazyDirectRawRead) {
            throw new Error('lazyDirectRawRead can not be used with LazyRefOTM');
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
            //nothing
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
        let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<L, any>(this.session.fielEtcCacheMap, this.refererObj, this.refererKey, this.session.manager.config);
        if (!fieldEtc.propertyOptions.lazyDirectRawWrite) {
            thisLocal.session.validatePlayerSideResponseLike(responselike);
        }
        let playerSnapshot: PlayerSnapshot | NodeJS.ReadStream;
        playerSnapshot = responselike.body;

        if (this.lazyLoadedObj == null) {
            if (thisLocal.consoleLikeProcResp.enabledFor(RecorderLogLevel.Trace)) {
                thisLocal.consoleLikeProcResp.debug('LazyRefBase.processResponse: LazyRef.lazyLoadedObj is not setted yet: Me:\n' + this);
            }
            if (fieldEtc.otmCollectionType) {
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
                    this.session.processWrappedSnapshotFieldArrayInternal(collTypeParam, lazyLoadedColl, (playerSnapshot as PlayerSnapshot).wrappedSnapshot as any[]);
                    
                    this.setLazyObjOnLazyLoadingNoNext(lazyLoadedColl);
                } finally {
                    LodashLike.set(this.lazyLoadedObj, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME, false);
                }
            } else {
                throw new Error('Wrong type: ' + this.genericNode.gType.name + '. Me:\n' + this);
            }
        }
        return thisLocal.lazyLoadedObj;
    }
}