import { Type } from '@angular/core';
import "reflect-metadata";

export class GenericNode {
    gType: Type<any>;
    gParams: Array<Type<any> | GenericNode>;
    gParent: GenericNode;
}

enum GenericTokenEnum {
    Type,
    Lt,
    Gt,
    Comma
}

interface MergeWithCustomizer {
    (value: any, srcValue: any, key?: string, object?: Object, source?: Object): any;
}
export interface GenericNodeDelegate {
    (): GenericNode;
}

export class GenericNodeNotNow {
    constructor(private _genericNodeCallback: GenericNodeDelegate) {
    }
    /**
     * Getter genericNodeCallback
     * @return {GenericNodeDelegate}
     */
	public get genericNodeCallback(): GenericNodeDelegate {
		return this._genericNodeCallback;
	}

    /**
     * Setter genericNodeCallback
     * @param {GenericNodeDelegate} value
     */
	public set genericNodeCallback(value: GenericNodeDelegate) {
		this._genericNodeCallback = value;
	}
}

export class GenericTokenizer {
    private _tree: GenericNode = null;
    private currNode: GenericNode = null;
    private lastToken: GenericTokenEnum = null;
    private ltGtCount: number = 0;

    /**
     * Setter tree
     * @param {GenericNode } value
     */
	public get tree(): GenericNode {
        if (this.ltGtCount > 0) {
            throw new Error('lt() nao acompanha um gt()');
        }
		return this._tree;
	}

    public static create(): GenericTokenizer {
        return new GenericTokenizer();
    }

    public tp(type: Type<any>): GenericTokenizer {
        if ((this.lastToken == null)
            || (this.lastToken == GenericTokenEnum.Comma)
            || (this.lastToken == GenericTokenEnum.Lt)) {
            //nada, OK
        } else {
            throw new Error('Token invalido, type(): ' + type);
        }
        if (this._tree == null) {
            this._tree = new GenericNode();
            this._tree.gType = type;
            this._tree.gParams = [];
            this.currNode = this._tree;
        } else {
            this.currNode.gParams.push(type);
        }
        this.lastToken = GenericTokenEnum.Type;
        return this;
    }
    public lt(): GenericTokenizer {
        if (this.lastToken != GenericTokenEnum.Type) {
            throw new Error('lt() somente pode vir apos de type()');
        }
        let gParamNew: GenericNode = null;
        if (this.currNode.gParams.length > 0) {
            let gParamActual: Type<any> | GenericNode = this.currNode.gParams.pop();
            if (gParamActual instanceof Type) {
                gParamNew = new GenericNode();
                gParamNew.gType = <Type<any>>gParamActual;
                gParamNew.gParent = this.currNode;
                gParamNew.gParams = [];
                this.currNode.gParams.push(gParamNew);
                this.currNode = gParamNew;
            }
        } else {
            //nao faz nada, esse eh o caso do tipo raiz!
        }

        this.ltGtCount ++;
        this.lastToken = GenericTokenEnum.Lt;
        return this;
    }
    public gt(): GenericTokenizer {
        if (this.ltGtCount == 0) {
            throw new Error('gt() inserido sem um lt() precedente');
        }
        if (this.lastToken == GenericTokenEnum.Lt) {
            throw new Error('Tipo generico "' + this.currNode.gType +'" nao define nenhum tipo parametro');
        }
        this.currNode = this.currNode.gParent;

        this.ltGtCount --;
        this.lastToken = GenericTokenEnum.Gt;
        return this;
    }
    public comma(): GenericTokenizer {
        //nada
        this.lastToken = GenericTokenEnum.Comma;
        return this;
    }

    public static resolveNode(entityObj: any, keyItem: string): GenericNode {
        let prpGenTypeOrNotNow: GenericNode | GenericNodeNotNow = Reflect.getMetadata("design:generics", entityObj, keyItem);
        if (prpGenTypeOrNotNow instanceof GenericNode) {
            return prpGenTypeOrNotNow as GenericNode;
        } else if (prpGenTypeOrNotNow instanceof GenericNodeNotNow) {
            return (prpGenTypeOrNotNow as GenericNodeNotNow).genericNodeCallback();
        } else {
            //throw new Error('design:generics of ' + entityObj + '.' + keyItem + ' is not an GenericNode nor GenericNodeNotNow');
            return null;
        }
    }
}