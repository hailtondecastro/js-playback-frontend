import { MasterBEnt, MasterBCompId } from './master-b-ent';
import { MasterAEnt } from './master-a-ent';
import { LazyRefMTO, LazyRef } from '../../src/lazy-ref';
import { NgJsHbDecorators } from '../../src/js-hb-decorators';
import { GenericTokenizer, GenericNodeNotNow } from '../../src/generic-tokenizer';
import { Stream } from 'stream';

@NgJsHbDecorators.clazz({javaClass: 'br.gov.serpro.webanalise.jsHbSuperSync.entities.DetailACompComp'})
export class DetailACompComp {
    private _masterB: LazyRefMTO<MasterBEnt, MasterBCompId>;

    /**
     * Getter masterB
     * @return {LazyRefMTO<MasterBEnt, MasterBCompId>}
     */
	@NgJsHbDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterBEnt).comma().tp(MasterBCompId).gt().tree))
	public get masterB(): LazyRefMTO<MasterBEnt, MasterBCompId> {
		return this._masterB;
	}

    /**
     * Setter masterB
     * @param {LazyRefMTO<MasterBEnt, MasterBCompId>} value
     */
	public set masterB(value: LazyRefMTO<MasterBEnt, MasterBCompId>) {
		this._masterB = value;
	}

}

@NgJsHbDecorators.clazz({javaClass: 'br.gov.serpro.webanalise.jsHbSuperSync.entities.DetailAComp'})
export class DetailAComp {
    private _masterB: LazyRefMTO<MasterBEnt, MasterBCompId>;
    private _detailACompComp: DetailACompComp;
    private _subIdB: number;
    private _vcharA: string;
    private _vcharB: string;
    private _blobA: Stream;
    private _blobB: Stream;

	@NgJsHbDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterBEnt).comma().tp(MasterBCompId).gt().tree))
	public get masterB(): LazyRefMTO<MasterBEnt, MasterBCompId> {
		return this._masterB;
	}

	public set masterB(value: LazyRefMTO<MasterBEnt, MasterBCompId>) {
		this._masterB = value;
	}
    
	@NgJsHbDecorators.property()
	public get detailACompComp(): DetailACompComp {
		return this._detailACompComp;
	}

	public set detailACompComp(value: DetailACompComp) {
		this._detailACompComp = value;
	}

	@NgJsHbDecorators.property()
	public get subIdB(): number {
		return this._subIdB;
	}

	public set subIdB(value: number) {
		this._subIdB = value;
	}

	@NgJsHbDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

	public set vcharA(value: string) {
		this._vcharA = value;
	}

	@NgJsHbDecorators.property()
	public get vcharB(): string {
		return this._vcharB;
	}

	public set vcharB(value: string) {
		this._vcharB = value;
    }

	@NgJsHbDecorators.property()
	public get blobA(): Stream {
		return this._blobA;
     }
     
	public set blobA(value: Stream) {
		this._blobA = value;
	}

	@NgJsHbDecorators.property()
	public get blobB(): Stream {
		return this._blobB;
	}

	public set blobB(value: Stream) {
		this._blobB = value;
	}

}

@NgJsHbDecorators.clazz({javaClass: 'br.gov.serpro.webanalise.jsHbSuperSync.entities.DetailACompId'})
export class DetailACompId {
    private _masterA: LazyRefMTO<MasterAEnt, number>;
    private _subId: number;


    /**
     * Getter masterA
     * @return {LazyRefMTO<MasterAEnt, number>}
     */
	@NgJsHbDecorators.property()
	@Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(LazyRef).lt().tp(MasterAEnt).comma().tp(Number).gt().tree))
	public get masterA(): LazyRefMTO<MasterAEnt, number> {
		return this._masterA;
	}

    /**
     * Setter masterA
     * @param {LazyRefMTO<MasterAEnt, number>} value
     */
	public set masterA(value: LazyRefMTO<MasterAEnt, number>) {
		this._masterA = value;
	}

    /**
     * Getter subId
     * @return {number}
     */
	@NgJsHbDecorators.property()
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

@NgJsHbDecorators.clazz({javaClass: 'br.gov.serpro.webanalise.jsHbSuperSync.entities.DetailAEnt'})
export class DetailAEnt {
    private _compId: DetailACompId;
    private _vcharA: string;
    private _vcharB: string;
    private _hbVersion: number;
    private _detailAComp: DetailAComp;


    /**
     * Getter compId
     * @return {DetailACompId}
     */
	@NgJsHbDecorators.property()
	public get compId(): DetailACompId {
		return this._compId;
	}

    /**
     * Setter compId
     * @param {DetailACompId} value
     */
	public set compId(value: DetailACompId) {
		this._compId = value;
	}

    /**
     * Getter vcharA
     * @return {string}
     */
	@NgJsHbDecorators.property()
	public get vcharA(): string {
		return this._vcharA;
	}

    /**
     * Setter vcharA
     * @param {string} value
     */
	public set vcharA(value: string) {
		this._vcharA = value;
	}

    /**
     * Getter vcharB
     * @return {string}
     */
	@NgJsHbDecorators.property()
	public get vcharB(): string {
		return this._vcharB;
	}

    /**
     * Setter vcharB
     * @param {string} value
     */
	public set vcharB(value: string) {
		this._vcharB = value;
	}

    /**
     * Getter hbVersion
     * @return {number}
     */
	@NgJsHbDecorators.property()
	public get hbVersion(): number {
		return this._hbVersion;
	}

    /**
     * Setter hbVersion
     * @param {number} value
     */
	public set hbVersion(value: number) {
		this._hbVersion = value;
	}

    /**
     * Getter detailAComp
     * @return {DetailAComp}
     */
	@NgJsHbDecorators.property()
	public get detailAComp(): DetailAComp {
		return this._detailAComp;
	}

    /**
     * Setter detailAComp
     * @param {DetailAComp} value
     */
	public set detailAComp(value: DetailAComp) {
		this._detailAComp = value;
	}
    
}