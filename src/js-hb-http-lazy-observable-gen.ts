import { Observable } from 'rxjs/Observable';
import { GenericNode } from './generic-tokenizer';
import { Type } from '@angular/core';
import { NgJsHbDecorators } from './js-hb-decorators';
import { Stream } from 'stream';
import { HttpHeaders } from '@angular/common/http';

export interface LazyInfo<L> {
	gNode: GenericNode
	propertyOptions: NgJsHbDecorators.PropertyOptions<L>,
	literalLazyObj: any,
	ownerType: Type<any>,
	lazyFieldType: Type<any>,
	fieldName: string
}

export interface ResponseLike<T> {
	body: T | null;
	headers?: HttpHeaders;
}

export interface IJsHbHttpLazyObservableGen {
	generateHttpObservable(signatureStr: string, info: LazyInfo<any>): Observable<ResponseLike<Object>>;
	generateHttpObservableForDirectRaw(signatureStr: string, info: LazyInfo<any>): Observable<ResponseLike<Stream | any>>;
}