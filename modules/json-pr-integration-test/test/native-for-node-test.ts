import { from, of, Subject } from "rxjs";
import { map, flatMap, delay } from "rxjs/operators";
import { Readable, Stream } from "stream";
import streamToObservable from 'stream-to-observable';
import { IFieldProcessor, MemStreamReadableStreamAutoEnd, CacheHandler, BinaryStream, StringStream, StringStreamMarker, BinaryStreamMarker, NonWritableStreamExtraMethods } from "json-playback-recorder-ts";

export namespace ForNodeTest {
    export const CacheMap: Map<string, Buffer> = new Map();
    export const CacheHandlerSync: CacheHandler = 
        {
            clearCache: () => {
                CacheMap.clear();
                return of(null);
            },
            getFromCache: (cacheKey) => {
                let buffer = CacheMap.get(cacheKey);
                // let base64AB;
                // if (buffer) {
                //     base64AB = buffer.toString();
                // }
                // let myReadableStreamBuffer;
                // if (base64AB) {
                //     let ws = new memStreams.WritableStream();
                //     ws.write(base64AB);
                //     myReadableStreamBuffer.push(base64AB);
                // }
                let myReadableStreamBuffer = new MemStreamReadableStreamAutoEnd(buffer.toString());

                // myReadableStreamBuffer.addListener('data', (chunk) => {
                //     myReadableStreamBuffer.emit('end');
                // })
                return of(myReadableStreamBuffer);
            },
            putOnCache: (cacheKey, stream) => {
                let resultSub = new Subject<void>();
                let result$ = resultSub.asObservable();

                // const isSynchronouslyDone = { value: false };
                // (stream as Readable).on('data', (chunk) => {
                //     isSynchronouslyDone.value = true;
                //     CacheMap.set(cacheKey, chunk);
                //     resultSub.next();
                // });

                if (stream) {
                    const chunkConcatArrRef: {value: Buffer[]} = {value:[]};
                    return from(
                        streamToObservable(stream)
                            .forEach((chunk) => {
                                chunkConcatArrRef.value.push(chunk as Buffer);
                            })
                    ).pipe(
                        flatMap(() => {
                            let bufferConc = Buffer.concat(chunkConcatArrRef.value);
                            CacheMap.set(cacheKey, bufferConc);
                            return of(null);
                        })
                    );
                } else {
                    return of(null);
                }                

                // if (!isSynchronouslyDone.value) {
                //     return result$;
                // } else {
                //     return of(undefined);
                // };
            },
            removeFromCache: (cacheKey) => {
                CacheMap.delete(cacheKey);
                return of(null);
            }
        };

