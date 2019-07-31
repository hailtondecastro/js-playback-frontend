import { Observable } from "rxjs";
import { FieldInfo } from "./recorder-config";

export interface IFieldProcessor<L> {
    fromLiteralValue?(value: any, info: FieldInfo): Observable<L>;
    /**
     * Used to restore from literal value stored on {@link RecorderSession#generateEntireStateAsLiteral}.  
     * It will be called from {@link RecorderSession#restoreEntireStateFromLiteral}.  
     * If not defined {@link this#fromLiteralValue} will be used.
     * @param value 
     * @param info 
     */
    fromRecordedLiteralValue?(value: any, info: FieldInfo): Observable<L>;
    fromDirectRaw?(value: NodeJS.ReadableStream, info: FieldInfo): Observable<L>;
    toLiteralValue?(value: L, info: FieldInfo): Observable<any>;
    toDirectRaw?(value: L, info: FieldInfo): Observable<NodeJS.ReadableStream>;
}

/** Framework internal use. */
export interface IFieldProcessorEvents<L> {
    /** Framework internal use. */
    onFromLiteralValue?: (value: any, info: FieldInfo, obs: Observable<L>) => Observable<L>;
    /** Framework internal use. */
    onFromRecordedLiteralValue?: (value: any, info: FieldInfo, obs: Observable<L>) => Observable<L>;
    /** Framework internal use. */
    onFromDirectRaw?: (rawValue: NodeJS.ReadableStream, info: FieldInfo, obs: Observable<L>) => Observable<L>;
    /** Framework internal use. */
    onToLiteralValue?: (value: L, info: FieldInfo, obs: Observable<L>) => Observable<L>;
    /** Framework internal use. */
    onToDirectRaw?: (value: L, info: FieldInfo, obs: Observable<NodeJS.ReadableStream>) => Observable<NodeJS.ReadWriteStream>;
}