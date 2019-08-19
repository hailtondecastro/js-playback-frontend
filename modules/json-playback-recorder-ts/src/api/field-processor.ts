import { Observable } from "rxjs";
import { FieldInfo } from "./recorder-config";
import { ResponseLike } from "../typeslike";

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
     * Used to restore from literal value stored on {@link RecorderSession#generateEntireStateAsLiteral}.  
     * It will be called from {@link RecorderSession#restoreEntireStateFromLiteral}.  
     * If not defined {@link this#fromLiteralValue} will be used.
     * @param value 
     * @param info 
     */
    fromRecordedLiteralValue?(value: any, info: FieldInfo): P;
    fromDirectRaw?(value: Observable<ResponseLike<NodeJS.ReadableStream>>, info: FieldInfo): Observable<ResponseLike<P>>;
    toLiteralValue?(value: P, info: FieldInfo): any;
    toDirectRaw?(value: P, info: FieldInfo): Observable<ResponseLike<NodeJS.ReadableStream>>;
}

/** Framework internal use. */
export interface IFieldProcessorEvents<P> {
    /** Framework internal use. */
    onFromLiteralValue?: (value: any, info: FieldInfo, result: P) => P;
    /** Framework internal use. */
    onFromRecordedLiteralValue?: (value: any, info: FieldInfo, result: P) => P;
    /** Framework internal use. */
    onFromDirectRaw?: (rawValue: Observable<ResponseLike<NodeJS.ReadableStream>>, info: FieldInfo, result: Observable<ResponseLike<P>>) => Observable<ResponseLike<P>>;
    /** Framework internal use. */
    onToLiteralValue?: (value: P, info: FieldInfo, result: any) => any;
    /** Framework internal use. */
    onToDirectRaw?: (value: P, info: FieldInfo, result: Observable<ResponseLike<NodeJS.ReadableStream>>) => Observable<ResponseLike<NodeJS.ReadableStream>>;
}