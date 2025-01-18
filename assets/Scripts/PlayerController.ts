/**
 * @author MYXH <1735350920@qq.com>
 * @license GNU GPL v3
 * @version 0.0.1
 * @date 2024-12-30
 * @description 玩家控制器
 */

import {
    _decorator,
    Component,
    Vec3,
    EventMouse,
    input,
    Input,
    Animation,
    EventTouch,
    Node,
} from "cc";
const { ccclass, property } = _decorator;

/**
 * @description 添加一个放大比
 */
export const BLOCK_SIZE = 40;

@ccclass("PlayerController")
export class PlayerController extends Component {
    /**
     * @description 身体动画
     */
    @property(Animation)
    BodyAnim: Animation = null;

    /**
     * @description 是否开始跳跃
     */
    private _startJump: boolean = false;

    /**
     * @description 跳跃步数：一步或者两步
     */
    private _jumpStep: number = 0;

    /**
     * @description 当前跳跃时间
     */
    private _curJumpTime: number = 0;

    /**
     * @description 跳跃时间
     */
    private _jumpTime: number = 0.1;

    /**
     * @description 移动速度
     */
    private _curJumpSpeed: number = 0;

    /**
     * @description 当前的位置
     */
    private _curPos: Vec3 = new Vec3();

    /**
     * @description 位移
     */
    private _deltaPos: Vec3 = new Vec3(0, 0, 0);

    /**
     * @description 目标位置
     */
    private _targetPos: Vec3 = new Vec3();

    /**
     * @description 当前移动的索引
     */
    private _curMoveIndex: number = 0;

    /**
     * @description 左侧触摸点
     */
    @property(Node)
    leftTouch: Node = null;

    /**
     * @description 右侧触摸点
     */
    @property(Node)
    rightTouch: Node = null;

    /**
     * @description 开始
     * @returns void
     */
    start() {
        // 不需要在 start 方法中调用 input.on 方法，而是在 setInputActive 方法中调用 input.on 方法，这样可以更灵活地控制输入是否激活
        // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        // 不需要在 start 方法中调用 this.leftTouch.on 和 this.rightTouch.on 方法，而是在 setInputActive 方法中调用 this.leftTouch.on 和 this.rightTouch.on 方法，这样可以更灵活地控制输入是否激活
        // this.leftTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        // this.rightTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    /**
     * @description 设置输入是否激活
     * @param active 是否激活
     * @returns void
     */
    setInputActive(active: boolean) {
        if (active) {
            // 如果 active 为 true，则调用 input.on 方法，监听鼠标抬起事件
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

            // 如果 active 为 true，则调用 this.leftTouch.on 和 this.rightTouch.on 方法，监听触摸事件
            this.leftTouch?.on(
                Input.EventType.TOUCH_START,
                this.onTouchStart,
                this
            );
            this.rightTouch?.on(
                Input.EventType.TOUCH_START,
                this.onTouchStart,
                this
            );
        } else {
            // 如果 active 为 false，则调用 input.off 方法，取消监听鼠标抬起事件
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);

            // 如果 active 为 false，则调用 this.leftTouch.off 和 this.rightTouch.off 方法，取消监听触摸事件
            this.leftTouch?.off(
                Input.EventType.TOUCH_START,
                this.onTouchStart,
                this
            );
            this.rightTouch?.off(
                Input.EventType.TOUCH_START,
                this.onTouchStart,
                this
            );
        }
    }

    /**
     * @description 重置
     * @returns void
     */
    reset() {
        this._curMoveIndex = 0; // 重置当前移动的索引
        this.node.getPosition(this._curPos); // 获取当前的位置
        this._targetPos.set(0, 0, 0); // 重置目标位置
    }

    /**
     * @description 鼠标抬起事件
     * @param event 鼠标事件
     * @returns void
     */
    onMouseUp(event: EventMouse) {
        if (event.getButton() === 0) {
            this.jumpByStep(1);
        } else if (event.getButton() === 2) {
            this.jumpByStep(2);
        }
    }

    /**
     * @description 触摸开始事件
     * @param event 触摸事件
     */
    onTouchStart(event: EventTouch) {
        const target = event.target as Node;

        if (target?.name === "LeftTouch") {
            this.jumpByStep(1);
        } else if (target?.name === "RightTouch") {
            this.jumpByStep(2);
        }
    }

    /**
     * @description 跳跃
     * @param step 跳跃的步数 1 或者 2
     * @returns void
     */
    jumpByStep(step: number) {
        if (this._startJump) {
            return;
        }

        this._startJump = true; // 标记开始跳跃
        this._jumpStep = step; // 跳跃的步数 1 或者 2
        this._curJumpTime = 0; // 重置开始跳跃的时间

        const clipName = step === 1 ? "oneStep" : "twoStep"; // 根据步数选择动画

        // 检查当前对象的 BodyAnim 属性是否存在
        if (!this.BodyAnim) {
            // 如果 BodyAnim 不存在，则直接返回，不执行后续代码
            return;
        }

        const state = this.BodyAnim.getState(clipName); // 获取动画状态
        this._jumpTime = state.duration; // 获取动画的时间

        this._curJumpSpeed = (this._jumpStep * BLOCK_SIZE) / this._jumpTime; // 根据时间计算出速度
        this.node.getPosition(this._curPos); // 获取角色当前的位置
        Vec3.add(
            this._targetPos,
            this._curPos,
            new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0)
        ); // 计算出目标位置

        // 播放动画
        if (step === 1) {
            // 调用 BodyAnim 的 play 方法，播放名为 "oneStep" 的动画
            this.BodyAnim.play("oneStep");
        } else if (step === 2) {
            // 否则如果 step 等于 2
            // 调用 BodyAnim 的 play 方法，播放名为 "twoStep" 的动画
            this.BodyAnim.play("twoStep");
        }

        this._curMoveIndex += step; // 更新当前移动的索引
    }

    /**
     * @description 跳跃结束事件
     * @returns void
     */
    onOnceJumpEnd() {
        this.node.emit("JumpEnd", this._curMoveIndex); // 触发跳跃结束事件
    }

    /**
     * @description 更新
     * @param deltaTime 时间间隔
     * @returns void
     */
    update(deltaTime: number) {
        if (this._startJump) {
            this._curJumpTime += deltaTime; // 累计总的跳跃时间
            if (this._curJumpTime > this._jumpTime) {
                // 当跳跃时间是否结束
                // 如果结束，强制位置到终点
                this.node.setPosition(this._targetPos); // 强制位置到终点
                this._startJump = false; // 清理跳跃标记
                this.onOnceJumpEnd(); // 调用跳跃结束事件
            } else {
                // 没有结束，根据速度和时间计算位移
                this.node.getPosition(this._curPos);
                this._deltaPos.x = this._curJumpSpeed * deltaTime; //每一帧根据速度和时间计算位移
                Vec3.add(this._curPos, this._curPos, this._deltaPos); // 应用这个位移
                this.node.setPosition(this._curPos); // 将位移设置给角色
            }
        }
    }
}
