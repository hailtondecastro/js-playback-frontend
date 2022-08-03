import { MasterBEnt, MasterBCompId } from './master-b-ent';
import { MasterAEnt } from './master-a-ent';
import { LazyRefMTO, LazyRefMTOMarker, BinaryBlobOrStream, BinaryBlobOrStreamMarker } from '../../src/api/lazy-ref';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailACompComp'})
export class DetailACompComp {
    private _masterB: LazyRefMTO<MasterBEnt, MasterBCompId>;

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefMTOMarker).lt().tp(MasterBEnt).comma().tp(MasterBCompId).gt().tree))
	public get masterB(): LazyRefMTO<MasterBEnt, MasterBCompId> {
		return this._masterB;
	}

	public set masterB(value: LazyRefMTO<MasterBEnt, MasterBCompId>) {
		this._masterB = value;
	}

}

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailAComp'})
export class DetailAComp {
    private _masterB: LazyRefMTO<MasterBEnt, MasterBCompId>;
    private _detailACompComp: DetailACompComp;
    private _vcharA: string;
    private _vcharB: string;
    private _blobA: BinaryBlobOrStream;
    private _blobB: BinaryBlobOrStream;

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefMTOMarker).lt().tp(MasterBEnt).comma().tp(MasterBCompId).gt().tree))
	public get masterB(): LazyRefMTO<MasterBEnt, MasterBCompId> {
		return this._masterB;
	}

	public set masterB(value: LazyRefMTO<MasterBEnt, MasterBCompId>) {
		this._masterB = value;
	}
    
	@RecorderDecorators.property()
	public get detailACompComp(): DetailACompComp {
		return this._detailACompComp;
	}

	public set detailACompComp(value: DetailACompComp) {
		this._detailACompComp = value;
	}

	@RecorderDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	public set vcharA(value: string) {
		this._vcharA = value;
	}

	@RecorderDecorators.property()
	public get vcharB(): string {
		return this._vcharB;
	}

	public set vcharB(value: string) {
		this._vcharB = value;
    }

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(BinaryBlobOrStreamMarker).tree))
	public get blobA(): BinaryBlobOrStream {
		return this._blobA;
     }
     
	public set blobA(value: BinaryBlobOrStream) {
		this._blobA = value;
	}

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(BinaryBlobOrStreamMarker).tree))
	public get blobB(): BinaryBlobOrStream {
		return this._blobB;
	}

	public set blobB(value: BinaryBlobOrStream) {
		this._blobB = value;
	}

}

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailACompId'})
export class DetailACompId {
    private _masterA: LazyRefMTO<MasterAEnt, number>;
    private _subId: number;

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRefMTOMarker).lt().tp(MasterAEnt).comma().tp(Number).gt().tree))
	public get masterA(): LazyRefMTO<MasterAEnt, number> {
		return this._masterA;
	}

	public set masterA(value: LazyRefMTO<MasterAEnt, number>) {
		this._masterA = value;
	}
	
	@RecorderDecorators.property()
	public get subId(): number {
		return this._subId;
	}

	public set subId(value: number) {
		this._subId = value;
	}
    
}

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailAEnt'})
export class DetailAEnt {
    private _compId: DetailACompId;
    private _vcharA: string;
    private _vcharB: string;
    private _hbVersion: number;
    private _detailAComp: DetailAComp;

	@RecorderDecorators.property()
	@RecorderDecorators.playerObjectId()
	public get compId(): DetailACompId {
		return this._compId;
	}

	public set compId(value: DetailACompId) {
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
	public get vcharB(): string {
		return this._vcharB;
	}

	public set vcharB(value: string) {
		this._vcharB = value;
	}

	@RecorderDecorators.property()
	public get hbVersion(): number {
		return this._hbVersion;
	}

	public set hbVersion(value: number) {
		this._hbVersion = value;
	}

	@RecorderDecorators.property()
	public get detailAComp(): DetailAComp {
		return this._detailAComp;
	}

	public set detailAComp(value: DetailAComp) {
		this._detailAComp = value;
	}
    
}