import { Type } from "@angular/core";
import { GenericNode } from "./generic-tokenizer";
import { NgJsHbDecorators } from "./js-hb-decorators";
import { IFieldProcessor, IFieldProcessorEvents } from "./field-processor";
import { FieldInfo } from "./js-hb-config";
import { Observable } from "rxjs";
import { Stream } from "stream";

export interface IFieldProcessorCaller<P> {
    callFromLiteralValue?(value: any, info: FieldInfo): Observable<P>;
    callFromDirectRaw?(rawValue: Stream, info: FieldInfo): Observable<P>;
    callToLiteralValue?(value: any, info: FieldInfo): Observable<any>;
    callToDirectRaw?(value: any, info: FieldInfo): Observable<Stream>;
}

export interface FieldEtc<P, GP> {
    prpType: Type<P>,
    prpGenType: GenericNode,
    lazyLoadedObjType: Type<P>,
    lazyRefGenericParam: Type<GP>,
    propertyOptions: NgJsHbDecorators.PropertyOptions<P>,
    fieldProcessorCaller: IFieldProcessorCaller<P>,
    fieldInfo: FieldInfo
}