import { PlayerMetadatas } from "./player-metadatas";
import { Subject, PartialObserver, Observable } from "rxjs";
import { ConsoleLike } from "./config";

export class StringStreamMarker {
}

export interface StringStream extends NodeJS.ReadableStream, NodeJS.WritableStream {
           /**
             * Event emitter
             * The defined events on documents including:
             * 1. close
             * 2. data
             * 3. end
             * 4. readable
             * 5. error
             */
            addListener(event: "close", listener: () => void): this;
            addListener(event: "data", listener: (chunk: string) => void): this;
            addListener(event: "end", listener: () => void): this;
            addListener(event: "readable", listener: () => void): this;
            addListener(event: "error", listener: (err: Error) => void): this;
            addListener(event: string | symbol, listener: (...args: any[]) => void): this;

            emit(event: "close"): boolean;
            emit(event: "data", chunk: any): boolean;
            emit(event: "end"): boolean;
            emit(event: "readable"): boolean;
            emit(event: "error", err: Error): boolean;
            emit(event: string | symbol, ...args: any[]): boolean;

            on(event: "close", listener: () => void): this;
            on(event: "data", listener: (chunk: string) => void): this;
            on(event: "end", listener: () => void): this;
            on(event: "readable", listener: () => void): this;
            on(event: "error", listener: (err: Error) => void): this;
            on(event: string | symbol, listener: (...args: any[]) => void): this;

            once(event: "close", listener: () => void): this;
            once(event: "data", listener: (chunk: any) => void): this;
            once(event: "end", listener: () => void): this;
            once(event: "readable", listener: () => void): this;
            once(event: "error", listener: (err: Error) => void): this;
            once(event: string | symbol, listener: (...args: any[]) => void): this;

            prependListener(event: "close", listener: () => void): this;
            prependListener(event: "data", listener: (chunk: string) => void): this;
            prependListener(event: "end", listener: () => void): this;
            prependListener(event: "readable", listener: () => void): this;
            prependListener(event: "error", listener: (err: Error) => void): this;
            prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

            prependOnceListener(event: "close", listener: () => void): this;
            prependOnceListener(event: "data", listener: (chunk: string) => void): this;
            prependOnceListener(event: "end", listener: () => void): this;
            prependOnceListener(event: "readable", listener: () => void): this;
            prependOnceListener(event: "error", listener: (err: Error) => void): this;
            prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

            removeListener(event: "close", listener: () => void): this;
            removeListener(event: "data", listener: (chunk: string) => void): this;
            removeListener(event: "end", listener: () => void): this;
            removeListener(event: "readable", listener: () => void): this;
            removeListener(event: "error", listener: (err: Error) => void): this;
            removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
}

export class LazyRefPrpMarker {    
}

/**
 * Base class to use as marker for {@link reflect-metadata#Reflect.metadata} with 
 * {@link ./generic-tokenizer#GenericTokenizer GenericTokenizer}.
 * 
 * Do not use this as the field type, use {@link LazyRefMTO} or {@link LazyRefOTM}.
 * Use this as 'interface like' to do your own implementation if you need! 
 * See {@link IJsHbSession#createApropriatedLazyRef}
 * 
 * Code sample:
 * ```ts
   ...
   private _myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>>;
   @JsonPlayback.property()
   @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(Set).lt().tp(MyChildEntity).gt().gt().tree))
   public get myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>> {
     return this._myChildEntitiesSet;
   }
   ...
 * ```
 * or
 * ```ts
   ...
   private _myParentEntity(): LazyRefMTO<MyParentEntity, Number>;
   @JsonPlayback.property()
   @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MyParentEntity).comma().tp(Number).gt().tree))
   public get myParentEntity(): LazyRefMTO<MyParentEntity, Number> {
     return this._myParentEntity;
   }
   ...
 * ```
 */
export class LazyRef<L extends object, I> extends Subject<L> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRef: boolean = true;
    /**
     * Attache id that will be used on lazyDirectRawRead and 
     */
    attachRefId: string;

    /**
     * Hibernate id. This is accessible even before lazy loading.
     */
    hbId: I;
    /**
     * Signature identifier generated by backend server.
     */
    signatureStr: string;
    bMdRefererObj: PlayerMetadatas;
    bMdLazyLoadedObj: PlayerMetadatas;
    bMdPlayerObjectIdMetadata: PlayerMetadatas;

    consoleLike: ConsoleLike;
	consoleLikeSubs: ConsoleLike;
    consoleLikeProcResp: ConsoleLike;
    /**
     * Unlike the common subscribe, which must be executed every time the data
     * changed, it is only executed once and triggers a next to
     * that all other subscriptions (pipe async's for example) are called.
     * so it does not return Subscription, after all it does not subscribe permanently
     * on the observer's list.  
     * Call {@link IJsHbSession#notifyAllLazyrefsAboutEntityModification} after modification and {@link Subscription#unsubscribe}.
     * @param observerOrNext
     * @param error
     * @param complete
     */
    subscribeToModify(observer?: PartialObserver<L>): void;
    subscribeToModify(next?: (value: L) => void, error?: (error: any) => void, complete?: () => void): void;
    subscribeToModify(): void { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); }
    /**
     * TODO:
     * @param lazyLoadedObj 
     */
    setLazyObj(lazyLoadedObj: L): Observable<void> { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
    /**
     * true if it is lazy loaded.
     * @returns true if it is lazy loaded.
     */
    isLazyLoaded(): boolean { throw new Error('LazyRef is not the real implementation base, Do not instantiate it!!'); };
}

/**
 * One-to-one.  
 * See {@link LazyRef}
 */
export declare type LazyRefOTM<L extends object> = LazyRef<L, undefined>;

/**
 * One-to-one.  
 * See {@link LazyRef}
 */
export declare type LazyRefMTO<L extends object, I> = LazyRef<L, I>;

export declare type LazyRefPrp<L extends object> = LazyRef<L, undefined>;