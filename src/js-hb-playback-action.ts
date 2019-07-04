export enum JsHbPlaybackActionType {
    Create = <any>'CREATE',
    Save = <any>'SAVE',
    Delete = <any>'DELETE',
    SetField = <any>'SET_FIELD',
    CollectionAdd = <any>'COLLECTION_ADD',
    CollectionRemove = <any>'COLLECTION_REMOVE',
}

export class JsHbPlaybackAction {
    private _ownerSignatureStr: String;
    private _ownerCreationId: Number;
    private _ownerCreationRefId: Number;
    private _settedSignatureStr: String;
    private _settedCreationRefId: Number;
    private _ownerJavaClass: String;
    private _actionType: JsHbPlaybackActionType;
    private _fieldName: String;
    private _simpleSettedValue: any;

    /**
     * Getter ownerSignatureStr
     * @return {String}
     */
	public get ownerSignatureStr(): String {
		return this._ownerSignatureStr;
	}

    /**
     * Getter ownerCreationId
     * @return {Number}
     */
	public get ownerCreationId(): Number {
		return this._ownerCreationId;
	}

    /**
     * Getter ownerCreationRefId
     * @return {Number}
     */
	public get ownerCreationRefId(): Number {
		return this._ownerCreationRefId;
	}

    /**
     * Getter settedSignatureStr
     * @return {String}
     */
	public get settedSignatureStr(): String {
		return this._settedSignatureStr;
	}

    /**
     * Getter settedCreationRefId
     * @return {Number}
     */
	public get settedCreationRefId(): Number {
		return this._settedCreationRefId;
	}

    /**
     * Getter ownerJavaClass
     * @return {String}
     */
	public get ownerJavaClass(): String {
		return this._ownerJavaClass;
	}

    /**
     * Getter actionType
     * @return {JsHbPlaybackActionType}
     */
	public get actionType(): JsHbPlaybackActionType {
		return this._actionType;
	}

    /**
     * Getter fieldName
     * @return {String}
     */
	public get fieldName(): String {
		return this._fieldName;
	}

    /**
     * Setter ownerSignatureStr
     * @param {String} value
     */
	public set ownerSignatureStr(value: String) {
		this._ownerSignatureStr = value;
	}

    /**
     * Setter ownerCreationId
     * @param {Number} value
     */
	public set ownerCreationId(value: Number) {
		this._ownerCreationId = value;
	}

    /**
     * Setter ownerCreationRefId
     * @param {Number} value
     */
	public set ownerCreationRefId(value: Number) {
		this._ownerCreationRefId = value;
	}

    /**
     * Setter settedSignatureStr
     * @param {String} value
     */
	public set settedSignatureStr(value: String) {
		this._settedSignatureStr = value;
	}

    /**
     * Setter settedCreationRefId
     * @param {Number} value
     */
	public set settedCreationRefId(value: Number) {
		this._settedCreationRefId = value;
	}

    /**
     * Setter ownerJavaClass
     * @param {String} value
     */
	public set ownerJavaClass(value: String) {
		this._ownerJavaClass = value;
	}

    /**
     * Setter actionType
     * @param {JsHbPlaybackActionType} value
     */
	public set actionType(value: JsHbPlaybackActionType) {
		this._actionType = value;
	}

    /**
     * Setter fieldName
     * @param {String} value
     */
	public set fieldName(value: String) {
		this._fieldName = value;
	}

    /**
     * Getter resolvedSettedValue
     * @return {any}
     */
	public get simpleSettedValue(): any {
		return this._simpleSettedValue;
	}

    /**
     * Setter resolvedSettedValue
     * @param {any} value
     */
	public set simpleSettedValue(value: any) {
		this._simpleSettedValue = value;
	}

}