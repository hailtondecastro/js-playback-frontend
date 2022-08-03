import { Observable } from "rxjs";
import { FieldInfo } from "./recorder-config";
import { ResponseLike } from "../typeslike";
import { BlobOrStream } from "./lazy-ref";

// export interface FromResult<L> {
//     async: boolean,
//     asyncResult: Observable<L>,
//     syncResult: L
// }

// export interface ToResult<L> {
//     async: boolean,
//     asyncResult: Observable<any>,
//     syncResult: any
// }

export interface IFieldProcessor<P> {
    fromLiteralValue?(value: any, info: FieldInfo): P;
    /**
     * Used to restore from literal value stored on {@link RecorderSession#generateEntireStringifiableState}.  
     * It will be called from {@link RecorderSession#restoreEntireState}.  
     * If not defined {@link this#fromLiteralValue} will be used.
     * @param value 
     * @param info 
     */
    fromRecordedStringifiableValue?(value: any, info: FieldInfo): P;
    fromDirectRaw?(value: Observable<ResponseLike<BlobOrStream>>, info: FieldInfo): Observable<ResponseLike<P>>;
    toLiteralValue?(value: P, info: FieldInfo): any;
    toDirectRaw?(value: P, info: FieldInfo): Observable<ResponseLike<BlobOrStream>>;
}

/** Framework internal use. */
export interface IFieldProcessorEvents<P> {
    /** Framework internal use. */
    onFromLiteralValue?: (value: any, info: FieldInfo, result: P) => P;
    /** Framework internal use. */
    onFromRecordedStringifiableValue?: (value: any, info: FieldInfo, result: P) => P;
    /** Framework internal use. */
    onFromDirectRaw?: (rawValue: Observable<ResponseLike<BlobOrStream>>, info: FieldInfo, result: Observable<ResponseLike<P>>) => Observable<ResponseLike<P>>;
    /** Framework internal use. */
    onToLiteralValue?: (value: P, info: FieldInfo, result: any) => any;
    /** Framework internal use. */
    onToDirectRaw?: (value: P, info: FieldInfo, result: Observable<ResponseLike<BlobOrStream>>) => Observable<ResponseLike<BlobOrStream>>;
}