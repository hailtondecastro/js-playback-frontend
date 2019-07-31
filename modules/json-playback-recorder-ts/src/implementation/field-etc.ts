import { Observable } from "rxjs";
import { Stream } from "stream";
import { TypeLike } from '../typeslike';
import { GenericNode } from "../api/generic-tokenizer";
import { RecorderDecorators } from "../api/recorder-decorators";
import { FieldInfo } from "../api/recorder-config";

export interface IFieldProcessorCaller<P> {
    callFromLiteralValue?(value: any, info: FieldInfo): Observable<P>;
    callFromRecordedLiteralValue?(value: any, info: FieldInfo): Observable<P>;
    callFromDirectRaw?(rawValue: NodeJS.ReadableStream, info: FieldInfo): Observable<P>;
    callToLiteralValue?(value: any, info: FieldInfo): Observable<any>;
    callToDirectRaw?(value: any, info: FieldInfo): Observable<NodeJS.ReadableStream>;
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