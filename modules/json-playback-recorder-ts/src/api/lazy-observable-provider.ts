import { ResponseLike } from "../typeslike";
import { TypeLike } from "../typeslike";
import { GenericNode } from "./generic-tokenizer";
import { RecorderDecorators } from "./recorder-decorators";
import { Observable } from "rxjs";
import { BlobOrStream } from "./lazy-ref";

export interface LazyInfo<L> {
	gNode: GenericNode
	propertyOptions: RecorderDecorators.PropertyOptions<L>,
	//literalLazyObj?: any,
	ownerType: TypeLike<any>,
	lazyFieldType: TypeLike<any>,
	fieldName: string
}

export interface LazyObservableProvider {
	generateObservable(signatureStr: string, info: LazyInfo<any>): Observable<ResponseLike<Object>>;
	generateObservableForDirectRaw(signatureStr: string, info: LazyInfo<any>): Observable<ResponseLike<BlobOrStream | any>>;
}