import { TapeAction } from "./implementation/tape-action";

export class Tape {
    private _actions: Array<TapeAction> = new Array<TapeAction>();

    /**
     * Getter actions
     * @return {Array<TapeAction> }
     */
	public get actions(): Array<TapeAction>  {
		return this._actions;
	}

    /**
     * Setter actions
     * @param {Array<TapeAction> } value
     */
	public set actions(value: Array<TapeAction> ) {
		this._actions = value;
	}

}