    export const CacheHandlerAsync: CacheHandler = 
        {
            clearCache: () => {
                return CacheHandlerSync.clearCache().pipe(delay(1));
            },
            getFromCache: (cacheKey) => {
                return CacheHandlerSync.getFromCache(cacheKey).pipe(delay(1));
            },
            putOnCache: (cacheKey, stream) => {
                return CacheHandlerSync.putOnCache(cacheKey, stream).pipe(delay(1));
            },
            removeFromCache: (cacheKey) => {
                return CacheHandlerSync.removeFromCache(cacheKey).pipe(delay(1));
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

    export const DateSyncProcessor: IFieldProcessor<Date> = {
        fromLiteralValue: (value, info) => {
            if (value instanceof Number || typeof(value) === 'number') {
                return new Date(value as number);
            } else if (value instanceof String || typeof(value) === 'string') {
                return new Date(value as string);
            } else {
                return null;
            }
        },
        toLiteralValue: (value, info) => {
            if (value) {
                return value.getTime();
            } else {
                return null;
            }
        }
    };

    export const BufferSyncProcessor: IFieldProcessor<Buffer> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                return Buffer.from(value, 'base64');
            } else {
                return null;
            }
        },
        fromDirectRaw: (respStream$, info) => {
            return respStream$.pipe(
                flatMap((respStream) => {
                    if (respStream) {
                        const chunkConcatArrRef: {value: Buffer[]} = {value:[]};
                        return from(
                            streamToObservable(respStream.body)
                                .forEach((chunk) => {
                                    chunkConcatArrRef.value.push(chunk as Buffer);
                                })
                        ).pipe(
                            map(() => {
                                return { body: Buffer.concat(chunkConcatArrRef.value) };
                            })
                        );
                    } else {
                        return of({ body: null });
                    }
                })
            );
        },
        toLiteralValue: (value, info) => {
            if (value) {
                let base64Str = value.toString('base64');
                return base64Str;
            } else {
                return null;
            }
        },
        toDirectRaw: (value, info) => {
            if (value) {
                // let ws = new memStreams.WritableStream();
                // ws.write(value);
                let myReadableStreamBuffer = new MemStreamReadableStreamAutoEnd(''); 
                myReadableStreamBuffer.push(value);
                return of({ body: myReadableStreamBuffer} );
                // return of(null).pipe(
                //     tap(() => {
                //         myReadableStreamBuffer.emit('end');
                //     }),
                //     map(() => {
                //         return myReadableStreamBuffer;
                //     })
                // );
            } else {
                return of({ body: null });
            }
        }
    };
    export const StringSyncProcessor: IFieldProcessor<String> = {
        fromLiteralValue: (value, info) => {
            return value;
        },
        fromDirectRaw: (respStream$, info) => {
            return respStream$.pipe(
                flatMap((respStream) => {
                    if (respStream.body) {
                        respStream.body.setEncoding('utf8');
                        const chunkConcatArrRef: {value: string[]} = {value:[]};
                        return from(
                            streamToObservable(respStream.body)
                                .forEach((chunk) => {
                                    if (typeof(chunk) === 'string') {
                                        chunkConcatArrRef.value.push(chunk);
                                    } else if (chunk instanceof String) {
                                        chunkConcatArrRef.value.push(chunk.toString());
                                    } else {
                                        throw new Error('Not supported!: chunk: ' + chunk);
                                    }
                                })
                        ).pipe(
                            map(() => {
                                let bufferConc = ''.concat(...chunkConcatArrRef.value);
                                return { body: bufferConc };
                            })
                        );
                    } else {
                        return of({ body: null });
                    }
                })
            );
        },
        toLiteralValue: (value, info) => {
            return value;
        },
        toDirectRaw: (value, info) => {
            if (value) {
                let myReadableStreamBuffer = new MemStreamReadableStreamAutoEnd(value.toString()); 
                myReadableStreamBuffer.setEncoding('utf-8');
                    return of( { body: myReadableStreamBuffer } );
            } else {
                return of( { body: null });
            }
        }
    };
    export const BinaryStreamSyncProcessor: IFieldProcessor<BinaryStream> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                let base64AB = Buffer.from(value, 'base64');
                let myReadableStreamBuffer = new MemStreamReadableStreamAutoEnd(base64AB.toString()); 
                let binaryWRStream: BinaryStream = Object.assign(myReadableStreamBuffer, NonWritableStreamExtraMethods);
                return binaryWRStream;
            } else {
                return null;
            }
        },
        fromDirectRaw: (respStream$, info) => {
            return respStream$.pipe(
                flatMap((respStream) => {
                    if (respStream.body) {
                        if ((respStream.body as NodeJS.ReadStream).addListener && (respStream.body as NodeJS.ReadStream).pipe) {
                            return of(respStream);
                        } else {
                            throw new Error('Not supported');
                        }
                    } else {
                        return of({ body: null });
                    }
                })
            );
        },
        toDirectRaw: (value, info) => {
            if (value) {
                return of({ body: value });
            } else {
                return of({ body: null });
            }
        },
        toLiteralValue: (value, info) => {
            throw new Error('Not supported!');
        }
    };
    export const StringStreamSyncProcessor: IFieldProcessor<StringStream> = {
            fromLiteralValue: (value, info) => {
                if (value) {
                    let valueBuffer = Buffer.from(value, 'utf8');
                    // let ws = new memStreams.WritableStream();
                    // ws.write(valueBuffer);
                    let myReadableStreamBuffer = new MemStreamReadableStreamAutoEnd(value); 
                    myReadableStreamBuffer.setEncoding('utf-8');
                    return myReadableStreamBuffer as any as StringStream;
                } else {
                    return null;
                }
            },
            fromDirectRaw: (respStream$, info) => {
                return respStream$.pipe(
                    flatMap((respStream) => {
                        if (respStream.body) {
                            if ((respStream.body as NodeJS.ReadStream).addListener && (respStream.body as NodeJS.ReadStream).pipe) {
                                (respStream.body as any as Readable).setEncoding('utf-8');
                                return of(respStream);
                            } else {
                                throw new Error('Not supported');
                            }
                        } else {
                            return of({ body: null});
                        }
                    })
                )
            },
            toDirectRaw: (value, info) => {
                if (value) {
                    value.setEncoding('utf8');
                    return of({ body: value });
                } else {
                    return of({ body: null });
                }
            },
            toLiteralValue: (value, info) => {
                throw new Error('Not supported!');
            }
    };

    export const BufferAsyncProcessor: IFieldProcessor<Buffer> = {
        fromLiteralValue: (value, info) => { return BufferSyncProcessor.fromLiteralValue(value, info); },
        fromDirectRaw: (stream, info) => { return BufferSyncProcessor.fromDirectRaw(stream, info).pipe(delay(1)); },
        toDirectRaw: (value, info) => { return BufferSyncProcessor.toDirectRaw(value, info).pipe(delay(1)); },
        toLiteralValue: (value, info) => { return BufferSyncProcessor.toLiteralValue(value, info); }
    };
    export const StringAsyncProcessor: IFieldProcessor<String> = {
            fromLiteralValue: (value, info) => { return StringSyncProcessor.fromLiteralValue(value, info); },
            fromDirectRaw: (stream, info) => { return StringSyncProcessor.fromDirectRaw(stream, info).pipe(delay(1)); },
            toDirectRaw: (value, info) => { return StringSyncProcessor.toDirectRaw(value, info).pipe(delay(1)); },
            toLiteralValue: (value, info) => { return StringSyncProcessor.toLiteralValue(value, info); }
    };
    export const BinaryStreamAsyncProcessor: IFieldProcessor<BinaryStream> = {
            fromLiteralValue: (value, info) => { return BinaryStreamSyncProcessor.fromLiteralValue(value, info); },
            fromDirectRaw: (stream, info) => { return BinaryStreamSyncProcessor.fromDirectRaw(stream, info).pipe(delay(1)); },
            toDirectRaw: (value, info) => { return BinaryStreamSyncProcessor.toDirectRaw(value, info).pipe(delay(1)); },
            toLiteralValue: (value, info) => { return BinaryStreamSyncProcessor.toLiteralValue(value, info); }
    };
    export const StringStreamAsyncProcessor: IFieldProcessor<StringStream> = {
            fromLiteralValue: (value, info) => { return StringStreamSyncProcessor.fromLiteralValue(value, info); },
            fromDirectRaw: (stream, info) => { return StringStreamSyncProcessor.fromDirectRaw(stream, info).pipe(delay(1)); },
            toDirectRaw: (value, info) => { return StringStreamSyncProcessor.toDirectRaw(value, info).pipe(delay(1)); },
            toLiteralValue: (value, info) => { return StringStreamSyncProcessor.toLiteralValue(value, info); }
    };
    export const DateAsyncProcessor: IFieldProcessor<Date> = {
        fromLiteralValue: (value, info) => { return DateSyncProcessor.fromLiteralValue(value, info); },
        toLiteralValue: (value, info) => { return DateSyncProcessor.toLiteralValue(value, info); }
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
            type: BinaryStreamMarker,
            processor: BinaryStreamAsyncProcessor
        },
        {
            type: StringStreamMarker,
            processor: StringAsyncProcessor
        },
        {
            type: Date,
            processor: DateAsyncProcessor
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
            type: BinaryStreamMarker,
            processor: BinaryStreamSyncProcessor
        },
        {
            type: StringStreamMarker,
            processor: StringSyncProcessor
        },
        {
            type: Date,
            processor: DateSyncProcessor
        }
    ];
}