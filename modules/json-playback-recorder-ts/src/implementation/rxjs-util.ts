import { OperatorFunction, ObservableInput, Observable, of } from "rxjs";
import { map, flatMap, tap } from "rxjs/operators";

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
            flatMapJustOnceRxOpr((resultT) => {
                return element$;
            }),
            tap((resultT) => {
                if (resultT != dummyMarker) {
                    //console.log(array.length);
                    resutlArr[indexRef.value] = resultT;
                }
            })
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
    return resutltObsArrRef.value.pipe(
        mapJustOnceRxOpr((resultT) => {
            return resutlArr;
        })
    );
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