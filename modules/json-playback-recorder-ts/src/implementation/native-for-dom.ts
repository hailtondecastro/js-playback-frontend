
import { of, from, Observable, combineLatest } from "rxjs";
import { map, delay, flatMap } from "rxjs/operators";
import { flatMapJustOnceRxOpr, combineFirstSerial } from "./rxjs-util";
import { CacheHandler } from "../api/recorder-config";
import { MemStreamReadableStreamAutoEnd } from "./mem-stream-readable-stream-auto-end";
import { BlobOrStream } from "../api/lazy-ref";
import { rejects } from "assert";

export namespace RecorderForDom {
    export const CacheHandlerDefault: CacheHandler = 
        {
            clearCache: () => {
                return from(caches.open('jshb_cachestorage'))
                    .pipe(
                        flatMap((cache) => {
                            return from(cache.keys())
                                .pipe(
                                    flatMapJustOnceRxOpr((requests) => {
                                        const obsArr: Observable<boolean>[] = [];
                                        for (const req of requests) {
                                            obsArr.push(from(cache.delete(req)));
                                        }
                                        if (obsArr.length > 0) {
                                            return combineLatest(obsArr);
                                        } else {
                                            return of(null);
                                        }
                                    })
                                )
                        })
                    )
                    .pipe(map(() => {}));
            },
            getFromCache: (cacheKey) => {
                return from(caches.open('jshb_cachestorage'))
                    .pipe(
                        flatMapJustOnceRxOpr((cache) => {
                            return from(cache.match(cacheKey));
                        }),
                    )
                    .pipe(
                        flatMapJustOnceRxOpr((response) => {
                            return from(response.blob());
                        })
                    )
                    .pipe(
                        flatMapJustOnceRxOpr((blob) => {
                            return of(blob);
                        })
                    );
            },
            putOnCache: (cacheKey, stream) => {
                return from(caches.open('jshb_cachestorage'))
                    .pipe(
                        flatMapJustOnceRxOpr((cache) => {
                            return from(cache.put(cacheKey, new Response(stream as Blob, null)))
                                .pipe(
                                    map(() => {
                                        return null;
                                    })
                                );
                        })
                    );
            },
            removeFromCache: (cacheKey) => {
                return from(caches.open('jshb_cachestorage'))
                    .pipe(
                        flatMapJustOnceRxOpr((cache) => {
                            return from(cache.delete(cacheKey))
                                .pipe(map(() => {}));
                        })
                    )
                    .pipe(map(() => {}));
            }
        };
    
