import {HttpResponse, HttpHeaders} from '@angular/common/http';
// let Blob = Buffer;
// (global as any).Blob = Blob;
// let atob = require('atob');
// (global as any).atob = atob;
// let btoa = require('btoa');
// (global as any).btoa = btoa;
// let FileReader = require('filereader');
// (global as any).FileReader = FileReader;

import * as chai from 'chai';
import { IJsHbSession } from '../src/js-hb-session';
import { JsHbManagerDefault, IJsHbManager } from '../src/js-hb-manager';
import { JsHbConfigDefault, IJsHbConfig, JsHbLogLevel } from '../src/js-hb-config';
import { Observable, of, OperatorFunction, from, Subject, BehaviorSubject, concat, throwError, combineLatest } from 'rxjs';
import resultMasterLiteral from './master-a-test.json';
import resultMasterLazyPrpOverSizedTest from './master-lazy-prp-over-sized-test.json';
import { MasterAEnt } from './entities/master-a-ent';
import { NgJsHbDecorators } from '../src/js-hb-decorators';
import { JsHbContants } from '../src/js-hb-constants';
import { Readable, Stream } from 'stream';
import * as memStreams from 'memory-streams';
import { JsHbForNodeTest } from './native-for-node-test';
import * as fs from 'fs';
import { ResponseLike } from '../src/js-hb-http-lazy-observable-gen';
import { delay, flatMap, map, catchError, timeout } from 'rxjs/operators';
import { StringStream } from '../src/lazy-ref';
import { mapJustOnceRxOpr, flatMapJustOnceRxOpr } from '../src/rxjs-util';



