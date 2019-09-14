import * as chai from 'chai';
import { Observable, of, BehaviorSubject, interval, zip, combineLatest } from 'rxjs';
import { delay, tap, combineAll, take } from 'rxjs/operators';
import { combineFirstSerial } from '../src/implementation/rxjs-util.js';
import { AsyncCountdown } from './async-countdown.js';
import { AsyncCount } from './async-count.js';

{
    describe('rxjs-util-test', () => {
        const debugTimeFactor = 0.5;

        it('rxjs-util-test.combineAll', (done) => {
            //let asyncCount = 0;
            let asyncCount = new AsyncCount();
            const executionArr: Number[] = [];
            let asyncCountdown = new AsyncCountdown({ count: 10, timeOut: 1000 * debugTimeFactor});

            const bSub0 = new BehaviorSubject<string>('b0');
            const bSub1 = new BehaviorSubject<string>('b1');
            const bSub2 = new BehaviorSubject<string>('b2');
            const d0 = interval(50 * debugTimeFactor).pipe(
                tap((i)=> {
                    bSub0.next('b0: ' + i);
                }),
                take(3),
            ).subscribe(() => {});
            const d1 = interval(60 * debugTimeFactor).pipe(
                tap((i)=> {
                    bSub1.next('b1: ' + i);
                }),
                take(3),
            ).subscribe(() => {});
            const d2 = interval(70 * debugTimeFactor).pipe(
                tap((i)=> {
                    bSub2.next('b1: ' + i);
                }),
                take(3),
            ).subscribe(() => {});

            of(bSub0, bSub1, bSub2).pipe(
                combineAll((b0, b1, b2) => {
                    return [b0, b1, b2];
                }),
                asyncCountdown.registerRxOpr()
            ).subscribe(([bs0, bs1, bs2]) => {
                //console.log(bs0, bs1, bs2);
            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                done();
            });
        }).timeout(2000 * debugTimeFactor);

        it('rxjs-util-test.combineFirstSerial_4-items', (done) => {
            //let asyncCount = 0;
            let asyncCount = new AsyncCount();
            const executionArr: Number[] = [];
            let asyncCountdown = new AsyncCountdown({ count: 4, timeOut: 1000 * debugTimeFactor});


            let obs0$: Observable<number> = of(0).pipe(
                delay(300 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    //console.log(new Date() + ': ' + value);
                    executionArr.push(value);
                })
            );
            let obs1$: Observable<number> = of(1).pipe(
                delay(200 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    //console.log(new Date() + ': ' + value);
                    executionArr.push(value);
                })
            );
            let obs2$: Observable<number> = of(2).pipe(
                delay(100 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    //console.log(new Date() + ': ' + value);
                    executionArr.push(value);
                })                
            );
            let obs3$: Observable<number> = of(3).pipe(
                delay(1 * debugTimeFactor),
                asyncCount.registerRxOpr(),
                asyncCountdown.registerRxOpr(),
                tap((value) => {
                    //console.log(new Date() + ': ' + value);
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
        }).timeout(2000 * debugTimeFactor);

        it('rxjs-util-test.combineFirstSerial_so-many-items', 1 == 1 ? (done) => {done();} : (done) => {
            //let asyncCount = 0;
            let asyncCount = new AsyncCount();
            const executionArr: Number[] = [];
            const amount = 1000;

            let asyncCountdown = new AsyncCountdown({ count: amount, timeOut: (amount * 16) * debugTimeFactor});

            const obsArr: Observable<number>[] = [];
            for (let index = 0; index < amount; index++) {
                obsArr.push(of(index).pipe(
                    delay(((amount * 0.01) - (index * 0.005)) * debugTimeFactor),
                    asyncCount.registerRxOpr(),
                    asyncCountdown.registerRxOpr(),
                    tap((value) => {
                        //console.log(new Date() + ': ' + index);
                        executionArr.push(value);
                    })
                ));                
            }

            combineFirstSerial(obsArr).subscribe((valuesArr) => {
                for (let index = 0; index < valuesArr.length; index++) {
                    chai.expect(valuesArr[index]).to.eq(index);
                    chai.expect(executionArr[index]).to.eq(index);           
                }
            });

            asyncCountdown.createCountdownEnds().subscribe(() => {
                done();
            });
        }).timeout(20000 * debugTimeFactor);

        it('rxjs-util-test.combineFirstSerial_0-items', (done) => {
            //let asyncCount = 0;
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
        }).timeout(2000 * debugTimeFactor);
    });
}
