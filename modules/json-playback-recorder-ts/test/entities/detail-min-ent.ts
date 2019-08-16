import { MasterAEnt } from './master-a-ent';
import { LazyRefMTO, LazyRef, BinaryStream, BinaryStreamMarker } from '../../src/api/lazy-ref';
import { RecorderDecorators } from '../../src/api/recorder-decorators';
import { GenericNodeNotNow, GenericTokenizer } from '../../src/api/generic-tokenizer';
import { MasterMinEnt } from './master-min-ent';
import { MasterBMinEnt, MasterBMinCompId } from './master-b-min-ent';

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailACompComp'})
export class DetailMinCompComp {
	private _masterB: LazyRefMTO<MasterBMinEnt, MasterBMinCompId>;

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterBMinEnt).comma().tp(MasterBMinCompId).gt().tree))
	public get masterB(): LazyRefMTO<MasterBMinEnt, MasterBMinCompId> {
		return this._masterB;
	}

	public set masterB(value: LazyRefMTO<MasterBMinEnt, MasterBMinCompId>) {
		this._masterB = value;
	}
}

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailAComp'})
export class DetailMinComp {
	private _masterB: LazyRefMTO<MasterBMinEnt, MasterBMinCompId>;
	private _detailACompComp: DetailMinCompComp;
	// private _vcharA: string;
	// private _vcharB: string;
	// private _blobA: BinaryStream;
	// private _blobB: BinaryStream;

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterBMinEnt).comma().tp(MasterBMinCompId).gt().tree))
	public get masterB(): LazyRefMTO<MasterBMinEnt, MasterBMinCompId> {
		return this._masterB;
	}

	public set masterB(value: LazyRefMTO<MasterBMinEnt, MasterBMinCompId>) {
		this._masterB = value;
	}
	
	@RecorderDecorators.property()
	public get detailACompComp(): DetailMinCompComp {
		return this._detailACompComp;
	}

	public set detailACompComp(value: DetailMinCompComp) {
		this._detailACompComp = value;
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
	// @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(BinaryStreamMarker).tree))
	// public get blobA(): BinaryStream {
	// 	return this._blobA;
    //  }
     
	// public set blobA(value: BinaryStream) {
	// 	this._blobA = value;
	// }
	
	// @RecorderDecorators.property()
	// @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(BinaryStreamMarker).tree))
	// public get blobB(): BinaryStream {
	// 	return this._blobB;
	// }

	// public set blobB(value: BinaryStream) {
	// 	this._blobB = value;
	// }
}

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailACompId'})
export class DetailMinCompId {
    private _masterA: LazyRefMTO<MasterMinEnt, number>;
    //private _subId: number;

	@RecorderDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterAEnt).comma().tp(Number).gt().tree))
	public get masterA(): LazyRefMTO<MasterMinEnt, number> {
		return this._masterA;
	}

	public set masterA(value: LazyRefMTO<MasterMinEnt, number>) {
		this._masterA = value;
	}

	// @RecorderDecorators.property()
	// public get subId(): number {
	// 	return this._subId;
	// }

	// public set subId(value: number) {
	// 	this._subId = value;
	// }
    
}

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.entities.DetailAEnt'})
export class DetailMinEnt {
    private _compId: DetailMinCompId;
    // private _vcharA: string;
    // private _vcharB: string;
	// private _hbVersion: number;
    private _detailAComp: DetailMinComp;
	
	@RecorderDecorators.property()
	@RecorderDecorators.playerObjectId()
	public get compId(): DetailMinCompId {
		return this._compId;
	}

	public set compId(value: DetailMinCompId) {
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
	// public get hbVersion(): number {
	// 	return this._hbVersion;
	// }

	// public set hbVersion(value: number) {
	// 	this._hbVersion = value;
	// }

	@RecorderDecorators.property()
	public get detailAComp(): DetailMinComp {
		return this._detailAComp;
	}

	public set detailAComp(value: DetailMinComp) {
		this._detailAComp = value;
	}
}