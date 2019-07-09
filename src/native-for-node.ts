
import { of, from, Observable, forkJoin } from "rxjs";
import { CacheHandler } from "./js-hb-config";
import { map, flatMap } from "rxjs/operators";
const toStream = require('blob-to-stream');
const toBlob = require('stream-to-blob');

export namespace JsHbForNode {
    // export const CacheHandlerDefault: CacheHandler = 
    //     {
    //         clearCache: () => {
    //             return from(caches.open('jshb_cachestorage'))
    //                 .pipe(
    //                     map((cache) => {
    //                         return from(cache.keys())
    //                             .pipe(
    //                                 flatMap((requests) => {
    //                                     const obsArr: Observable<boolean>[] = [];
    //                                     for (const req of requests) {
    //                                         obsArr.push(from(cache.delete(req)));
    //                                     }
    //                                     return forkJoin(obsArr);
    //                                 })
    //                             )
    //                     })
    //                 )
    //                 .pipe(map(() => {}));
    //         },
    //         getFromCache: (cacheKey) => {
    //             return from(caches.open('jshb_cachestorage'))
    //                 .pipe(
    //                     flatMap((cache) => {
    //                         return from(cache.match(cacheKey));
    //                     })
    //                 )
    //                 .pipe(
    //                     flatMap((response) => {
    //                         return from(response.blob());
    //                     })
    //                 )
    //                 .pipe(
    //                     flatMap((blob) => {
    //                         return of(toStream(blob));
    //                     })
    //                 );
    //         },
    //         putOnCache: (cacheKey, stream) => {
    //             return from(caches.open('jshb_cachestorage'))
    //                 .pipe(
    //                     map((cache) => {
    //                         return from(cache.put(cacheKey, new Response(toBlob(stream), null)))
    //                             .pipe(map(() => {}));
    //                     })
    //                 )
    //                 .pipe(map(() => {}));
    //         },
    //         removeFromCache: (cacheKey) => {
    //             return from(caches.open('jshb_cachestorage'))
    //                 .pipe(
    //                     map((cache) => {
    //                         return from(cache.delete(cacheKey))
    //                             .pipe(map(() => {}));
    //                     })
    //                 )
    //                 .pipe(map(() => {}));
    //         }
    //     };
}