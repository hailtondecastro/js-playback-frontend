import "reflect-metadata";
import { TypeLike } from '../typeslike';

export class GenericNode {
    gType: TypeLike<any>;
    gParams: Array<TypeLike<any> | GenericNode>;
    gParent: GenericNode;
    public toString(): string {
        let returnStr = this.gType.name + '<';
        let commaStr = '';
        for (const gParamItem of this.gParams) {
            if (gParamItem instanceof GenericNode) {
                returnStr += commaStr + gParamItem.toString();
            } else {
                returnStr += commaStr + gParamItem.name;
            }
            commaStr = ', ';
        }
        returnStr += '>';
        return returnStr;
    }
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
	public get genericNodeCallback(): GenericNodeDelegate {
		return this._genericNodeCallback;
	}

	public set genericNodeCallback(value: GenericNodeDelegate) {
		this._genericNodeCallback = value;
	}
}

export class GenericTokenizer {
    private _tree: GenericNode = null;
    private currNode: GenericNode = null;
    private lastToken: GenericTokenEnum = null;
    private ltGtCount: number = 0;

	public get tree(): GenericNode {
        if (this.ltGtCount > 0) {
            throw new Error('gt() not found to close lt()');
        }
		return this._tree;
	}

    public static create(): GenericTokenizer {
        return new GenericTokenizer();
    }

    public tp(type: TypeLike<any>): GenericTokenizer {
        if ((this.lastToken == null)
            || (this.lastToken == GenericTokenEnum.Comma)
            || (this.lastToken == GenericTokenEnum.Lt)) {
            //nothing, OK
        } else {
            throw new Error('Invalid token, type(): ' + type);
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
            throw new Error('lt() can only come after type()');
        }
        let gParamNew: GenericNode = null;
        if (this.currNode.gParams.length > 0) {
            let gParamActual: TypeLike<any> | GenericNode = this.currNode.gParams.pop();
            if (gParamActual instanceof TypeLike) {
                gParamNew = new GenericNode();
                gParamNew.gType = <TypeLike<any>>gParamActual;
                gParamNew.gParent = this.currNode;
                gParamNew.gParams = [];
                this.currNode.gParams.push(gParamNew);
                this.currNode = gParamNew;
            }
        } else {
            //does nothing, that's the root type!
        }

        this.ltGtCount ++;
        this.lastToken = GenericTokenEnum.Lt;
        return this;
    }
    public gt(): GenericTokenizer {
        if (this.ltGtCount == 0) {
            throw new Error('gt() inserted without a preceding lt()');
        }
        if (this.lastToken == GenericTokenEnum.Lt) {
            throw new Error('Generic type "' + this.currNode.gType +'" does not define any parameter type');
        }
        this.currNode = this.currNode.gParent;

        this.ltGtCount --;
        this.lastToken = GenericTokenEnum.Gt;
        return this;
    }
    public comma(): GenericTokenizer {
        //nothing
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
            return null;
        }
    }
}