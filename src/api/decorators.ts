import { NgJsHbDecorators } from "../implementation/js-hb-decorators";
import { IFieldProcessor, IFieldProcessorEvents } from "./field-processor";
import { Stream } from "stream";
import { StringStreamMarker } from "./lazy-ref";

export namespace JsonPlaybackDecorators {
    /**
     * L: In case of LazyRef this is first type parameter of LazyRef.
     */
    export interface PropertyOptions<L> {
        persistent: boolean,
        lazyDirectRawRead?: boolean,
        lazyDirectRawWrite?: boolean,
        fieldProcessorResolver?: () => IFieldProcessor<L>,
        /** Framework internal use. */
        fieldProcessorEvents?: IFieldProcessorEvents<L>;
    }
    /**
     * Decorator for get property.  
     * \@JsonPlayback.property() is equivalent to \@JsonPlayback.property({persistent: true})
     * 
     * Examplo:
     * ```ts
       ...
       private _myField: string;
       @JsonPlayback.property()
       public get myField(): string {
         return this._myField;
       }
       public set myField(value: string) {
         this._myField = value;
       }
       ...
     * ```
     */
    export function property<T>(options: PropertyOptions<T>): MethodDecorator;
    export function property<T>(): MethodDecorator;
    export function property<T>(): MethodDecorator {
        let options: PropertyOptions<T> = { persistent: true };
        if (arguments.length > 0) {
            options = arguments[0];
        }
        return NgJsHbDecorators.property(options);
    }

    export function playerObjectId<T>(): MethodDecorator {
        return NgJsHbDecorators.playerObjectId();
    }

    /**
     * Used with {@link JsonPlayback#clazz}.
     */
    export interface clazzOptions {
        /**
         * Mapped java entity class.
         */
        javaClass: string;
        /**
         * Use it if you have more than one typescript classes mapping the same java entity class.
         */
        disambiguationId?: string;
    }

    /**
     * Decorator for persistent entity.
     * 
     * Sample:
     * ```ts
     * ...
     * @JsonPlayback.clazz({javaClass: 'org.mypackage.MyPersistentEntity'})
     * export class MyPersistentEntityJs {
     * ...
     * ```
     */
    export function clazz<T>(options: clazzOptions): ClassDecorator {
        return NgJsHbDecorators.clazz(options);
    }

    export const BufferProcessor = NgJsHbDecorators.BufferProcessor;
    export const StringProcessor = NgJsHbDecorators.StringProcessor;
    export const StreamProcessor = NgJsHbDecorators.StreamProcessor;
    export const StringStreamProcessor = NgJsHbDecorators.StringStreamProcessor;

    export const TypeProcessorEntries = 
    [ 
        {
            type: Buffer,
            processor: NgJsHbDecorators.BufferProcessor
        },
        {                
            type: String,
            processor: NgJsHbDecorators.StringProcessor
        },
        {                
            type: Stream,
            processor: NgJsHbDecorators.StreamProcessor
        },
        {
            type: StringStreamMarker,
            processor: NgJsHbDecorators.StringStreamProcessor
        }
    ];
}