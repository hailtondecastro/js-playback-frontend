import { JsHbContants } from './js-hb-constants';
import { LazyRef, LazyRefPrpMarker, StringStreamMarker, StringStream } from './lazy-ref';
import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { get as lodashGet, has } from 'lodash';
import { Type } from '@angular/core';
import { JsHbLogLevel, FieldInfo, JsHbLogger } from './js-hb-config';
import { JsHbBackendMetadatas } from './js-hb-backend-metadatas';
import { IFieldProcessor, IFieldProcessorEvents } from './field-processor';
import { Stream, Readable } from 'stream';
import { Observable, of, from } from 'rxjs';
import { GenericNode, GenericTokenizer } from './generic-tokenizer';
import { JsHbManagerDefault } from './js-hb-manager';
import getStream = require("get-stream");
import * as memStreams from 'memory-streams';
import { ReadLine } from 'readline';
import * as readline from 'readline';

export namespace NgJsHbDecorators {
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
     * \@NgJsHbDecorators.property() is equivalent to \@NgJsHbDecorators.property({persistent: true})
     * 
     * Examplo:
     * ```ts
       ...
       private _myField: string;
       @NgJsHbDecorators.property()
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
        const optionsConst: PropertyOptions<T> =
            {
                persistent: true
            }
        if (options) {
            Object.assign(optionsConst, options);
        }
        if (!optionsConst.fieldProcessorEvents) {
            optionsConst.fieldProcessorEvents =
                {
                };
        }

        let returnFunc: MethodDecorator = function<Z> (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Z>) {
            Reflect.defineMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, optionsConst, target, propertyKey);
            const oldSet = descriptor.set;
            descriptor.set = function(value) {
                let session: IJsHbSession = lodashGet(this, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME) as IJsHbSession;
                const consoleLike = session.jsHbManager.jsHbConfig.getConsole(JsHbLogger.NgJsHbDecorators)
                let fieldEtc = JsHbManagerDefault.resolveFieldProcessorPropOptsEtc<Z, any>(session.fielEtcCacheMap, target, propertyKey.toString(), session.jsHbManager.jsHbConfig);
                if (fieldEtc.propertyOptions.persistent) {
                    if (consoleLike.enabledFor(JsHbLogLevel.Trace)) {
                        consoleLike.group('NgJsHbDecorators.set' +
                            'propertyOptions.persistent. Intercepting set method for '+target.constructor.name + '.' + (propertyKey as string) + '. target and value:');
                        consoleLike.debug(target);
                        consoleLike.debug(value);
                        consoleLike.groupEnd();
                    }
                    let isOnlazyLoad: any = lodashGet(this, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME);
                    if (value && (value as any as LazyRef<any, any>).iAmLazyRef) {
                        //nothing
                    } else {
                        if ((target instanceof Object && !(target instanceof Date))) {
                            if (!session) {
                                throw new Error('The property \'' + propertyKey.toString() + '\' of \'' + target.constructor + '\' has a not managed owner. \'' + JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME + '\' is null or not present');
                            }
                            let actualValue = lodashGet(this, propertyKey);
                            if (actualValue !== value) {
                                if (!isOnlazyLoad && !session.isOnRestoreEntireStateFromLiteral()) {
                                    if (!session.isRecording()){
                                        throw new Error('Invalid operation. It is not recording. is this Error correct?!');
                                    }
                                    if (consoleLike.enabledFor(JsHbLogLevel.Trace)) {
                                        consoleLike.group('NgJsHbDecorators.set' +
                                            '(actualValue !== value) && !isOnlazyLoad && !session.isOnRestoreEntireStateFromLiteral()\n' +
                                            'Recording action: ' + JsHbPlaybackActionType.SetField + '. actual and new value: ');
                                        consoleLike.debug(actualValue);
                                        consoleLike.debug(value);
                                        consoleLike.groupEnd();
                                    }
                                    //do the JsHbPlaybackAction log here
                                    const action: JsHbPlaybackAction = new JsHbPlaybackAction();
                                    action.fieldName = propertyKey.toString();
                                    action.actionType = JsHbPlaybackActionType.SetField;
                                    let allMD = session.resolveMetadatas({object: this});
                                    let bMd = allMD.objectMd;

                                    if (bMd.$signature$) {
                                        action.ownerSignatureStr = bMd.$signature$;
                                    } else if (has(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                                        action.ownerCreationRefId = lodashGet(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                                    } else if (!this._isOnInternalSetLazyObjForCollection) {
                                        throw new Error('The property \'' + propertyKey.toString() + ' of \'' + target.constructor + '\' has a not managed owner');
                                    }
            
                                    if (value != null && value != undefined) {
                                        let allMD = session.resolveMetadatas({object: value});
                                        let bMdValue = allMD.objectMd;

                                        if (bMdValue.$signature$) {
                                            action.settedSignatureStr = bMdValue.$signature$;
                                        } else if (has(value, session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                                            action.settedCreationRefId = lodashGet(value, session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                                        } else {
                                            if (value instanceof Object && !(value instanceof Date)) {
                                                throw new Error('The property \'' + propertyKey.toString() + ' of \'' + this.constructor + '\'. Value can not be anything but primitive in this case. value: ' + value.constructor);
                                            }
                                            action.simpleSettedValue = value;
                                        }
                                    } else {
                                        action.simpleSettedValue = null;
                                    }

                                    if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                                        action.attachRefId = session.jsHbManager.jsHbConfig.cacheStoragePrefix + session.nextMultiPurposeInstanceId();
                                        if (fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callToDirectRaw) {
                                            let toDirectRaw$ = fieldEtc.fieldProcessorCaller.callToDirectRaw(value, fieldEtc.fieldInfo);
                                            toDirectRaw$ = toDirectRaw$.pipe(session.addSubscribedObsRxOpr());
                                            toDirectRaw$.subscribe((stream) => {
                                                if (stream) {
                                                    let putOnCache$ = session.jsHbManager.jsHbConfig.cacheHandler.putOnCache(action.attachRefId, stream)
                                                    putOnCache$ = putOnCache$.pipe(session.addSubscribedObsRxOpr());
                                                    putOnCache$.subscribe(() => {
                                                        session.addPlaybackAction(action);
                                                    });
                                                    let getFromCache$ = session.jsHbManager.jsHbConfig.cacheHandler.getFromCache(action.attachRefId);
                                                    getFromCache$ = getFromCache$.pipe(session.addSubscribedObsRxOpr());
                                                    getFromCache$.subscribe((stream) => {
                                                        oldSet.call(this, stream);
                                                    });
                                                } else {
                                                    if (value) {
                                                        throw new Error('The property \'' + propertyKey.toString() + ' of \'' + this.constructor + '\'. Stream is null but value is not null. value: ' + value.constructor);
                                                    }
                                                    action.simpleSettedValue = null;
                                                    action.attachRefId = null;
                                                    session.addPlaybackAction(action);
                                                }
                                            });
                                        } else {
                                            if (!((value as any as Stream).addListener && (value as any as Stream).pipe)) {
                                                throw new Error('The property \'' + propertyKey.toString() + ' of \'' + this.constructor + '\'. There is no "IFieldProcessor.toDirectRaw" defined and value is not a Stream. value: ' + value.constructor);
                                            } else {
                                                let putOnCache$ = session.jsHbManager.jsHbConfig.cacheHandler.putOnCache(action.attachRefId, value as any as Stream);
                                                putOnCache$ = putOnCache$.pipe(session.addSubscribedObsRxOpr());
                                                putOnCache$.subscribe(() => {
                                                    session.addPlaybackAction(action);
                                                });
                                                let getFromCache$ = session.jsHbManager.jsHbConfig.cacheHandler.getFromCache(action.attachRefId);
                                                getFromCache$ = getFromCache$.pipe(session.addSubscribedObsRxOpr());
                                                getFromCache$.subscribe((stream) => {
                                                    oldSet.call(this, stream);
                                                });
                                            }
                                        }
                                    } else if (fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callToLiteralValue) {
                                        let toLiteralValue$ = fieldEtc.fieldProcessorCaller.callToLiteralValue(
                                            action.simpleSettedValue, 
                                            fieldEtc.fieldInfo);
                                        toLiteralValue$ = toLiteralValue$.pipe(session.addSubscribedObsRxOpr());
                                        toLiteralValue$.subscribe(
                                            {
                                                next: (processedValue) => {
                                                    action.simpleSettedValue = processedValue;
                                                    session.addPlaybackAction(action);
                                                }
                                            }
                                        );
                                    } else {
                                        session.addPlaybackAction(action);
                                    }
                                }
                            } else {
                                if (consoleLike.enabledFor(JsHbLogLevel.Trace)) {
                                    consoleLike.group('NgJsHbDecorators.set' +
                                        '(actualValue === value)\n' +
                                        'NOT recording action, BUT may process : ' + JsHbPlaybackActionType.SetField + '. value: ');
                                    consoleLike.debug(value);
                                    consoleLike.groupEnd();
                                }
                            }
                        }
                    }

                    oldSet.call(this, value);
                    if (session && !isOnlazyLoad) {
                        session.notifyAllLazyrefsAboutEntityModification(this, null);
                    }
                } else {
                    oldSet.call(this, value);
                    if (consoleLike.enabledFor(JsHbLogLevel.Trace)) {
                        consoleLike.group('NgJsHbDecorators.set' +
                            '!(propertyOptions.persistent && genericNode.gType !== LazyRef && genericNode.gType !== LazyRefPrpMarker). Not intercepting set method for '+target.constructor.name + '.' + (propertyKey as string) + '. target and value:');
                        consoleLike.debug(target);
                        consoleLike.debug(value);
                        consoleLike.groupEnd();
                    }
                }
            };
        }

        return returnFunc;
    }

    export function hibernateId<T>(): MethodDecorator {
        return function<T> (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) {
            let hibernateIdType: any = Reflect.getMetadata('design:type', target, propertyKey);
            Reflect.defineMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_ID_TYPE, hibernateIdType, target);
        };
    }

    /**
     * Used with {@link NgJsHbDecorators#clazz}.
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
     * @NgJsHbDecorators.clazz({javaClass: 'org.mypackage.MyPersistentEntity'})
     * export class MyPersistentEntityJs {
     * ...
     * ```
     */
    export function clazz<T>(options: clazzOptions): ClassDecorator {
        return function<T> (target: T): T | void {
            Reflect.defineMetadata(JsHbContants.JSHB_REFLECT_METADATA_JAVA_CLASS, options, target);
            Reflect.defineMetadata(
                mountContructorByJavaClassMetadataKey(options, target as any as Type<any>),
                target,
                Function);
        }
    }

