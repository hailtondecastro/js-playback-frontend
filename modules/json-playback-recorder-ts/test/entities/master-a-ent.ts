import { DetailAEnt } from './detail-a-ent';
import { LazyRef, LazyRefOTM, StringStream, StringStreamMarker, LazyRefPrp, LazyRefPrpMarker, BinaryStream, BinaryStreamMarker, LazyRefOTMMarker } from '../../src/api/lazy-ref';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';
import { Stream } from 'stream';
import { ReadLine } from 'readline';

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.MasterAEnt'})
export class MasterAEnt {
    private _id: number;
    private _vcharA: string;
    private _vcharB: string;
    private _dateA: Date;
    private _datetimeA: Date;
    private _blobA: Buffer;
    private _blobB: Buffer;
    private _hbVersion: number;
    private _detailAEntCol: LazyRefOTM<Set<DetailAEnt>>;
    private _blobLazyA: LazyRefPrp<BinaryStream>;
    private _blobLazyB: LazyRefPrp<BinaryStream>;
    private _clobLazyA: LazyRefPrp<StringStream>;
	private _clobLazyB: LazyRefPrp<StringStream>;

	@RecorderDecorators.property()
	public get id(): number {
		return this._id;
	}

	@RecorderDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	@RecorderDecorators.property()
	public get vcharB(): string {
		return this._vcharB;
	}

	@RecorderDecorators.property()
	public get dateA(): Date {
		return this._dateA;
	}

	@RecorderDecorators.property()
	public get datetimeA(): Date {
		return this._datetimeA;
	}

	@RecorderDecorators.property()
	public get blobA(): Buffer {
		return this._blobA;
	}

	@RecorderDecorators.property()
	public get blobB(): Buffer {
		return this._blobB;
	}

	@RecorderDecorators.property()
	public get hbVersion(): number {
		return this._hbVersion;
	}

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefOTMMarker).lt().tp(Set).lt().tp(DetailAEnt).gt().gt().tree))
	public get detailAEntCol(): LazyRefOTM<Set<DetailAEnt>> {
		return this._detailAEntCol;
	}

	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(BinaryStreamMarker).gt().tree))
	public get blobLazyA(): LazyRefPrp<BinaryStream> {
		return this._blobLazyA;
	}

	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true })
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(BinaryStreamMarker).gt().tree))
	public get blobLazyB(): LazyRefPrp<BinaryStream> {
		return this._blobLazyB;
	}

	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(StringStreamMarker).gt().tree))
	public get clobLazyA(): LazyRefPrp<StringStream> {
		return this._clobLazyA;
    }
    
	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(StringStreamMarker).gt().tree))
	public get clobLazyB(): LazyRefPrp<StringStream> {
		return this._clobLazyB;
	}

	public set id(value: number) {
		this._id = value;
	}

	public set vcharA(value: string) {
		this._vcharA = value;
	}

	public set vcharB(value: string) {
		this._vcharB = value;
	}

	public set dateA(value: Date) {
		this._dateA = value;
	}

	public set datetimeA(value: Date) {
		this._datetimeA = value;
	}

	public set blobA(value: Buffer) {
		this._blobA = value;
	}

	public set blobB(value: Buffer) {
		this._blobB = value;
	}

	public set hbVersion(value: number) {
		this._hbVersion = value;
	}

	public set detailAEntCol(value: LazyRefOTM<Set<DetailAEnt>>) {
		this._detailAEntCol = value;
	}

	public set blobLazyA(value: LazyRefPrp<BinaryStream>) {
		this._blobLazyA = value;
	}

	public set blobLazyB(value: LazyRefPrp<BinaryStream>) {
		this._blobLazyB = value;
	}

	public set clobLazyA(value: LazyRefPrp<StringStream>) {
		this._clobLazyA = value;
	}

	public set clobLazyB(value: LazyRefPrp<StringStream>) {
		this._clobLazyB = value;
	}

}