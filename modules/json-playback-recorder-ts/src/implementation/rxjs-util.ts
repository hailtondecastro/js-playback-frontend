import { OperatorFunction, ObservableInput, Observable, of, concat, Subscriber, TeardownLogic, merge, throwError } from "rxjs";
import { map, flatMap, tap, share, take, mergeMap, timeout, catchError } from "rxjs/operators";
import { a } from "@angular/core/src/render3";

class DummyMarker {

}

const dummyMarker = new DummyMarker();

export function combineFirstSerial<T>(array: Observable<T>[]): Observable<T[]> {
    const resutlArr: T[] = new Array<T>(array.length);
    const resutltObsArrRef = {value: of(dummyMarker) as Observable<T>};

    for (let index = 0; index < array.length; index++) {
        const element$ = array[index];
        const indexRef = {value: index};
        resutltObsArrRef.value = resutltObsArrRef.value.pipe(
            flatMap((resultT) => {
                console.log((array as any).fooid);
                return element$;
            }),
            tap((element) => {
                if (element != dummyMarker) {
                    //console.log((array as any).fooid);
                    resutlArr[indexRef.value] = element;
                }
            }),
            share()
        );

        // if (!resutltObsArrRef.value) {
        //     resutltObsArrRef.value = element$.pipe(
        //         flatMapJustOnceRxOpr((resultT) => {
        //             console.log(array.length);
        //             resutlArr[indexRef.value] = resultT;
        //             return element$;
        //         })
        //     );
        // } else {
        //     resutltObsArrRef.value = resutltObsArrRef.value.pipe(
        //         flatMapJustOnceRxOpr((resultT) => {
        //             console.log(array.length);
        //             resutlArr[indexRef.value] = resultT;
        //             return element$;
        //         })
        //     );
        // }
    }
    // if (array.length > 0) {
        return resutltObsArrRef.value.pipe(
            // mapJustOnceRxOpr((resultT) => {
            //     return resutlArr;
            // })
            map((resultT) => {
                return resutlArr;
            })
            // ,
            // timeoutDecorateRxOpr()
        );
    // } else {
    //     return of([]);
    // }
}

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

export function timeoutDecorateRxOpr<T>(): OperatorFunction<T, T> {
    const errTimeOut = new Error('timeout for provided observable');
    let rxOpr: OperatorFunction<T, T> = (source) => {
        return source
            .pipe(
                timeout(3000),
                catchError((err, caugth) => {
                    console.error(err + '\n' + errTimeOut);
                    return throwError(errTimeOut);
                })
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