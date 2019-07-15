import { from, Observable, of, interval, Subject } from "rxjs";
import { map, flatMap, timeout, delay, finalize } from "rxjs/operators";
const toStream = require('blob-to-stream');
const toBlob = require('stream-to-blob');
import * as memStreams from 'memory-streams';
import { Readable, Stream } from "stream";
import getStream from 'get-stream';
import streamToObservable from 'stream-to-observable';
import { IFieldProcessor } from '../src/api/field-processor';
import { StringStream, StringStreamMarker } from '../src/api/lazy-ref';
import { CacheHandler } from '../src/api/recorder-config';

export namespace ForNodeTest {
    export const CacheMap: Map<string, Buffer> = new Map();
    export const CacheHandlerSync: CacheHandler = 
        {
            clearCache: () => {
                return of(null);
            },
            getFromCache: (cacheKey) => {
                let base64AB = CacheMap.get(cacheKey);
                let myReadableStreamBuffer;
                if (base64AB) {
                    let ws = new memStreams.WritableStream();
                    ws.write(base64AB);
                    myReadableStreamBuffer = new memStreams.ReadableStream('');
                    myReadableStreamBuffer.push(base64AB);
                }
                return of(myReadableStreamBuffer);
            },
            putOnCache: (cacheKey, stream) => {
                let resultSub = new Subject<void>();
                let result$ = resultSub.asObservable();
                (stream as Readable).on('data', (chunk) => {
                    CacheMap.set(cacheKey, chunk);
                    resultSub.next();
                });
                return result$;
            },
            removeFromCache: (cacheKey) => {
                CacheMap.delete(cacheKey);
                return of(null);
            }
        };

    export const CacheHandlerAsync: CacheHandler = 
        {
            clearCache: () => {
                return CacheHandlerSync.clearCache().pipe(delay(10));
            },
            getFromCache: (cacheKey) => {
                return CacheHandlerSync.getFromCache(cacheKey).pipe(delay(10));
            },
            putOnCache: (cacheKey, stream) => {
                return CacheHandlerSync.putOnCache(cacheKey, stream).pipe(delay(10));
            },
            removeFromCache: (cacheKey) => {
                return CacheHandlerSync.removeFromCache(cacheKey).pipe(delay(10));
            }
        };

    export interface CacheHandlerWithInterceptor extends CacheHandler {
        callback: (operation: 'getFromCache' | 'removeFromCache' | 'putOnCache' | 'clearCache', cacheKey?: string, stream?: Stream) => void
    }
    export function createCacheHandlerWithInterceptor(cacheHandler: CacheHandler): CacheHandlerWithInterceptor {
        CacheMap.clear();
        let newCacheHandler: CacheHandlerWithInterceptor =
        {
            ...cacheHandler,
            callback: (operation: 'getFromCache' | 'removeFromCache' | 'putOnCache' | 'clearCache', cacheKey?: string, stream?: Stream) => {}
        }
        newCacheHandler.putOnCache = (cacheKey, stream) => {
            newCacheHandler.callback('putOnCache', cacheKey, stream);
            return cacheHandler.putOnCache(cacheKey, stream);
        }
        newCacheHandler.clearCache = () => {
            newCacheHandler.callback('clearCache');
            return cacheHandler.clearCache();
        }
        newCacheHandler.getFromCache = (cacheKey) => {
            newCacheHandler.callback('getFromCache', cacheKey);
            return cacheHandler.getFromCache(cacheKey);
        }
        newCacheHandler.removeFromCache = (cacheKey) => {
            newCacheHandler.callback('removeFromCache', cacheKey);
            return cacheHandler.removeFromCache(cacheKey);
        }   

        return newCacheHandler;
    }

