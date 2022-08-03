export namespace RecorderConstants {
    export let ENTITY_CONTROL_PROPS_PATTERN: RegExp = /^\$rc\..*/;
    export let ENTITY_SESION_PROPERTY_NAME: string = '$rc.session$';
    export let ENTITY_IS_ON_LAZY_LOAD_NAME: string = '$rc.isOnLazyLoad$';
    export let ENTITY_EXISTS_BY_SIGN_FROM_PREVIOUS_PROCESSING: string = '$rc.existsBySignFromPreviuosProcessessing$';
    export let REFLECT_METADATA_PLAYER_TYPE: string = 'design:player-type$';
    export let REFLECT_METADATA_JSCONTRUCTOR_BY_PLAYER_TYPE_PREFIX: string = 'design:jscontructorByPlayerTypePrefix:';
    export let REFLECT_METADATA_PLAYER_OBJECT_ID_INFO: string = 'design:playerObjectIdInfo';
    export let REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS: string = 'design:propertyOptions';
}