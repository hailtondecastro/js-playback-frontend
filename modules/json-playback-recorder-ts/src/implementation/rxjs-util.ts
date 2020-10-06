import { OperatorFunction, ObservableInput, Observable, of, throwError, PartialObserver } from "rxjs";
import { map, flatMap, timeout, catchError, delay } from "rxjs/operators";

class DummyMarker {

}



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
            delay(0)
        );
    }
    const indexRef = { value: 0 };
    const o$ = new Observable<T[] | T>(
        (subscriber) => {
            let subscriberGoNextDecorated: PartialObserver<T[] | T> = 
                {
                    next: (value) => {
                        resutlArr[indexRef.value] = value as T;
                        indexRef.value++;
                        if (!subscriber.closed) {
                            if (indexRef.value < array.length) {
                                const subs = decoratedArray[indexRef.value].subscribe(
                                    {
                                        next: (nextValue) => {
                                            try {
                                                if (indexRef.value < array.length) {
                                                    subscriberGoNextDecorated.next(nextValue);
                                                } else {
                                                }
                                            } finally {
                                                if (subs) {
                                                    subs.unsubscribe();
                                                }
                                            }
                                        },
                                        error: (err) => {
                                            if (subs) {
                                                subs.unsubscribe();
                                            }
                                            subscriber.error(err);
                                        }
                                    }
                                );
                            } else {
                                subscriber.next(resutlArr);
                                subscriber.complete();
                            }
                        } else {

                        }
                    },
                    error: subscriber.error,
                    complete: () => {
                        //nothing
                    }
                };
            decoratedArray[indexRef.value].subscribe(subscriberGoNextDecorated);
        }
    );
    return o$ as Observable<T[]>;
}

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