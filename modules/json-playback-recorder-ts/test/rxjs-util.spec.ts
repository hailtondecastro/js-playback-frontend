import * as chai from 'chai';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { combineFirstSerial } from '../src/implementation/rxjs-util.js';
import { AsyncCountdown } from './async-countdown.js';
import { AsyncCount } from './async-count.js';

{
    describe('rxjs-util-test', () => {
        it('rxjs-util-test.combineFirstSerial_4-items', (done) => {
            //let asyncCount = 0;
            const debugTimeFactor = 1;
            let asyncCount = new AsyncCount();
            const executionArr: Number[] = [];
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1000 * debugTimeFactor});


            let obs0$: Observable<number> = of(0).pipe(
                delay(300 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    // console.log(new Date() + ': ' + value);
                    executionArr.push(value);
                })
            );
            let obs1$: Observable<number> = of(1).pipe(
                delay(200 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    // console.log(new Date() + ': ' + value);
                    // executionArr.push(value);
                })
            );
            let obs2$: Observable<number> = of(2).pipe(
                delay(100 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    // console.log(new Date() + ': ' + value);
                    executionArr.push(value);
                })                
            );
            let obs3$: Observable<number> = of(3).pipe(
                delay(1 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    // console.log(new Date() + ': ' + value);
                    executionArr.push(value);
                })
            );
            combineFirstSerial([obs0$, obs1$, obs2$, obs3$]).subscribe((resultArr) => {
                chai.expect(resultArr[0]).to.eq(0);
                chai.expect(resultArr[1]).to.eq(1);
                chai.expect(resultArr[2]).to.eq(2);
                chai.expect(resultArr[3]).to.eq(3);
                chai.expect(executionArr[0]).to.eq(0);
                chai.expect(executionArr[1]).to.eq(1);
                chai.expect(executionArr[2]).to.eq(2);
                chai.expect(executionArr[3]).to.eq(3);
            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                done();
            });
        });
        it('rxjs-util-test.combineFirstSerial_0-items', (done) => {
            //let asyncCount = 0;
            const debugTimeFactor = 1;
            let asyncCount = new AsyncCount();
            const executionArr: Number[] = [];
            let asyncCountdown = new AsyncCountdown({ count: 2, timeOut: 1000 * debugTimeFactor});

            combineFirstSerial([]).pipe(
                asyncCountdown.registerRxOpr()
            ).subscribe((resultArr) => {
                chai.expect(resultArr.length).to.eq(0);
            });

            combineFirstSerial([]).pipe(
                asyncCountdown.registerRxOpr()
            ).subscribe((resultArr) => {
                chai.expect(resultArr.length).to.eq(0);
            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                done();
            });
        });
    });
}
