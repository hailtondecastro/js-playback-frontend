import { Observable } from 'rxjs/Observable';
import { GenericNode } from './generic-tokenizer';
import { NgJsHbDecorators } from './js-hb-decorators';
import { Stream } from 'stream';
import { HttpHeadersLike } from './typeslike';
import { TypeLike } from './typeslike';
import { HttpResponseLike } from './typeslike';

export interface LazyInfo<L> {
	gNode: GenericNode
	propertyOptions: NgJsHbDecorators.PropertyOptions<L>,
	literalLazyObj: any,
	ownerType: TypeLike<any>,
	lazyFieldType: TypeLike<any>,
	fieldName: string
}

export interface IJsHbHttpLazyObservableGen {
	generateHttpObservable(signatureStr: string, info: LazyInfo<any>): Observable<HttpResponseLike<Object>>;
	generateHttpObservableForDirectRaw(signatureStr: string, info: LazyInfo<any>): Observable<HttpResponseLike<Stream | any>>;
}