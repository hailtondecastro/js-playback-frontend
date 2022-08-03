import { LazyRefMTO, LazyRefMTOMarker } from '../../src/api/lazy-ref';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';
import { DetailACompId, DetailAEnt } from './detail-a-ent';

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailARefererEnt'})
export class DetailARefererEnt {
    private _id: Number;
    private _vcharA: string;
    private _detailA: LazyRefMTO<DetailAEnt, DetailACompId>;

	@RecorderDecorators.property()
	@RecorderDecorators.playerObjectId()
	public get id(): Number {
		return this._id;
	}
	public set id(value: Number) {
		this._id = value;
	}
	@RecorderDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}
	public set vcharA(value: string) {
		this._vcharA = value;
	}
	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefMTOMarker).lt().tp(DetailAEnt).comma().tp(DetailACompId).gt().tree))
	public get detailA(): LazyRefMTO<DetailAEnt, DetailACompId> {
		return this._detailA;
	}
	public set detailA(value: LazyRefMTO<DetailAEnt, DetailACompId>) {
		this._detailA = value;
	}

}