import { OperatorFunction, ObservableInput, Observable, of, throwError, Subject, timer, Subscription } from 'rxjs';
import { map, flatMap, timeout, catchError, delay, take } from 'rxjs/operators';
import { ConsoleLike } from '../api/recorder-config';
import { RecorderLogLevel } from '../api/recorder-config';




// export function combineFirstSerial<T>(array: Observable<T>[]): Observable<T[]> {
//     const resutlArr: T[] = new Array<T>(array.length);
//     const resutltObsArrRef = {value: of(dummyMarker) as Observable<T>};
    
//     const errorForStack = new Error('combineFirstSerial. Possible cycle!');

//     // for (let i = 0; i < array.length; i++) {
//     //     const element = array[i];
//     //     for (let j = i + 1; j < array.length; j++) {
//     //         const elementOther = array[j];
//     //         if (element === elementOther) {
//     //             console.log('same element\n' + errorForStack.stack);
//     //         }
//     //     }
//     // }


//     for (let index = 0; index < array.length; index++) {
  
//         const element$ = array[index];
//         const indexRef = {value: index};
//         resutltObsArrRef.value = resutltObsArrRef.value.pipe(
//             flatMap((resultT) => {
//                 //console.log((array as any).fooid);
//                 return element$;
//             }),
//             tap((element) => {
//                 if (element != dummyMarker) {
//                     //console.log((array as any).fooid);
//                     resutlArr[indexRef.value] = element;
//                 }
//             }),
//             share()
//             // ,tap((value) => {
//             //     if (!LodashLike.isNil(value)) {
//             //         if(repeatedValueSet.has(value)) {
//             //             console.error(errorForStack + '\n' + errorForStack.stack);
//             //         } else {
//             //             repeatedValueSet.add(value);
//             //         }
//             //     } 
//             // })
//         );

//         // if (!resutltObsArrRef.value) {
//         //     resutltObsArrRef.value = element$.pipe(
//         //         flatMapJustOnceRxOpr((resultT) => {
//         //             console.log(array.length);
//         //             resutlArr[indexRef.value] = resultT;
//         //             return element$;
//         //         })
//         //     );
//         // } else {
//         //     resutltObsArrRef.value = resutltObsArrRef.value.pipe(
//         //         flatMapJustOnceRxOpr((resultT) => {
//         //             console.log(array.length);
//         //             resutlArr[indexRef.value] = resultT;
//         //             return element$;
//         //         })
//         //     );
//         // }
//     }
//     // if (array.length > 0) {
//         return resutltObsArrRef.value.pipe(
//             // mapJustOnceRxOpr((resultT) => {
//             //     return resutlArr;
//             // })
//             map((resultT) => {
//                 return resutlArr;
//             })
//             // ,
//             // timeoutDecorateRxOpr()
//         );
//     // } else {
//     //     return of([]);
//     // }
// }

export function combineFirstSerial<T>(array: Observable<T>[]): Observable<T[]> {
    if (!array || array.length < 1) {
        return of ([]);
    }
    
    const resutlArr: T[] = new Array<T>(array.length);
    const decoratedArray = new Array<Observable<T>>(array.length);

    for (let index = 0; index < array.length; index++) {
        decoratedArray[index] = array[index].pipe(
            take(1),
            delay(0)
        );
    }
    let result$: Observable<T[]> = of(resutlArr);

    for (let index = 0; index < decoratedArray.length; index++) {
        result$ = result$.pipe(
            flatMap(() => {
                return decoratedArray[index];
            }),
            take(1),
            map((valueItem) => {
                resutlArr[index] = valueItem;
                return resutlArr;
            }),
            take(1)
        );        
    }
    return result$;
}

// export function combineFirstSerial<T>(array: Observable<T>[]): Observable<T[]> {
//     if (!array || array.length < 1) {
//         return of ([]);
//     }
    
//     const resutlArr: T[] = new Array<T>(array.length);
//     const decoratedArray = new Array<Observable<T>>(array.length);

