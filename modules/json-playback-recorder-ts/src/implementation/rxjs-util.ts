import { OperatorFunction, ObservableInput, Observable, of, concat, Subscriber, TeardownLogic, merge } from "rxjs";
import { map, flatMap, tap, share, take, mergeMap } from "rxjs/operators";
import { a } from "@angular/core/src/render3";

class DummyMarker {

}

const dummyMarker = new DummyMarker();

export function combineFirstSerial<T>(array: Observable<T>[]): Observable<T[]> {
    const resutlArr: T[] = new Array<T>(array.length);
    const indexRef = { value: 0 };
    const resutltObsArrRef = {value: of(dummyMarker) as Observable<T>};


    const subscriberSet = new Set<Subscriber<T[]>>();

    const concat$: Observable<T> = concat(array).pipe(
        flatMap((item$: Observable<T>) => {
            return item$;
        }),
        take(array.length),
        tap((resultItem) => {
            resutlArr[indexRef.value] = resultItem;
            indexRef.value++;
            if (indexRef.value === array.length) {
                for (const subscriberItem of Array.from(subscriberSet)) {
                    subscriberItem.next(resutlArr);
                    subscriberItem.complete();
                }
            }
        }),
        share()
    );

    const custom$ = new Observable((subscriber: Subscriber<T[]>): TeardownLogic => {
        subscriberSet.add(subscriber);
        return concat$.subscribe(subscriber);
    });

    return custom$.pipe(
        flatMap(() => {
            return concat$;
        }),
        map(() => {
            return resutlArr;
        })
    );

    // for (let index = 0; index < array.length; index++) {
    //     const element$ = array[index];
    //     const indexRef = {value: index};
    //     resutltObsArrRef.value = resutltObsArrRef.value.pipe(
    //         flatMap((resultT) => {
    //             return element$;
    //         }),
    //         tap((element) => {
    //             if (element != dummyMarker) {
    //                 //console.log(array.length);
    //                 resutlArr[indexRef.value] = element;
    //             }
    //         }),
    //         share()
    //     );
    // }
    // return resutltObsArrRef.value.pipe(
    //     // mapJustOnceRxOpr((resultT) => {
    //     //     return resutlArr;
    //     // })
    //     map((resultT) => {
    //         return resutlArr;
    //     })
    // );
}

// export function combineFirstSerial<T>(array: Observable<T>[]): Observable<T[]> {
//     const resutlArr: T[] = new Array<T>(array.length);
//     const resutltObsArrRef = {value: of(dummyMarker) as Observable<T>};
//     const countRef: {value: 0};
//     concat(array as ObservableInput<T>[]).pipe(
//         map((resultItem) => {
//             resutlArr[countRef++] = resultItem;
//         })
//     );

//     for (let index = 0; index < array.length; index++) {
//         const element$ = array[index];
//         const indexRef = {value: index};
//         resutltObsArrRef.value = resutltObsArrRef.value.pipe(
//             flatMap((resultT) => {
//                 return element$;
//             }),
//             tap((element) => {
//                 if (element != dummyMarker) {
//                     //console.log(array.length);
//                     resutlArr[indexRef.value] = element;
//                 }
//             }),
//             share()
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
//     return resutltObsArrRef.value.pipe(
//         // mapJustOnceRxOpr((resultT) => {
//         //     return resutlArr;
//         // })
//         map((resultT) => {
//             return resutlArr;
//         })
//     );
// }

export function mapJustOnceRxOpr<T, R>(project: (value: T, index?: number) => R, thisArg?: any): OperatorFunction<T, R> {
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
    return rxOpr;
}

export function flatMapJustOnceRxOpr<T, R>(project: (value: T, index?: number) => ObservableInput<R>, concurrent?: number): OperatorFunction<T, R> {
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
            );
    }
    return rxOpr;
}