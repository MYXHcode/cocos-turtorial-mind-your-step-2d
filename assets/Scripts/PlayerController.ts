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
    sys,
} from "cc";
const { ccclass, property } = _decorator;

/**
 * @description 添加一个放大比
 */
export const BLOCK_SIZE = 40;

/**
 * @description 输入类型
 */
enum InputType {
    /**
     * @description 键鼠
     */
    KEYBOARD_AND_MOUSE = "KeyboardAndMouse",

    /**
     * @description 触摸
     */
    TOUCH = "Touch",
}

@ccclass("PlayerController")
export class PlayerController extends Component {
    /**
     * @description 身体动画
     */
    @property(Animation)
    public BodyAnim: Animation = null;

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
     * @description 当前移动速度
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
     * @description 输入类型
     */
    public inputType: InputType = null;

    /**
     * @description 左侧触摸点
     */
    @property(Node)
    public leftTouch: Node = null;

    /**
     * @description 右侧触摸点
     */
    @property(Node)
    public rightTouch: Node = null;

    /**
     * @description 开始
     * @returns void
     */
    start() {
        // 检测输入类型
        this.inputType = this.checkInputType();
    }

    /**
     * @description 检测输入类型
     * @returns 输入类型
     */
    checkInputType(): InputType {
        // 获取操作系统
        const os = sys.os;

        // 检测是否为移动端
        const isMobile =
            os === sys.OS.ANDROID ||
            os === sys.OS.IOS ||
            os === sys.OS.OHOS ||
            os === sys.OS.OPENHARMONY;

        // 检测是否为PC端
        const isPC =
            os === sys.OS.WINDOWS || os === sys.OS.LINUX || os === sys.OS.OSX;

        if (isMobile) {
            // 如果是移动端，返回触摸输入
            return InputType.TOUCH;
        } else if (isPC) {
            // 如果是PC端，返回键鼠输入
            return InputType.KEYBOARD_AND_MOUSE;
        }
    }

    /**
     * @description 设置输入是否激活
     * @param active 是否激活
     * @param inputType 输入类型
     * @returns void
     */
    setInputActive(active: boolean, inputType: InputType) {
        if (active) {
            if (inputType === InputType.KEYBOARD_AND_MOUSE) {
                // 添加鼠标事件监听
                input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            } else if (inputType === InputType.TOUCH) {
                // 添加触摸事件监听
                      this.leftTouch.on(
                          Input.EventType.TOUCH_START,
                          this.onTouchStart,
                          this
                      );
                      this.rightTouch.on(
                          Input.EventType.TOUCH_START,
                          this.onTouchStart,
                          this
                      );
            }
        } else {
            // 移除事件监听
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
             this.leftTouch.off(
                 Input.EventType.TOUCH_START,
                 this.onTouchStart,
                 this
             );
             this.rightTouch.off(
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
        // 重置当前移动的索引
        this._curMoveIndex = 0;

        // 获取当前的位置
        this.node.getPosition(this._curPos);

        // 重置目标位置
        this._targetPos.set(0, 0, 0);
    }

    /**
     * @description 鼠标抬起事件
     * @param event 鼠标事件
     * @returns void
     */
    onMouseUp(event: EventMouse) {
        // 0：左键，1：中键，2：右键
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
        // 获取当前触摸的目标节点
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

        // 标记开始跳跃
        this._startJump = true;

        // 跳跃的步数 1 或者 2
        this._jumpStep = step;

        // 重置开始跳跃的时间
        this._curJumpTime = 0;

        // 根据步数选择动画
        const clipName = step === 1 ? "oneStep" : "twoStep";

        // 检查当前对象的 BodyAnim 属性是否存在
        if (!this.BodyAnim) {
            // 如果 BodyAnim 不存在，则直接返回，不执行后续代码
            return;
        }

        // 获取动画状态
        const state = this.BodyAnim.getState(clipName);

        // 获取动画的时间
        this._jumpTime = state.duration;

        // 根据时间计算出速度
        this._curJumpSpeed = (this._jumpStep * BLOCK_SIZE) / this._jumpTime;

        // 获取角色当前的位置
        this.node.getPosition(this._curPos);

        // 计算出目标位置
        Vec3.add(
            this._targetPos,
            this._curPos,
            new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0)
        );

        // 播放动画
        if (step === 1) {
            // 调用 BodyAnim 的 play 方法，播放名为 "oneStep" 的动画
            this.BodyAnim.play("oneStep");
        } else if (step === 2) {
            // 否则如果 step 等于 2
            // 调用 BodyAnim 的 play 方法，播放名为 "twoStep" 的动画
            this.BodyAnim.play("twoStep");
        }

        // 更新当前移动的索引
        this._curMoveIndex += step;
    }

    /**
     * @description 跳跃结束事件
     * @returns void
     */
    onOnceJumpEnd() {
        // 触发跳跃结束事件
        this.node.emit("JumpEnd", this._curMoveIndex);
    }

    /**
     * @description 更新
     * @param deltaTime 时间间隔
     * @returns void
     */
    update(deltaTime: number) {
        if (this._startJump) {
            // 累计总的跳跃时间
            this._curJumpTime += deltaTime;
            if (this._curJumpTime > this._jumpTime) {
                // 当跳跃时间是否结束
                // 如果结束，强制位置到终点
                this.node.setPosition(this._targetPos);

                // 清理跳跃标记
                this._startJump = false;

                // 调用跳跃结束事件
                this.onOnceJumpEnd();
            } else {
                // 没有结束，根据速度和时间计算位移
                this.node.getPosition(this._curPos);

                //每一帧根据速度和时间计算位移
                this._deltaPos.x = this._curJumpSpeed * deltaTime;

                // 应用这个位移
                Vec3.add(this._curPos, this._curPos, this._deltaPos);

                // 将位移设置给角色
                this.node.setPosition(this._curPos);
            }
        }
    }
}
