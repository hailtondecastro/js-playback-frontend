import {HttpHeaders} from '@angular/common/http';
import * as chai from 'chai';
import { Observable, of, OperatorFunction, from, Subject, BehaviorSubject, concat, throwError, combineLatest, interval, timer } from 'rxjs';
import pSnapshotMasterLiteral from './master-a-test.json';
import pSnapshotMasterList1000Literal from './master-a-list-1000-test.json';
import pSnapshotMasterAWrapperLiteral from './master-a-wrapper-tes.json';
import pSnapshotMasterLazyPrpOverSizedLiteral from './master-lazy-prp-over-sized-test.json';
import pSnapshotMasterADetailATestLiteral from './master-a-detail-a-test.json';
import pSnapshotMasterADetailAMinTestLiteral from './master-a-detail-a-min-test.json';
import pSnapshotMasterMinDetailMinTestLiteral from './master-min-detail-min-test.json';
import pSnapshotDetailALiteral from './detail-a-by-sig.json';
import pSnapshotMasterDetailAColLiteral from './master-detail-a-col.json';
import pSnapshotWSnapMasterBBySign from './wsnap-master-b-by-sign-map.json';
import pSnapshotMasterAListFirstTwiceLiteral from './master-a-list-first-twice-test.json';
import pSnapshotDetailAFirstSecondLiteral from './detail-a-first-second-test.json';
import pSnapshotDetailASecondThirdLiteral from './detail-a-secon-third-test.json';
import { MasterAEnt } from './entities/master-a-ent';
import { ForNodeTest } from './native-for-node-test';
import * as fs from 'fs';
import { delay, flatMap, map, catchError, timeout, tap, share, take } from 'rxjs/operators';
import { AsyncCountdown } from './async-countdown.js';
import { AsyncCount } from './async-count.js';
import { mapJustOnceRxOpr, flatMapJustOnceRxOpr, RecorderConfigDefault, RecorderSession, RecorderConfig, RecorderLogger, RecorderLogLevel, RecorderDecorators, StringStream, RecorderConstants, BinaryStream, RecorderManager, RecorderManagerDefault, MemStreamReadableStreamAutoEnd, NonWritableStreamExtraMethods, TypeLike, TapeActionType } from 'json-playback-recorder-ts';
import { ResponseLike } from 'json-playback-recorder-ts';
import { DetailAEnt } from './entities/detail-a-ent.js';
import { MasterMinEnt } from './entities/master-min-ent.js';
import { MasterAWrapper } from './non-entities/master-a-wrapper.js';

