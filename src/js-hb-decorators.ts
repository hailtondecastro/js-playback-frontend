import { JsHbContants } from './js-hb-constants';
import { LazyRef } from './lazy-ref';
import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { get as lodashGet, has } from 'lodash';
import { Type } from '@angular/core';
import { JsHbLogLevel } from './js-hb-config';
import { JsHbBackendMetadatas } from './js-hb-backend-metadatas';

export namespace NgJsHbDecorators {
    export interface PropertyOptions {
        persistent: boolean;
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
    export function property<T>(options: PropertyOptions): MethodDecorator;
    export function property<T>(): MethodDecorator;
    export function property<T>(): MethodDecorator {
        let options: {notPersistent: boolean};
        if (arguments.length > 0) {
            options = arguments[0];
        }
        const optionsConst: PropertyOptions =
            {
                persistent: true
            }
        if (options) {
            Object.assign(optionsConst, options);
        }

        let returnFunc: MethodDecorator = function<T> (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) {
            Reflect.defineMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, optionsConst, target, propertyKey);
            let oldSet = descriptor.set;
            descriptor.set = function(value) {
                let session: IJsHbSession = lodashGet(this, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME) as IJsHbSession;
                if (optionsConst.persistent) {
                    if (JsHbLogLevel.Trace >= session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('NgJsHbDecorators.set' +
                            'propertyOptions.persistent. Intercepting set method for '+target.constructor.name + '.' + (propertyKey as string) + '. target and value:');
                        console.debug(target);
                        console.debug(value);
                        console.groupEnd();
                    }
                    let isOnlazyLoad: any = lodashGet(this, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME);
                    if (value && (value as any as LazyRef<any, any>).iAmLazyRef) {
                        //nada
                    } else {
                        if (target instanceof Object && !(target instanceof Date)) {
                            if (!session) {
                                throw new Error('The property \'' + propertyKey.toString() + '\' de \'' + target.constructor + '\' has a not managed owner. \'' + JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME + '\' is null or not present');
                            }
                            let actualValue = lodashGet(this, propertyKey);
                            if (actualValue !== value) {
                                if (!isOnlazyLoad && !session.isOnRestoreEntireStateFromLiteral()) {
                                    if (!session.isRecording()){
                                        throw new Error('Invalid operation. It is not recording. is this Error correct?!');
                                    }
                                    if (JsHbLogLevel.Trace >= session.jsHbManager.jsHbConfig.logLevel) {
                                        console.group('NgJsHbDecorators.set' +
                                            '(actualValue !== value) && !isOnlazyLoad && !session.isOnRestoreEntireStateFromLiteral()\n' +
                                            'Recording action: ' + JsHbPlaybackActionType.SetField + '. actual and new value: ');
                                        console.debug(actualValue);
                                        console.debug(value);
                                        console.groupEnd();
                                    }
                                    //fazer aqui o registro de JsHbPlaybackAction
                                    let action: JsHbPlaybackAction = new JsHbPlaybackAction();
                                    action.fieldName = propertyKey.toString();
                                    action.actionType = JsHbPlaybackActionType.SetField;
                                    let backendMetadatas: JsHbBackendMetadatas = { iAmJsHbBackendMetadatas: true };
                                    if (has(this, session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                                        backendMetadatas = lodashGet(this, session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                                    }

                                    //if (has(this, session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                                    if (backendMetadatas.signature) {
                                        //action.ownerSignatureStr = lodashGet(this, session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                                        action.ownerSignatureStr = backendMetadatas.signature;
                                    } else if (has(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                                        action.ownerCreationRefId = lodashGet(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                                    } else if (!this._isOnInternalSetLazyObjForCollection) {
                                        throw new Error('The property \'' + propertyKey.toString() + ' de \'' + target.constructor + '\' has a not managed owner');
                                    }
            
                                    if (value != null && value != undefined) {
                                        let backendMetadatasValue: JsHbBackendMetadatas = { iAmJsHbBackendMetadatas: true };
                                        if (has(value, session.jsHbManager.jsHbConfig.jsHbMetadatasName)) {
                                            backendMetadatasValue = lodashGet(value, session.jsHbManager.jsHbConfig.jsHbMetadatasName);
                                        }

                                        //if (has(value, session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                                        if (backendMetadatasValue.signature) {
                                            //action.settedSignatureStr = lodashGet(value, session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                                            action.settedSignatureStr = backendMetadatasValue.signature;
                                        } else if (has(value, session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                                            action.settedCreationRefId = lodashGet(value, session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                                        } else {
                                            if (value instanceof Object && !(value instanceof Date)) {
                                                throw new Error('The property \'' + propertyKey.toString() + ' de \'' + this.constructor + '\'. Value can not be anything but primitive in this case. value: ' + value.constructor);
                                            }
                                            action.simpleSettedValue = value;
                                        }
                                    } else {
                                        action.simpleSettedValue = null;
                                    }
                                    session.addPlaybackAction(action);
                                }
                            } else {
                                if (JsHbLogLevel.Trace >= session.jsHbManager.jsHbConfig.logLevel) {
                                    console.group('NgJsHbDecorators.set' +
                                        '(actualValue === value)\n' +
                                        'NOT recording action: ' + JsHbPlaybackActionType.SetField + '. value: ');
                                    console.debug(value);
                                    console.groupEnd();
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
                    if (JsHbLogLevel.Trace >= session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('NgJsHbDecorators.set' +
                            '!propertyOptions.persistent. Not intercepting set method for '+target.constructor.name + '.' + (propertyKey as string) + '. target and value:');
                        console.debug(target);
                        console.debug(value);
                        console.groupEnd();
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
}