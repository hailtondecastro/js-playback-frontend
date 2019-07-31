import {HttpResponse, HttpHeaders} from '@angular/common/http';

import * as chai from 'chai';
import { Observable, of, OperatorFunction, from, Subject, BehaviorSubject, concat, throwError } from 'rxjs';
import resultMasterLiteral from './master-a-test.json';
import resultMasterLazyPrpOverSizedLiteral from './master-lazy-prp-over-sized-test.json';
import resultMasterADetailATestLiteral from './master-a-detail-a-test.json';
import { MasterAEnt } from './entities/master-a-ent';
import { Readable, Stream } from 'stream';
import * as memStreams from 'memory-streams';
import * as fs from 'fs';
import getStream = require('get-stream');
import { AsyncCountdown } from './async-countdown.js';
import { AsyncCount } from './async-count.js';
import { ForNodeTest } from './native-for-node-test.js';
import { FieldInfo } from '../src/api/recorder-config.js';
import { StringStream, BinaryStream, NonWritableStreamExtraMethods, NonReadableStreamExtraMethods } from '../src/api/lazy-ref.js';
import { MemStreamReadableStreamAutoEnd } from '../src/implementation/mem-stream-readable-stream-auto-end.js';

{
    describe('ForNodeTest', () => {
        it('ForNodeTest.StringSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(3);
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
            toDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            myReadableStream.setEncoding('utf8');
            let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((streamStr) => {
                chai.expect(originalValue).to.eq(streamStr);
            });
            //myReadableStream.emit('end');

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3);
                done();
            });
        });

        it('ForNodeTest.BufferSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(5);
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
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((stream) => {
                stream.setEncoding('utf8');
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let fromDirectRaw$ = ForNodeTest.BufferSyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((bufferFromStream) => {
                chai.expect(originalValue).to.eq(bufferFromStream.toString('utf8'));
            });
            //myReadableStream\.emit\('end'\);

            let toLiteralValue$ = ForNodeTest.BufferSyncProcessor.toLiteralValue(Buffer.from(originalValue, 'utf8'), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            toLiteralValue$.subscribe((literalValue) => {
                chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');
                //console.log(literalValue);
            });

            let fromLiteralValue$ = ForNodeTest.BufferSyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromLiteralValue$.subscribe((bufferFromLiteral) => {
                chai.expect((bufferFromLiteral as Buffer).toString('utf8')).to.eq(originalValue);
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(5);
                done();
            });
        });

        it('ForNodeTest.BinaryStreamSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(7);
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
            toDirectRaw$.subscribe((stream) => {
                stream.setEncoding('utf8');
                let fromDirectRaw$ = ForNodeTest.StringAsyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let fromDirectRaw$ = ForNodeTest.BinaryStreamSyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });
            //myReadableStream\.emit\('end'\);

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            binaryWRStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
            let toLiteralValue$ = ForNodeTest.BinaryStreamSyncProcessor.toLiteralValue(binaryWRStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            toLiteralValue$.subscribe((literalValue) => {
                chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');
                //console.log(literalValue);
            });
            //myReadableStream\.emit\('end'\);

            let fromLiteralValue$ = ForNodeTest.BinaryStreamSyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromLiteralValue$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(7);
                done();
            });
        });

        it('ForNodeTest.StringStreamSyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(7);
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
            toDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let myWriStream: NodeJS.WritableStream = new memStreams.WritableStream();
            stringStream = Object.assign(myWriStream, NonReadableStreamExtraMethods);
            let fromDirectRaw$ = ForNodeTest.StringStreamSyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            fromDirectRaw$.subscribe((stream) => {
                stream.setEncoding('utf8');
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });
            //myReadableStream\.emit\('end'\);

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            stringStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
            let toLiteralValue$ = ForNodeTest.StringStreamSyncProcessor.toLiteralValue(stringStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            toLiteralValue$.subscribe((literalValue) => {
                chai.expect(literalValue).to.eq('originalValue_FOO_BAA');
                //console.log(literalValue);
            });
            //myReadableStream\.emit\('end'\);

            let fromLiteralValue$ = ForNodeTest.StringStreamSyncProcessor.fromLiteralValue('originalValue_FOO_BAA', fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromLiteralValue$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(7);
                done();
            });
        });

        it('ForNodeTest.StringAsyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(3);
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let toDirectRaw$ = ForNodeTest.StringAsyncProcessor.toDirectRaw(originalValue, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let fromDirectRaw$ = ForNodeTest.StringAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((streamStr) => {
                chai.expect(originalValue).to.eq(streamStr);
            });
            //myReadableStream\.emit\('end'\);

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(3);
                done();
            });
        });

        it('ForNodeTest.BufferAsyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(5);
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            let fieldInfo: FieldInfo = {
                    fieldName: 'fieldName',
                    fieldType: String,
                    ownerType: Object,
                    ownerValue: {}
                };
            let toDirectRaw$ = ForNodeTest.BufferAsyncProcessor.toDirectRaw(Buffer.from(originalValue, 'utf8'), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            let myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let fromDirectRaw$ = ForNodeTest.BufferAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((bufferFromStream) => {
                chai.expect(originalValue).to.eq(bufferFromStream.toString('utf8'));
            });
            //myReadableStream\.emit\('end'\);

            let toLiteralValue$ = ForNodeTest.BufferAsyncProcessor.toLiteralValue(Buffer.from(originalValue, 'utf8'), fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            toLiteralValue$.subscribe((literalValue) => {
                chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');
                //console.log(literalValue);
            });

            let fromLiteralValue$ = ForNodeTest.BufferAsyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromLiteralValue$.subscribe((bufferFromLiteral) => {
                chai.expect((bufferFromLiteral as Buffer).toString('utf8')).to.eq(originalValue);
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(5);
                done();
            });
        });

        it('ForNodeTest.BinaryStreamAsyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(7);
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
            let toDirectRaw$ = ForNodeTest.BinaryStreamAsyncProcessor.toDirectRaw(binaryWRStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let fromDirectRaw$ = ForNodeTest.BinaryStreamAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });
            //myReadableStream\.emit\('end'\);

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            binaryWRStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
            let toLiteralValue$ = ForNodeTest.BinaryStreamAsyncProcessor.toLiteralValue(binaryWRStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            toLiteralValue$.subscribe((literalValue) => {
                chai.expect(literalValue).to.eq('b3JpZ2luYWxWYWx1ZV9GT09fQkFB');
                //console.log(literalValue);
            });
            //myReadableStream\.emit\('end'\);

            let fromLiteralValue$ = ForNodeTest.BinaryStreamAsyncProcessor.fromLiteralValue('b3JpZ2luYWxWYWx1ZV9GT09fQkFB', fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromLiteralValue$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(7);
                done();
            });
        });

        it('ForNodeTest.StringStreamAsyncProcessor', (done) => {
            let asyncCountdown = new AsyncCountdown(7);
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
            let toDirectRaw$ = ForNodeTest.StringStreamAsyncProcessor.toDirectRaw(stringStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            toDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            let myWriStream: NodeJS.WritableStream = new memStreams.WritableStream();
            stringStream = Object.assign(myWriStream, NonReadableStreamExtraMethods);
            let fromDirectRaw$ = ForNodeTest.StringStreamAsyncProcessor.fromDirectRaw(myReadableStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            
            fromDirectRaw$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            });
            //myReadableStream\.emit\('end'\);

            myReadableStream = new MemStreamReadableStreamAutoEnd(originalValue);
            stringStream = Object.assign(myReadableStream, NonWritableStreamExtraMethods);
            let toLiteralValue$ = ForNodeTest.StringStreamAsyncProcessor.toLiteralValue(stringStream, fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );

            toLiteralValue$.subscribe((literalValue) => {
                chai.expect(literalValue).to.eq('originalValue_FOO_BAA');
                //console.log(literalValue);
            });
            //myReadableStream\.emit\('end'\);

            let fromLiteralValue$ = ForNodeTest.StringStreamAsyncProcessor.fromLiteralValue('originalValue_FOO_BAA', fieldInfo)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            fromLiteralValue$.subscribe((stream) => {
                let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, fieldInfo)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                fromDirectRaw$.subscribe((streamStr) => {
                    chai.expect(originalValue).to.eq(streamStr);
                });
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(7);
                done();
            });
        });

        it('ForNodeTest.CacheHandlerSync', (done) => {
            let asyncCountdown = new AsyncCountdown(3);
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
                    let fromDirectRaw$ = ForNodeTest.StringSyncProcessor.fromDirectRaw(stream, null)
                        .pipe(
                            asyncCount.registerRxOpr(),
                            asyncCountdown.registerRxOpr()
                        );
                    fromDirectRaw$.subscribe((streamStr) => {
                        chai.expect(originalValue).to.eq(streamStr);
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