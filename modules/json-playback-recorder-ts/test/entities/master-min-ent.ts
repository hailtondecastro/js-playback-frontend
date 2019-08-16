import { DetailAEnt } from './detail-a-ent';
import { LazyRef, LazyRefOTM, StringStream, StringStreamMarker, LazyRefPrp, LazyRefPrpMarker, BinaryStream, BinaryStreamMarker } from '../../src/api/lazy-ref';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';
import { Stream } from 'stream';
import { ReadLine } from 'readline';
import { DetailMinEnt } from './detail-min-ent';

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.MasterAEnt'})
export class MasterMinEnt {
    private _id: number;
    private _vcharA: string;
    private _detailAEntCol: LazyRefOTM<Set<DetailMinEnt>>;

	@RecorderDecorators.property()
	public get id(): number {
		return this._id;
	}

	@RecorderDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(Set).lt().tp(DetailMinEnt).gt().gt().tree))
	public get detailAEntCol(): LazyRefOTM<Set<DetailMinEnt>> {
		return this._detailAEntCol;
	}

	public set id(value: number) {
		this._id = value;
	}

	public set vcharA(value: string) {
		this._vcharA = value;
	}

	public set detailAEntCol(value: LazyRefOTM<Set<DetailMinEnt>>) {
		this._detailAEntCol = value;
	}
}