//     for (let index = 0; index < array.length; index++) {
//         decoratedArray[index] = array[index].pipe(
//             take(1),
//             delay(0)
//         );
//     }
//     const alreadyRunnedMap: Map<Observable<T>, boolean> = new Map();
//     const alreadyRunnedOrderMap: Map<Observable<T>, number> = new Map();
//     const indexRef = { value: 0 };
//     const o$ = new Observable<T[] | T>(
//         (subscriber) => {
//             let subscriberGoNextDecorated: PartialObserver<T[] | T> = 
//                 {
//                     next: (value) => {
//                         const obsIndexCurrent = indexRef.value;
//                         const obsIndexNext = indexRef.value + 1;
//                         try {
//                             resutlArr[obsIndexCurrent] = value as T;
//                             if (!subscriber.closed) {
//                                 if (obsIndexNext < array.length
//                                         && !alreadyRunnedMap.get(decoratedArray[obsIndexNext])) {
//                                     const subs = decoratedArray[obsIndexNext].subscribe(
//                                         {
//                                             next: (nextValue) => {
//                                                 try {
//                                                     if (obsIndexNext < array.length) {
//                                                         subscriberGoNextDecorated.next(nextValue);
//                                                     } else {
//                                                     }
//                                                 } finally {
//                                                     if (subs) {
//                                                         subs.unsubscribe();
//                                                     } else {
//                                                         1 === 1;
//                                                     }
//                                                 }
//                                             },
//                                             error: (err) => {
//                                                 if (subs) {
//                                                     subs.unsubscribe();
//                                                 }
//                                                 subscriber.error(err);
//                                             }
//                                         }
//                                     );
//                                 } else {
//                                     subscriber.next(resutlArr);
//                                     subscriber.complete();
//                                 }
//                             } else {
//                             }
//                         } finally {
//                             if(!alreadyRunnedMap.get(decoratedArray[obsIndexCurrent])) {
//                                 indexRef.value++;
//                             }
//                             alreadyRunnedMap.set(decoratedArray[obsIndexCurrent], true);
//                             alreadyRunnedOrderMap.set(decoratedArray[obsIndexCurrent], indexRef.value);
//                         }
//                     },
//                     error: subscriber.error,
//                     complete: () => {
//                         //nothing
//                     }
//                 };
//             if(!alreadyRunnedMap.get(decoratedArray[0])) {
//                 decoratedArray[0].subscribe(subscriberGoNextDecorated);
//             } else {
//                 1 === 1;
//             }
//         }
//     );
//     return o$ as Observable<T[]>;
// }

export function mapJustOnceRxOpr<T, R>(project: (value: T, index?: number) => R): OperatorFunction<T, R> {
    const isPipedCallbackDone = { value: false, result: null as R};
    let rxOpr: OperatorFunction<T, R> = (source) => {
        let projectExtentend = (valueA: T, index: number) => {
            if (!isPipedCallbackDone.value) {
                isPipedCallbackDone.value = true;
                isPipedCallbackDone.result = project(valueA, index);
            }
            return isPipedCallbackDone.result;
        }
        return source
            .pipe(
                map(projectExtentend)
            );
    }
    //console.log('foobarfoobar');
    return rxOpr;
}

export function timeoutDecorateRxOpr<T>(): OperatorFunction<T, T> {
    const errTimeOut = new Error('timeout for provided observable');
    let rxOpr: OperatorFunction<T, T> = (source) => {
        return source
            .pipe(
                timeout(3000),
                catchError((err) => {
                    console.error(err + '\n' + errTimeOut);
                    return throwError(errTimeOut);
                })
            );
    }
    return rxOpr;
}

export function flatMapJustOnceRxOpr<T, R>(project: (value: T, index?: number) => ObservableInput<R>): OperatorFunction<T, R> {
    const isPipedCallbackDone = { value: false, result: null as ObservableInput<R>};
    let rxOpr: OperatorFunction<T, R> = (source) => {
        let projectExtentend = (valueB: T, index: number) => {
            if (!isPipedCallbackDone.value) {
                isPipedCallbackDone.value = true;
                isPipedCallbackDone.result = project(valueB, index);
            }
            return isPipedCallbackDone.result;
        }
        return source
            .pipe(
                flatMap(projectExtentend)
            ) as Observable<R>;
    }
    return rxOpr;
}

