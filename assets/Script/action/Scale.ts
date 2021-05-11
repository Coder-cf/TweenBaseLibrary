import BaseTween from "../base/BaseTween";
import { TweenFlag, TweenType } from "../base/Config";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Scale extends BaseTween {

    @property(cc.EditBox)
    tEdit: cc.EditBox = null;

    @property(cc.EditBox)
    xEdit: cc.EditBox = null;

    @property(cc.EditBox)
    yEdit: cc.EditBox = null;

    x: number = 0.2;
    y: number = 0.2;

    _receiveTween = null;

    onLoad() {
        this.time = 1;
        this._tweenType = TweenType.SCALE;

        this.tEdit.string = this.time + "";
        this.xEdit.string = this.x + "";
        this.yEdit.string = this.y + "";
    }

    onChangeEnd(event, data) {
        switch (data) {
            case "x":
                this.x = Number(event.string);
                break;
            case "y":
                this.y = Number(event.string);
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
                scaleX: this.x,
                scaleY: this.y,
            })
        } else {
            tween.by(this.time, {
                scaleX: this.x,
                scaleY: this.y,
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
                scaleX: this.x, scaleY: this.y
            }
        })
    }
}
