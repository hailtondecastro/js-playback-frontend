import { CacheHandler } from "../src/js-hb-config";
import { from, Observable, forkJoin, of, interval, Subject } from "rxjs";
import { map, flatMap, timeout, delay } from "rxjs/operators";
const toStream = require('blob-to-stream');
const toBlob = require('stream-to-blob');
import * as memStreams from 'memory-streams';
import { Readable, Stream } from "stream";
import { IFieldProcessor } from "../src/field-processor";
import getStream = require("get-stream");
import { StringStream } from "../src/lazy-ref";
import { StringStreamMarker } from "../src/lazy-ref";

export namespace JsHbForNodeTest {
    export const CacheMap: Map<string, Buffer> = new Map();
    export const CacheHandlerDefault: CacheHandler = 
        {
            clearCache: () => {
                return of(null).pipe(delay(10));
            },
            getFromCache: (cacheKey) => {
                let base64AB = CacheMap.get(cacheKey);
                //let rs = new memStreams.ReadableStream(base64AB.to);
                //let myReadableStreamBuffer = new Stream.Readable(); 
                let myReadableStreamBuffer;
                if (base64AB) {
                    let ws = new memStreams.WritableStream();
                    ws.write(base64AB);
                    myReadableStreamBuffer = new memStreams.ReadableStream('');
                    myReadableStreamBuffer.push(base64AB);
                }
                return of(myReadableStreamBuffer).pipe(delay(10));
            },
            putOnCache: (cacheKey, stream) => {
                let resultSub = new Subject<void>();
                let result$ = resultSub.asObservable();
                (stream as Readable).on('data', (chunk) => {
                    CacheMap.set(cacheKey, chunk);
                    resultSub.next();
                });
                return result$.pipe(delay(10));
            },
            removeFromCache: (cacheKey) => {
                CacheMap.delete(cacheKey);
                return of(null).pipe(delay(10));
            }
        };

        
    export const BufferAsyncProcessor: IFieldProcessor<Buffer> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                return of(Buffer.from(value, 'base64')).pipe(delay(10));
            } else {
                return of(null).pipe(timeout(10));
            }
        },
        toLiteralValue: (value, info) => {
            if (value) {
                let base64Str = value.toString('base64');                            
                return of(base64Str).pipe(delay(10));
            }
        }
    };
    export const StringAsyncProcessor: IFieldProcessor<String> = {
        fromLiteralValue: (value: string, info: any) => {
            return of(value);
        },
        fromDirectRaw: (stream: Stream, info: any) => {
            return from(getStream(stream, {}) as Promise<string>).pipe(delay(10));
        }
    };
    export const StreamAsyncProcessor: IFieldProcessor<String> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                let base64AB = Buffer.from(value, 'base64');
                let ws = new memStreams.WritableStream();
                ws.write(base64AB);
                //let rs = new memStreams.ReadableStream(base64AB.to);
                //let myReadableStreamBuffer = new Stream.Readable(); 
                let myReadableStreamBuffer = new memStreams.ReadableStream(''); 
                myReadableStreamBuffer.push(base64AB);
                console.log()
                return of(myReadableStreamBuffer).pipe(delay(10));
            } else {
                return of(null).pipe(delay(10));
            }
        },
        fromDirectRaw: (stream, info) => {
            if (stream) {
                if ((stream as Stream).addListener && (stream as Stream).pipe) {
                    return of(stream).pipe(delay(10));
                } else {
                    throw new Error('Not supported');
                }
            } else {
                return of(null).pipe(delay(10));
            }
        }
    };
    export const StringStreamProcessor: IFieldProcessor<StringStream> = {
            fromLiteralValue: (value, info) => {
                if (value) {
                    let base64AB = Buffer.from(value, 'base64');
                    let ws = new memStreams.WritableStream();
                    ws.write(base64AB);
                    //let rs = new memStreams.ReadableStream(base64AB.to);
                    //let myReadableStreamBuffer = new Stream.Readable(); 
                    let myReadableStreamBuffer = new memStreams.ReadableStream(value); 
                    myReadableStreamBuffer.setEncoding('utf-8');
                    return of(myReadableStreamBuffer).pipe(delay(10));
                } else {
                    return of(null);
                }
            },
            fromDirectRaw: (stream, info) => {
                if (stream) {
                    if ((stream as Stream).addListener && (stream as Stream).pipe) {
                        (stream as any as Readable).setEncoding('utf-8');
                        return of(stream).pipe(delay(10));
                    } else {
                        throw new Error('Not supported');
                    }
                } else {
                    return of(null);
                }
            }
    };
    export const TypeProcessorEntries = 
    [ 
        {
            type: Buffer,
            processor: BufferAsyncProcessor
        },
        {                
            type: String,
            processor: StringAsyncProcessor
        },
        {                
            type: Stream,
            processor: StreamAsyncProcessor
        },
        {
            type: StringStreamMarker,
            processor: StringStreamProcessor
        }
    ];
}