    export const BufferSyncProcessor: IFieldProcessor<Buffer> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                return of(Buffer.from(value, 'base64'));
            } else {
                return of(null);
            }
        },
        fromDirectRaw: (stream, info) => {
            if (stream) {
                const chunkConcatArrRef: {value: Buffer[]} = {value:[]};
                return from(
                    streamToObservable(stream)
                        .forEach((chunk) => {
                            chunkConcatArrRef.value.push(chunk as Buffer);
                        })
                ).pipe(
                    map(() => {
                        return Buffer.concat(chunkConcatArrRef.value);
                    })
                );
            } else {
                of(null);
            }
        },
        toLiteralValue: (value, info) => {
            if (value) {
                let base64Str = value.toString('base64');
                return of(base64Str);
            } else {
                return of(null);
            }
        },
        toDirectRaw: (value, info) => {
            if (value) {
                let ws = new memStreams.WritableStream();
                ws.write(value);
                let myReadableStreamBuffer = new memStreams.ReadableStream(''); 
                myReadableStreamBuffer.push(value);
                return of(myReadableStreamBuffer);
            } else {
                return of(null);
            }
        }
    };
    export const StringSyncProcessor: IFieldProcessor<String> = {
        fromLiteralValue: (value, info) => {
            return of(value);
        },
        fromDirectRaw: (stream, info) => {
            if (stream) {
                if ((stream as Stream).addListener && (stream as Stream).pipe) {
                    let resultPrmStr = getStream(stream, {encoding: 'utf8', maxBuffer: 1024 * 1024});
                    return from(resultPrmStr);
                } else {
                    throw new Error('Not supported');
                }
            } else {
                return of(null);
            }
        },
        toLiteralValue: (value, info) => {
            return of(value);
        },
        toDirectRaw: (value, info) => {
            if (value) {
                let myReadableStreamBuffer = new memStreams.ReadableStream(value.toString()); 
                myReadableStreamBuffer.setEncoding('utf-8');
                return of(myReadableStreamBuffer);
            } else {
                return of(null);
            }
        }
    };
    export const StreamSyncProcessor: IFieldProcessor<Stream> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                let base64AB = Buffer.from(value, 'base64');
                let myReadableStreamBuffer = new memStreams.ReadableStream(''); 
                myReadableStreamBuffer.push(base64AB);
                return of(myReadableStreamBuffer);
            } else {
                return of(null);
            }
        },
        fromDirectRaw: (stream, info) => {
            if (stream) {
                if ((stream as Stream).addListener && (stream as Stream).pipe) {
                    return of(stream);
                } else {
                    throw new Error('Not supported');
                }
            } else {
                return of(null);
            }
        },
        toDirectRaw: (value, info) => {
            if (value) {
                return of(value);
            } else {
                return of(null);
            }
        },
        toLiteralValue: (value, info) => {
            if (value) {
                return of(value);
            } else {
                return of(null);
            }
        }
    };
    export const StringStreamSyncProcessor: IFieldProcessor<StringStream> = {
            fromLiteralValue: (value, info) => {
                if (value) {
                    let valueBuffer = Buffer.from(value, 'utf8');
                    let ws = new memStreams.WritableStream();
                    ws.write(valueBuffer);
                    let myReadableStreamBuffer = new memStreams.ReadableStream(''); 
                    myReadableStreamBuffer.push(valueBuffer);
                    myReadableStreamBuffer.setEncoding('utf-8');
                    return of(myReadableStreamBuffer);
                } else {
                    return of(null);
                }
            },
            fromDirectRaw: (stream, info) => {
                if (stream) {
                    if ((stream as Stream).addListener && (stream as Stream).pipe) {
                        (stream as any as Readable).setEncoding('utf-8');
                        return of(stream);
                    } else {
                        throw new Error('Not supported');
                    }
                } else {
                    return of(null);
                }
            },
            toDirectRaw: (value, info) => {
                if (value) {
                    return of(value);
                } else {
                    return of(null);
                }
            },
            toLiteralValue: (value, info) => {
                if (value) {
                    return from(getStream(value));
                } else {
                    return of(null);
                }
            }
    };

    export const BufferAsyncProcessor: IFieldProcessor<Buffer> = {
        fromLiteralValue: (value, info) => { return BufferSyncProcessor.fromLiteralValue(value, info).pipe(delay(10)); },
        fromDirectRaw: (stream, info) => { return BufferSyncProcessor.fromDirectRaw(stream, info).pipe(delay(10)); },
        toDirectRaw: (value, info) => { return BufferSyncProcessor.toDirectRaw(value, info).pipe(delay(10)); },
        toLiteralValue: (value, info) => { return BufferSyncProcessor.toLiteralValue(value, info).pipe(delay(10)); }
    };
    export const StringAsyncProcessor: IFieldProcessor<String> = {
            fromLiteralValue: (value, info) => { return StringSyncProcessor.fromLiteralValue(value, info).pipe(delay(10)); },
            fromDirectRaw: (stream, info) => { return StringSyncProcessor.fromDirectRaw(stream, info).pipe(delay(10)); },
            toDirectRaw: (value, info) => { return StringSyncProcessor.toDirectRaw(value, info).pipe(delay(10)); },
            toLiteralValue: (value, info) => { return StringSyncProcessor.toLiteralValue(value, info).pipe(delay(10)); }
    };
    export const StreamAsyncProcessor: IFieldProcessor<Stream> = {
            fromLiteralValue: (value, info) => { return StreamSyncProcessor.fromLiteralValue(value, info).pipe(delay(10)); },
            fromDirectRaw: (stream, info) => { return StreamSyncProcessor.fromDirectRaw(stream, info).pipe(delay(10)); },
            toDirectRaw: (value, info) => { return StreamSyncProcessor.toDirectRaw(value, info).pipe(delay(10)); },
            toLiteralValue: (value, info) => { return StreamSyncProcessor.toLiteralValue(value, info).pipe(delay(10)); }
    };
    export const StringStreamAsyncProcessor: IFieldProcessor<StringStream> = {
            fromLiteralValue: (value, info) => { return StringStreamSyncProcessor.fromLiteralValue(value, info).pipe(delay(10)); },
            fromDirectRaw: (stream, info) => { return StringStreamSyncProcessor.fromDirectRaw(stream, info).pipe(delay(10)); },
            toDirectRaw: (value, info) => { return StringStreamSyncProcessor.toDirectRaw(value, info).pipe(delay(10)); },
            toLiteralValue: (value, info) => { return StringStreamSyncProcessor.toLiteralValue(value, info).pipe(delay(10)); }
    };

    export const TypeProcessorEntriesAsync = 
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
            processor: StringAsyncProcessor
        }
    ];

    export const TypeProcessorEntriesSync = 
    [ 
        {
            type: Buffer,
            processor: BufferSyncProcessor
        },
        {                
            type: String,
            processor: StringSyncProcessor
        },
        {                
            type: Stream,
            processor: StreamSyncProcessor
        },
        {
            type: StringStreamMarker,
            processor: StringSyncProcessor
        }
    ];
}