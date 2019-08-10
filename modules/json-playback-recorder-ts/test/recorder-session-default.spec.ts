import {HttpResponse, HttpHeaders} from '@angular/common/http';

import * as chai from 'chai';
import { Observable, of, OperatorFunction, from, Subject, BehaviorSubject, concat, throwError, combineLatest } from 'rxjs';
import pSnapshotMasterLiteral from './master-a-test.json';
import pSnapshotMasterLazyPrpOverSizedLiteral from './master-lazy-prp-over-sized-test.json';
import pSnapshotMasterADetailATestLiteral from './master-a-detail-a-test.json';
import pSnapshotDetailALiteral from './detail-a-by-sig.json';
import { MasterAEnt } from './entities/master-a-ent';
import { Readable, Stream } from 'stream';
import * as memStreams from 'memory-streams';
import { ForNodeTest } from './native-for-node-test';
import * as fs from 'fs';
import { delay, flatMap, map, catchError, timeout, tap, share } from 'rxjs/operators';
import { ResponseLike } from '../src/typeslike';
import { mapJustOnceRxOpr, flatMapJustOnceRxOpr } from '../src/implementation/rxjs-util.js';
import { RecorderSession } from '../src/api/session.js';
import { RecorderConfigDefault } from '../src/implementation/recorder-config-default.js';
import { RecorderConfig, RecorderLogLevel, RecorderLogger } from '../src/api/recorder-config.js';
import { RecorderDecorators } from '../src/api/recorder-decorators';
import { RecorderConstants } from '../src/implementation/recorder-constants.js';
import { StringStream, BinaryStream, NonWritableStreamExtraMethods } from '../src/api/lazy-ref.js';
import { RecorderManager } from '../src/api/recorder-manager.js';
import { RecorderManagerDefault } from '../src/implementation/recorder-manager-default.js';
import { TapeActionType } from '../src/api/tape.js';
import { AsyncCountdown } from './async-countdown.js';
import { AsyncCount } from './async-count.js';
import { MemStreamReadableStreamAutoEnd } from '../src/implementation/mem-stream-readable-stream-auto-end.js';
import { DetailAEnt } from './entities/detail-a-ent.js';
import { RecorderSessionImplementor } from '../src/implementation/recorder-session-default.js';

