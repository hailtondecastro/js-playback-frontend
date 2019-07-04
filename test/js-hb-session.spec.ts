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
import { JsHbConfigDefault, IJsHbConfig } from '../src/js-hb-config';
import { Observable, of, OperatorFunction, from, Subject, BehaviorSubject } from 'rxjs';
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
import { delay, flatMap } from 'rxjs/operators';



{
    describe('JsHbManagerDefault', () => {
        it('master-a-test', (done) => {

            let jsHbSession: IJsHbSession;
            let jsHbConfig: IJsHbConfig = new JsHbConfigDefault()
                .configCacheHandler(JsHbForNodeTest.CacheHandlerDefault)
                .configAddFieldProcessors(JsHbForNodeTest.TypeProcessorEntries);

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
                obs.pipe(
                    (source) => {
                        return source;
                    }
                );
            }

            jsHbSession = jsHbManager.createSession();
            let masterA: MasterAEnt = jsHbSession.processJsHbResultEntity(MasterAEnt, resultMasterLiteral);

            const subs1 = masterA.blobLazyA.subscribe( 
                {
                    next: (valueStream) => {
                        let w = new memStreams.WritableStream();
                        let result = '';
                        (valueStream as Readable).on('data', (chunk) => {
                            result = chunk.toString();
                            chai.expect('MasterAEnt_REG01_BlobLazyA').to.eq(result);
                            done();
                        });
                    },
                    complete: () => {
                        subs1.unsubscribe();
                    }
                }
            );
        });

        it('master-lazy-prp-over-sized-test', (done) => {
            let subTest = new BehaviorSubject<void>(null);
            let subTest$ = subTest.asObservable()
                .pipe(delay(10));
            subTest$.pipe(
                    flatMap((value) => {
                        return of(value);
                    })
                );
            subTest$.subscribe(
                (value) => {
                    console.log('forEach: ' + value);
                }
            );
            subTest.next(null);
            subTest$.subscribe(
                {next: (value) => {
                    console.log('next: ' + value);
                }}
            );
            subTest.next(null);

            let jsHbSession: IJsHbSession;
            let jsHbConfig: IJsHbConfig = new JsHbConfigDefault()
                .configCacheHandler(JsHbForNodeTest.CacheHandlerDefault)
                .configAddFieldProcessors(JsHbForNodeTest.TypeProcessorEntries);

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
                        return of(responseResult).pipe(delay(10));
                    }
                });

            let propertyOptions: NgJsHbDecorators.PropertyOptions<Buffer> =
                Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, new MasterAEnt(), 'blobLazyA');

            propertyOptions.fieldProcessorEvents.onFromLiteralValue = (rawValue, info, obs) => {
                obs.pipe(
                    (source) => {
                        return source;
                    }
                );
            }

            jsHbSession = jsHbManager.createSession();
            let masterA: MasterAEnt = jsHbSession.processJsHbResultEntity(MasterAEnt, resultMasterLazyPrpOverSizedTest);

            let asyncCountSub: BehaviorSubject<number> = new BehaviorSubject(0);
            let asyncCount$: Observable<number> = asyncCountSub.asObservable();

            asyncCountSub.next(asyncCountSub.value + 1);
            masterA.blobLazyA.subscribe( 
                {
                    next: (valueStream) => {
                        valueStream.on
                        let w = new memStreams.WritableStream();
                        let result = '';
                        (valueStream as Readable).on('data', (chunk) => {
                            result = chunk.toString();
                            chai.expect(result)
                                .to.satisfy(
                                    (resultB: string) => {
                                        return resultB
                                            .startsWith('MasterAEnt_REG01_BlobLazyAMasterAEnt_REG01_'+
                                                'BlobLazyAMasterAEnt_REG01_BlobLazyAMasterAEnt');
                                    }
                                );
                            asyncCountSub.next(asyncCountSub.value - 1);
                        });
                    },
                    complete: () => {
                    }
                }
            );

            asyncCountSub.next(asyncCountSub.value + 1);
            masterA.blobLazyB.subscribe( 
                {
                    next: (valueStream) => {
                        valueStream.on
                        let w = new memStreams.WritableStream();
                        let result = '';
                        (valueStream as Readable).on('data', (chunk) => {
                            result = chunk.toString();
                            chai.expect(result)
                                .to.satisfy(
                                    (resultB: string) => {
                                        return resultB
                                            .startsWith('MasterAEnt_REG01_BlobLazyBMasterAEnt_'+
                                                'REG01_BlobLazyBMaster');
                                    }
                                );
                            asyncCountSub.next(asyncCountSub.value - 1);
                        });
                    },
                    complete: () => {
                    }
                }
            );

            asyncCountSub.next(asyncCountSub.value + 1);
            masterA.clobLazyA.subscribe( 
                {
                    next: (value) => {
                        value.on('data', (chunk) => {
                            chai.expect(chunk)
                                .to.satisfy(
                                    (chunk2: string) => {
                                        return chunk2
                                            .startsWith('MasterAEnt_REG01_ClobLazyBMasterAEnt_REG01_'+
                                                'ClobLazyBMasterAEnt_REG01_ClobLazyBMasterA');
                                    }
                                );
                            asyncCountSub.next(asyncCountSub.value - 1);
                        });
                    },
                    complete: () => {
                    }
                }
            );

            // jsHbSession.getLastRecordedPlaybackAndStreams().subscribe((playBackAndStreams) => {
            //     console.log(playBackAndStreams);
            //     done();
            // });

            asyncCount$.subscribe((asyncCount) => {
                if (asyncCount == 0) {
                    // done();
                }
            });
        });
    });
}
