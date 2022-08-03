import { PlayerMetadatas } from "./player-metadatas";
import { PartialObserver, Observable, Subscription, OperatorFunction } from "rxjs";
import { ConsoleLike } from "./recorder-config";
import { ResponseLike } from "../typeslike";
import { GenericNode } from "./generic-tokenizer";
import { RecorderSessionImplementor, PlayerSnapshot } from "./recorder-session";
import { IFieldProcessorEvents } from "./field-processor";
import { WaitHolder } from '../implementation/rxjs-util';
import { RecorderDecorators } from "./recorder-decorators";

export class BlobOrStreamMarker {
    public iAmBlobOrStreamMarker = true;
}

export class StringBlobOrStreamMarker extends BlobOrStreamMarker {
}

export class BinaryBlobOrStreamMarker extends BlobOrStreamMarker {
}

export declare type BlobOrStream = NodeJS.ReadableStream | Blob;

/**
 * Helps to define IFieldProcessor.
 */
export declare type BinaryBlobOrStream = BlobOrStream;

/**
 * Helps to define IFieldProcessor.
 */
export declare type StringBlobOrStream  = BlobOrStream;

export class LazyRefPrpMarker {
}
export class LazyRefOTMMarker {
}
export class LazyRefMTOMarker {
}

/**
 * Base class to use as marker for {@link reflect-metadata#Reflect.metadata} with 
 * {@link ./generic-tokenizer#GenericTokenizer GenericTokenizer}.
 * 
 * Do not use this as the field type, use {@link LazyRefMTO} or {@link LazyRefOTM}.
 * Use this as 'interface like' to do your own implementation if you need! 
 * See {@link RecorderSession#createApropriateLazyRef}
 * 
 * Code sample:
 * ```ts
   ...
   private _myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>>;
   @RecorderDecorators.property()
   @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefOTMMarker).lt().tp(Set).lt().tp(MyChildEntity).gt().gt().tree))
   public get myChildEntitiesSet(): LazyRefOTM<Set<MyChildEntity>> {
     return this._myChildEntitiesSet;
   }
   ...
 * ```
 * or
 * ```ts
   ...
   private _myParentEntity(): LazyRefMTO<MyParentEntity, Number>;
   @RecorderDecorators.property()
   @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefMTOMarker).lt().tp(MyParentEntity).comma().tp(Number).gt().tree))
   public get myParentEntity(): LazyRefMTO<MyParentEntity, Number> {
     return this._myParentEntity;
   }
   ...
 * ```
 */
export interface LazyRef<L extends object, I> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRef: true;
    asObservable(): Observable<L>;
    subscribe(observer?: PartialObserver<L>): Subscription;
    /** @deprecated Use an observer instead of a complete callback */
    subscribe(next: null | undefined, error: null | undefined, complete: () => void): Subscription;
    /** @deprecated Use an observer instead of an error callback */
    subscribe(next: null | undefined, error: (error: any) => void, complete?: () => void): Subscription;
    /** @deprecated Use an observer instead of a complete callback */
    subscribe(next: (value: L) => void, error: null | undefined, complete: () => void): Subscription;
    subscribe(next?: (value: L) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    pipe(): Observable<L>;
    pipe<A>(op1: OperatorFunction<L, A>): Observable<A>;
    pipe<A, B>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>): Observable<B>;
    pipe<A, B, C>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): Observable<C>;
    pipe<A, B, C, D>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): Observable<D>;
    pipe<A, B, C, D, E>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): Observable<E>;
    pipe<A, B, C, D, E, F>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): Observable<F>;
    pipe<A, B, C, D, E, F, G>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): Observable<G>;
    pipe<A, B, C, D, E, F, G, H>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): Observable<H>;
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): Observable<I>;
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<L, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>, ...operations: OperatorFunction<any, any>[]): Observable<{}>;
    toPromise<L>(this: Observable<L>): Promise<L>;
    toPromise<L>(this: Observable<L>, PromiseCtor: typeof Promise): Promise<L>;
    toPromise<L>(this: Observable<L>, PromiseCtor: PromiseConstructorLike): Promise<L>;
    /**
     * Signature identifier generated by backend server.
     */
    signatureStr: string;
    mdRefererObj: PlayerMetadatas;
    mdLazyLoadedObj: PlayerMetadatas;
    mdRefererPlayerObjectId: PlayerMetadatas;

    consoleLike: ConsoleLike;
	consoleLikeSubs: ConsoleLike;
    consoleLikeProcResp: ConsoleLike;
    /**
     * Unlike the common subscribe, which must be executed every time the data
     * changed, it is only executed once and triggers a next to
     * that all other subscriptions (pipe async's for example) are called.
     * so it does not return Subscription, after all it does not subscribe permanently
     * on the observer's list.  
     * Call {@link RecorderSession#notifyAllLazyrefsAboutEntityModification} after modification and {@link Subscription#unsubscribe}.
     * @param observerOrNext
     * @param error
     * @param complete
     */
    subscribeToModify(observer?: PartialObserver<L>): void;
    subscribeToModify(next?: (value: L) => void, error?: (error: any) => void, complete?: () => void): void;
    subscribeToModify(): void;
    /**
     * TODO:
     * @param lazyLoadedObj 
     */
    setLazyObj(lazyLoadedObj: L): void;
    /**
     * true if it is lazy loaded.
     * @returns true if it is lazy loaded.
     */
    isLazyLoaded(): boolean;

    /**
     * Use this to reconfigure to uninitialized. This can be used after some erro pn lazy initialization.
     */
    backToUnitialized(): void;
}

