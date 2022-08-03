import { LazyRefOTM, LazyRefPrp, LazyRefPrpMarker, LazyRefOTMMarker, BinaryBlobOrStream, StringBlobOrStream, BinaryBlobOrStreamMarker, StringBlobOrStreamMarker } from '../../src/api/lazy-ref';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';
import { DetailMinEnt } from './detail-min-ent';

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.MasterAEnt'})
export class MasterMinEnt {
    private _id: number;
    private _vcharA: string;
    private _vcharB: string;
    private _dateA: Date;
    private _datetimeA: Date;
    private _blobA: Buffer;
    private _blobB: Buffer;
    private _hbVersion: number;
    private _detailAEntCol: LazyRefOTM<Set<DetailMinEnt>>;
	private _blobLazyA: LazyRefPrp<BinaryBlobOrStream>;
    private _blobLazyB: LazyRefPrp<BinaryBlobOrStream>;
    private _clobLazyA: LazyRefPrp<StringBlobOrStream>;
	private _clobLazyB: LazyRefPrp<StringBlobOrStream>;
	
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
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefOTMMarker).lt().tp(Set).lt().tp(DetailMinEnt).gt().gt().tree))
	public get detailAEntCol(): LazyRefOTM<Set<DetailMinEnt>> {
		return this._detailAEntCol;
	}

	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(BinaryBlobOrStreamMarker).gt().tree))
	public get blobLazyA(): LazyRefPrp<BinaryBlobOrStream> {
		return this._blobLazyA;
	}

	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true })
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(BinaryBlobOrStreamMarker).gt().tree))
	public get blobLazyB(): LazyRefPrp<BinaryBlobOrStream> {
		return this._blobLazyB;
	}

	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(StringBlobOrStreamMarker).gt().tree))
	public get clobLazyA(): LazyRefPrp<StringBlobOrStream> {
		return this._clobLazyA;
    }
    
	@RecorderDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(StringBlobOrStreamMarker).gt().tree))
	public get clobLazyB(): LazyRefPrp<StringBlobOrStream> {
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

	public set detailAEntCol(value: LazyRefOTM<Set<DetailMinEnt>>) {
		this._detailAEntCol = value;
	}

	public set blobLazyA(value: LazyRefPrp<BinaryBlobOrStream>) {
		this._blobLazyA = value;
	}

	public set blobLazyB(value: LazyRefPrp<BinaryBlobOrStream>) {
		this._blobLazyB = value;
	}

	public set clobLazyA(value: LazyRefPrp<StringBlobOrStream>) {
		this._clobLazyA = value;
	}

	public set clobLazyB(value: LazyRefPrp<StringBlobOrStream>) {
		this._clobLazyB = value;
	}

}