    export function isBlobOrStream(blobOrStreamCandidate: any): boolean {
        return isStream(blobOrStreamCandidate) || isBlob(blobOrStreamCandidate);
    }
    export function isStream(streamCandidate: any): boolean {
        if((streamCandidate as NodeJS.ReadableStream).addListener && (streamCandidate as NodeJS.ReadableStream).pipe) {
            return true;
        } else {
            return false;
        }
    }
    export function isBlob(blobCandidate: any): boolean {
        if (blobCandidate && blobCandidate.constructor && blobCandidate.constructor.prototype) {
            const bKeysSet = new Set(Object.keys(blobCandidate.constructor.prototype));
            return bKeysSet.has('slice') && bKeysSet.has('size') && bKeysSet.has('type');
        } else {
            return false;
        }
    }
    export function b64ToBlobOrStream(base64: string, options?: {blobType?: string}): BlobOrStream {
        if(!options) {
            options = {};
        }
        if(!options.blobType) {
            options.blobType = 'application/octet-stream';
        }
        let blobOrStream: BlobOrStream;

        if(typeof Blob === 'undefined') {
            let base64AB = Buffer.from(base64, 'base64');
            blobOrStream = new MemStreamReadableStreamAutoEnd(base64AB); 
        } else {
            blobOrStream = b64ToBlob(base64.toString());
        }

        return blobOrStream;
    }
    export function b64ToBlob(base64: string, options?: {blobType?: string}): Blob {
        if(!options) {
            options = {};
        }
        if(!options.blobType) {
            options.blobType = 'application/octet-stream';
        }
        var byteString = atob(base64);
        let ab = new ArrayBuffer(byteString.length);
        let ia = new Uint8Array(ab);
    
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: options.blobType });
    }

    /**
     * Ref: [node.js - Convert a binary NodeJS Buffer to JavaScript ArrayBuffer - Stack Overflow](https://stackoverflow.com/a/31394257/1350308)  
     * 
     * @param buffer 
     */
    export function nodeBufferToBlob(buffer: Buffer): Blob {
        const arrBuffer: ArrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const blob = new Blob([arrBuffer], { type: 'application/octet-stream' });
        return blob;
    }

    export function stringToBlobOrStream(valueStr: string): BlobOrStream {
        if(typeof Blob === 'undefined') {
            let myReadableStreamBuffer = new MemStreamReadableStreamAutoEnd(valueStr.toString(), 'utf-8'); 
            myReadableStreamBuffer.setEncoding('utf-8');
            return myReadableStreamBuffer;
        } else {
            let blob = new Blob([valueStr.toString()], {
                type: 'text/plain'
            });
            return blob;
        }
    }

    export function bufferToBlobOrStream(valueBuffer: Buffer): BlobOrStream {
        if (typeof Blob === 'undefined') {
            return new MemStreamReadableStreamAutoEnd(valueBuffer, 'binary');
        } else {
            return RecorderForDom.nodeBufferToBlob(valueBuffer);
        }
    }

    export function arrayBufferToBuffer(ab: ArrayBuffer) {
        var buffer = new Buffer(ab.byteLength);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }
        return buffer;
      }

    export function blobOrStreamToString(blobOrStream: BlobOrStream): Observable<String> {
        let p: Promise<String>;
        if (blobOrStream) {
            const chunkConcatArrRef: {value: string[]} = {value:[]};
            if(typeof Blob === 'undefined') {
                p = new Promise((resolve, reject) => {
                    (blobOrStream as NodeJS.ReadableStream).setEncoding('utf8');
                    (blobOrStream as NodeJS.ReadableStream).addListener(
                        'data',
                        (dataBuffer) => {
                            chunkConcatArrRef.value.push(dataBuffer);
                        }
                    );
                    (blobOrStream as NodeJS.ReadableStream).addListener(
                        'end',
                        () => {
                            resolve(''.concat(...chunkConcatArrRef.value));
                        }
                    );
                    (blobOrStream as NodeJS.ReadableStream).addListener(
                        'error',
                        (err) => {
                            reject(err);
                        }
                    );
                    (blobOrStream as NodeJS.ReadableStream).read();
                })
            } else {
                p = new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.addEventListener(
                        'load',
                        (ev) => {
                            chunkConcatArrRef.value.push(fr.result as string);
                        }
                    );
                    fr.addEventListener(
                        'loadend',
                        (ev) => {
                            resolve(''.concat(...chunkConcatArrRef.value));
                        }
                    );
                    fr.addEventListener(
                        'error',
                        (err) => {
                            reject(err);
                        }
                    )
                    fr.readAsText(blobOrStream as Blob);
                })
            }
            return from(p);
        } else {
            return of(null);
        }
    }

    export function blobOrStreamToBuffer(blobOrStream: BlobOrStream): Observable<Buffer> {
        let p: Promise<Buffer>;
        if (blobOrStream) {
            const chunkConcatArrRef: {value: Buffer[]} = {value:[]};
            if(typeof Blob === 'undefined') {
                p = new Promise((resolve, reject) => {
                    (blobOrStream as NodeJS.ReadableStream).addListener(
                        'data',
                        (dataBuffer) => {
                            chunkConcatArrRef.value.push(dataBuffer);
                        }
                    );
                    (blobOrStream as NodeJS.ReadableStream).addListener(
                        'end',
                        () => {
                            resolve(Buffer.concat(chunkConcatArrRef.value));
                        }
                    );
                    (blobOrStream as NodeJS.ReadableStream).addListener(
                        'error',
                        (err) => {
                            reject(err);
                        }
                    );
                    (blobOrStream as NodeJS.ReadableStream).read();
                })
            } else {
                p = new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.addEventListener(
                        'load',
                        (ev) => {
                            chunkConcatArrRef.value.push(arrayBufferToBuffer(fr.result as ArrayBuffer));
                        }
                    );
                    fr.addEventListener(
                        'loadend',
                        (ev) => {
                            resolve(Buffer.concat(chunkConcatArrRef.value));
                        }
                    );
                    fr.addEventListener(
                        'error',
                        (err) => {
                            reject(err);
                        }
                    )
                    fr.readAsArrayBuffer(blobOrStream as Blob);
                })
            }
            return from(p);
        } else {
            return of(null);
        }
    }
}