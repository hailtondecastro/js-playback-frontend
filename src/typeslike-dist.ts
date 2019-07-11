export declare interface HttpHeadersLike {
}

export interface HttpResponseLike<T> {
	body: T | null;
	headers?: HttpHeadersLike;
}
export interface HttpResponseLike<T> {
	body: T | null;
	headers?: HttpHeadersLike;
}

export const TypeLike = Function;

export function isType(v: any): v is TypeLike<any> {
  return typeof v === 'function';
}

export interface TypeLike<T> extends Function { new (...args: any[]): T; }