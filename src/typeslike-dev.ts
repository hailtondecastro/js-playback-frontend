import { HttpHeaders, HttpResponse } from "@angular/common/http";
import { Type } from "@angular/core";

export declare class HttpHeadersLike extends HttpHeaders {
}
export interface HttpResponseLike<T> {
	body: T | null;
	headers?: HttpHeadersLike;
}

export const TypeLike = Type;
export function isType(v: any): v is TypeLike<any> {
	return typeof v === 'function';
  }
export interface TypeLike<T> extends Type<T> {
}