{
    describe('RecorderManagerDefault', () => {
        it('RecorderManagerDefault.poc-observable-just-once-pipe-test', (done) => {
            // let subTest1 = new Subject<number>();
            // let subTest2 = new Subject<number>();
            // let subTest1$ = subTest1.asObservable()
            //     .pipe(delay(1));
            // let subTest2$ = subTest2.asObservable()
            //     .pipe(delay(1));

            // subTest1$ = subTest1$.pipe(
            //     map((value) => {
            //         console.log('subTest1$.pipe: ' + value);
            //         return value;
            //     })
            // );
            // subTest2$ = subTest2$.pipe(
            //     flatMap((value) => {
            //         console.log('subTest2$.pipe: ' + value);
            //         return of(value);
            //     })
            // );
            // // let subTestFork$ = forkJoin(subTest1$, subTest2$,
            // //     (v1: any, v2: any) => {
            // //         console.log('subTestFork$ => (v1: any, v2: any): ' + [v1, v2]);
            // //         return [v1, v2];
            // //     })
            // let subTestFork$ = concat([subTest1$, subTest2$])
            //     .pipe (
            //         map((value) => {
            //             console.log('subTestFork$.pipe => map: ' + value);
            //             return value;
            //         })
            //     )
            //     .pipe(
            //         catchError((err, caugth) => {
            //             console.log('subTestFork$.pipe => err: ' + err);
            //             return err;
            //         })
            //     );

            // subTest1$.subscribe(
            //     {next: (value) => {
            //         console.log('subTest1$.subscribe: ' + value);
            //     }}
            // );
            // subTest2$.subscribe(
            //     {next: (value) => {
            //         console.log('subTest2$.subscribe: ' + value);
            //     }}
            // );
            // subTestFork$.subscribe(
            //     {
            //         next: (value) => {
            //             console.log('subTestFork.subscribe: ' + value);
            //         },
            //         error: (err) => {
            //             console.error('subTestFork.subscribe => error: ' + err);
            //         },
            //         complete: () => {
            //             console.error('subTestFork.subscribe => complete: ');
            //         }
            //     });

            // subTest1.next(1);
            // subTest2.next(2);

            // const example = forkJoin(
            //     //emit 'Hello' immediately
            //     of('Hello'),
            //     //emit 'World' after 1 second
            //     of('World').pipe(delay(1000)),
            //     //new BehaviorSubject('BSub').asObservable().pipe(delay(1000))
            //     //new BehaviorSubject('BSub').pipe(delay(1000))
            //     new BehaviorSubject('BSub')
            //     // ,
            //     // // throw error
            //     // throwError('This will error')
            // ).pipe(catchError(error => of(error)));
            // //output: 'This will Error'
            // const subscribe = example.subscribe(val => console.log(val));

            //let asyncCount = 0;
            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1000});

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
        });

        it('RecorderManagerDefault.poc-observable-each-pipe-test', (done) => {
            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 8, timeOut: 1000});            

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

        });

        it('RecorderManagerDefault.master-a-test-async', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesAsync);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 1000});

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

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    }
                ).pipe(
                    asyncCount.registerRxOpr()
                );
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    }
                ).pipe(
                    asyncCount.registerRxOpr()
                );
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

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            }

            recorderSession = manager.createSession();
            let masterA$: Observable<MasterAEnt> = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterLiteral)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        masterA.blobLazyA.subscribe( 
                            {
                                next: (valueStream) => {
                                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(valueStream, null)
                                    .pipe(
                                        asyncCount.registerRxOpr(),
                                        asyncCountdown.registerRxOpr()
                                    );
                                    fromDirectRaw$.subscribe((streamStr) => {
                                        chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(streamStr);
                                    });
                                },
                                complete: () => {
                                }
                            }
                        );
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
        });

        it('RecorderManagerDefault.master-a-test-sync', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerSync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesSync);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 1000});

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

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    }
                ).pipe(
                    asyncCount.registerRxOpr()
                );
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    }
                ).pipe(
                    asyncCount.registerRxOpr()
                );
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

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            }

            recorderSession = manager.createSession();
            let masterA$: Observable<MasterAEnt> = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterLiteral)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        masterA.blobLazyA.subscribe( 
                            {
                                next: (valueStream) => {
                                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(valueStream, null)
                                    .pipe(
                                        asyncCount.registerRxOpr(),
                                        asyncCountdown.registerRxOpr()
                                    );
                                    fromDirectRaw$.subscribe((streamStr) => {
                                        chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(streamStr);
                                    });
                                },
                                complete: () => {
                                }
                            }
                        );
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.detail-a-master-a-async', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesAsync);            

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 2, timeOut: 1000});

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

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    }
                ).pipe(
                    asyncCount.registerRxOpr()
                );
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    }
                ).pipe(
                    asyncCount.registerRxOpr()
                );
            }

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
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            }

            recorderSession = manager.createSession();
            let detailAArr$: Observable<DetailAEnt[]> = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailALiteral)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            detailAArr$.subscribe(
                {
                    next: (detailAArr) => {
                        detailAArr[0].compId.masterA.asObservable().pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        ).subscribe((masteeA) => {
                            chai.expect(masteeA.vcharA).to.eq('MasterAEnt_REG01_REG01_VcharA');
                        });
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(4, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.master-a-detail-a-test-sync', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerSync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesSync);
                
            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 6, timeOut: 1000});

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

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );;
            };

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            };

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
                });

            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );;
            }

            recorderSession = manager.createSession();
            let masterA$: Observable<MasterAEnt> = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterADetailATestLiteral)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        let blobLazyA$ = masterA.blobLazyA.asObservable()
                            .pipe(
                                asyncCount.registerRxOpr(),
                                asyncCountdown.registerRxOpr()
                            );
                        blobLazyA$.subscribe((valueStream) => {
                            let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(valueStream, null)
                            .pipe(
                                asyncCount.registerRxOpr(),
                                asyncCountdown.registerRxOpr()
                            );
                            fromDirectRaw$.subscribe((streamStr) => {
                                chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(streamStr);
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
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(7, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.master-a-detail-a-test-async', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesAsync);
                
            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 15, timeOut: 1000});

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

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );;
            };

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };
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

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );;
            }

            recorderSession = manager.createSession();
            let masterA$: Observable<MasterAEnt> = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterADetailATestLiteral)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            masterA$.subscribe((masterA) => {
                masterA.blobLazyA.subscribe((valueStream) => {
                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(valueStream, null)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                    fromDirectRaw$.subscribe((streamStr) => {
                        chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(streamStr);
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
            });

            asyncCountdown.createCountdownEnds().pipe(
                delay(1),
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(59, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.detail-a-arr-master-test-async', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesAsync);
                
            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000});

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

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    share()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    share()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    share()
                );;
            };

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    share()
                );
            };
            config.configLazyObservableProvider(
                {
                    generateObservable: (signature, info) => {
                        if (!signature) {
                            throw new Error('Signature not found');
                        }
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
            let manager: RecorderManager = new RecorderManagerDefault(
                config
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr(),
                    share()
                );;
            }

            recorderSession = manager.createSession();
            let detailAArr$: Observable<DetailAEnt[]> = recorderSession.processPlayerSnapshotArray(DetailAEnt, pSnapshotDetailALiteral)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            const firstMasterARef = {value: null as MasterAEnt};
            const subs = detailAArr$.subscribe((detailAArr) => {
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
                subs.unsubscribe();
            });
            
            asyncCountdown.createCountdownEnds().pipe(
                delay(1),
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(12, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.master-lazy-prp-over-sized-test-async', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesAsync);

            let asyncCount = new AsyncCount();
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1000});

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

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    }
                );
            }

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    }
                )
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            }

            recorderSession = manager.createSession();
            (recorderSession as RecorderSessionImplementor).decorateCreateNotLoadedLazyRef(
                (options) => {
                    if (options.refererKey === 'blobLazyA') {
                        return options.originalResult.pipe(delay(200));
                    } else {
                        return options.originalResult;
                    }
                }
            );

            let masterA$: Observable<MasterAEnt> = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterLazyPrpOverSizedLiteral)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        let blobLazyA$ = masterA.blobLazyA.asObservable()
                            .pipe(
                                asyncCount.registerRxOpr(),
                                asyncCountdown.registerRxOpr()
                            );
                        blobLazyA$.subscribe( 
                            {
                                next: (valueStream) => {
                                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(valueStream, null)
                                    .pipe(
                                        asyncCount.registerRxOpr(),
                                        asyncCountdown.registerRxOpr()
                                    );
                                    fromDirectRaw$.subscribe((streamStr) => {
                                        chai.expect(streamStr)
                                            .to.satisfy(
                                                (resultB: string) => {
                                                    return resultB
                                                        .startsWith('MasterAEnt_REG01_BlobLazyAMasterAEnt_REG01_'+
                                                            'BlobLazyAMasterAEnt_REG01_BlobLazyAMasterAEnt');
                                                }
                                            );
                                    });
                                },
                                complete: () => {
                                }
                            }
                        );
            
                        recorderSession.manager.config.cacheHandler.clearCache();
                    }
                }
            );

            asyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting();
                })
            )
            .subscribe(() => {
                chai.expect(asyncCount.count).to.eq(6, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.master-a-detail-a-record-sync', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerSync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesSync);


            let asyncCount = new AsyncCount();
            // let asyncCount = 0;
            // let asyncCountDown = 8;
            // let allAsyncEndedSub = new Subject<void>();
            // let allAsyncEndedSub$ = allAsyncEndedSub.asObservable();
            // let asyncCountDownStepFunc = () => {
            //     asyncCount++;
            //     if (--asyncCountDown === 0) {
            //         setTimeout(() => {allAsyncEndedSub.next(null);});
            //     } else if (asyncCountDown < 0) {
            //         throw new Error('Invalid asyncCountDown: ' + asyncCountDown);
            //     }
            // }

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
                asyncCount.doNonObservableIncrement();
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };
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
                config, 
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );  
            }

            recorderSession = manager.createSession();
            recorderSession.startRecording();

            let dataAsyncCountdown = new AsyncCountdown({ count: 3, timeOut: 500});
            let tapeAsyncCountdown = new AsyncCountdown({ count: 3, timeOut: 700});

            let masterA$: Observable<MasterAEnt> = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterADetailATestLiteral);
            masterA$ = masterA$.pipe(dataAsyncCountdown.registerRxOpr());
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        masterA.dateA = new Date(Date.UTC(2019, 10, 20));
                        let readableStream = new MemStreamReadableStreamAutoEnd('masterA.blobLazyA: CHANGHED');
                        let binaryWRStream: BinaryStream = Object.assign(readableStream, NonWritableStreamExtraMethods);
                        let setLazyObj$ = masterA.blobLazyA.setLazyObj(binaryWRStream).pipe(dataAsyncCountdown.registerRxOpr());
                        setLazyObj$.subscribe(() => {
                            let detailAEntCol$ = masterA.detailAEntCol.asObservable().pipe(dataAsyncCountdown.registerRxOpr());
                            detailAEntCol$.subscribe((coll) => {
                                let detailAEntArr = Array.from(coll);
                                for (let index = 0; index < detailAEntArr.length; index++) {
                                    const detailAItem = detailAEntArr[index];
                                    detailAItem.vcharA = 
                                        '[' + detailAItem.compId.masterA.playerObjectId + ',' +
                                        detailAItem.compId.subId + '].vcharA_changed';
                                }
                            });
                        });
                    }
                }
            );

            dataAsyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    recorderSession.stopRecording();
                    return recorderSession.getLastRecordedTapeAndStreams();
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr(),
                tap((tapeAndStreams) => {
                    // chai.expect(tape.actions.length).to.eq(3);
                    // chai.expect(tape.actions[0].actionType).to.eq(TapeActionType.SetField);
                    // chai.expect(tape.actions[0].fieldName).to.eq('dateA');
                    // chai.expect(tape.actions[0].simpleSettedValue).to.eq(1574208000000);
                    // chai.expect(tape.actions[1].actionType).to.eq(TapeActionType.SetField);
                    // chai.expect(tape.actions[1].fieldName).to.eq('vcharA');
                    // chai.expect(tape.actions[1].simpleSettedValue).to.eq('[1,0].vcharA_changed');
                    // chai.expect(tape.actions[2].actionType).to.eq(TapeActionType.SetField);
                    // chai.expect(tape.actions[2].fieldName).to.eq('vcharA');
                    // chai.expect(tape.actions[2].simpleSettedValue).to.eq('[1,1].vcharA_changed');
                    //console.log(tapeAndStreams.tape);
                    // getStream(tapeAndStreams.streams.get(tapeAndStreams.tape.actions[1].attachRefId)).then((streamPrm) => {
                    //     console.log(streamPrm);
                    // })
                }),
                flatMap((tapeAndStreams) => {
                    let stream = tapeAndStreams.streams.get(tapeAndStreams.tape.actions[1].attachRefId);
                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, null);
                    return fromDirectRaw$;
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr(),
                flatMap((fromDirectRaw) => {
                    chai.expect(fromDirectRaw).to.eq('masterA.blobLazyA: CHANGHED');
                    return recorderSession.getLastRecordedTapeAsLiteralAndStreams();
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr()
            ).subscribe((tapeAndStreamsLiteral) => {
                console.log('tape subs');
                //console.log(tapeAndStreamsLiteral);
            });

            // allAsyncEndedSub$ = allAsyncEndedSub$.pipe(
            //     flatMap(() => {
            //         recorderSession.stopRecording();
            //         asyncCountDown++;
            //         return recorderSession.getLastRecordedTapeAndStreams();
            //     }),
            //     flatMap((tapeAndStreams) => {
            //         // chai.expect(tape.actions.length).to.eq(3);
            //         // chai.expect(tape.actions[0].actionType).to.eq(TapeActionType.SetField);
            //         // chai.expect(tape.actions[0].fieldName).to.eq('dateA');
            //         // chai.expect(tape.actions[0].simpleSettedValue).to.eq(1574208000000);
            //         // chai.expect(tape.actions[1].actionType).to.eq(TapeActionType.SetField);
            //         // chai.expect(tape.actions[1].fieldName).to.eq('vcharA');
            //         // chai.expect(tape.actions[1].simpleSettedValue).to.eq('[1,0].vcharA_changed');
            //         // chai.expect(tape.actions[2].actionType).to.eq(TapeActionType.SetField);
            //         // chai.expect(tape.actions[2].fieldName).to.eq('vcharA');
            //         // chai.expect(tape.actions[2].simpleSettedValue).to.eq('[1,1].vcharA_changed');
            //         ; 'masterA.blobLazyA: CHANGHED'
            //         console.log(tapeAndStreams.tape);
            //         let streamStr$ = from(getStream(tapeAndStreams.streams.get(tapeAndStreams.tape.actions[1].attachRefId)));
            //         streamStr$.subscribe((streamStr) => {
            //             chai.expect(streamStr).to.eq('masterA.blobLazyA: CHANGHED');
            //         });
            //         asyncCountDown++;
            //         return recorderSession.getLastRecordedTapeAsLiteral();
            //     }),
            //     flatMap((tapeLiteral) => {
            //         console.log(tapeLiteral);
            //         return of(null);
            //     }),
            // )

            tapeAsyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(8, 'asyncCount');
                done();
            });
        });

        it('RecorderManagerDefault.master-a-detail-a-record-async', (done) => {
            let newCacheHandler = ForNodeTest.createCacheHandlerWithInterceptor(ForNodeTest.CacheHandlerAsync);

            let recorderSession: RecorderSession;
            let config: RecorderConfig = new RecorderConfigDefault()
                .configLogLevel(RecorderLogger.All, RecorderLogLevel.Error)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(ForNodeTest.TypeProcessorEntriesAsync);


            let asyncCount = new AsyncCount();
            // let asyncCount = 0;
            // let asyncCountDown = 8;
            // let allAsyncEndedSub = new Subject<void>();
            // let allAsyncEndedSub$ = allAsyncEndedSub.asObservable();
            // let asyncCountDownStepFunc = () => {
            //     asyncCount++;
            //     if (--asyncCountDown === 0) {
            //         setTimeout(() => {allAsyncEndedSub.next(null);});
            //     } else if (asyncCountDown < 0) {
            //         throw new Error('Invalid asyncCountDown: ' + asyncCountDown);
            //     }
            // }

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                // console.log(operation + ', ' + cacheKey + ', ' + stream);
                asyncCount.doNonObservableIncrement();
            }

            let propertyOptionsString: RecorderDecorators.PropertyOptions<String> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: RecorderDecorators.PropertyOptions<BinaryStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: RecorderDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobLazyA' || fieldName === 'blobLazyB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsClobDirectRaw.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'clobLazyA' || fieldName === 'clobLazyB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };

            propertyOptionsBlob.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'blobA' || fieldName === 'blobB';
                                }
                            );
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );
            };
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
                config, 
                );

            let propertyOptions: RecorderDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        return source;
                    },
                    asyncCount.registerRxOpr()
                );  
            }

            recorderSession = manager.createSession();
            recorderSession.startRecording();

            let dataAsyncCountdown = new AsyncCountdown({ count: 3, timeOut: 500});
            let tapeAsyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000});

            let masterA$: Observable<MasterAEnt> = recorderSession.processPlayerSnapshot(MasterAEnt, pSnapshotMasterADetailATestLiteral);
            masterA$ = masterA$.pipe(dataAsyncCountdown.registerRxOpr());
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        masterA.dateA = new Date(Date.UTC(2019, 10, 20));
                        let readableStream = new MemStreamReadableStreamAutoEnd('masterA.blobLazyA: CHANGHED');
                        let binaryWRStream: BinaryStream = Object.assign(readableStream, NonWritableStreamExtraMethods);
                        let setLazyObj$ = masterA.blobLazyA.setLazyObj(binaryWRStream).pipe(dataAsyncCountdown.registerRxOpr());
                        setLazyObj$.subscribe(() => {
                            let detailAEntCol$ = masterA.detailAEntCol.asObservable().pipe(dataAsyncCountdown.registerRxOpr());
                            detailAEntCol$.subscribe((coll) => {
                                let detailAEntArr = Array.from(coll);
                                for (let index = 0; index < detailAEntArr.length; index++) {
                                    const detailAItem = detailAEntArr[index];
                                    detailAItem.vcharA = 
                                        '[' + detailAItem.compId.masterA.playerObjectId + ',' +
                                        detailAItem.compId.subId + '].vcharA_changed';
                                }
                            });
                        });
                    }
                }
            );

            dataAsyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    recorderSession.stopRecording();
                    return recorderSession.getLastRecordedTapeAndStreams();
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr(),
                tap((tapeAndStreams) => {
                    // chai.expect(tape.actions.length).to.eq(3);
                    // chai.expect(tape.actions[0].actionType).to.eq(TapeActionType.SetField);
                    // chai.expect(tape.actions[0].fieldName).to.eq('dateA');
                    // chai.expect(tape.actions[0].simpleSettedValue).to.eq(1574208000000);
                    // chai.expect(tape.actions[1].actionType).to.eq(TapeActionType.SetField);
                    // chai.expect(tape.actions[1].fieldName).to.eq('vcharA');
                    // chai.expect(tape.actions[1].simpleSettedValue).to.eq('[1,0].vcharA_changed');
                    // chai.expect(tape.actions[2].actionType).to.eq(TapeActionType.SetField);
                    // chai.expect(tape.actions[2].fieldName).to.eq('vcharA');
                    // chai.expect(tape.actions[2].simpleSettedValue).to.eq('[1,1].vcharA_changed');
                    //console.log(tapeAndStreams.tape);
                    // getStream(tapeAndStreams.streams.get(tapeAndStreams.tape.actions[1].attachRefId)).then((streamPrm) => {
                    //     console.log(streamPrm);
                    // })
                }),
                flatMap((tapeAndStreams) => {
                    let stream = tapeAndStreams.streams.get(tapeAndStreams.tape.actions[1].attachRefId);
                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, null);
                    return fromDirectRaw$;
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr(),
                flatMap((fromDirectRaw) => {
                    chai.expect(fromDirectRaw).to.eq('masterA.blobLazyA: CHANGHED');
                    return recorderSession.getLastRecordedTapeAsLiteralAndStreams();
                }),
                asyncCount.registerRxOpr(),
                tapeAsyncCountdown.registerRxOpr()
            ).subscribe((tapeAndStreamsLiteral) => {
                console.log('tape subs');
                //console.log(tapeAndStreamsLiteral);
            });

            // allAsyncEndedSub$ = allAsyncEndedSub$.pipe(
            //     flatMap(() => {
            //         recorderSession.stopRecording();
            //         asyncCountDown++;
            //         return recorderSession.getLastRecordedTapeAndStreams();
            //     }),
            //     flatMap((tapeAndStreams) => {
            //         // chai.expect(tape.actions.length).to.eq(3);
            //         // chai.expect(tape.actions[0].actionType).to.eq(TapeActionType.SetField);
            //         // chai.expect(tape.actions[0].fieldName).to.eq('dateA');
            //         // chai.expect(tape.actions[0].simpleSettedValue).to.eq(1574208000000);
            //         // chai.expect(tape.actions[1].actionType).to.eq(TapeActionType.SetField);
            //         // chai.expect(tape.actions[1].fieldName).to.eq('vcharA');
            //         // chai.expect(tape.actions[1].simpleSettedValue).to.eq('[1,0].vcharA_changed');
            //         // chai.expect(tape.actions[2].actionType).to.eq(TapeActionType.SetField);
            //         // chai.expect(tape.actions[2].fieldName).to.eq('vcharA');
            //         // chai.expect(tape.actions[2].simpleSettedValue).to.eq('[1,1].vcharA_changed');
            //         ; 'masterA.blobLazyA: CHANGHED'
            //         console.log(tapeAndStreams.tape);
            //         let streamStr$ = from(getStream(tapeAndStreams.streams.get(tapeAndStreams.tape.actions[1].attachRefId)));
            //         streamStr$.subscribe((streamStr) => {
            //             chai.expect(streamStr).to.eq('masterA.blobLazyA: CHANGHED');
            //         });
            //         asyncCountDown++;
            //         return recorderSession.getLastRecordedTapeAsLiteral();
            //     }),
            //     flatMap((tapeLiteral) => {
            //         console.log(tapeLiteral);
            //         return of(null);
            //     }),
            // )

            tapeAsyncCountdown.createCountdownEnds().pipe(
                flatMap(() => {
                    return recorderSession.createSerialPendingTasksWaiting()
                })
            ).subscribe(() => {
                chai.expect(asyncCount.count).to.eq(63, 'asyncCount');
                done();
            });
        });
    });
}
