import { Observable } from "rxjs";
import { ResponseLike } from "../typeslike";
import { Stream } from "stream";
import { TypeLike } from "../typeslike";
import { GenericNode } from "./generic-tokenizer";
import { RecorderDecorators } from "./recorder-decorators";

export interface LazyInfo<L> {
	gNode: GenericNode
	propertyOptions: RecorderDecorators.PropertyOptions<L>,
	literalLazyObj: any,
	ownerType: TypeLike<any>,
	lazyFieldType: TypeLike<any>,
	fieldName: string
}

export interface LazyObservableProvider {
	generateObservable(signatureStr: string, info: LazyInfo<any>): Observable<ResponseLike<Object>>;
	generateObservableForDirectRaw(signatureStr: string, info: LazyInfo<any>): Observable<ResponseLike<Stream | any>>;
}