/**
 * One-to-one.  
 * See {@link LazyRef}
 */
export interface LazyRefOTM<L extends object> extends LazyRef<L, undefined>{
    iAmLazyRefOTM: true;
}

/**
 * One-to-one.  
 * See {@link LazyRef}
 */
export interface LazyRefMTO<L extends object, I> extends LazyRef<L, I> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRefMTO: true;
    /**
     * Player object Id. This is accessible even before lazy loading.
     */
    readonly playerObjectId: I;
}

export interface LazyRefPrp<L extends object> extends LazyRef<L, undefined> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRefPrp: true;
}

export interface LazyRefImplementor<L extends object, I> extends LazyRef<L, I> {
    iAmLazyRefImplementor: true;
    /**
     * Framework internal use. Internal mutipurpose instance id.
     */
    instanceId: number;
    setLazyObj(lazyLoadedObj: L, observerOriginal?: PartialObserver<L>): void;
    /** Framework internal use. */
    setLazyObjOnLazyLoading(lazyLoadedObj: L, observerOriginal: PartialObserver<L>): void;
    /** Framework internal use. */
    setLazyObjNoNext(lazyLoadedObj: L) : void;
    /** Framework internal use. */
    setLazyObjOnLazyLoadingNoNext(lazyLoadedObj: L) : void;
    /** Framework internal use. */
    notifyModification(lazyLoadedObj: L) : void;
    /** 
     * TODO:  
     * Framework internal use.
     */
    processResponse(responselike: ResponseLike<PlayerSnapshot | NodeJS.ReadableStream>):  L | Observable<L>;
    /** Framework internal use. */
    genericNode: GenericNode;
    /** Framework internal use. */
    propertyOptions: RecorderDecorators.PropertyOptions<L>;
    /** Framework internal use. */
	refererObj: any;
    /** Framework internal use. */
	refererKey: string;
    /** Framework internal use. */
	session: RecorderSessionImplementor;
    /** Framework internal use. */
	lazyLoadedObj: L;
    /** Framework internal use. */
    respObs: Observable<ResponseLike<Object>>;
    /** Framework internal use. */
    fieldProcessorEvents: IFieldProcessorEvents<L>;

    // /**
    //  * Framework internal use.  
    //  * Used to wait when someone try lazy load between
    //  * the first request and the end of processResponse().
    //  */
    // createTemporaryWait(): void;
    // /**
    //  * Framework internal use.  
    //  * @see createTemporaryWait()
    //  */
    // temporaryWait(): Observable<void>;
    // /**
    //  * Framework internal use.  
    //  * @see createTemporaryWait()
    //  */
    // emitEndForTemporaryWait(): void;

    /**
     * Framework internal use.  
     * Used to wait when someone try lazy load between
     * the first request and the end of processResponse().
     */
    waitFromResponseToProcess: WaitHolder;
}

export interface LazyRefPrpImplementor<L extends object> extends LazyRefImplementor<L, undefined>, LazyRefPrp<L> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRefPrpImplementor: true;
    /** Framework internal use. */
    setRealResponseDoneDirectRawWrite(value: boolean): void;
    /** Framework internal use. */
    isRealResponseDoneDirectRawWrite(): boolean;
    /**
     * Attache id that will be used on lazyDirectRawRead and 
     */
    attachRefId: string;
    setLazyObj(lazyLoadedObj: L, observerOriginal?: PartialObserver<L>): void;
}

export interface LazyRefMTOImplementor<L extends object, I> extends LazyRefImplementor<L, I>, LazyRefMTO<L, I> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRefMTOImplementor: true;

    playerObjectId: I;
    setLazyObj(lazyLoadedObj: L, observerOriginal?: PartialObserver<L>): void;
}

export interface LazyRefOTMImplementor<L extends object> extends LazyRefImplementor<L, undefined>, LazyRefOTM<L> {
    /**
     * Alternative to instance of.
     */
    iAmLazyRefOTMImplementor: true;
    setLazyObj(lazyLoadedObj: L, observerOriginal?: PartialObserver<L>): void;
}