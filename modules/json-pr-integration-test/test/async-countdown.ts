import { ObservableInput, OperatorFunction, Subject, Observable } from "rxjs";
import { tap } from "rxjs/operators";

export class AsyncCountdown {
    constructor(options: {count: number, timeOut?: number}) {
        if (!options) {
            throw new Error('options can not be null');
        }
        const thisLocal = this;
        this._count = options.count;
        this._countRemain = options.count;
        this._timeOut = options.timeOut;

        setTimeout(() => {
            if (thisLocal._countRemain !== 0) {
                thisLocal._allAsyncEndedSub.error(new Error('Invalid async count remain on timeout: ' + thisLocal._countRemain));
            }
            if (thisLocal._countRemain === 0) {
                thisLocal._allAsyncEndedSub.next(null);
            }
        },
        thisLocal._timeOut);
    }
    private _registerRxOprCallCount: number = 0;
    private _timeOut: number = 0;
    private _countRemain: number;
    private _count: number;
    private _allAsyncEndedSub = new Subject<void>();
	public get count(): number {
		return this._count;
	}
	public set count(value: number) {
		this._count = value;
    }
    
    private doCountdown() {
        const thisLocal = this;
        if (thisLocal._timeOut) {
            --thisLocal._countRemain;
        } else {
            if (--thisLocal._countRemain === 0) {
                setTimeout(() => {thisLocal._allAsyncEndedSub.next(null);});
            } else if (thisLocal._countRemain < 0) {
                throw new Error('Invalid async count remain: ' + thisLocal._countRemain);
            }
        }
    }
    
    public doNonPipedCountdown(consoleMsg?: string) {
        if (consoleMsg) {
            console.log(consoleMsg);
        }
        this.doCountdown();
    }

    public registerRxOpr<T>(consoleMsgCB?: () => string): OperatorFunction<T, T> {
        const thisLocal = this;
        thisLocal._registerRxOprCallCount++;
        let rxOpr: OperatorFunction<T, T> = (source) => {
            return source
                .pipe(
                    tap( () => {
                        if (consoleMsgCB) {
                            console.log(consoleMsgCB());
                        }
                        thisLocal.doCountdown();
                    })
                );
        }
        return rxOpr;
    }
    
    public createCountdownEnds(): Observable<void> {
        return this._allAsyncEndedSub.asObservable();
    }
}