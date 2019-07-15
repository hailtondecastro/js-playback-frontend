export enum TapeActionType {
    Create = <any>'CREATE',
    Save = <any>'SAVE',
    Delete = <any>'DELETE',
    SetField = <any>'SET_FIELD',
    CollectionAdd = <any>'COLLECTION_ADD',
    CollectionRemove = <any>'COLLECTION_REMOVE',
}

export interface TapeAction {
    ownerSignatureStr?: string;
    ownerCreationId?: number;
    ownerCreationRefId?: number;
    settedSignatureStr?: string;
    settedCreationRefId?: number;
    ownerPlayerType?: string;
    actionType?: TapeActionType;
    fieldName?: string;
    simpleSettedValue?: any;
    attachRefId?: string;
}

export interface Tape {
    actions?: Array<TapeAction>;
}