/**
 * This class is to solve this problem:  
 * Using only one Observable as a wait marker for many waiting 'agents'  
 * on 'subscribe' has a side effect:  
 * If you have N callbacks (into N different subscribe's) the first callback  
 * is called N times, the second N - 1 times, and so on.  
 */
export class WaitHolder {
    constructor(private consoleLike: ConsoleLike, private timeout?: number) {
    }
    private _senderSet: Set<Object> = new Set();
    private _temporaryWaitArr: Subject<void>[];
    public needToWait(): boolean {
        if(this._temporaryWaitArr && this._senderSet.size > 0) {
            return true;
        } else {
            return false;
        }
    }
    private timerSubs: Subscription;
    public beginWait(sender: Object): void {
        const thisLocal = this;
        if(!this.timerSubs) {
            if(this.timeout > 0) {
                this.timerSubs = timer(this.timeout).subscribe(() => {
                    if(thisLocal.needToWait()) {
                        if(thisLocal.timerSubs) {
                            thisLocal.timerSubs.unsubscribe();
                            thisLocal.timerSubs = null;                    
                        }
                        if(thisLocal.timerSubs) {
                            thisLocal.timerSubs.unsubscribe();
                            thisLocal.timerSubs = null;                    
                        }
                        const err = new Error('Timeout exceded for wait: ' + thisLocal.timeout);
                        thisLocal.emitEndWait(null, err);
                    }
                })
            }
        }
        if(this._senderSet.has(sender)) {
            throw new Error('The sender has already asked to wait for him before: ' + sender);
        }
        this._senderSet.add(sender);
        if(!this._temporaryWaitArr) {
            this._temporaryWaitArr = [];
        }
        if (this.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
            this.consoleLike.debug('WaitHolder.beginWait()');
        }
    }
    public getWait(): Observable<void> {
        if(this.needToWait()) {
            this._temporaryWaitArr.push(new Subject());
            if (this.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                this.consoleLike.debug('WaitHolder.getWait(): this._temporaryWait.length: ' + this._temporaryWaitArr.length);
            }
            return this._temporaryWaitArr[this._temporaryWaitArr.length - 1].asObservable();
        } else {
            if (this.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                this.consoleLike.debug('WaitHolder.getWait(): nothing to wait, returning of(null)');
            }
            return of(null);
        }
    }
    public emitEndWait(sender: Object, err?: Error): void {
        if(this.needToWait()) {
            if(err) {
                const temporaryWaitArrLocal = this._temporaryWaitArr;    
                this._temporaryWaitArr = null;
                this._senderSet.clear();
                if(this.timerSubs) {
                    this.timerSubs.unsubscribe();
                    this.timerSubs = null;                    
                }
                for (let index = 0; index < temporaryWaitArrLocal.length; index++) {
                    if (this.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        this.consoleLike.debug('WaitHolder.emitEndWait(err): this._temporaryWait.length: ' + this._temporaryWaitArr.length + '. Time: ' + new Date().getTime());
                    }
                    const tempWaitItem = temporaryWaitArrLocal[index];
                    tempWaitItem.error(err);
                    tempWaitItem.complete();
                }
            } else {
                if (this.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                    this.consoleLike.debug('WaitHolder.emitEndWait(): this._temporaryWait.length: ' + this._temporaryWaitArr.length + '. Time: ' + new Date().getTime());
                }
                if(!this._senderSet.has(sender)) {
                    throw new Error('The sender has not asked to wait for him before: ' + sender);
                }
                this._senderSet.delete(sender);
                if(this._senderSet.size === 0) {
                    const temporaryWaitArrLocal = this._temporaryWaitArr;    
                    this._temporaryWaitArr = null;
                    for (let index = 0; index < temporaryWaitArrLocal.length; index++) {
                        const tempWaitItem = temporaryWaitArrLocal[index];
                        tempWaitItem.next();
                        tempWaitItem.complete();
                    }
                    if(this.timerSubs) {
                        this.timerSubs.unsubscribe();
                        this.timerSubs = null;                    
                    }
                }
            }
        } else {
            if (this.consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                this.consoleLike.debug('WaitHolder.emitEndWait(): nothing to emit');
            }
            //throw new Error('nothing to emit: ' + sender + '\nerr: ' + err);
        }
    }
}