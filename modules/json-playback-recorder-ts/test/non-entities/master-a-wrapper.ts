import { MasterAEnt } from "../entities/master-a-ent";
import { RecorderDecorators } from "../../src/api/recorder-decorators";
import { DetailAWrapper } from "./detail-a-wrapper";
import { GenericNodeNotNow } from "../../src/api/generic-tokenizer";
import { GenericTokenizer } from "../../src/api/generic-tokenizer";
import { DetailAEnt } from "../entities/detail-a-ent";

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.nonentities.MasterAWrapper'})
export class MasterAWrapper {
    private _masterA: MasterAEnt;
    private _detailAWrapperList: Set<DetailAWrapper>;
    private _detailAEntCol: Set<DetailAEnt>;

    @RecorderDecorators.property()
    @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(Set).lt().tp(DetailAEnt).gt().tree))
	public get detailAEntCol(): Set<DetailAEnt> {
		return this._detailAEntCol;
	}

	public set detailAEntCol(value: Set<DetailAEnt>) {
		this._detailAEntCol = value;
	}

    @RecorderDecorators.property()
    @Reflect.metadata('design:generics', new GenericNodeNotNow(() => GenericTokenizer.create().tp(Set).lt().tp(DetailAWrapper).gt().tree))
	public get detailAWrapperList(): Set<DetailAWrapper> {
		return this._detailAWrapperList;
	}

	public set detailAWrapperList(value: Set<DetailAWrapper>) {
		this._detailAWrapperList = value;
	}

	@RecorderDecorators.property()
	public get masterA(): MasterAEnt {
		return this._masterA;
	}

	public set masterA(value: MasterAEnt) {
		this._masterA = value;
	}

}