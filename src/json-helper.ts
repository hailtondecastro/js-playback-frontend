import { Type } from '@angular/core';
import { MergeWithCustomizer } from 'lodash';
import { has as lodashHas, mergeWith as lodashMergeWith } from 'lodash';


/**
 * TODO:
 */
export class JSONHelper {
    //currParent: any;

    //private parseResolveRefMap: Map<any, any> = new Map<any, any>();

    /**
     * TODO:
     * @param k 
     * @param v 
     */
    public static resolveRefs(jsonObj: any, removeJsId: boolean): any {
        let resolveRefMap: Map<number, any> = new Map<number, any>();
        JSONHelper.resolveRefsRecursivo(resolveRefMap, jsonObj, removeJsId);

        return jsonObj;
    }

    private static resolveRefsRecursivo(resolveRefMap: Map<number, any>, jsonObj: any, removeJsId: boolean) {
        let currParent: any = jsonObj;
        let array = Object.getOwnPropertyNames(jsonObj);
        array.forEach(fieldName => {
            let fieldValue: any = currParent[fieldName];
            if (typeof fieldValue !== 'object') {
                if (fieldName === 'jsId') {
                    (resolveRefMap as any)[fieldValue] = currParent;
                    if (removeJsId) {
                        delete currParent['jsId'];
                    }
                } else {
                    //nada
                }
            } else if (lodashHas(fieldValue, 'rJsId')) {
                let refJsId: any = fieldValue['rJsId'];
                currParent[fieldName] = (resolveRefMap as any)[refJsId];
            } else {
                JSONHelper.resolveRefsRecursivo(resolveRefMap, fieldValue, removeJsId);
            } 
        });
    }

    private static MergeWithCustomizerClass = class {
        constructor(){
            this.visitedMap = new Map();
        }
        private visitedMap: Map<any, any>;
        customizer: MergeWithCustomizer = (value: any, srcValue: any) => {
            if (this.visitedMap.get(srcValue) != null) {
                return this.visitedMap.get(srcValue);
            } else if (srcValue != null && JSONHelper.isCollection(srcValue.constructor)) {
                let valueColl: any = JSONHelper.createCollection(srcValue.constructor);
                for (const item of srcValue) {
                    if (item instanceof Object && !(item instanceof Date)) {
                        JSONHelper.addOnCollection(valueColl, lodashMergeWith(<any>{}, item, this.customizer));
                    } else {
                        JSONHelper.addOnCollection(valueColl, item);
                    }
                }
                this.visitedMap.set(srcValue, valueColl);
                return valueColl;
            } else if (srcValue instanceof Object && !(srcValue instanceof Date)) {
                this.visitedMap.set(srcValue, lodashMergeWith(<any>{}, srcValue, this.customizer));
                return this.visitedMap.get(srcValue);
            } else {
                return srcValue;
            }
        }
    }

    private static deepRemoveDashFields(obj: any, visitedSet: Set<any>) {
        for (let prop in obj) {
            if (prop.startsWith('_'))
                delete obj[prop];
            else if (obj[prop] instanceof Object  && !(obj[prop] instanceof Date)) {
                if (visitedSet.has(obj[prop])) {
                    //nada
                } else {
                    visitedSet.add(obj[prop]);
                    JSONHelper.deepRemoveDashFields(obj[prop], visitedSet);
                }
            }
        }
    }

    private static createCollection(collType: Type<any>): any {
        return new collType();
    }

    private static isCollection(typeTested: Type<any>): any {
        return (typeTested === Array)
                || (typeTested === Set);
    }

    public static addOnCollection(collection: any, element: any) {
        if (collection instanceof Array) {
            (<Array<any>>collection).push(element);
        } else if (collection instanceof Set){
            (<Set<any>>collection).add(element);
        } else {
            throw new Error('Colecction nao suportada: ' + collection.prototype);
        }
    }

    private static convertToLiteralObjectPriv(sourceObject: any, removeDashFields: boolean, customizerObj: any ): any {

        let result: any = null;

        if (sourceObject != null && JSONHelper.isCollection(sourceObject.constructor)) {
            let valueColl: any = JSONHelper.createCollection(sourceObject.constructor);
            for (const item of sourceObject) {
                if (item instanceof Object && !(item instanceof Date)) {
                    JSONHelper.addOnCollection(valueColl, JSONHelper.convertToLiteralObjectPriv(item, removeDashFields, customizerObj));
                } else {
                    JSONHelper.addOnCollection(valueColl, item);
                }
            }
            result = valueColl;
        } else if (sourceObject instanceof Object && !(sourceObject instanceof Date)) {
            result = lodashMergeWith({}, sourceObject, customizerObj.customizer);
            if (removeDashFields) {
                JSONHelper.deepRemoveDashFields(result, new Set());
            }
        } else {
            result = sourceObject;
        }

        return result;
    }

    public static convertToLiteralObject(sourceObject: any, removeDashFields: boolean): any {
        let customizerObj = new JSONHelper.MergeWithCustomizerClass();
        return JSONHelper.convertToLiteralObjectPriv(sourceObject, removeDashFields, customizerObj);
    }

    // /**
    //  * TODO:
    //  * @param rootParent 
    //  */
    // setRootParent(rootParent:any):JSONHelper {
    //     this.currParent = rootParent;
    //     return this;
    // }
}