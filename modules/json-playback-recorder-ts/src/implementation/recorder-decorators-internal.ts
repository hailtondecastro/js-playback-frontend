import { RecorderConstants } from './recorder-constants';
import { of, from } from 'rxjs';
import { RecorderManagerDefault } from './recorder-manager-default';
//import * as readline from 'readline';
import { IFieldProcessor, IFieldProcessorEvents } from '../api/field-processor';
import { TypeLike } from '../typeslike-dev';
import { LazyRef, StringBlobOrStream, BinaryBlobOrStream } from '../api/lazy-ref';
import { RecorderDecorators } from '../api/recorder-decorators';
import { RecorderLogger, RecorderLogLevel } from '../api/recorder-config';
import { TapeActionType, TapeAction } from '../api/tape';
import { TapeActionDefault } from './tape-default';
import { flatMap, map, share } from 'rxjs/operators';
import { LodashLike } from './lodash-like';
import { RecorderSessionImplementor } from '../api/recorder-session';
import { RecorderForDom } from './native-for-dom';

export namespace RecorderDecoratorsInternal {
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
     * \@RecorderDecorators.property() is equivalent to \@RecorderDecorators.property({persistent: true})
     * 
     * Examplo:
     * ```ts
       ...
       private _myField: string;
       @RecorderDecorators.property()
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
            Reflect.defineMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, optionsConst, target, propertyKey);
            const oldSet = descriptor.set;
            descriptor.set = function(value) {
                const thisLocal = this;
                let session: RecorderSessionImplementor = LodashLike.get(this, RecorderConstants.ENTITY_SESION_PROPERTY_NAME) as RecorderSessionImplementor;
                const consoleLike = session.manager.config.getConsole(RecorderLogger.RecorderDecorators)
                let fieldEtc = RecorderManagerDefault.resolveFieldProcessorPropOptsEtc<Z, any>(session.fielEtcCacheMap, target, propertyKey.toString(), session.manager.config);
                if (fieldEtc.propertyOptions.persistent) {
                    if (consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        consoleLike.group('JsonPlayback.set' +
                            'propertyOptions.persistent. Intercepting set method for '+target.constructor.name + '.' + (propertyKey as string) + '. target and value:');
                        consoleLike.debug(target);
                        consoleLike.debug(value);
                        consoleLike.groupEnd();
                    }
                    let isOnlazyLoad: any = LodashLike.get(this, RecorderConstants.ENTITY_IS_ON_LAZY_LOAD_NAME);
                    if (value && (value as any as LazyRef<any, any>).iAmLazyRef) {
                        //nothing
                    } else {
                        if (LodashLike.isObject(target, new Set([Date, Buffer]))) {
                            if (!session) {
                                throw new Error('The property \'' + propertyKey.toString() + '\' of \'' + target.constructor + '\' has a not managed owner. \'' + RecorderConstants.ENTITY_SESION_PROPERTY_NAME + '\' is null or not present');
                            }
                            let actualValue = LodashLike.get(this, propertyKey.toString());
                            if (actualValue !== value) {
                                if (!isOnlazyLoad && !session.isOnRestoreEntireState()) {
                                    if (!session.isRecording()){
                                        throw new Error('Invalid operation. It is not recording. is this Error correct?!');
                                    }
                                    if (consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                                        consoleLike.group('JsonPlayback.set' +
                                            '(actualValue !== value) && !isOnlazyLoad && !session.isOnRestoreEntireState()\n' +
                                            'Recording action: ' + TapeActionType.SetField + '. actual and new value: ');
                                        consoleLike.debug(actualValue);
                                        consoleLike.debug(value);
                                        consoleLike.groupEnd();
                                    }
                                    //do the TapeAction log here
                                    const action: TapeAction = new TapeActionDefault();
                                    action.fieldName = propertyKey.toString();
                                    action.actionType = TapeActionType.SetField;
                                    let allMD = session.resolveMetadatas({object: this});
                                    let bMd = allMD.objectMd;

                                    if (bMd.$signature$) {
                                        action.ownerSignatureStr = bMd.$signature$;
                                    } else if (LodashLike.has(this, session.manager.config.creationIdName)) {
                                        action.ownerCreationRefId = LodashLike.get(this, session.manager.config.creationIdName) as number;
                                    } else if (!this._isOnInternalSetLazyObjForCollection) {
                                        throw new Error('The property \'' + propertyKey.toString() + ' of \'' + target.constructor + '\' has a not managed owner');
                                    }
            
                                    const asyncAddTapeAction = { value: false };

                                    if (value != null && value != undefined) {
                                        let allMD = session.resolveMetadatas({object: value});
                                        let bMdValue = allMD.objectMd;
                                        if (bMdValue.$signature$) {
                                            action.settedSignatureStr = bMdValue.$signature$;
                                        } else if (LodashLike.has(value, session.manager.config.creationIdName)) {
                                            action.settedCreationRefId = LodashLike.get(value, session.manager.config.creationIdName) as number;
                                        } else {
                                            if (LodashLike.isObject(value, new Set([Date, Buffer]))) {
                                                throw new Error('The property \'' + propertyKey.toString() + ' of \'' + this.constructor + '\'. Value can not be anything but primitive in this case. value: ' + value.constructor);
                                            }
                                            action.simpleSettedValue = value;
                                        }
                                    } else {
                                        action.simpleSettedValue = null;
                                    }

                                    if (fieldEtc.propertyOptions.lazyDirectRawWrite) {
                                        let processTapeActionAttachRefId$ = session.processTapeActionAttachRefId({fieldEtc: fieldEtc, value: value, action: action, propertyKey: propertyKey.toString()});
                                        //processTapeActionAttachRefId$ = processTapeActionAttachRefId$.pipe(session.addSubscribedObsRxOpr());
                                        asyncAddTapeAction.value = true;
                                        processTapeActionAttachRefId$ = processTapeActionAttachRefId$.pipe(
                                            session.registerProvidedObservablesRxOpr(),
                                            share()
                                        );
                                        processTapeActionAttachRefId$.subscribe(
                                            {
                                                next: (ptaariValue: any) => {
                                                    oldSet.call(thisLocal, ptaariValue.newValue);
                                                    if(!ptaariValue.asyncAddTapeAction) {
                                                        session.addTapeAction(action);
                                                    }
                                                }
                                            }
                                        );
                                        // action.attachRefId = session.manager.config.cacheStoragePrefix + session.nextMultiPurposeInstanceId();
                                        // if (fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callToDirectRaw) {
                                        //     let toDirectRaw$ = fieldEtc.fieldProcessorCaller.callToDirectRaw(value, fieldEtc.fieldInfo);
                                        //     toDirectRaw$ = toDirectRaw$.pipe(session.addSubscribedObsRxOpr());
                                        //     asyncAddTapeAction.value = true;
                                        //     toDirectRaw$.subscribe((stream) => {
                                        //         if (stream) {
                                        //             let putOnCache$ = session.manager.config.cacheHandler.putOnCache(action.attachRefId, stream)
                                        //             putOnCache$ = putOnCache$.pipe(session.addSubscribedObsRxOpr());
                                        //             putOnCache$.subscribe(() => {
                                        //                 session.addTapeAction(action);
                                        //             });
                                        //             let getFromCache$ = session.manager.config.cacheHandler.getFromCache(action.attachRefId);
                                        //             getFromCache$ = getFromCache$.pipe(session.addSubscribedObsRxOpr());
                                        //             getFromCache$.subscribe((stream) => {
                                        //                 oldSet.call(this, stream);
                                        //             });
                                        //         } else {
                                        //             if (value) {
                                        //                 throw new Error('The property \'' + propertyKey.toString() + ' of \'' + this.constructor + '\'. '+(typeof Blob === 'undefined'? 'NodeJS.ReadableStream': 'Blob')+' is null but value is not null. value: ' + value.constructor);
                                        //             }
                                        //             action.simpleSettedValue = null;
                                        //             action.attachRefId = null;
                                        //             session.addTapeAction(action);
                                        //         }
                                        //     });
                                        // } else {
                                        //     if (!((value as any as NodeJS.ReadableStream).addListener && (value as any as NodeJS.ReadableStream).pipe)) {
                                        //         throw new Error('The property \'' + propertyKey.toString() + ' of \'' + this.constructor + '\'. There is no "IFieldProcessor.toDirectRaw" defined and value is not a NodeJS.ReadableStream. value: ' + value.constructor);
                                        //     } else {
                                        //         let putOnCache$ = session.manager.config.cacheHandler.putOnCache(action.attachRefId, value as any as NodeJS.ReadableStream);
                                        //         putOnCache$ = putOnCache$.pipe(session.addSubscribedObsRxOpr());
                                        //         asyncAddTapeAction.value = true;
                                        //         putOnCache$.subscribe(() => {
                                        //             session.addTapeAction(action);
                                        //         });
                                        //         let getFromCache$ = session.manager.config.cacheHandler.getFromCache(action.attachRefId);
                                        //         getFromCache$ = getFromCache$.pipe(session.addSubscribedObsRxOpr());
                                        //         getFromCache$.subscribe((stream) => {
                                        //             oldSet.call(this, stream);
                                        //         });
                                        //     }
                                        // }
                                    } else if (fieldEtc.fieldProcessorCaller && fieldEtc.fieldProcessorCaller.callToLiteralValue) {
                                        let processedValue = fieldEtc.fieldProcessorCaller.callToLiteralValue(
                                            value, 
                                            fieldEtc.fieldInfo);
                                        // toLiteralValue$ = toLiteralValue$.pipe(session.addSubscribedObsRxOpr());
                                        asyncAddTapeAction.value = false;
                                        action.simpleSettedValue = processedValue;
                                    } else {
                                        action.simpleSettedValue = value;
                                    }

                                    if (!asyncAddTapeAction.value) {
                                        session.addTapeAction(action);
                                    }
                                }
                            } else {
                                if (consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                                    consoleLike.group('JsonPlayback.set' +
                                        '(actualValue === value)\n' +
                                        'NOT recording action, BUT may process : ' + TapeActionType.SetField + '. value: ');
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
                    if (consoleLike.enabledFor(RecorderLogLevel.Trace)) {
                        consoleLike.group('JsonPlayback.set' +
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

    export interface PlayerObjectIdInfo {
        idType: TypeLike<any>,
        fieldName: string
    }

    export function playerObjectId(): MethodDecorator {
        return function<T> (target: Object, propertyKey: string | symbol) {
            let playerObjectIdType: any = Reflect.getMetadata('design:type', target, propertyKey);
            const playerObjectIdInfo: PlayerObjectIdInfo = (
                {
                    idType: playerObjectIdType as TypeLike<any>,
                    fieldName: propertyKey.toString()
                }
            );
            Reflect.defineMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_ID_INFO, playerObjectIdInfo, target);
        };
    }  

    /**
     * Decorator for persistent entity.
     * 
     * Sample:
     * ```ts
     * ...
     * @RecorderDecorators.playerType({playerType: 'org.mypackage.MyPersistentEntity'})
     * export class MyPersistentEntityJs {
     * ...
     * ```
     */
    export function playerType(options: RecorderDecorators.playerTypeOptions): ClassDecorator {
        return function<T> (target: T): T | void {
            Reflect.defineMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_TYPE, options, target);
            Reflect.defineMetadata(
                mountContructorByPlayerTypeMetadataKey(options, target as any as TypeLike<any>),
                target,
                Function);
        }
    }

    /**
     * Internal use only! It is no a decorator!
     */
    export function mountContructorByPlayerTypeMetadataKey(options: RecorderDecorators.playerTypeOptions, entityType: TypeLike<any>): string {
        return RecorderConstants.REFLECT_METADATA_JSCONTRUCTOR_BY_PLAYER_TYPE_PREFIX +
            (entityType as any).name +
            (options.disambiguationId? ':' + options.disambiguationId : '') +
            ':' + options.playerType;
    }

    // export const BufferProcessor: IFieldProcessor<Buffer> = {
    //     fromLiteralValue: (value, info) => {
    //         if (value) {
    //             return of(Buffer.from(value, 'base64'));
    //         } else {
    //             return of(null);
    //         }
    //     },
    //     toLiteralValue: (value, info) => {
    //         if (value) {
    //             let base64Str = value.toString('base64');                            
    //             return of(base64Str);
    //         }
    //     }
    // };
    // export const StringProcessor: IFieldProcessor<String> = {
    //     fromLiteralValue: (value: string, info: any) => {
    //         return of(value);
    //     },
    //     fromDirectRaw: (stream: NodeJS.ReadableStream, info: any) => {
    //         return from(getStream(stream, {}) as Promise<string>);
    //     }
    // };
    // export const NodeJS.ReadableStreamProcessor: IFieldProcessor<String> = {
    //     fromLiteralValue: (value, info) => {
    //         if (value) {
    //             let base64AB = Buffer.from(value, 'base64');
    //             let ws = new memStreams.WritableStream();
    //             ws.write(base64AB);
    //             let myReadableStreamBuffer = new memStreams.ReadableStream(''); 
    //             myReadableStreamBuffer.push(base64AB);
    //             return of(myReadableStreamBuffer);
    //         } else {
    //             return of(null);
    //         }
    //     },
    //     fromDirectRaw: (stream, info) => {
    //         if (stream) {
    //             if ((stream as NodeJS.ReadableStream).addListener && (stream as NodeJS.ReadableStream).pipe) {
    //                 return of(stream);
    //             } else {
    //                 throw new Error('Not supported');
    //             }
    //         } else {
    //             return of(null);
    //         }
    //     }
    // };
    // export const StringStreamProcessor: IFieldProcessor<StringStream> = {
    //         fromLiteralValue: (value, info) => {
    //             if (value) {
    //                 let base64AB = Buffer.from(value, 'base64');
    //                 let ws = new memStreams.WritableStream();
    //                 ws.write(base64AB);
    //                 let myReadableStreamBuffer = new memStreams.ReadableStream(value); 
    //                 myReadableStreamBuffer.setEncoding('utf-8');
    //                 return of(myReadableStreamBuffer);
    //             } else {
    //                 return of(null);
    //             }
    //         },
    //         fromDirectRaw: (stream, info) => {
    //             if (stream) {
    //                 if ((stream as NodeJS.ReadableStream).addListener && (stream as NodeJS.ReadableStream).pipe) {
    //                     (stream as any as Readable).setEncoding('utf-8');
    //                     return of(stream);
    //                 } else {
    //                     throw new Error('Not supported');
    //                 }
    //             } else {
    //                 return of(null);
    //             }
    //         }
    // };

    export const DateProcessor: IFieldProcessor<Date> = {
        fromLiteralValue: (value) => {
            if (value instanceof Number || typeof(value) === 'number') {
                return new Date(value as number);
            } else if (value instanceof String || typeof(value) === 'string') {
                return new Date(value as string);
            } else {
                return null;
            }
        },
        toLiteralValue: (value) => {
            if (value) {
                return value.getTime();
            } else {
                return null;
            }
        }
    };

    export const BufferProcessor: IFieldProcessor<Buffer> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                return Buffer.from(value, 'base64');
            } else {
                return null;
            }
        },
        fromDirectRaw: (respStream$, info) => {
            return respStream$.pipe(
                flatMap((respStream) => {
                    return RecorderForDom.blobOrStreamToBuffer(respStream.body);
                }),
                map((buffer) => {
                    return { body: buffer };
                })
            );
        },
        toLiteralValue: (value, info) => {
            if (value) {
                let base64Str = value.toString('base64');
                return base64Str;
            } else {
                return null;
            }
        },
        toDirectRaw: (value, info) => {
            if (value) {
                // let ws = new memStreams.WritableStream();
                // ws.write(value);
                let myReadableStreamBuffer = RecorderForDom.bufferToBlobOrStream(value); 
                return of({ body: myReadableStreamBuffer} );
                // return of(null).pipe(
                //     tap(() => {
                //         myReadableStreamBuffer.emit('end');
                //     }),
                //     map(() => {
                //         return myReadableStreamBuffer;
                //     })
                // );
            } else {
                return of({ body: null });
            }
        }
    };
    export const StringProcessor: IFieldProcessor<String> = {
        fromLiteralValue: (value, info) => {
            return value;
        },
        fromDirectRaw: (respStream$, info) => {
            return respStream$.pipe(
                flatMap((respStream) => {
                    return RecorderForDom.blobOrStreamToString(respStream.body)
                }),
                map((bodyStr) => {
                    return { body: bodyStr };
                })
            );
        },
        toLiteralValue: (value, info) => {
            return value;
        },
        toDirectRaw: (value, info) => {
            if (value) {
                let myReadableStreamBuffer = RecorderForDom.stringToBlobOrStream(value.toString()); 
                return of( { body: myReadableStreamBuffer } );
            } else {
                return of( { body: null });
            }
        }
    };
    export const BinaryBlobOrStreamProcessor: IFieldProcessor<BinaryBlobOrStream> = {
        fromLiteralValue: (value, info) => {
            if (value) {
                return RecorderForDom.b64ToBlobOrStream(value);
            } else {
                return null;
            }
        },
        fromDirectRaw: (respStream$, info) => {
            return respStream$.pipe(
                map((respStream) => {
                    if (respStream.body) {
                        if(RecorderForDom.isBlobOrStream(respStream.body)) {
                            return respStream;
                        } else {
                            //for debug purpose
                            info === info
                            throw new Error('Not supported');
                        }
                    } else {
                        return { body: null };
                    }
                })
            );
        },
        toDirectRaw: (value, info) => {
            if (value) {
                return of({ body: value });
            } else {
                return of({ body: null });
            }
        },
        toLiteralValue: (value, info) => {
            throw new Error('Not supported!');
        }
    };
    export const StringBlobOrStreamProcessor: IFieldProcessor<StringBlobOrStream> = {
            fromLiteralValue: (value, info) => {
                if (value) {
                    let valueBuffer = Buffer.from(value, 'utf8');
                    // let ws = new memStreams.WritableStream();
                    // ws.write(valueBuffer);
                    let myReadableStreamBuffer = RecorderForDom.stringToBlobOrStream(value); 
                    return myReadableStreamBuffer;
                } else {
                    return null;
                }
            },
            fromDirectRaw: (respStream$, info) => {
                return respStream$.pipe(
                    map((respStream) => {
                        if (respStream.body) {
                            if(RecorderForDom.isBlobOrStream(respStream.body)) {
                                return respStream;
                            } else {
                                //for debug purpose
                                info === info
                                throw new Error('Not supported');
                            }
                        } else {
                            return { body: null};
                        }
                    })
                )
            },
            toDirectRaw: (value, info) => {
                if (value) {
                    return of({ body: value });
                } else {
                    return of({ body: null });
                }
            },
            toLiteralValue: (value, info) => {
                throw new Error('Not supported!');
            }
    };
}