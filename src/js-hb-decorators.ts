import { JsHbContants } from './js-hb-constants';
import { LazyRefMTO } from './lazy-ref';
import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { get as lodashGet, has } from 'lodash';
import { Type } from '@angular/core';

export namespace NgJsHbDecorators {
    /**
     * Decorator for get property.<br>
     * Exemplo:
     * ```ts
     * ...
     * private _myField: string;
     * @NgJsHbDecorators.property()
     * public get myField(): string {
     *   return this._myField;
     * }
     * public set myField(value: string) {
     *   this._myField = value;
     * }
     * ...
     * ```
     */
    export function property<T>(): MethodDecorator {
        return function<T> (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) {
            let oldSet = descriptor.set;
            descriptor.set = function(value) {
                if (value instanceof LazyRefMTO) {
                    //nada
                } else {
                    if (target instanceof Object && !(target instanceof Date)) {
                        let session: IJsHbSession = lodashGet(this, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME) as IJsHbSession;
                        if (!session) {
                            throw new Error('A propriedade \'' + propertyKey.toString() + '\' de \'' + target.constructor + '\' possui um owner nao gerenciado. \'' + JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME + '\' estah null');
                        }
                        let isOnlazyLoad: any = lodashGet(this, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME);
                        if (!isOnlazyLoad && session.isRecording() && !session.isOnRestoreEntireStateFromLiteral()) {
                            //fazer aqui o registro de JsHbPlaybackAction
                            let action: JsHbPlaybackAction = new JsHbPlaybackAction();
                            action.fieldName = propertyKey.toString();
                            action.actionType = JsHbPlaybackActionType.SetField;
                            if (has(this, session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                                action.ownerSignatureStr = lodashGet(this, session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                            } else if (has(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                                action.ownerCreationRefId = lodashGet(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                            } else if (!this._isOnInternalSetLazyObjForCollection) {
                                throw new Error('The property \'' + propertyKey.toString() + ' de \'' + target.constructor + '\' has a not managed owner');
                            }
    
                            if (value != null) {
                                if (has(value, session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                                    action.settedSignatureStr = lodashGet(value, session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
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
                    }
                }
                oldSet.call(this, value);
            };
        }
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
         * Use it if you have to typescript classes mapping the same java entity class.
         */
        disambiguationId?: string;
    }

    /**
     * Decorator for persistent entity.<br>
     * Exemplo:
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