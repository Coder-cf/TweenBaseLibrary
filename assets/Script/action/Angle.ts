import BaseTween from "../base/BaseTween";
import { TweenType, TweenFlag } from "../base/Config";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Angle extends BaseTween {

    @property(cc.EditBox)
    tEdit: cc.EditBox = null;

    @property(cc.EditBox)
    aEdit: cc.EditBox = null;

    angle: number = 360;

    _receiveTween = null;

    onLoad() {
        this.time = 1;
        this._tweenType = TweenType.ANGLE;

        this.tEdit.string = this.time + "";
        this.aEdit.string = this.angle + "";
    }

    onChangeEnd(event, data) {
        switch (data) {
            case "a":
                this.angle = Number(event.string);
                break;
            case "t":
                this.time = Number(event.string);
                break;
        }

        this.sendTweenData();
    }

    /**怎么返回tween? */
    returnData() {
        let tween = cc.tween();
        if (this._tweenFlag === TweenFlag.TO) {
            tween.to(this.time, {
                angle: this.angle
            })
        } else {
            tween.by(this.time, {
                angle: this.angle
            })
        }
        this.exportData();
        return tween;
    }

    exportData() {
        Object.assign(this._exportData, {
            easingType: this._easingType,
            tweenFlag: this._tweenFlag,
            tweenType: this._tweenType,
            time: this.time,
            data: {
                angle: this.angle,
            }
        })
    }
}
