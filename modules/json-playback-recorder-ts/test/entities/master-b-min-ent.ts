import { DetailAEnt } from './detail-a-ent';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow } from '../../src/api/generic-tokenizer';
import { GenericTokenizer } from '../../src/api/generic-tokenizer';
import { LazyRef, LazyRefOTM } from '../../src/api/lazy-ref';

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
    private _vcharA: string;

	@RecorderDecorators.property()
	@RecorderDecorators.playerObjectId()
	public get compId(): MasterBMinCompId {
		return this._compId;
	}

	public set compId(value: MasterBMinCompId) {
		this._compId = value;
	}

	@RecorderDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	public set vcharA(value: string) {
		this._vcharA = value;
	}
}