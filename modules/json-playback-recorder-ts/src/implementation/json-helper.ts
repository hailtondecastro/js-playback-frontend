import { TypeLike } from '../typeslike';
import { LodashLike } from '../implementation/lodash-like';


/**
 * TODO:
 */
export class JSONHelper {
    /**
     * TODO:
     * @param k 
     * @param v 
     */
    // public static resolveRefs(jsonObj: any, removeJsId: boolean): any {
    //     let resolveRefMap: Map<number, any> = new Map<number, any>();
    //     JSONHelper.resolveRefsRecursivo(resolveRefMap, jsonObj, removeJsId);

    //     return jsonObj;
    // }

    // private static resolveRefsRecursivo(resolveRefMap: Map<number, any>, jsonObj: any, removeJsId: boolean) {
    //     let currParent: any = jsonObj;
    //     let array = Object.getOwnPropertyNames(jsonObj);
    //     array.forEach(fieldName => {
    //         let fieldValue: any = currParent[fieldName];
    //         if (typeof fieldValue !== 'object') {
    //             if (fieldName === 'jsId') {
    //                 (resolveRefMap as any)[fieldValue] = currParent;
    //                 if (removeJsId) {
    //                     delete currParent['jsId'];
    //                 }
    //             } else {
    //                 //nada
    //             }
    //         } else if (LodashLike.has(fieldValue, 'rJsId')) {
    //             let refJsId: any = fieldValue['rJsId'];
    //             currParent[fieldName] = (resolveRefMap as any)[refJsId];
    //         } else {
    //             JSONHelper.resolveRefsRecursivo(resolveRefMap, fieldValue, removeJsId);
    //         } 
    //     });
    // }

    private static MergeWithCustomizerClass = class {
        constructor(){
        }
        //private visitedMap: Map<any, any>;
        customizer: LodashLike.MergeWithCustomizer = (value: any, srcValue: any) => {
            if (srcValue != null && JSONHelper.isCollection(srcValue.constructor)) {
                let valueColl: any = JSONHelper.createCollection(srcValue.constructor);
                for (const item of srcValue) {
                    if (LodashLike.isObject(item, new Set([Date, Buffer]))) {
                        JSONHelper.addOnCollection(valueColl, LodashLike.mergeWith(<any>{}, item, this.customizer));
                    } else {
                        JSONHelper.addOnCollection(valueColl, item);
                    }
                }
                return valueColl;
            } else if (LodashLike.isObject(srcValue, new Set([Date, Buffer]))) {
                LodashLike.mergeWith(<any>{}, srcValue, this.customizer);
            } else {
                return srcValue;
            }
        }
    }

    private static deepRemoveDashFields(obj: any, visitedSet: Set<any>) {
        for (let prop in obj) {
            if (prop.startsWith('_'))
                delete obj[prop];
            else if (LodashLike.isObject(obj[prop], new Set([Date, Buffer]))) {
                if (visitedSet.has(obj[prop])) {
                    //nada
                } else {
                    visitedSet.add(obj[prop]);
                    JSONHelper.deepRemoveDashFields(obj[prop], visitedSet);
                }
            }
        }
    }

    private static createCollection(collType: TypeLike<any>): any {
        return new collType();
    }

    private static isCollection(typeTested: TypeLike<any>, instance?: any): any {
        return (typeTested === Array)
                || (typeTested === Set)
                || (LodashLike.isArrayLike(instance));
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
                if (LodashLike.isObject(item, new Set([Date, Buffer]))) {
                    JSONHelper.addOnCollection(valueColl, JSONHelper.convertToLiteralObjectPriv(item, removeDashFields, customizerObj));
                } else {
                    JSONHelper.addOnCollection(valueColl, item);
                }
            }
            result = valueColl;
        } else if (LodashLike.isObject(sourceObject, new Set([Date, Buffer]))) {
            result = LodashLike.mergeWith({}, sourceObject, customizerObj.customizer);
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
}