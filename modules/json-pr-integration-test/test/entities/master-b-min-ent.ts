import { RecorderDecorators } from "json-playback-recorder-ts";

@RecorderDecorators.playerType({ playerType: 'org.jsonplayback.player.hibernate.entities.MasterBCompId' })
export class MasterBMinCompId {
    private _idA: number;
    private _idB: number;

    /**
     * Getter idA
     * @return {number}
     */
	@RecorderDecorators.property()
	public get idA(): number {
		return this._idA;
	}

    /**
     * Setter idA
     * @param {number} value
     */
	public set idA(value: number) {
		this._idA = value;
	}

    /**
     * Getter idB
     * @return {number}
     */
	@RecorderDecorators.property()
	public get idB(): number {
		return this._idB;
	}

    /**
     * Setter idB
     * @param {number} value
     */
	public set idB(value: number) {
		this._idB = value;
	}
    
}

@RecorderDecorators.playerType({ playerType: 'org.jsonplayback.player.hibernate.entities.MasterBEnt' })
export class MasterBMinEnt {
    private _compId: MasterBMinCompId;
    // private _vcharA: string;
    // private _vcharB: string;
    // private _dateA: Date;
    // private _datetimeA: Date;
    // private _blobA: Buffer;
    // private _blobB: Buffer;
    // private _hbVersion: number;
    // private _detailAEntCol: LazyRefOTM<Set<DetailAEnt>>;
    //private _masterBComp: MasterBComp;

	@RecorderDecorators.property()
	public get compId(): MasterBMinCompId {
		return this._compId;
	}

	public set compId(value: MasterBMinCompId) {
		this._compId = value;
	}

	// @RecorderDecorators.property()
	// public get vcharA(): string {
	// 	return this._vcharA;
	// }

	// public set vcharA(value: string) {
	// 	this._vcharA = value;
	// }

	// @RecorderDecorators.property()
	// public get vcharB(): string {
	// 	return this._vcharB;
	// }

	// public set vcharB(value: string) {
	// 	this._vcharB = value;
	// }

	// @RecorderDecorators.property()
	// public get dateA(): Date {
	// 	return this._dateA;
	// }

	// public set dateA(value: Date) {
	// 	this._dateA = value;
	// }

	// @RecorderDecorators.property()
	// public get datetimeA(): Date {
	// 	return this._datetimeA;
	// }

	// public set datetimeA(value: Date) {
	// 	this._datetimeA = value;
	// }

	// @RecorderDecorators.property()
	// public get blobA(): Buffer {
	// 	return this._blobA;
	// }

	// public set blobA(value: Buffer) {
	// 	this._blobA = value;
	// }

	// @RecorderDecorators.property()
	// public get blobB(): Buffer {
	// 	return this._blobB;
	// }

	// public set blobB(value: Buffer) {
	// 	this._blobB = value;
	// }

	// @RecorderDecorators.property()
	// public get hbVersion(): number {
	// 	return this._hbVersion;
	// }

	// public set hbVersion(value: number) {
	// 	this._hbVersion = value;
	// }

	// @RecorderDecorators.property()
	// @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(Set).lt().tp(DetailAEnt).gt().gt().tree))
	// public get detailAEntCol(): LazyRefOTM<Set<DetailAEnt>> {
	// 	return this._detailAEntCol;
	// }

	// public set detailAEntCol(value: LazyRefOTM<Set<DetailAEnt>>) {
	// 	this._detailAEntCol = value;
	// }

	// @RecorderDecorators.property()
	// public get masterBComp(): MasterBComp {
	// 	return this._masterBComp;
	// }

	// public set masterBComp(value: MasterBComp) {
	// 	this._masterBComp = value;
	// }    
}