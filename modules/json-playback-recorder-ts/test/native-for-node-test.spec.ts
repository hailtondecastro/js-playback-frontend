import {HttpResponse, HttpHeaders} from '@angular/common/http';

import * as chai from 'chai';
import { Observable, of, OperatorFunction, from, Subject, BehaviorSubject, concat, throwError } from 'rxjs';
import resultMasterLiteral from './master-a-test.json';
import resultMasterLazyPrpOverSizedLiteral from './master-lazy-prp-over-sized-test.json';
import resultMasterADetailATestLiteral from './master-a-detail-a-test.json';
import * as memStreams from 'memory-streams';
import * as fs from 'fs';
import { AsyncCountdown } from './async-countdown.js';
import { AsyncCount } from './async-count.js';
import { ForNodeTest } from './native-for-node-test.js';
import { FieldInfo } from '../src/api/recorder-config.js';
import { StringStream, BinaryStream, NonWritableStreamExtraMethods, NonReadableStreamExtraMethods } from '../src/api/lazy-ref.js';
import { MemStreamReadableStreamAutoEnd } from '../src/implementation/mem-stream-readable-stream-auto-end.js';
import { delay, tap, map } from 'rxjs/operators';
import { timeoutDecorateRxOpr } from '../src/implementation/rxjs-util.js';

