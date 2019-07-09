import { JsHbContants } from './js-hb-constants';
import { LazyRefMTO } from './lazy-ref';
import { IJsHbSession } from './js-hb-session';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';

export namespace NgJsHbDecorators {
    export function property<T>(): MethodDecorator {
        return function<T> (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) {
            let oldSet = descriptor.set;
            descriptor.set = function(value) {
                if (value instanceof LazyRefMTO) {
                    //nada
                } else {
                    if (target instanceof Object && !(target instanceof Date)) {
                        let session: IJsHbSession = _.get(this, JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME) as IJsHbSession;
                        if (!session) {
                            throw new Error('A propriedade \'' + propertyKey.toString() + '\' de \'' + target.constructor + '\' possui um owner nao gerenciado. \'' + JsHbContants.JSHB_ENTITY_SESION_PROPERTY_NAME + '\' estah null');
                        }
                        let isOnlazyLoad: any = _.get(this, JsHbContants.JSHB_ENTITY_IS_ON_LAZY_LOAD_NAME);
                        if (!isOnlazyLoad && session.isRecording()) {
                            //fazer aqui o registro de JsHbPlaybackAction
                            let action: JsHbPlaybackAction = new JsHbPlaybackAction();
                            action.fieldName = propertyKey.toString();
                            action.actionType = JsHbPlaybackActionType.SetField;
                            if (_.has(this, session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                                action.ownerSignatureStr = _.get(this, session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                            } else if (_.has(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                                action.ownerCreationRefId = _.get(this, session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                            } else if (!this._isOnInternalSetLazyObjForCollection) {
                                throw new Error('The property \'' + propertyKey.toString() + ' de \'' + target.constructor + '\' has a not managed owner');
                            }
    
                            if (value != null) {
                                if (_.has(value, session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                                    action.settedSignatureStr = _.get(value, session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                                } else if (_.has(value, session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                                    action.settedCreationRefId = _.get(value, session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
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

    export function clazz<T>(javaClass: string): ClassDecorator {
        return function<T> (target: T): T | void {
            Reflect.defineMetadata(JsHbContants.JSHB_REFLECT_METADATA_JAVA_CLASS, javaClass, target);
        }
    }
}