{
    describe('JsHbManagerDefault', () => {
        it('poc-observable-just-once-pipe-test', (done) => {
            // let subTest1 = new Subject<number>();
            // let subTest2 = new Subject<number>();
            // let subTest1$ = subTest1.asObservable()
            //     .pipe(delay(10));
            // let subTest2$ = subTest2.asObservable()
            //     .pipe(delay(10));

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

            let asyncCount = 0;
            let streamReadCount = 6;
            let allStreamReadedSub = new Subject<void>();
            let allStreamReaded$ = allStreamReadedSub.asObservable();

            let obs1$: Observable<void> = of(undefined).pipe(delay(10));
            let obs2$: Observable<void> = of(undefined).pipe(delay(10));

            obs1$ = obs1$
                .pipe(
                    mapJustOnceRxOpr((value) => {
                    //map((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs1$.pipe() => map(): ' + value);
                        return value;
                    })
                );

            obs1$ = obs1$
                .pipe(
                    flatMapJustOnceRxOpr((value) => {
                    //flatMap((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs1$.pipe() => flatMap(): ' + value);
                        return of(value);
                    })
                )
                .pipe(
                    flatMapJustOnceRxOpr((value) => {
                    //flatMap((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs1$.pipe() => flatMap() 2a vez: ' + value);
                        return of(value);
                    })
                )
                ;

            obs2$ = obs2$
                .pipe(
                    mapJustOnceRxOpr((value) => {
                    //map((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs2$.pipe() => map(): ' + value);
                        return value;
                    })
                );

            let obs3$ = combineLatest(obs1$, obs2$);

            obs3$.subscribe((values) => {
                asyncCount++;
                if (--streamReadCount === 0) {
                    setTimeout(() => {
                        allStreamReadedSub.next(null);
                    });
                } else if (streamReadCount < 0) {
                    throw new Error('Invalid streamReadCount' + streamReadCount);
                }
                console.log("obs3$.subscribe 1o: " + values);
            });

            obs3$.subscribe((values) => {
                asyncCount++;
                if (--streamReadCount === 0) {
                    setTimeout(() => {
                        allStreamReadedSub.next(null);
                    });
                } else if (streamReadCount < 0) {
                    throw new Error('Invalid streamReadCount' + streamReadCount);
                }
                console.log("obs3$.subscribe 2o: " + values);
            });
            
            allStreamReaded$
                    .subscribe(() => {
                        chai.expect(asyncCount).to.eq(6, 'asyncCount');
                        done();
                });

        });

        it('poc-observable-each-pipe-test', (done) => {
            let asyncCount = 0;

            let streamReadCount = 10;
            let allStreamReadedSub = new Subject<void>();
            let allStreamReaded$ = allStreamReadedSub.asObservable();

            let obs1$: Observable<void> = of(undefined).pipe(delay(10));
            let obs2$: Observable<void> = of(undefined).pipe(delay(10));

            obs1$ = obs1$
                .pipe(
                    map((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs1$.pipe() => map(): ' + value);
                        return value;
                    })
                );

            obs1$ = obs1$
                .pipe(
                    flatMap((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs1$.pipe() => flatMap(): ' + value);
                        return of(value);
                    })
                )
                .pipe(
                    flatMap((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs1$.pipe() => flatMap() 2a vez: ' + value);
                        return of(value);
                    })
                )
                ;

            obs2$ = obs2$
                .pipe(
                    map((value) => {
                        asyncCount++;
                        if (--streamReadCount === 0) {
                            setTimeout(() => {
                                allStreamReadedSub.next(null);
                            });
                        } else if (streamReadCount < 0) {
                            throw new Error('Invalid streamReadCount' + streamReadCount);
                        }
                        console.log('obs2$.pipe() => map(): ' + value);
                        return value;
                    })
                );

            let obs3$ = combineLatest(obs1$, obs2$);

            obs3$.subscribe((values) => {
                asyncCount++;
                if (--streamReadCount === 0) {
                    setTimeout(() => {
                        allStreamReadedSub.next(null);
                    });
                } else if (streamReadCount < 0) {
                    throw new Error('Invalid streamReadCount' + streamReadCount);
                }
                console.log("obs3$.subscribe 1o: " + values);
            });

            obs3$.subscribe((values) => {
                asyncCount++;
                if (--streamReadCount === 0) {
                    setTimeout(() => {
                        allStreamReadedSub.next(null);
                    });
                } else if (streamReadCount < 0) {
                    throw new Error('Invalid streamReadCount' + streamReadCount);
                }
                console.log("obs3$.subscribe 2o: " + values);
            })
            
            allStreamReaded$
                    .subscribe(() => {
                        chai.expect(asyncCount).to.eq(10, 'asyncCount');
                        done();
                });

        });

        it('master-a-async-test', (done) => {
            let newCacheHandler = JsHbForNodeTest.createCacheHandlerWithInterceptor(JsHbForNodeTest.CacheHandlerAsync);

            let jsHbSession: IJsHbSession;
            let jsHbConfig: IJsHbConfig = new JsHbConfigDefault()
                // .configLogLevel(JsHbLogLevel.Trace)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(JsHbForNodeTest.TypeProcessorEntriesAsync);
                
            let asyncCount = 0;

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                console.log(operation + ', ' + cacheKey + ', ' + stream);
                asyncCount++;
            }

            let propertyOptionsString: NgJsHbDecorators.PropertyOptions<String> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: NgJsHbDecorators.PropertyOptions<Stream> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: NgJsHbDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: NgJsHbDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        asyncCount++;
                        return source;
                    }
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
                        asyncCount++;
                        return source;
                    }
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
                        asyncCount++;
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
                        asyncCount++;
                        return source;
                    }
                );
            }

            let streamReadCount = 1;
            let allStreamReadedSub = new Subject<void>();
            let allStreamReaded$ = allStreamReadedSub.asObservable();

            let jsHbManager: IJsHbManager = new JsHbManagerDefault(
                jsHbConfig, 
                {
                    generateHttpObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(10));
                    },
                    generateHttpObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<Stream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(10));
                    }
                });

            let propertyOptions: NgJsHbDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        asyncCount++;
                        return source;
                    }
                );
            }

            jsHbSession = jsHbManager.createSession();
            let masterA$: Observable<MasterAEnt> = jsHbSession.processJsHbResultEntity(MasterAEnt, resultMasterLiteral);
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        masterA.blobLazyA.subscribe( 
                            {
                                next: (valueStream) => {
                                    asyncCount++;
                                    let w = new memStreams.WritableStream();
                                    let result = '';
                                    (valueStream as Readable).on('data', (chunk) => {
                                        result = chunk.toString();
                                        chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(result);
                                    });
                                    if (--streamReadCount === 0) {
                                        setTimeout(() => {setTimeout(() => {allStreamReadedSub.next(null);});});
                                    } else if (streamReadCount < 0) {
                                        throw new Error('Invalid streamReadCount' + streamReadCount);
                                    }
                                },
                                complete: () => {
                                }
                            }
                        );
                    }
                }
            );

            combineLatest(
                jsHbSession.createAsyncTasksWaiting(),
                allStreamReaded$)
                .subscribe(() => {
                    chai.expect(asyncCount).to.eq(5, 'asyncCount');
                    done();
                });
        });

        it('master-a-sync-test', (done) => {
            let newCacheHandler = JsHbForNodeTest.createCacheHandlerWithInterceptor(JsHbForNodeTest.CacheHandlerSync);

            let jsHbSession: IJsHbSession;
            let jsHbConfig: IJsHbConfig = new JsHbConfigDefault()
                // .configLogLevel(JsHbLogLevel.Trace)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(JsHbForNodeTest.TypeProcessorEntriesSync);
                
            let asyncCount = 0;

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                console.log(operation + ', ' + cacheKey + ', ' + stream);
                asyncCount++;
            }

            let propertyOptionsString: NgJsHbDecorators.PropertyOptions<String> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: NgJsHbDecorators.PropertyOptions<Stream> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: NgJsHbDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: NgJsHbDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        asyncCount++;
                        return source;
                    }
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
                        asyncCount++;
                        return source;
                    }
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
                        asyncCount++;
                        return source;
                    }
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
                        asyncCount++;
                        return source;
                    }
                );
            };

            let streamReadCount = 1;
            let allStreamReadedSub = new Subject<void>();
            let allStreamReaded$ = allStreamReadedSub.asObservable();

            let jsHbManager: IJsHbManager = new JsHbManagerDefault(
                jsHbConfig, 
                {
                    generateHttpObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(10));
                    },
                    generateHttpObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<Stream> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(10));
                    }
                });

            let propertyOptions: NgJsHbDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        asyncCount++;
                        return source;
                    }
                );
            }

            jsHbSession = jsHbManager.createSession();
            let masterA$: Observable<MasterAEnt> = jsHbSession.processJsHbResultEntity(MasterAEnt, resultMasterLiteral);
            masterA$.subscribe(
                {
                    next: (masterA) => {
                        masterA.blobLazyA.subscribe( 
                            {
                                next: (valueStream) => {
                                    asyncCount++;
                                    let w = new memStreams.WritableStream();
                                    let result = '';
                                    (valueStream as Readable).on('data', (chunk) => {
                                        result = chunk.toString();
                                        chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(result);
                                    });
                                    if (--streamReadCount === 0) {
                                        setTimeout(() => {
                                            allStreamReadedSub.next(null);
                                        });
                                    } else if (streamReadCount < 0) {
                                        throw new Error('Invalid streamReadCount' + streamReadCount);
                                    }
                                },
                                complete: () => {
                                }
                            }
                        );
                    }
                }
            );

            combineLatest(
                jsHbSession.createAsyncTasksWaiting(),
                allStreamReaded$)
                .subscribe(() => {
                    chai.expect(asyncCount).to.eq(5, 'asyncCount');
                    done();
                });
        });

        it('master-lazy-prp-over-sized-async-test', (done) => {
            let newCacheHandler = JsHbForNodeTest.createCacheHandlerWithInterceptor(JsHbForNodeTest.CacheHandlerAsync);

            let jsHbSession: IJsHbSession;
            let jsHbConfig: IJsHbConfig = new JsHbConfigDefault()
                //.configLogLevel(JsHbLogLevel.Trace)
                .configCacheHandler(newCacheHandler)
                .configAddFieldProcessors(JsHbForNodeTest.TypeProcessorEntriesAsync);

            let asyncCount = 0;

            newCacheHandler.callback = (operation, cacheKey, stream) => {
                console.log(operation + ', ' + cacheKey + ', ' + stream);
                asyncCount++;
            }

            let jsHbManager: IJsHbManager = new JsHbManagerDefault(
                jsHbConfig, 
                {
                    generateHttpObservable: (signature, info) => {
                        let responseResult: ResponseLike<Object> = {
                            body: null
                        }
                        return of(responseResult).pipe(delay(10));
                    },
                    generateHttpObservableForDirectRaw: (signature, info) => {
                        let responseResult: ResponseLike<Stream> = {
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
                            .pipe(delay(10))
                            .pipe(
                                map((value) => {
                                    asyncCount++;
                                    return value;
                                })
                            );
                    }
                });

            let propertyOptionsString: NgJsHbDecorators.PropertyOptions<String> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'vcharA');
            let propertyOptionsBlobDirectRaw: NgJsHbDecorators.PropertyOptions<Stream> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');
            let propertyOptionsClobDirectRaw: NgJsHbDecorators.PropertyOptions<StringStream> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'clobLazyA');
            let propertyOptionsBlob: NgJsHbDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobA');

            propertyOptionsString.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                return obs.pipe(
                    (source) => {
                        chai.expect(info.fieldName)
                            .to.satisfy(
                                (fieldName: string) => {
                                    return fieldName === 'vcharA' || fieldName === 'vcharB';
                                }
                            );
                        asyncCount++;
                        return source;
                    }
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
                        asyncCount++;
                        return source;
                    }
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
                        asyncCount++;
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
                        asyncCount++;
                        return source;
                    }
                );
            }

            jsHbSession = jsHbManager.createSession();
            let streamReadCount = 1;
            let allStreamReadedSub = new Subject<void>();
            let allStreamReaded$ = allStreamReadedSub.asObservable();

            let masterA$: Observable<MasterAEnt> = jsHbSession.processJsHbResultEntity(MasterAEnt, resultMasterLazyPrpOverSizedTest);
            masterA$.subscribe(
                {
                    next: (masterA) => {
            
                        masterA.blobLazyA.subscribe( 
                            {
                                next: (valueStream) => {
                                    asyncCount++;
                                    let w = new memStreams.WritableStream();
                                    let result = '';
                                    (valueStream as Readable).on('data', (chunk) => {
                                        asyncCount++;
                                        result = chunk.toString();
                                        chai.expect(result)
                                            .to.satisfy(
                                                (resultB: string) => {
                                                    return resultB
                                                        .startsWith('MasterAEnt_REG01_BlobLazyAMasterAEnt_REG01_'+
                                                            'BlobLazyAMasterAEnt_REG01_BlobLazyAMasterAEnt');
                                                }
                                            );
                                        if (--streamReadCount === 0) {
                                            setTimeout(() => {allStreamReadedSub.next(null);});
                                        } else if (streamReadCount < 0) {
                                            throw new Error('Invalid streamReadCount' + streamReadCount);
                                        }
                                    });
                                },
                                complete: () => {
                                }
                            }
                        );
            
                        // masterA.blobLazyB.subscribe( 
                        //     {
                        //         next: (valueStream) => {
                        //             asyncCount++;
                        //             let w = new memStreams.WritableStream();
                        //             let result = '';
                        //             (valueStream as Readable).on('data', (chunk) => {
                        //                 result = chunk.toString();
                        //                 chai.expect(result)
                        //                     .to.satisfy(
                        //                         (resultB: string) => {
                        //                             return resultB
                        //                                 .startsWith('MasterAEnt_REG01_BlobLazyBMasterAEnt_'+
                        //                                     'REG01_BlobLazyBMaster');
                        //                         }
                        //                     );
                        //                 if (--streamReadCount === 0) {
                        //                     setTimeout(() => {allStreamReadedSub.next(null);});
                        //                 } else if (streamReadCount < 0) {
                        //                     throw new Error('Invalid streamReadCount' + streamReadCount);
                        //                 }
                        //             });
                        //         },
                        //         complete: () => {
                        //         }
                        //     }
                        // );
            
                        // masterA.clobLazyA.subscribe( 
                        //     {
                        //         next: (value) => {
                        //             asyncCount++;
                        //             value.on('data', (chunk) => {
                        //                 asyncCount++;
                        //                 chai.expect(chunk)
                        //                     .to.satisfy(
                        //                         (chunk2: string) => {
                        //                             return chunk2
                        //                                 .startsWith('MasterAEnt_REG01_ClobLazyBMasterAEnt_REG01_'+
                        //                                     'ClobLazyBMasterAEnt_REG01_ClobLazyBMasterA');
                        //                         }
                        //                     );
                        //                 if (--streamReadCount === 0) {
                        //                     setTimeout(() => {allStreamReadedSub.next(null);});
                        //                 } else if (streamReadCount < 0) {
                        //                     throw new Error('Invalid streamReadCount: ' + streamReadCount);
                        //                 }
                        //             });
                        //         },
                        //         complete: () => {
                        //         }
                        //     }
                        // );
            
                        jsHbSession.jsHbManager.jsHbConfig.cacheHandler.clearCache();
                    }
                }
            );

            combineLatest(
                jsHbSession.createAsyncTasksWaiting(),
                allStreamReaded$)
                    .subscribe(() => {
                        chai.expect(asyncCount).to.eq(8, 'asyncCount');
                        done();
                });

        });
    });
}