{
    describe('RecorderManagerDefault', () => {
        const debugTimeFactor = 0.5;

        it('RecorderManagerDefault.poc-observable-just-once-pipe-test', (done) => {
            //let asyncCount = 0;
            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1000 * debugTimeFactor });

            let obs1$: Observable<void> = of(undefined).pipe(delay(1)).pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );
            let obs2$: Observable<void> = of(undefined).pipe(delay(1)).pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );

            obs1$ = obs1$
                .pipe(
                    mapJustOnceRxOpr((value) => {
                        //console.log('obs1$.pipe() => map(): ' + value);
                        return value;
                    })
                );

            obs1$ = obs1$
                .pipe(
                    flatMapJustOnceRxOpr((value) => {
                        // console.log('obs1$.pipe() => flatMap(): ' + value);
                        return of(value);
                    })
                )
                .pipe(
                    flatMapJustOnceRxOpr((value) => {
                        // console.log('obs1$.pipe() => flatMap() 2a vez: ' + value);
                        return of(value);
                    })
                )
                ;

            obs2$ = obs2$
                .pipe(
                    mapJustOnceRxOpr((value) => {
                        // console.log('obs2$.pipe() => map(): ' + value);
                        return value;
                    })
                );

            let obs3$ = combineLatest(obs1$, obs2$);

            obs3$.subscribe((values) => {
                // console.log("obs3$.subscribe 1o: " + values);
            });

            obs3$.subscribe((values) => {
                // console.log("obs3$.subscribe 2o: " + values);
            });
            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(4, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.poc-observable-each-pipe-test', (done) => {
            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 8, timeOut: 1000 * debugTimeFactor });            

            let obs1$: Observable<void> = of(undefined).pipe(delay(1));
            let obs2$: Observable<void> = of(undefined).pipe(delay(1));

            obs1$ = obs1$
                .pipe(
                    map((value) => {
                        // console.log('obs1$.pipe() => map(): ' + value);
                        return value;
                    })
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );;

            obs1$ = obs1$
                .pipe(
                    flatMap((value) => {
                        // console.log('obs1$.pipe() => flatMap(): ' + value);
                        return of(value);
                    })
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                )
                .pipe(
                    flatMap((value) => {
                        // console.log('obs1$.pipe() => flatMap() 2a vez: ' + value);
                        return of(value);
                    })
                ).pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            obs2$ = obs2$
                .pipe(
                    map((value) => {
                        // console.log('obs2$.pipe() => map(): ' + value);
                        return value;
                    })
                ).pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            let obs3$ = combineLatest(obs1$, obs2$);

            obs3$.subscribe((values) => {
                // console.log("obs3$.subscribe 1o: " + values);
            });

            obs3$.subscribe((values) => {
                // console.log("obs3$.subscribe 2o: " + values);
            })
            
            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(8, 'asyncCount');
                done();
            });

        }).timeout(2000 * debugTimeFactor);

        //it('RecorderManagerDefault.master-a-list-1000-test', 1 == 1 ? (done) => {done();} : (done) => {
        it('RecorderManagerDefault.master-a-list-1000-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 2000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            let manager: RecorderManager = new RecorderManagerDefault(
                config);

            recorderSession = manager.createSession();
            let masterAArr: MasterAEnt[] = recorderSession.processPlayerSnapshotArray(MasterAEnt, pSnapshotMasterList1000Literal);
            masterAArr[0].blobLazyA.subscribe( 
                {
                    next: (valueStream) => {
                        asyncCount.doNonPipedIncrement();
                        let fromDirectRaw$ = ForNodeTest.StringProcessor.fromDirectRaw(of({ body: valueStream }), null)
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                        fromDirectRaw$.subscribe((streamStr) => {
                            asyncCount.doNonPipedIncrement();
                            chai.expect('MasterAEnt_REG00_BlobLazyA').to.eq(streamStr.body);
                        });
                    },
                    complete: () => {
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3, 'asyncCount');
                done();
            });
        }).timeout(3000 * debugTimeFactor);

        it('RecorderManagerDefault.master-a-list-first-twice-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 2000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            let manager: RecorderManager = new RecorderManagerDefault(
                config);

            recorderSession = manager.createSession();
            let masterAArr: MasterAEnt[] = recorderSession.processPlayerSnapshotArray(MasterAEnt, pSnapshotMasterAListFirstTwiceLiteral);
            chai.expect(masterAArr[0]).to.eq(masterAArr[1]);

            masterAArr = recorderSession.processPlayerSnapshotArray(MasterAEnt, pSnapshotMasterAListFirstTwiceLiteral);
            chai.expect(masterAArr[0]).to.eq(masterAArr[1]);
            done();
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.master-a-wrapper-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            let manager: RecorderManager = new RecorderManagerDefault(
                config);

            recorderSession = manager.createSession();
            let masterAArr: MasterAWrapper[] = recorderSession.processPlayerSnapshotArray(MasterAWrapper, pSnapshotMasterAWrapperLiteral);
            masterAArr[0].masterA.blobLazyA.subscribe( 
                {
                    next: (valueStream) => {
                        asyncCount.doNonPipedIncrement();
                        let fromDirectRaw$ = ForNodeTest.StringProcessor.fromDirectRaw(of({ body: valueStream }), null)
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                        fromDirectRaw$.subscribe((streamStr) => {
                            asyncCount.doNonPipedIncrement();
                            chai.expect('MasterAEnt_REG00_BlobLazyA').to.eq(streamStr.body);
                        });
                    },
                    complete: () => {
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.master-a-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            return of(null).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                return result;
            }

            recorderSession = manager.createSession();
            let masterA: MasterAEnt = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterLiteral);
            masterA.blobLazyA.subscribe( 
                {
                    next: (valueStream) => {
                        let fromDirectRaw$ = ForNodeTest.StringProcessor.fromDirectRaw(of({ body: valueStream }), null).pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                        fromDirectRaw$.subscribe((reqStreamStr) => {
                            asyncCount.doNonPipedIncrement();
                            chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(reqStreamStr.body);
                        });
                    },
                    complete: () => {
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(2, 'asyncCount');
                done();
            });

        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.master-a-test-subs-to-mod', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 5, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            return of(null).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                return result;
            }

            recorderSession = manager.createSession();
            let masterA: MasterAEnt = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterLiteral);

            masterA.blobLazyA.subscribe( 
                {
                    next: (valueStream) => {
                        asyncCountdown.doNonPipedCountdown();
                        let fromDirectRaw$ = ForNodeTest.StringProcessor.fromDirectRaw(of({ body: valueStream }), null)
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                        fromDirectRaw$.subscribe((respStreamStr) => {
                            chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(respStreamStr.body);
                        });
                    },
                    complete: () => {
                    }
                }
            );
            
            masterA.detailAEntCol.subscribeToModify((detailAEntCol) => {
                asyncCountdown.doNonPipedCountdown();
                const detailAEntArr = Array.from(detailAEntCol);
                //detailAEntArr[0].vcharA = "detailAEntArr[0].vcharA_changed";
                const detailACompMasterB = detailAEntArr[0].detailAComp.masterB.asObservable().pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr(),
                    tap((masterB) => {
                        asyncCount.doNonPipedIncrement();
                        const originalVarcharA = (pSnapshotWSnapMasterBBySign as any)[detailAEntArr[0].detailAComp.masterB.signatureStr].wrappedSnapshot.vcharA;
                        chai.expect(masterB.vcharA).to.eq(originalVarcharA, 'masterB.vcharA');
                        detailAEntArr[0].detailAComp.masterB.signatureStr
                    })
                );
                detailACompMasterB.subscribe((masterB) => {
                    asyncCount.doNonPipedIncrement();
                    const originalVarcharA = (pSnapshotWSnapMasterBBySign as any)[detailAEntArr[0].detailAComp.masterB.signatureStr].wrappedSnapshot.vcharA;
                    chai.expect(masterB.vcharA).to.eq(originalVarcharA, 'masterB.vcharA');
                    detailAEntArr[0].detailAComp.masterB.signatureStr
                });
                detailACompMasterB.subscribe((masterB) => {
                    asyncCount.doNonPipedIncrement();
                    const originalVarcharA = (pSnapshotWSnapMasterBBySign as any)[detailAEntArr[0].detailAComp.masterB.signatureStr].wrappedSnapshot.vcharA;
                    chai.expect(masterB.vcharA).to.eq(originalVarcharA, 'masterB.vcharA');
                    detailAEntArr[0].detailAComp.masterB.signatureStr
                });
            });

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(7, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.master-a-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                return result;
            }

            recorderSession = manager.createSession();
            let masterA: MasterAEnt = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterLiteral);
            masterA.blobLazyA.subscribe( 
                {
                    next: (valueStream) => {
                        let fromDirectRaw$ = ForNodeTest.StringProcessor.fromDirectRaw(of({ body: valueStream }), null).pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                        fromDirectRaw$.subscribe((respStreamStr) => {
                            chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(respStreamStr.body);
                        });
                    },
                    complete: () => {
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(1, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.detail-a-master-a-subscribe-twice', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 2, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            };

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: pSnapshotMasterLiteral
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterA' ) {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            let responseResult: ResponseLike<Object> = {
                                body: null
                            }
                            return of(responseResult).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            recorderSession = manager.createSession();
            let detailAArr: DetailAEnt[] = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailALiteral);
            detailAArr[0].compId.masterA.asObservable().pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            ).subscribe((masteeA) => {
                asyncCount.doNonPipedIncrement();
                chai.expect(masteeA.vcharA).to.eq('MasterAEnt_REG01_REG01_VcharA');
            });

            detailAArr[0].compId.masterA.asObservable().pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            ).subscribe((masteeA) => {
                asyncCount.doNonPipedIncrement();
                chai.expect(masteeA.vcharA).to.eq('MasterAEnt_REG01_REG01_VcharA');
            });

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(4, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.detail-a-master-a-same-observable-subscribe-twice', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 2, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            };

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: pSnapshotMasterLiteral
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterA' ) {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            let responseResult: ResponseLike<Object> = {
                                body: null
                            }
                            return of(responseResult).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            recorderSession = manager.createSession();
            let detailAArr: DetailAEnt[] = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailALiteral);
            const compIdMasterAAsObservable$ = detailAArr[0].compId.masterA.asObservable().pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );

            compIdMasterAAsObservable$.subscribe((masteeA) => {
                asyncCount.doNonPipedIncrement();
                chai.expect(masteeA.vcharA).to.eq('MasterAEnt_REG01_REG01_VcharA');
            });
            timer(10).subscribe(() => {
                compIdMasterAAsObservable$.subscribe((masteeA) => {
                    asyncCount.doNonPipedIncrement();
                    chai.expect(masteeA.vcharA).to.eq('MasterAEnt_REG01_REG01_VcharA');
                });
            });

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(4, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.detail-a-first-secont-second-third', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 2, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            };

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: pSnapshotMasterLiteral
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterA' ) {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            let responseResult: ResponseLike<Object> = {
                                body: null
                            }
                            return of(responseResult).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            recorderSession = manager.createSession();
            let detailAFirstSecondArr: DetailAEnt[] = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailAFirstSecondLiteral);
            let detailASecondThirdArr: DetailAEnt[] = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailASecondThirdLiteral);
            // detailAArr[0].compId.masterA.asObservable().pipe(
            //     asyncCount.registerRxOpr(),
            //     asyncCountdown.registerRxOpr()
            // ).subscribe((masteeA) => {
            //     asyncCount.doNonObservableIncrement();
            //     chai.expect(masteeA.vcharA).to.eq('MasterAEnt_REG01_REG01_VcharA');
            // });

            detailAFirstSecondArr[0].compId.masterA.asObservable().pipe(
                asyncCountdown.registerRxOpr()
            ).subscribe((masterA0) => {
                asyncCount.doNonPipedIncrement();
                detailASecondThirdArr[1].compId.masterA.pipe(
                    asyncCountdown.registerRxOpr()
                ).subscribe((masterA2) => {
                    asyncCount.doNonPipedIncrement();
                    chai.expect(masterA0).to.be.eq(masterA2);
                })
            })

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(2, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.detail-a-master-a-only-one-request-with-share', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 5, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            };

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: pSnapshotMasterLiteral
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            const obsRespAsyncCount = new AsyncCount();
            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(
                                delay(1)
                            );
                        } else if (info.fieldName === 'masterA' ) {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterLiteral
                            }
                            return of(responseResult).pipe(
                                delay(1),
                                obsRespAsyncCount.registerRxOpr(),
                                asyncCountdown.registerRxOpr(),
                                tap((value)=> {
                                    //console.log('obsRespAsyncCount.count: ' + obsRespAsyncCount.count);
                                }),
                                share()
                            );
                        } else {
                            let responseResult: ResponseLike<Object> = {
                                body: null
                            }
                            return of(responseResult).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            recorderSession = manager.createSession();
            let detailACol: DetailAEnt[] = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailALiteral);
            const masterRef0 = {value: undefined as MasterAEnt};
            const masterRef0AsObs = {value: undefined as MasterAEnt};
            const masterRef1 = {value: undefined as MasterAEnt};
            const masterRef1AsObs = {value: undefined as MasterAEnt};
            detailACol[0].compId.masterA.subscribe((masterA) => {
                asyncCount.doNonPipedIncrement();
                masterRef0.value = masterA;
            });
            detailACol[0].compId.masterA.asObservable().pipe(
                asyncCountdown.registerRxOpr()
            ).subscribe((masterA) => {
                asyncCount.doNonPipedIncrement();
                masterRef0AsObs.value = masterA;
            });
            detailACol[1].compId.masterA.subscribe((masterA) => {
                asyncCount.doNonPipedIncrement();
                masterRef1.value = masterA;
            });
            detailACol[1].compId.masterA.asObservable().pipe(
                asyncCountdown.registerRxOpr()
            ).subscribe((masterA) => {
                asyncCount.doNonPipedIncrement();
                masterRef1AsObs.value = masterA;
            });

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(masterRef0.value).to.be.eq(masterRef0AsObs.value, 'detailA.compId.masterA');
                chai.expect(masterRef0.value).to.be.eq(masterRef1.value, 'detailA.compId.masterA');
                chai.expect(masterRef0.value).to.be.eq(masterRef1AsObs.value, 'detailA.compId.masterA');
                chai.expect(asyncCount.count).to.eq(6, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.master-min-detail-min-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                return result;
            }

            recorderSession = manager.createSession();


            let masterMin: MasterMinEnt = recorderSession.processPlayerSnapshot(MasterMinEnt, pSnapshotMasterMinDetailMinTestLiteral);

            let detailAEntCol$ = masterMin.detailAEntCol.asObservable().pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );
            let sub = detailAEntCol$.subscribe((coll) => {
                asyncCount.doNonPipedIncrement();
                let detailAEntArr = Array.from(coll);
                for (let index = 0; index < detailAEntArr.length; index++) {
                    const detailAItem = detailAEntArr[index];
                    let compIdMasterA$ = detailAItem.compId.masterA.asObservable()
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                    let subB = compIdMasterA$.subscribe( (detMasterA) => {
                        asyncCount.doNonPipedIncrement();
                        chai.expect(masterMin)
                            .to.eq(detMasterA);
                        if (subB) {
                            subB.unsubscribe();
                        }
                    });
                }
                if (sub) {
                    sub.unsubscribe();
                }
            });
            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                }),
                catchError((err, caugth) => {
                    return throwError(err);
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(6, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.master-a-detail-a-min-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 6, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            return of(null).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            recorderSession = manager.createSession();
            let masterA: MasterAEnt = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterADetailAMinTestLiteral);
            let blobLazyA$ = masterA.blobLazyA.asObservable().pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );
            blobLazyA$.subscribe((valueStream) => {
                asyncCount.doNonPipedIncrement();
                let fromDirectRaw$ = ForNodeTest.StringProcessor.fromDirectRaw(of({ body: valueStream }), null).pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
                fromDirectRaw$.subscribe((reqStreamStr) => {
                    chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(reqStreamStr.body);
                });
            });

            let blobLazyB$ = masterA.blobLazyB.asObservable().pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );
            blobLazyB$.subscribe((valueStream) => {
                asyncCount.doNonPipedIncrement();
                // console.log('valueStream: ' + valueStream);
                chai.expect(valueStream).to.be.null;
            });

            let detailAEntCol$ = masterA.detailAEntCol.asObservable()
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            detailAEntCol$.subscribe((coll) => {
                asyncCount.doNonPipedIncrement();
                let detailAEntArr = Array.from(coll);
                for (let index = 0; index < detailAEntArr.length; index++) {
                    const detailAItem = detailAEntArr[index];
                    chai.expect(pSnapshotMasterADetailATestLiteral.wrappedSnapshot.detailAEntCol[index].detailAComp.vcharA)
                        .to.eq(detailAItem.detailAComp.vcharA);
                    chai.expect(pSnapshotMasterADetailATestLiteral.wrappedSnapshot.detailAEntCol[index].detailAComp.vcharB)
                        .to.eq(detailAItem.detailAComp.vcharB);
                    let compIdMasterA$ = detailAItem.compId.masterA.asObservable()
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                    compIdMasterA$.subscribe( (detMasterA) => {
                        chai.expect(masterA)
                            .to.eq(detMasterA);
                    });
                }
            });

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                }),
                catchError((err, caugth) => {
                    return throwError(err);
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(9, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.master-a-detail-a-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 6, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            return of(null).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );

            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            recorderSession = manager.createSession();
            let masterA: MasterAEnt = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterADetailATestLiteral);
            let blobLazyA$ = masterA.blobLazyA.asObservable()
            .pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );
            blobLazyA$.subscribe((valueStream) => {
                let fromDirectRaw$ = ForNodeTest.StringProcessor.fromDirectRaw(of({body: valueStream}), null).pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
                fromDirectRaw$.subscribe((reqStreamStr) => {
                    chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(reqStreamStr.body);
                });
            });

            let detailAEntCol$ = masterA.detailAEntCol.asObservable()
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            detailAEntCol$.subscribe((coll) => {
                let detailAEntArr = Array.from(coll);
                for (let index = 0; index < detailAEntArr.length; index++) {
                    const detailAItem = detailAEntArr[index];
                    chai.expect(pSnapshotMasterADetailATestLiteral.wrappedSnapshot.detailAEntCol[index].detailAComp.vcharA)
                        .to.eq(detailAItem.detailAComp.vcharA);
                    chai.expect(pSnapshotMasterADetailATestLiteral.wrappedSnapshot.detailAEntCol[index].detailAComp.vcharB)
                        .to.eq(detailAItem.detailAComp.vcharB);
                    let compIdMasterA$ = detailAItem.compId.masterA.asObservable()
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                    compIdMasterA$.subscribe( (detMasterA) => {
                        chai.expect(masterA)
                            .to.eq(detMasterA);
                    });
                }
            });

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                }),
                catchError((err, caugth) => {
                    return throwError(err);
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(6, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('RecorderManagerDefault.detail-a-arr-master-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(1));
                        } else if (info.fieldName === 'masterA' ) {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterLiteral
                            }
                            return of(responseResult).pipe(delay(1));
                        } else {
                            return of(null).pipe(delay(1));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            recorderSession = manager.createSession();
            let detailAArr: DetailAEnt[] = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailALiteral);
            const firstMasterARef = {value: null as MasterAEnt};
            for (let index = 0; index < detailAArr.length; index++) {
                const detailAItem = detailAArr[index];
                chai.expect(pSnapshotDetailALiteral.wrappedSnapshot[index].detailAComp.vcharA)
                    .to.eq(detailAItem.detailAComp.vcharA);
                chai.expect(pSnapshotDetailALiteral.wrappedSnapshot[index].detailAComp.vcharB)
                    .to.eq(detailAItem.detailAComp.vcharB);
                let compIdMasterA$ = detailAItem.compId.masterA.asObservable()
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );

                const subs2 = compIdMasterA$.subscribe( (detMasterA) => {
                    if (!firstMasterARef.value) {
                        firstMasterARef.value = detMasterA;
                    } else {
                        chai.expect(firstMasterARef.value).to.eq(detMasterA);
                    }
                    subs2.unsubscribe();
                });
            }

            asyncCountdown.createCountdownEnds().pipe(
                delay(1),
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.master-lazy-prp-over-sized-test', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);
            
            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();
            let cacheGetAsyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 18, timeOut: 1000 * debugTimeFactor });

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
                if(operation === 'getFromCache') {
                    cacheGetAsyncCount.doNonPipedIncrement();
                }
            };

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(1));
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<NodeJS.ReadableStream> = {
                            body: null
                        }
                        if (info.fieldName === 'blobLazyA') {
                            responseResult.body = fs.createReadStream('./test/master-lazy-prp-over-sized-blob-lazy-blob-lazy-a-test.txt');
                        } else if(info.fieldName === 'blobLazyB') {
                            responseResult.body = fs.createReadStream('./test/master-lazy-prp-over-sized-blob-lazy-blob-lazy-b-test.txt');
                        } else if(info.fieldName === 'clobLazyA') {
                            responseResult.body = fs.createReadStream('./test/master-lazy-prp-over-sized-blob-lazy-clob-lazy-a-test.txt');
                            responseResult.headers = new HttpHeaders().append('Content-Type', 'text/plain; charset=utf-8');
                        } else if(info.fieldName === 'clobLazyB') {
                            responseResult.body = fs.createReadStream('./test/master-lazy-prp-over-sized-blob-lazy-clob-lazy-b-test.txt');
                            responseResult.headers = new HttpHeaders().append('Content-Type', 'text/plain; charset=utf-8');
                        }
                        return of(responseResult)
                            .pipe(delay(1))
                            .pipe(
                                asyncCount.registerRxOpr()
                            );
                    }
                }
            );

            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );
            recorderSession = manager.createSession();
            let masterA: MasterAEnt = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterLazyPrpOverSizedLiteral);
            const nonRepeatableValueSet = new Set();

            const testParamByIntervalIndex: {delayForStreamRead: number, delayForLazyRef: number, expectedError: TypeLike<Error>, doNotUserAsObs?: boolean}[] = [
                {
                    delayForLazyRef: 0,
                    delayForStreamRead: 10 * debugTimeFactor,
                    expectedError: null
                },
                {
                    delayForLazyRef: 2,
                    delayForStreamRead: 0,
                    expectedError: null
                },
                {
                    delayForLazyRef: 5 * debugTimeFactor,
                    delayForStreamRead: 0,
                    expectedError: null
                },
                {
                    delayForLazyRef: 5 * debugTimeFactor,
                    delayForStreamRead: 0,
                    expectedError: null
                },
                {
                    delayForLazyRef: 5 * debugTimeFactor,
                    delayForStreamRead: 0,
                    expectedError: null,
                    doNotUserAsObs: true
                },
                {
                    delayForLazyRef: 5 * debugTimeFactor,
                    delayForStreamRead: 0,
                    expectedError: null,
                    doNotUserAsObs: true
                }
            ];
            let intervalIndex = -1;
            interval(1).pipe(
                take(testParamByIntervalIndex.length),
                asyncCountdown.registerRxOpr(() => 'asyncCountdown: interval(1): ' + intervalIndex)
            ).subscribe(() => {
                intervalIndex++;
                //console.log('interval.subscribe(); ' + intervalIndex + '; ' + new Date().getTime());
                let blobLazyA$ = of(null).pipe(
                    flatMap(() => {
                        if (testParamByIntervalIndex[intervalIndex].doNotUserAsObs) {
                            //console.log('intervalIndex: ' + intervalIndex + ' as sub');
                            return masterA.blobLazyA;
                        } else {
                            //console.log('intervalIndex: ' + intervalIndex + ' as obs');
                            return masterA.blobLazyA.asObservable();
                        }
                    }),
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr(() => 'asyncCountdown: blobLazyA$ = of(null).pipe(: ' + intervalIndex + ' as sub or obs'),
                    delay(testParamByIntervalIndex[intervalIndex].delayForLazyRef)
                );
                try {
                    const subs = blobLazyA$.subscribe( 
                        {
                            next: (valueStream) => {
                                //console.log('intervalIndex: ' + intervalIndex);
                                //console.log('blobLazyA$.subscribe(); ' + intervalIndex + '; ' + new Date().getTime());
                                asyncCount.doNonPipedIncrement();
                                chai.expect(testParamByIntervalIndex[intervalIndex].expectedError).to.be.null;
                                chai.expect(nonRepeatableValueSet).to.not.contains(blobLazyA$);
                                chai.expect(nonRepeatableValueSet).to.not.contains(valueStream);
                                
                                chai.expect(intervalIndex).to.not.equals(1);
                                nonRepeatableValueSet.add(valueStream);
                                nonRepeatableValueSet.add(blobLazyA$);
    
                                let fromDirectRaw$ = timer(testParamByIntervalIndex[intervalIndex].delayForStreamRead).pipe(
                                    flatMap(() => {
                                        return ForNodeTest.StringProcessor.fromDirectRaw(of({ body: valueStream }), null).pipe(
                                            asyncCount.registerRxOpr(),
                                            asyncCountdown.registerRxOpr(() => 'asyncCountdown: fromDirectRaw$: ' + intervalIndex),
                                            delay(testParamByIntervalIndex[intervalIndex].delayForStreamRead)
                                        );
                                    })
                                )
                                const subs2 = fromDirectRaw$.subscribe((reqStreamStr) => {
                                    //console.log('fromDirectRaw$.subscribe(); ' + intervalIndex + '; ' + new Date().getTime());
                                    chai.expect(nonRepeatableValueSet).to.not.contains(fromDirectRaw$);
                                    nonRepeatableValueSet.add(fromDirectRaw$);
                                    chai.expect(reqStreamStr.body)
                                        .to.satisfy(
                                            (resultB: string) => {
                                                //for debug purpose
                                                fromDirectRaw$ === fromDirectRaw$;
                                                valueStream === valueStream
    
                                                return resultB
                                                    .startsWith('MasterAEnt_REG01_BlobLazyAMasterAEnt_REG01_'+
                                                        'BlobLazyAMasterAEnt_REG01_BlobLazyAMasterAEnt');
                                            }
                                        );
                                    if(subs2) {
                                        subs2.unsubscribe();
                                    }
                                });
                                if (subs) {
                                    subs.unsubscribe();
                                }
                            },
                            complete: () => {
                            }
                        }
                    );
                } catch (err) {
                    chai.expect(testParamByIntervalIndex[intervalIndex].expectedError, 'intervalIndex: ' + intervalIndex + '; ' + err).to.be.not.null;
                    chai.expect(err).to.be.an.instanceof(testParamByIntervalIndex[intervalIndex].expectedError);
                }
            });

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(19, 'asyncCount');
                chai.expect(cacheGetAsyncCount.count).to.eq(testParamByIntervalIndex.length, 'cacheGetAsyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        //it('RecorderManagerDefault.master-a-detail-a-record', 1 == 1 ? (done) => {done();} : (done) => {
        it('RecorderManagerDefault.master-a-detail-a-record', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntries);            

            let asyncCount = new AsyncCount();

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'vcharA' || fieldName === 'vcharB';
                        }
                    );
                return result;
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                        }
                    );
                return result;
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                        }
                    );
                return result;
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, result) => {
                chai.expect(info.fieldName)
                    .to.satisfy(
                        (fieldName: string) => {
                            return fieldName === 'blobA' || fieldName === 'blobB';
                        }
                    );
                return result;
            }

            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (info.fieldName === 'detailAEntCol') {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterDetailAColLiteral
                            }
                            return of(responseResult).pipe(delay(10));
                        } else if (info.fieldName === 'masterB') {
                            let responseResult: ResponseLike<Object> = {
                                body: (pSnapshotWSnapMasterBBySign as any)[signature]
                            }
                            return of(responseResult).pipe(delay(10));
                        } else if (info.fieldName === 'masterA' ) {
                            let responseResult: ResponseLike<Object> = {
                                body: pSnapshotMasterLiteral
                            }
                            return of(responseResult).pipe(delay(10));
                        } else {
                            return of(null).pipe(delay(10));
                        }
                    },
                    generateObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<BinaryStream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(10));
                    }
                }
            );
            let manager: RecorderManager = new RecorderManagerDefault(
                config, 
                );
            recorderSession = manager.createSession();

            let dataAsyncCountdown = new AsyncCountdown({ count: 4, timeOut: 500 * debugTimeFactor });
            let tapeAsyncCountdown = new AsyncCountdown({ count: 7, timeOut: 1000 * debugTimeFactor });

            let masterA: MasterAEnt = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterADetailATestLiteral);
            
            recorderSession.startRecording();
            masterA.dateA = new Date(Date.UTC(2019, 10, 20));
            let readableStream = new MemStreamReadableStreamAutoEnd('masterA.blobLazyA: CHANGHED');
            let binaryWRStream: BinaryStream = Object.assign(readableStream, NonWritableStreamExtraMethods);
            masterA.blobLazyA.setLazyObj(binaryWRStream);
            recorderSession.createSerialPendingTasksWaiting().subscribe(() => {
                masterA.detailAEntCol.subscribeToModify((coll) => {
                    dataAsyncCountdown.doNonPipedCountdown();
                    asyncCount.doNonPipedIncrement();
                    let detailAEntArr = Array.from(coll);
                    for (let index = 0; index < detailAEntArr.length; index++) {
                        dataAsyncCountdown.doNonPipedCountdown();
                        const detailAItem = detailAEntArr[index];
                        detailAItem.vcharA = 
                            '[' + detailAItem.compId.masterA.playerObjectId + ',' +
                            detailAItem.compId.subId + '].vcharA_changed';
                    }
                });
            });

            dataAsyncCountdown.createCountdownEnds().pipe(
                map(() => {
                    recorderSession.stopRecording();
                    return recorderSession.getLastRecordedTapeAndStreams();
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr(),
                tap((tapeAndStreams) => {
                    asyncCount.doNonPipedIncrement();
                    tapeAsyncCountdown.doNonPipedCountdown();
                    chai.expect(tapeAndStreams.tape.actions.length).to.eq(5);
                    chai.expect(tapeAndStreams.tape.actions[0].actionType).to.eq(TapeActionType.SetField);
                    chai.expect(tapeAndStreams.tape.actions[0].fieldName).to.eq('dateA');
                    chai.expect(tapeAndStreams.tape.actions[0].simpleSettedValue).to.eq(1574208000000);
                    chai.expect(tapeAndStreams.tape.actions[2].actionType).to.eq(TapeActionType.SetField);
                    chai.expect(tapeAndStreams.tape.actions[2].fieldName).to.eq('vcharA');
                    chai.expect(tapeAndStreams.tape.actions[2].simpleSettedValue).to.eq('[1,0].vcharA_changed');
                    chai.expect(tapeAndStreams.tape.actions[3].actionType).to.eq(TapeActionType.SetField);
                    chai.expect(tapeAndStreams.tape.actions[3].fieldName).to.eq('vcharA');
                    chai.expect(tapeAndStreams.tape.actions[3].simpleSettedValue).to.eq('[1,1].vcharA_changed');
                    chai.expect(tapeAndStreams.tape.actions[4].actionType).to.eq(TapeActionType.SetField);
                    chai.expect(tapeAndStreams.tape.actions[4].fieldName).to.eq('vcharA');
                    chai.expect(tapeAndStreams.tape.actions[4].simpleSettedValue).to.eq('[1,2].vcharA_changed');
                }),
                flatMap((tapeAndStreams) => {
                    asyncCount.doNonPipedIncrement();
                    tapeAsyncCountdown.doNonPipedCountdown();
                    let stream$ = tapeAndStreams.streams.get(tapeAndStreams.tape.actions[1].attachRefId);
                    let fromDirectRaw$ = stream$.pipe(
                        flatMap((stream) => {
                            return ForNodeTest.StringProcessor.fromDirectRaw(of({ body: stream }), null);
                        })
                    );
                    return fromDirectRaw$;
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr(),
                map((respStream) => {
                    asyncCount.doNonPipedIncrement();
                    tapeAsyncCountdown.doNonPipedCountdown();
                    chai.expect(respStream.body).to.eq('masterA.blobLazyA: CHANGHED');
                    return recorderSession.getLastRecordedTapeAsLiteralAndStreams();
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr()
            ).subscribe((tapeAndStreamsLiteral) => {
                asyncCount.doNonPipedIncrement();
                tapeAsyncCountdown.doNonPipedCountdown();
            });

            tapeAsyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(8, 'asyncCount');
                done();
            });
        }).timeout(2000 * debugTimeFactor);
    });
}
