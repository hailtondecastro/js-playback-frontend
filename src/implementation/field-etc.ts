import { GenericNode } from "./generic-tokenizer";
import { NgJsHbDecorators } from "./js-hb-decorators";
import { IFieldProcessor, IFieldProcessorEvents } from "./field-processor";
import { FieldInfo } from "./js-hb-config";
import { Observable } from "rxjs";
import { Stream } from "stream";
import { TypeLike } from './typeslike';

export interface IFieldProcessorCaller<P> {
    callFromLiteralValue?(value: any, info: FieldInfo): Observable<P>;
    callFromDirectRaw?(rawValue: Stream, info: FieldInfo): Observable<P>;
    callToLiteralValue?(value: any, info: FieldInfo): Observable<any>;
    callToDirectRaw?(value: any, info: FieldInfo): Observable<Stream>;
}

export interface FieldEtc<P, GP> {
    prpType: TypeLike<P>,
    prpGenType: GenericNode,
    lazyLoadedObjType: TypeLike<P>,
    lazyRefGenericParam: TypeLike<GP>,
    propertyOptions: NgJsHbDecorators.PropertyOptions<P>,
    fieldProcessorCaller: IFieldProcessorCaller<P>,
    fieldInfo: FieldInfo
}