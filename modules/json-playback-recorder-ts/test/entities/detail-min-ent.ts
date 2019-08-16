import { MasterAEnt } from './master-a-ent';
import { LazyRefMTO, LazyRef } from '../../src/api/lazy-ref';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';
import { MasterMinEnt } from './master-min-ent';
import { MasterBMinEnt, MasterBMinCompId } from './master-b-min-ent';

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailACompId'})
export class DetailMinCompId {
    private _masterA: LazyRefMTO<MasterMinEnt, number>;
    private _subId: number;

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterAEnt).comma().tp(Number).gt().tree))
	public get masterA(): LazyRefMTO<MasterMinEnt, number> {
		return this._masterA;
	}

	public set masterA(value: LazyRefMTO<MasterMinEnt, number>) {
		this._masterA = value;
	}

    /**
     * Getter subId
     * @return {number}
     */
	@RecorderDecorators.property()
	public get subId(): number {
		return this._subId;
	}

    /**
     * Setter subId
     * @param {number} value
     */
	public set subId(value: number) {
		this._subId = value;
	}
    
}

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailAEnt'})
export class DetailMinEnt {
    private _compId: DetailMinCompId;
	private _vcharA: string;
	private _masterB: LazyRefMTO<MasterBMinEnt, MasterBMinCompId>;
  
	@RecorderDecorators.property()
	@RecorderDecorators.playerObjectId()
	public get compId(): DetailMinCompId {
		return this._compId;
	}
  
	public set compId(value: DetailMinCompId) {
		this._compId = value;
	}

	@RecorderDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	public set vcharA(value: string) {
		this._vcharA = value;
	}

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterBMinEnt).comma().tp(MasterBMinCompId).gt().tree))
	public get masterB(): LazyRefMTO<MasterBMinEnt, MasterBMinCompId> {
		return this._masterB;
	}

	public set masterB(value: LazyRefMTO<MasterBMinEnt, MasterBMinCompId>) {
		this._masterB = value;
	}
}