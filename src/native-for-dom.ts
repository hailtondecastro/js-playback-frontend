
import { of, from, Observable, combineLatest } from "rxjs";
import { IFieldProcessor } from "./field-processor";
import getStream = require("get-stream");
import { Stream } from "stream";
import * as memStreams from 'memory-streams';
import { NgJsHbDecorators } from "./js-hb-decorators";
import { CacheHandler } from "./js-hb-config";
import { map, flatMap } from "rxjs/operators";
import { flatMapJustOnceRxOpr } from "./rxjs-util";
const toStream = require('blob-to-stream');
const toBlob = require('stream-to-blob');

export namespace JsHbForDom {
    export const CacheHandlerDefault: CacheHandler = 
        {
            clearCache: () => {
                return from(caches.open('jshb_cachestorage'))
                    .pipe(
                        map((cache) => {
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
                        })
                    )
                    .pipe(
                        flatMapJustOnceRxOpr((response) => {
                            return from(response.blob());
                        })
                    )
                    .pipe(
                        flatMapJustOnceRxOpr((blob) => {
                            return of(toStream(blob));
                        })
                    );
            },
            putOnCache: (cacheKey, stream) => {
                return from(caches.open('jshb_cachestorage'))
                    .pipe(
                        map((cache) => {
                            return from(cache.put(cacheKey, new Response(toBlob(stream), null)))
                                .pipe(map(() => {}));
                        })
                    )
                    .pipe(map(() => {}));
            },
            removeFromCache: (cacheKey) => {
                return from(caches.open('jshb_cachestorage'))
                    .pipe(
                        map((cache) => {
                            return from(cache.delete(cacheKey))
                                .pipe(map(() => {}));
                        })
                    )
                    .pipe(map(() => {}));
            }
        };
}