    /**
     * Internal use only! It is no a decorator!
     */
    export function mountContructorByJavaClassMetadataKey(options: clazzOptions, entityType: Type<any>): string {
        return JsHbContants.JSHB_REFLECT_METADATA_JSCONTRUCTOR_BY_JAVA_CLASS_PREFIX +
            (entityType as any).name +
            (options.disambiguationId? ':' + options.disambiguationId : '') +
            ':' + options.javaClass;
    }

    export const BufferProcessor: IFieldProcessor<Buffer> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                return of(Buffer.from(value, 'base64'));
            } else {
                return of(null);
            }
        },
        toLiteralValue: (value, info) => {
            if (value) {
                let base64Str = value.toString('base64');                            
                return of(base64Str);
            }
        }
    };
    export const StringProcessor: IFieldProcessor<String> = {
        fromLiteralValue: (value: string, info: any) => {
            return of(value);
        },
        fromDirectRaw: (stream: Stream, info: any) => {
            return from(getStream(stream, {}) as Promise<string>);
        }
    };
    export const StreamProcessor: IFieldProcessor<String> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                let base64AB = Buffer.from(value, 'base64');
                let ws = new memStreams.WritableStream();
                ws.write(base64AB);
                let myReadableStreamBuffer = new memStreams.ReadableStream(''); 
                myReadableStreamBuffer.push(base64AB);
                return of(myReadableStreamBuffer);
            } else {
                return of(null);
            }
        },
        fromDirectRaw: (stream, info) => {
            if (stream) {
                if ((stream as Stream).addListener && (stream as Stream).pipe) {
                    return of(stream);
                } else {
                    throw new Error('Not supported');
                }
            } else {
                return of(null);
            }
        }
    };
    export const StringStreamProcessor: IFieldProcessor<StringStream> = {
            fromLiteralValue: (value, info) => {
                if (value) {
                    let base64AB = Buffer.from(value, 'base64');
                    let ws = new memStreams.WritableStream();
                    ws.write(base64AB);
                    let myReadableStreamBuffer = new memStreams.ReadableStream(value); 
                    myReadableStreamBuffer.setEncoding('utf-8');
                    return of(myReadableStreamBuffer);
                } else {
                    return of(null);
                }
            },
            fromDirectRaw: (stream, info) => {
                if (stream) {
                    if ((stream as Stream).addListener && (stream as Stream).pipe) {
                        (stream as any as Readable).setEncoding('utf-8');
                        return of(stream);
                    } else {
                        throw new Error('Not supported');
                    }
                } else {
                    return of(null);
                }
            }
    };

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