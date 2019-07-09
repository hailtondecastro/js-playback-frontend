import { DetailAEnt } from './detail-a-ent';
import { LazyRefPrp, StringStreamMarker, LazyRefPrpMarker, StringStream } from '../../src/lazy-ref';
import { NgJsHbDecorators } from '../../src/js-hb-decorators';
import { LazyRefOTM, LazyRef } from '../../src/lazy-ref';
import { GenericTokenizer, GenericNodeNotNow } from '../../src/generic-tokenizer';
import { Stream } from 'stream';
import { ReadLine } from 'readline';

@NgJsHbDecorators.clazz({javaClass: 'br.gov.serpro.webanalise.jsHbSuperSync.entities.MasterAEnt'})
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

	@NgJsHbDecorators.property()
	public get id(): number {
		return this._id;
	}

	@NgJsHbDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	@NgJsHbDecorators.property()
	public get vcharB(): string {
		return this._vcharB;
	}

	@NgJsHbDecorators.property()
	public get dateA(): Date {
		return this._dateA;
	}

	@NgJsHbDecorators.property()
	public get datetimeA(): Date {
		return this._datetimeA;
	}

	@NgJsHbDecorators.property()
	public get blobA(): Buffer {
		return this._blobA;
	}

	@NgJsHbDecorators.property()
	public get blobB(): Buffer {
		return this._blobB;
	}

	@NgJsHbDecorators.property()
	public get hbVersion(): number {
		return this._hbVersion;
	}

	@NgJsHbDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(Set).lt().tp(DetailAEnt).gt().gt().tree))
	public get detailAEntCol(): LazyRefOTM<Set<DetailAEnt>> {
		return this._detailAEntCol;
	}

	@NgJsHbDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(Stream).gt().tree))
	public get blobLazyA(): LazyRefPrp<Stream> {
		return this._blobLazyA;
	}

	@NgJsHbDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(Stream).gt().tree))
	public get blobLazyB(): LazyRefPrp<Stream> {
		return this._blobLazyB;
	}

	@NgJsHbDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefPrpMarker).lt().tp(StringStreamMarker).gt().tree))
	public get clobLazyA(): LazyRefPrp<StringStream> {
		return this._clobLazyA;
    }
    
	@NgJsHbDecorators.property({lazyDirectRawWrite: true, lazyDirectRawRead: true, persistent: true})
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