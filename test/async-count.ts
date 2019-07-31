import { ObservableInput, OperatorFunction, Subject, Observable } from "rxjs";
import { tap } from "rxjs/operators";

export class AsyncCount {
    constructor() {
    }
    private _registerRxOprCallCount: number = 0;
    private _countup: number = 0;
	public get count(): number {
		return this._countup;
	}
    
    private doIncrement() {
        const thisLocal = this;
        thisLocal._countup++;
    }
    
    public doNonObservableIncrement() {
        this.doIncrement();
    }

    public registerRxOpr<T>(): OperatorFunction<T, T> {
        const thisLocal = this;
        thisLocal._registerRxOprCallCount++;
        let rxOpr: OperatorFunction<T, T> = (source) => {
            return source
                .pipe(
                    tap( () => {
                        thisLocal.doIncrement();
                    })
                );
        }
        return rxOpr;
    }
}