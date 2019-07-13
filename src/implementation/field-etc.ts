import { Observable } from "rxjs";
import { Stream } from "stream";
import { TypeLike } from '../typeslike';
import { GenericNode } from "../api/generic-tokenizer";
import { RecorderDecorators } from "../api/decorators";
import { FieldInfo } from "../api/config";

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
    propertyOptions: RecorderDecorators.PropertyOptions<P>,
    fieldProcessorCaller: IFieldProcessorCaller<P>,
    fieldInfo: FieldInfo
}