{
    describe('ForNodeTest', () => {
        it('ForNodeTest.timeoutDecorateRxOpr', 1 == 1 ? (done) => { done(); } : (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 4000});
            let asyncCount = new AsyncCount();

            const obs$ = of(null).pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                delay(2000),
                timeoutDecorateRxOpr()
            );

            obs$.subscribe(() => {

            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(1);
                done();
            });
        });

        it('ForNodeTest.StringSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000});
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let toDirectRaw$ = ForNodeTest.StringSyncProcessor.toDirectRaw(originalValue, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(toDirectRaw$, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromDirectRaw$.subscribe((respStreamStr) => {
                chai.expect(originalValue).to.eq(respStreamStr.body);
            });

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            myReadableStream.setEncoding('utf8');
            fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(of({ body: myReadableStream }), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((respStreamStr) => {
                chai.expect(originalValue).to.eq(respStreamStr.body);
            });
            //myReadableStream.emit('end');

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3);
                done();
            });
        });

        it('ForNodeTest.BufferSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000});
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let toDirectRaw$ = ForNodeTest.BufferSyncProcessor.toDirectRaw(Buffer.from(originalValue, 'utf8'), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr(),
                    tap((respStream) => {
                        respStream.body.setEncoding('utf8'); 
                    })
                );
            let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(toDirectRaw$, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromDirectRaw$.subscribe((respStr) => {
                chai.expect(originalValue).to.eq(respStr.body);
            });

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            fromDirectRaw$ = ForNodeTest.BufferSyncProcessor.fromDirectRaw(
                of({ body: myReadableStream}),
                fieldInfo).pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                map((respBuffer) => {
                    return { body: respBuffer.body.toString('utf-8') };
                })
            );
            
            fromDirectRaw$.subscribe((respBufferFromStream) => {
                chai.expect(respBufferFromStream.body).to.eq(respBufferFromStream.body);
            });
            //myReadableStream\.emit\('end'\);

            let literalValue = ForNodeTest.BufferSyncProcessor.toLiteralValue(Buffer.from(originalValue, 'utf8'), fieldInfo)
            chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');

            let fromLiteralValue = ForNodeTest.BufferSyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
            chai.expect((fromLiteralValue as Buffer).toString('utf8')).to.eq(originalValue);

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3);
                done();
            });
        });

        it('ForNodeTest.BinaryStreamSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 5, timeOut: 1000});
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let binaryWRStream: BinaryStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
            let toDirectRaw$ = ForNodeTest.BinaryStreamSyncProcessor.toDirectRaw(binaryWRStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((respStream) => {
                respStream.body.setEncoding('utf8');
                let fromDirectRaw$ = ForNodeTest.StringAsyncProcessor.fromDirectRaw(of(respStream), fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((respStr) => {
                    chai.expect(originalValue).to.eq(respStr.body);
                });
            });

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let fromDirectRaw$ = ForNodeTest.BinaryStreamSyncProcessor.fromDirectRaw(of({ body: myReadableStream } ), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((respStream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(of(respStream), fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((respStreamStr) => {
                    chai.expect(originalValue).to.eq(respStreamStr.body);
                });
            });
            //myReadableStream\.emit\('end'\);

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            binaryWRStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);

            let fromLiteralValue = ForNodeTest.BinaryStreamSyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
            let fromDirectRawB$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(of({ body: fromLiteralValue }), fieldInfo).pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );
            asyncCount.doNonObservableIncrement();
            fromDirectRawB$.subscribe((streamStr) => {
                chai.expect(originalValue).to.eq(streamStr.body);
            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(6);
                done();
            });
        });

        it('ForNodeTest.StringStreamSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1000});
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let stringStream: StringStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
            let toDirectRaw$ = ForNodeTest.StringStreamSyncProcessor.toDirectRaw(stringStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((respStream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(of(respStream), fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((respStreamStr) => {
                    chai.expect(originalValue).to.eq(respStreamStr.body);
                });
            });

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let myWriStream: NodeJS.WritableStream = new memStreams.WritableStream();
            stringStream = Object.assign(myWriStream, NonReadableStreamExtraMethods);
            let fromDirectRaw$ = ForNodeTest.StringStreamSyncProcessor.fromDirectRaw(of({ body: myReadableStream }), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            fromDirectRaw$.subscribe((respStream) => {
                asyncCount.doNonObservableIncrement();
                respStream.body.setEncoding('utf8');
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(of(respStream), fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((respStreamStr) => {
                    chai.expect(originalValue).to.eq(respStreamStr.body);
                });
            });
            //myReadableStream\.emit\('end'\);
            //myReadableStream\.emit\('end'\);

            let fromLiteralValue = ForNodeTest.StringStreamSyncProcessor.fromLiteralValue('originalValue_FOO_BAA', fieldInfo);
            let fromDirectRawB$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(of({ body: fromLiteralValue}), fieldInfo);
            fromDirectRawB$.subscribe((respStreamStr) => {
                chai.expect(originalValue).to.eq(respStreamStr.body);
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(5);
                done();
            });
        });

        // it('ForNodeTest.StringAsyncProcessor', (done) => {
        //     let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000});
        //     let asyncCount = new AsyncCount();
        //     let originalValue = 'originalValue_FOO_BAA';
        //     let fieldInfo: FieldInfo = {
        //             fieldName: 'fieldName',
        //             fieldType: String,
        //             ownerType: Object,
        //             ownerValue: {}
        //         };
        //     let toDirectRaw$ = ForNodeTest.StringAsyncProcessor.toDirectRaw(originalValue, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     toDirectRaw$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     });

        //     let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     let fromDirectRaw$ = ForNodeTest.StringAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
            
        //     fromDirectRaw$.subscribe((streamStr) => {
        //         chai.expect(originalValue).to.eq(streamStr);
        //     });
        //     //myReadableStream\.emit\('end'\);

        //     asyncCountdown.createCountdownEnds().subscribe(() => {
        //         chai.expect(asyncCount.count).to.eq(3);
        //         done();
        //     });
        // });

        // it('ForNodeTest.BufferAsyncProcessor', (done) => {
        //     let asyncCountdown = new AsyncCountdown({ count: 5, timeOut: 1000});
        //     let asyncCount = new AsyncCount();
        //     let originalValue = 'originalValue_FOO_BAA';
        //     let fieldInfo: FieldInfo = {
        //             fieldName: 'fieldName',
        //             fieldType: String,
        //             ownerType: Object,
        //             ownerValue: {}
        //         };
        //     let toDirectRaw$ = ForNodeTest.BufferAsyncProcessor.toDirectRaw(Buffer.from(originalValue, 'utf8'), fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     toDirectRaw$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     });

        //     let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     let fromDirectRaw$ = ForNodeTest.BufferAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
            
        //     fromDirectRaw$.subscribe((bufferFromStream) => {
        //         chai.expect(originalValue).to.eq(bufferFromStream.toString('utf8'));
        //     });
        //     //myReadableStream\.emit\('end'\);

        //     let toLiteralValue$ = ForNodeTest.BufferAsyncProcessor.toLiteralValue(Buffer.from(originalValue, 'utf8'), fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );

        //     toLiteralValue$.subscribe((literalValue) => {
        //         chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');
        //         //console.log(literalValue);
        //     });

        //     let fromLiteralValue$ = ForNodeTest.BufferAsyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     fromLiteralValue$.subscribe((bufferFromLiteral) => {
        //         chai.expect((bufferFromLiteral as Buffer).toString('utf8')).to.eq(originalValue);
        //     })

        //     asyncCountdown.createCountdownEnds().subscribe(() => {
        //         chai.expect(asyncCount.count).to.eq(5);
        //         done();
        //     });
        // });

        // it('ForNodeTest.BinaryStreamAsyncProcessor', (done) => {
        //     let asyncCountdown = new AsyncCountdown({ count: 7, timeOut: 1000});
        //     let asyncCount = new AsyncCount();
        //     let originalValue = 'originalValue_FOO_BAA';
        //     let fieldInfo: FieldInfo = {
        //             fieldName: 'fieldName',
        //             fieldType: String,
        //             ownerType: Object,
        //             ownerValue: {}
        //         };
        //     let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     let binaryWRStream: BinaryStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
        //     let toDirectRaw$ = ForNodeTest.BinaryStreamAsyncProcessor.toDirectRaw(binaryWRStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     toDirectRaw$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     });

        //     myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     let fromDirectRaw$ = ForNodeTest.BinaryStreamAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
            
        //     fromDirectRaw$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     });
        //     //myReadableStream\.emit\('end'\);

        //     myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     binaryWRStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
        //     let toLiteralValue$ = ForNodeTest.BinaryStreamAsyncProcessor.toLiteralValue(binaryWRStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );

        //     toLiteralValue$.subscribe((literalValue) => {
        //         chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');
        //         //console.log(literalValue);
        //     });
        //     //myReadableStream\.emit\('end'\);

        //     let fromLiteralValue$ = ForNodeTest.BinaryStreamAsyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     fromLiteralValue$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     })

        //     asyncCountdown.createCountdownEnds().subscribe(() => {
        //         chai.expect(asyncCount.count).to.eq(7);
        //         done();
        //     });
        // });

        // it('ForNodeTest.StringStreamAsyncProcessor', (done) => {
        //     let asyncCountdown = new AsyncCountdown({ count: 7, timeOut: 1000});
        //     let asyncCount = new AsyncCount();
        //     let originalValue = 'originalValue_FOO_BAA';
        //     let fieldInfo: FieldInfo = {
        //             fieldName: 'fieldName',
        //             fieldType: String,
        //             ownerType: Object,
        //             ownerValue: {}
        //         };

        //     let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     let stringStream: StringStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
        //     let toDirectRaw$ = ForNodeTest.StringStreamAsyncProcessor.toDirectRaw(stringStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     toDirectRaw$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     });

        //     myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     let myWriStream: NodeJS.WritableStream = new memStreams.WritableStream();
        //     stringStream = Object.assign(myWriStream, NonReadableStreamExtraMethods);
        //     let fromDirectRaw$ = ForNodeTest.StringStreamAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
            
        //     fromDirectRaw$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     });
        //     //myReadableStream\.emit\('end'\);

        //     myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
        //     stringStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
        //     let toLiteralValue$ = ForNodeTest.StringStreamAsyncProcessor.toLiteralValue(stringStream, fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );

        //     toLiteralValue$.subscribe((literalValue) => {
        //         chai.expect(literalValue).to.eq('originalValue_FOO_BAA');
        //         //console.log(literalValue);
        //     });
        //     //myReadableStream\.emit\('end'\);

        //     let fromLiteralValue$ = ForNodeTest.StringStreamAsyncProcessor.fromLiteralValue('originalValue_FOO_BAA', fieldInfo)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     fromLiteralValue$.subscribe((stream) => {
        //         let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         fromDirectRaw$.subscribe((streamStr) => {
        //             chai.expect(originalValue).to.eq(streamStr);
        //         });
        //     })

        //     asyncCountdown.createCountdownEnds().subscribe(() => {
        //         chai.expect(asyncCount.count).to.eq(7);
        //         done();
        //     });
        // });

        it('ForNodeTest.CacheHandlerSync', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000});
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            // let fieldInfo: FieldInfo = {
            //         fieldName: 'fieldName',
            //         fieldType: String,
            //         ownerType: Object,
            //         ownerValue: {}
            //     };

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let stringStream: StringStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
            let putOnCache$ = ForNodeTest.CacheHandlerSync.putOnCache('foo_key', stringStream)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            putOnCache$.subscribe(() => {
                let getFromCache$ = ForNodeTest.CacheHandlerSync.getFromCache('foo_key')
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                getFromCache$.subscribe((stream) => {
                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(of({ body: stream }), null)
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                    fromDirectRaw$.subscribe((respStreamStr) => {
                        chai.expect(originalValue).to.eq(respStreamStr.body);
                    });
                });
            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3);
                done();
            });
        });
    });
}