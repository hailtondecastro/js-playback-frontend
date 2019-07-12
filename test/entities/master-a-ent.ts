import { DetailAEnt } from './detail-a-ent';
import { LazyRef, LazyRefOTM, StringStream, StringStreamMarker, LazyRefPrp, LazyRefPrpMarker } from '../../src/api/lazy-ref';
import { JsonPlaybackDecorators } from '../../src/api/decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';
import { Stream } from 'stream';
import { ReadLine } from 'readline';

@JsonPlaybackDecorators.clazz({javaClass: 'org.jsonplayback.player.hibernate.entities.MasterAEnt'})
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
    private _blobLazyA: LazyRefPrp<Stream>;
    private _blobLazyB: LazyRefPrp<Stream>;
    private _clobLazyA: LazyRefPrp<StringStream>;
    private _clobLazyB: LazyRefPrp<StringStream>;

	@JsonPlaybackDecorators.property()
	public get id(): number {
		return this._id;
	}

	@JsonPlaybackDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	@JsonPlaybackDecorators.property()
	public get vcharB(): string {
		return this._vcharB;
	}

	@JsonPlaybackDecorators.property()
	public get dateA(): Date {
		return this._dateA;
	}

	@JsonPlaybackDecorators.property()
	public get datetimeA(): Date {
		return this._datetimeA;
	}

	@JsonPlaybackDecorators.property()
	public get blobA(): Buffer {
		return this._blobA;
	}

	@JsonPlaybackDecorators.property()
	public get blobB(): Buffer {
		return this._blobB;
	}

	@JsonPlaybackDecorators.property()
	public get hbVersion(): number {
		return this._hbVersion;
	}

	@JsonPlaybackDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(Set).lt().tp(DetailAEnt).gt().gt().tree))
	public get detailAEntCol(): LazyRefOTM<Set<DetailAEnt>> {
		return this._detailAEntCol;
	}

	@JsonPlaybackDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(Stream).gt().tree))
	public get blobLazyA(): LazyRefPrp<Stream> {
		return this._blobLazyA;
	}

	@JsonPlaybackDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true })
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(Stream).gt().tree))
	public get blobLazyB(): LazyRefPrp<Stream> {
		return this._blobLazyB;
	}

	@JsonPlaybackDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(StringStreamMarker).gt().tree))
	public get clobLazyA(): LazyRefPrp<StringStream> {
		return this._clobLazyA;
    }
    
	@JsonPlaybackDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
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

	public set blobLazyA(value: LazyRefPrp<Stream>) {
		this._blobLazyA = value;
	}

	public set blobLazyB(value: LazyRefPrp<Stream>) {
		this._blobLazyB = value;
	}

	public set clobLazyA(value: LazyRefPrp<StringStream>) {
		this._clobLazyA = value;
	}

	public set clobLazyB(value: LazyRefPrp<StringStream>) {
		this._clobLazyB = value;
	}

}