import { DetailAEnt } from "../entities/detail-a-ent";
import { RecorderDecorators } from "../../src/api/recorder-decorators";

@RecorderDecorators.playerType({playerType: 'org.jsonplayback.player.hibernate.nonentities.DetailAWrapper'})
export class DetailAWrapper {
    private _detailA: DetailAEnt;

    @RecorderDecorators.property()
	public get detailA(): DetailAEnt {
		return this._detailA;
	}

	public set detailA(value: DetailAEnt) {
		this._detailA = value;
	}
}