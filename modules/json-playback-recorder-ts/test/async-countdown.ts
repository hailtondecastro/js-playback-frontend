import { ObservableInput, OperatorFunction, Subject, Observable } from "rxjs";
import { tap } from "rxjs/operators";

export class AsyncCountdown {
    constructor(count: number) {
        this._count = count;
        this._countRemain = count;
    }
    private _registerRxOprCallCount: number = 0;
    private _countup: number = 0;
    private _countRemain: number;
    private _count: number;
    private _allAsyncEndedSub = new Subject<void>();
	public get count(): number {
		return this._count;
	}
	public set count(value: number) {
		this._count = value;
    }
    
    private doCountDown() {
        const thisLocal = this;
        thisLocal._countup++;
        if (--thisLocal._countRemain === 0) {
            setTimeout(() => {thisLocal._allAsyncEndedSub.next(null);});
        } else if (thisLocal._countRemain < 0) {
            throw new Error('Invalid async count remain: ' + thisLocal._countRemain);
        }
    }
    
    public doNonObservableCountDown() {
        this.doCountDown();
    }

    public registerRxOpr<T>(): OperatorFunction<T, T> {
        const thisLocal = this;
        thisLocal._registerRxOprCallCount++;
        let rxOpr: OperatorFunction<T, T> = (source) => {
            return source
                .pipe(
                    tap( () => {
                        thisLocal.doCountDown();
                    })
                );
        }
        return rxOpr;
    }
    
    public createCountdownEnds(): Observable<void> {
        return this._allAsyncEndedSub.asObservable();
    }
}