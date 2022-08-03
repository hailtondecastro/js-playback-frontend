//require('any-observable/register')('rxjs', {Observable: require('rxjs/Observable').Observable})


import * as chai from 'chai';
import { of } from 'rxjs';
import { AsyncCountdown } from './async-countdown';
import { AsyncCount } from './async-count';
import { CacheHandler } from '../src/api/recorder-config';
import { StringBlobOrStream } from '../src/api/lazy-ref';
import { map, flatMap } from 'rxjs/operators';
import { RecorderForDom } from '../src/implementation/native-for-dom';
import { RecorderForNode } from '../src/implementation/native-for-node';
import { RecorderDecoratorsInternal } from '../src/implementation/recorder-decorators-internal';

//export function testBlock() {
{
    describe('CacheHandlerTest', () => {
        const speedTimeFactor = 0.5;

        it('CacheHandlerTest.CacheHandlerSync', (done) => {
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1000 * speedTimeFactor });
            let asyncCount = new AsyncCount();
            let originalValue = 'originalValue_FOO_BAA';
            // let fieldInfo: FieldInfo = {
            //         fieldName: 'fieldName',
            //         fieldType: String,
            //         ownerType: Object,
            //         ownerValue: {}
            //     };
            let cacheHandler: CacheHandler;
            if(typeof Blob === 'undefined') {
                cacheHandler = new RecorderForNode.CacheHandlerDefault('cache_files_test_folder');
            } else {
                cacheHandler = RecorderForDom.CacheHandlerDefault;
            }
            let myReadableStream = RecorderForDom.stringToBlobOrStream(originalValue);
            let stringStream: StringBlobOrStream = myReadableStream;
            let putOnCache$ = cacheHandler.putOnCache('foo_key', stringStream)
                .pipe(
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr()
                );
            const finalObs$ = putOnCache$.pipe(
                flatMap(() => {
                    let getFromCache$ = cacheHandler.getFromCache('foo_key')
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                    return getFromCache$;
                }),
                flatMap((stream) => {
                    let fromDirectRaw$ = RecorderDecoratorsInternal.StringProcessor.fromDirectRaw(of({ body: stream }), null)
                    .pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    );
                    return fromDirectRaw$;
                }),
                flatMap((respStreamStr) => {
                    chai.expect(originalValue).to.eq(respStreamStr.body);
                    let removeFromCache$ = cacheHandler.removeFromCache('foo_key').pipe(
                        asyncCount.registerRxOpr(),
                        asyncCountdown.registerRxOpr()
                    )
                    return removeFromCache$;
                }),
                map(() => {
                    return null;
                })
            );

            finalObs$.subscribe(() => {
                // nothing
                1 === 1;
            })

            asyncCountdown.createCountdownEnds().subscribe(() => {
                chai.expect(asyncCount.count).to.eq(4);
                done();
            });
        }).timeout(2000 * speedTimeFactor);
    });
}

//testBlock();