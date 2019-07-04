import { GenericNode } from "./generic-tokenizer";
import { Type } from "@angular/core";
import { FieldInfo } from "./js-hb-config";
import { Stream } from "stream";
import { Observable } from "rxjs";
import { ResponseLike } from "./js-hb-http-lazy-observable-gen";

export interface IFieldProcessor<L> {
    fromLiteralValue?(value: any, info: FieldInfo): Observable<L>;
    fromDirectRaw?(value: Stream, info: FieldInfo): Observable<L>;
    toLiteralValue?(value: any, info: FieldInfo): Observable<any>;
    toDirectRaw?(value: any, info: FieldInfo): Observable<Stream>;
}

/** Framework internal use. */
export interface IFieldProcessorEvents<L> {
    /** Framework internal use. */
    onFromLiteralValue?: (value: any, info: FieldInfo, obs: Observable<L>) => void;
    /** Framework internal use. */
    onFromDirectRaw?: (rawValue: Stream, info: FieldInfo, obs: Observable<L>) => void;
    /** Framework internal use. */
    onToLiteralValue?: (value: any, info: FieldInfo, obs: Observable<L>) => void;
    /** Framework internal use. */
    onToDirectRaw?: (value: any, info: FieldInfo, obs: Observable<Stream>) => void;
}