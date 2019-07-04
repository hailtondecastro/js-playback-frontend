import { JsHbContants } from './js-hb-constants';
import { LazyRefMTO } from './lazy-ref';
import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { get as lodashGet, has } from 'lodash';
import { Type } from '@angular/core';

export namespace NgJsHbDecorators {
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

    export interface clazzOptions {
        javaClass: string;
        disambiguationId?: string;
    }

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
     * @param options 
     * @param entityType 
     */
    export function mountContructorByJavaClassMetadataKey(options: clazzOptions, entityType: Type<any>): string {
        return JsHbContants.JSHB_REFLECT_METADATA_JSCONTRUCTOR_BY_JAVA_CLASS_PREFIX +
            (entityType as any).name +
            (options.disambiguationId? ':' + options.disambiguationId : '') +
            ':' + options.javaClass;
    }
}