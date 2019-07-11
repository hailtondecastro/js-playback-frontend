import { HttpHeaders, HttpResponse } from "@angular/common/http";
import { Type } from "@angular/core";

export declare class HttpHeadersLike extends HttpHeaders {
}
export interface HttpResponseLike<T> {
	body: T | null;
	headers?: HttpHeadersLike;
}

export declare const TypeLike: FunctionConstructor;
export interface TypeLike<T> extends Type<T> {
}