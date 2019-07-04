import { JsHbPlaybackAction } from './js-hb-playback-action';

export class JsHbPlayback {
    private _actions: Array<JsHbPlaybackAction> = new Array<JsHbPlaybackAction>();

    /**
     * Getter actions
     * @return {Array<JsHbPlaybackAction> }
     */
	public get actions(): Array<JsHbPlaybackAction>  {
		return this._actions;
	}

    /**
     * Setter actions
     * @param {Array<JsHbPlaybackAction> } value
     */
	public set actions(value: Array<JsHbPlaybackAction> ) {
		this._actions = value;
	}

}