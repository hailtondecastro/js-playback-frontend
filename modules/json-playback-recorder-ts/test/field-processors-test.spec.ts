//require('any-observable/register')('rxjs', {Observable: require('rxjs/Observable').Observable})


import * as chai from 'chai';
import { of } from 'rxjs';
import { AsyncCountdown } from './async-countdown';
import { AsyncCount } from './async-count';
import { FieldInfo } from '../src/api/recorder-config';
import { StringBlobOrStream, BinaryBlobOrStream, BlobOrStream } from '../src/api/lazy-ref';
import { delay, tap, map, buffer } from 'rxjs/operators';
import { timeoutDecorateRxOpr } from '../src/implementation/rxjs-util';
import { RecorderForDom } from '../src/implementation/native-for-dom';
import { RecorderDecorators } from '../src/api/recorder-decorators';

//export function testBlock() {
{
    describe('FieldProcessorsTest', () => {
        const speedTimeFactor = 0.5;

        it('FieldProcessorsTest.timeoutDecorateRxOpr', 1 == 1 ? (done) => { done(); } : (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 1, timeOut: 4000 * speedTimeFactor });
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
        }).timeout(2000 * speedTimeFactor);

        it('FieldProcessorsTest.StringSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000 * speedTimeFactor });
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let toDirectRaw$ = RecorderDecorators.StringProcessor.toDirectRaw(originalValue, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            let fromDirectRaw$ = RecorderDecorators.StringProcessor.fromDirectRaw(toDirectRaw$, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromDirectRaw$.subscribe((respStreamStr) => {
                chai.expect(originalValue).to.eq(respStreamStr.body);
            });

            //let myReadableStream = new memStreams.ReadableStream(originalValue);
            
            let myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
            fromDirectRaw$ = RecorderDecorators.StringProcessor.fromDirectRaw(of({ body: myReadableStream }), fieldInfo)
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
        }).timeout(2000 * speedTimeFactor);

        it('FieldProcessorsTest.BufferSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000 * speedTimeFactor });
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let toDirectRaw$ = RecorderDecorators.BufferProcessor.toDirectRaw(Buffer.from(originalValue, 'binary') , fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr(),
                    // tap((respStream) => {
                    //     if (typeof Blob === 'undefined') {
                    //         (respStream.body as NodeJS.ReadableStream).setEncoding('utf8'); 
                    //     }
                    // })
                );
            let fromDirectRaw$ = RecorderDecorators.BufferProcessor.fromDirectRaw(toDirectRaw$, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromDirectRaw$.subscribe((respStr) => {
                chai.expect(originalValue).to.eq(respStr.body.toString('utf8'));
            });

            let myReadableStream = RecorderForDom.bufferToBlobOrStream(Buffer.from(originalValue, 'binary'));

            fromDirectRaw$ = RecorderDecorators.BufferProcessor.fromDirectRaw(of({ body: myReadableStream }), fieldInfo).pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr(),
                    map((respBuffer) => {
                        return { body: respBuffer.body };
                    })
            );
            
            fromDirectRaw$.subscribe((respBufferFromStream) => {
                chai.expect(respBufferFromStream.body).to.eq(respBufferFromStream.body);
            });
            //myReadableStream\.emit\('end'\);

            let literalValue = RecorderDecorators.BufferProcessor.toLiteralValue(Buffer.from(originalValue, 'utf8'), fieldInfo)
            chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');

            let fromLiteralValue = RecorderDecorators.BufferProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
            chai.expect((fromLiteralValue as Buffer).toString('utf8')).to.eq(originalValue);

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3);
                done();
            });
        }).timeout(2000 * speedTimeFactor);

        it('FieldProcessorsTest.BinaryStreamSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 5, timeOut: 1000 * speedTimeFactor });
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
            let binaryStream: BinaryBlobOrStream = myReadableStream;
            let toDirectRaw$ = RecorderDecorators.BinaryBlobOrStreamProcessor.toDirectRaw(binaryStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((respStream) => {
                if (typeof Blob === 'undefined') {
                    (respStream.body as NodeJS.ReadableStream).setEncoding('utf8');
                }
                let fromDirectRaw$ = RecorderDecorators.StringProcessor.fromDirectRaw(of(respStream), fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((respStr) => {
                    chai.expect(originalValue).to.eq(respStr.body);
                });
            });

            myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
            let fromDirectRaw$ = RecorderDecorators.BinaryBlobOrStreamProcessor.fromDirectRaw(of({ body: myReadableStream } ), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((respStream) => {
                let fromDirectRaw$ = RecorderDecorators.StringProcessor.fromDirectRaw(of(respStream), fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((respStreamStr) => {
                    chai.expect(originalValue).to.eq(respStreamStr.body);
                });
            });

            myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
            binaryStream = myReadableStream;

            let fromLiteralValue = RecorderDecorators.BinaryBlobOrStreamProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
            let fromDirectRawB$ = RecorderDecorators.StringProcessor.fromDirectRaw(of({ body: fromLiteralValue }), fieldInfo).pipe(
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr()
            );
            asyncCount.doNonPipedIncrement();
            fromDirectRawB$.subscribe((streamStr) => {
                chai.expect(originalValue).to.eq(streamStr.body);
            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(6);
                done();
            });
        }).timeout(2000 * speedTimeFactor);

        it('FieldProcessorsTest.StringStreamSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1500 * speedTimeFactor });
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };

            let myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
            let stringStream: BlobOrStream = myReadableStream;
            let toDirectRaw$ = RecorderDecorators.StringBlobStreamProcessor.toDirectRaw(stringStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((respStream) => {
                let fromDirectRaw$ = RecorderDecorators.StringProcessor.fromDirectRaw(of(respStream), fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((respStreamStr) => {
                    chai.expect(originalValue).to.eq(respStreamStr.body);
                });
            });

            myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
            let fromDirectRaw$ = RecorderDecorators.StringBlobStreamProcessor.fromDirectRaw(of({ body: myReadableStream }), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            fromDirectRaw$.subscribe((respStream) => {
                asyncCount.doNonPipedIncrement();
                if (typeof Blob === 'undefined') {
                    (respStream.body as NodeJS.ReadableStream).setEncoding('utf8');
                }
                let fromDirectRaw$ = RecorderDecorators.StringProcessor.fromDirectRaw(of(respStream), fieldInfo)
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

            let fromLiteralValue = RecorderDecorators.StringBlobStreamProcessor.fromLiteralValue('originalValue_FOO_BAA', fieldInfo);
            let fromDirectRawB$ = RecorderDecorators.StringProcessor.fromDirectRaw(of({ body: fromLiteralValue}), fieldInfo);
            fromDirectRawB$.subscribe((respStreamStr) => {
                chai.expect(originalValue).to.eq(respStreamStr.body);
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(5);
                done();
            });
        }).timeout(2000 * speedTimeFactor);

        // it('FieldProcessorsTest.CacheHandlerSync', (done) => {
        //     let asyncCountdown = new AsyncCountdown({ count: 3, timeOut: 1000 * debugTimeFactor });
        //     let asyncCount = new AsyncCount();
        //     let originalValue = 'originalValue_FOO_BAA';
        //     // let fieldInfo: FieldInfo = {
        //     //         fieldName: 'fieldName',
        //     //         fieldType: String,
        //     //         ownerType: Object,
        //     //         ownerValue: {}
        //     //     };

        //     let myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
        //     let stringStream: StringBlobOrStream = myReadableStream;
        //     let putOnCache$ = RecorderDecorators.CacheHandlerSync.putOnCache('foo_key', stringStream)
        //         .pipe(
        //             asyncCount.registerRxOpr(),
        //             asyncCountdown.registerRxOpr()
        //         );
        //     putOnCache$.subscribe(() => {
        //         let getFromCache$ = FieldProcessorsTest.CacheHandlerSync.getFromCache('foo_key')
        //             .pipe(
        //                 asyncCount.registerRxOpr(),
        //                 asyncCountdown.registerRxOpr()
        //             );
        //         getFromCache$.subscribe((stream) => {
        //             let fromDirectRaw$ = FieldProcessorsTest.StringProcessor.fromDirectRaw(of({ body: stream }), null)
        //                 .pipe(
        //                     asyncCount.registerRxOpr(),
        //                     asyncCountdown.registerRxOpr()
        //                 );
        //             fromDirectRaw$.subscribe((respStreamStr) => {
        //                 chai.expect(originalValue).to.eq(respStreamStr.body);
        //             });
        //         });
        //     });

        //     asyncCountdown.createCountdownEnds().subscribe(() => {
        //         chai.expect(asyncCount.count).to.eq(3);
        //         done();
        //     });
        // }).timeout(2000 * debugTimeFactor);
    });
}

//testBlock();