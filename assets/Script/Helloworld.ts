import BaseNode from "./base/BaseNode";
import Line from "./base/Line";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(cc.Camera)
    MainCamera: cc.Camera = null;

    @property(cc.Node)
    Background: cc.Node = null;

    @property(cc.Node)
    MainNode: cc.Node = null;

    @property(cc.Node)
    ContentNode: cc.Node = null;

    @property(cc.Prefab)
    PositionPre: cc.Prefab = null;

    @property(cc.Prefab)
    StartPre: cc.Prefab = null;

    @property(cc.Prefab)
    LinePrefab: cc.Prefab = null;

    zIndex = 0;

    LineNodeListInfo = {};
    toList: Array<cc.Vec2> = [];
    fromList: Array<cc.Vec2> = [];

    touchType: boolean = true;

    toFromInfo = {};
    bindInfo = []
    NodeList = {};

    onLoad() {
        this.initView();
        this.initEvent();
    }

    initView() {
        /**创建矢量幕布 */
        this.addEvent(this.MainNode);

        let item = cc.instantiate(this.StartPre);
        item.position = cc.v3(200, 100);
        item.parent = this.ContentNode;
        let uuid = item.getComponent(BaseNode).getUuid();
        this.NodeList[uuid] = item;
        this.addEvent(item);
    }

    initEvent() {
        this.ContentNode.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.ContentNode.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        // this.ContentNode.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.ContentNode.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);

        this.node.on("LineCreate", this.createLine, this);
        this.node.on("LineMove", this.moveLine, this);
        this.node.on("LineEnd", this.endLine, this);
        this.node.on("toFromInfo", this.toFromLogic, this);
        this.node.on("LineUnbind", this.unBindLine, this);

        this.node.on("tweenData", this.receiveTweenData, this);
        this.node.on("tweenStart", this.tweenStart, this);
    }

    /**解除绑定 */
    unBindLine(e) {
          //目标节点的uuid, 
          let { tarUuid, tweenData } = e.getUserData();
    }

    receiveTweenData(e) {
        //目标节点的uuid, 
        let { tarUuid, tweenData } = e.getUserData();

        let item = this.NodeList[tarUuid];
        if (!item) {
            cc.log("error, tarUuid not found");
            return;
        }
        item.getComponent(BaseNode).receiveData(tweenData);
    }

    tweenStart(e) {
        let { tarUuid, tweenData } = e.getUserData();
        tweenData = tweenData as cc.Tween;
        cc.log(tweenData);
        tweenData
            .target(this.MainNode)
            .start();
        // cc.log("run")
        // cc.tween()
        //     .target(this.MainNode)
        //     .to(0.5, { position: cc.v2(200, 200) })
        //     .start();
    }

    toFromLogic(e) {
        let { uuid, toPos, fromPos } = e.getUserData();
        this.toFromInfo[uuid] = {
            uuid, toPos, fromPos
        }

        /**更新链接 */
        for (let i = 0; i < this.bindInfo.length; i++) {
            const info = this.bindInfo[i];
            if (info.uuid_to === uuid) {
                let pos1 = this.ContentNode.convertToNodeSpaceAR(toPos);
                let pos2 = this.toFromInfo[info.uuid_from].fromPos; //获取另一个点的位置并更新
                pos2 = this.ContentNode.convertToNodeSpaceAR(pos2);
                this.LineNodeListInfo[uuid].getComponent(Line).touchStart(pos1);
                this.LineNodeListInfo[uuid].getComponent(Line).touchEnd(true, pos2);
            }

            if (info.uuid_from === uuid) {
                let pos3 = this.toFromInfo[info.uuid_to].toPos;
                pos3 = this.ContentNode.convertToNodeSpaceAR(pos3);
                let pos4 = this.ContentNode.convertToNodeSpaceAR(fromPos);
                this.LineNodeListInfo[info.uuid_to].getComponent(Line).touchStart(pos3);
                this.LineNodeListInfo[info.uuid_to].getComponent(Line).touchEnd(true, pos4);
            }
        }
    }

    /**创建线条 */
    createLine(e) {
        let { uuid, pos } = e.getUserData();
        pos = this.ContentNode.convertToNodeSpaceAR(pos);
        let LineNode = cc.instantiate(this.LinePrefab);
        LineNode.getComponent(Line).touchStart(pos);
        LineNode.parent = this.ContentNode;
        this.LineNodeListInfo[uuid] = LineNode;
    }

    moveLine(e) {
        let { uuid, pos } = e.getUserData();
        pos = this.ContentNode.convertToNodeSpaceAR(pos);
        this.LineNodeListInfo[uuid].getComponent(Line).touchMove(pos);
    }

    endLine(e) {
        let { uuid, pos, hook_cb } = e.getUserData();
        //判断是否在某个区域内
        let { flag, tarPos, tarUuid } = this.isContains(uuid, pos);
        if (flag) {
            tarPos = this.ContentNode.convertToNodeSpaceAR(tarPos);
        }
        this.LineNodeListInfo[uuid].getComponent(Line).touchEnd(flag, tarPos);
        hook_cb & hook_cb(flag, tarUuid);

        //TODO 
        this.toFromInfo[tarUuid].getComponent(Line).bindUuid(uuid);
    }

    isContains(uuid: string, pos: cc.Vec2) {
        let keys = Object.keys(this.toFromInfo);
        for (const key in keys) {
            if (Object.prototype.hasOwnProperty.call(this.toFromInfo, keys[key])) {
                const info = this.toFromInfo[keys[key]];
                if (info.uuid === uuid) {
                    continue;
                };
                let rect = cc.rect(info.fromPos.x - 10, info.fromPos.y - 10, 20, 20);
                if (rect.contains(pos)) {
                    this.bindInfo.push({
                        uuid_to: uuid,
                        uuid_from: info.uuid,
                    });
                    return { flag: true, tarPos: info.fromPos, tarUuid: info.uuid };
                }
            }
        }
        return { flag: false };
    }

    onMouseDown(event) {
        event.stopPropagation();
        if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
            this.touchType = true;
        }
    }


    addZoomRatio() {
        this.MainCamera.zoomRatio += 0.02;
        if (this.MainCamera.zoomRatio > 1.5) {
            this.MainCamera.zoomRatio = 1.5;
        }
    }

    subZoomRatio() {
        this.MainCamera.zoomRatio -= 0.02;
        if (this.MainCamera.zoomRatio < 0.5) {
            this.MainCamera.zoomRatio = 0.5
        }
    }

    onMouseWheel(event) {
        let y = event.getScrollY();
        if (y > 0) {
            this.MainCamera.zoomRatio += 0.02;
        } else {
            this.MainCamera.zoomRatio -= 0.02;
        }

        if (this.MainCamera.zoomRatio < 0.5) {
            this.MainCamera.zoomRatio = 0.5
        }
        if (this.MainCamera.zoomRatio > 1.5) {
            this.MainCamera.zoomRatio = 1.5;
        }
        cc.log(this.MainCamera.zoomRatio);
    }

    onMouseUp(event) {
        event.stopPropagation();
        if (this.touchType && event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
            let pos = event.getLocation();
            pos = this.ContentNode.convertToNodeSpaceAR(pos);
            let item = cc.instantiate(this.PositionPre);
            item.position = pos;
            item.parent = this.ContentNode;
            let uuid = item.getComponent(BaseNode).getUuid();
            this.NodeList[uuid] = item;
            this.addEvent(item);
        }
    }

    /**
     * baseNode的事件未被拦截
     * 因为baseNode移动后 会触发 mouse 的up down 事件,而且无法判断
     * 那就让baseNode的事件透传过来, 然后定义一个isBaseTouchMove标识 是经由baseNode传递过来的
     * 这里就可以修改touchType 来判断是否是移动背景还是生成 
     * 三个事件互不影响
     * @param event 
     */
    touchMove(event: cc.Event.EventTouch) {
        event.stopPropagation();
        let x = event.getDeltaX();
        let y = event.getDeltaY();
        if (event['isBaseTouchMove']) { //是baseNode的移动事件,不需要处理
            return this.touchType = false;
        }
        if (event.getDelta().mag() > 10) {
            this.touchType = false;
        }
        this.updateToFromPos(x, y);
        this.ContentNode.x += x;
        this.ContentNode.y += y;
        if (this.ContentNode.x > 4000) {
            this.ContentNode.x = 4000;
        }
        if (this.ContentNode.x < -4000) {
            this.ContentNode.x = -4000;
        }
        if (this.ContentNode.y > 4000) {
            this.ContentNode.y = 4000;
        }
        if (this.ContentNode.y < -4000) {
            this.ContentNode.y = -4000;
        }
    }

    /**背景位置变动后,更新所有世界坐标 */
    updateToFromPos(x, y) {
        let keys = Object.keys(this.toFromInfo);
        for (const key in keys) {
            if (Object.prototype.hasOwnProperty.call(this.toFromInfo, keys[key])) {
                let info = this.toFromInfo[keys[key]];
                if (info.toPos) {
                    info.toPos.addSelf(cc.v2(x, y));
                }
                if (info.fromPos) {
                    info.fromPos.addSelf(cc.v2(x, y));
                }
            }
        }
    }

    addEvent(node) {
        node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
            node.zIndex = ++this.zIndex;
        }, this)
    }

    startTween() {
        let t1 = this.opacityTween();
        let t2 = this.scaleTween();

        let tween = cc.tween()
            .target(this.MainNode)
            .parallel(
                t1,
                t2
            )
        return tween.start();
    }

    opacityTween() {
        return cc.tween().to(0.5, {
            opacity: 0
        })
    }

    scaleTween() {
        return cc.tween().to(0.5, {
            scale: 2
        })
    }
}
