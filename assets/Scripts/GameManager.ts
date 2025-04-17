/**
 * @author MYXH <1735350920@qq.com>
 * @license GNU GPL v3
 * @version 0.0.1
 * @date 2025-01-17
 * @description 游戏管理器
 */

import {
    _decorator,
    CCInteger,
    Component,
    instantiate,
    Label,
    Node,
    Prefab,
    Vec3,
} from "cc";
import { BLOCK_SIZE, PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

/**
 * @description 方块类型
 */
enum BlockType {
    /**
     * @description 无
     */
    BT_NONE = "None",

    /**
     * @description 石头
     */
    BT_STONE = "Stone",
}

/**
 * @description 游戏状态
 */
enum GameState {
    /**
     * @description 初始化
     */
    GS_INIT = "Init",

    /**
     * @description 游戏中
     */
    GS_PLAYING = "Playing",

    /**
     * @description 结束
     */
    GS_END = "End",
}

@ccclass("GameManager")
export class GameManager extends Component {
    /**
     * @description 方块预制体
     */
    @property({ type: Prefab })
    public boxPrefab: Prefab | null = null;

    /**
     * @description 路径长度
     */
    @property({ type: CCInteger })
    public roadLength: number = 50;

    /**
     * @description 路径
     */
    private _road: BlockType[] = [];

    /**
     * @description 开始的 UI
     */
    @property({ type: Node })
    public startMenu: Node | null = null;

    /**
     * @description 角色控制器
     */
    @property({ type: PlayerController })
    public playerCtrl: PlayerController | null = null;

    /**
     * @description 计步器
     */
    @property({ type: Label })
    public stepsLabel: Label | null = null;

    /**
     * @description 开始
     * @returns void
     */
    start() {
        // 第一个初始化要在 start 里面调用
        this.setCurState(GameState.GS_INIT);

        // 监听角色跳跃结束事件
        this.playerCtrl?.node.on("JumpEnd", this.onPlayerJumpEnd, this);
    }

    /**
     * @description 初始化
     * @returns void
     */
    init() {
        // 显示游戏的 UI
        if (this.startMenu) {
            this.startMenu.active = true;
        }

        // 初始化地图
        this.generateRoad();

        // 将角色放回到初始点
        if (this.playerCtrl) {
            // 设置输入是否激活, 并传入输入类型
            this.playerCtrl.setInputActive(false, this.playerCtrl.inputType);
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
    }

    /**
     * @description 设置当前状态
     * @param value 游戏状态
     * @returns void
     */
    setCurState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                // 隐藏 StartMenu
                if (this.startMenu) {
                    this.startMenu.active = false;
                }

                // 重设计步器的数值
                if (this.stepsLabel) {
                    // 将步数重置为 0
                    this.stepsLabel.string = "0";
                }

                // 启用用户输入
                setTimeout(() => {
                    //直接设置 active 会直接开始监听鼠标事件，做了一下延迟处理
                    // 设置输入是否激活, 并传入输入类型
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(
                            true,
                            this.playerCtrl.inputType
                        );
                    }
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
    }

    /**
     * @description 生成路径
     * @returns void
     */
    generateRoad() {
        // 清除当前节点下的所有子节点
        this.node.removeAllChildren();

        // 初始化路径数组
        this._road = [];
        // 生成第一个块，默认是 BT_STONE
        this._road.push(BlockType.BT_STONE);

        // 生成路径数组，根据前一个块类型决定当前块类型
        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {
                // 如果前一个块是 BT_NONE，则当前块为 BT_STONE
                this._road.push(BlockType.BT_STONE);
            } else {
                // 否则，随机生成 0 或 1
                this._road.push(
                    Math.floor(Math.random() * 2) === 0
                        ? BlockType.BT_NONE
                        : BlockType.BT_STONE
                );
            }
        }

        // 根据路径数组生成对应的块并添加到当前节点下
        for (let j = 0; j < this._road.length; j++) {
            // 根据块类型生成块节点
            let block: Node | null = this.spawnBlockByType(this._road[j]);

            if (block) {
                this.node.addChild(block);
                // 设置块的位置，每个块之间的间隔为 BLOCK_SIZE
                block.setPosition(j * BLOCK_SIZE, 0, 0);
            }
        }
    }

    /**
     * @description 根据块类型生成块节点
     * @param type 块类型
     * @returns 块节点
     */
    spawnBlockByType(type: BlockType) {
        if (!this.boxPrefab) {
            // 如果没有预制体，则返回 null
            return null;
        }

        let block: Node | null = null;

        // 根据块类型生成对应的块节点
        switch (type) {
            case BlockType.BT_STONE:
                // 如果块类型是 BT_STONE，则生成 boxPrefab 的实例
                block = instantiate(this.boxPrefab);
                break;
        }

        return block;
    }

    /**
     * @description 开始按钮点击
     * @returns void
     */
    onStartButtonClicked() {
        this.setCurState(GameState.GS_PLAYING);
    }

    /**
     * @description 检查结果
     * @param moveIndex 移动的索引
     */
    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            if (this._road[moveIndex] === BlockType.BT_NONE) {
                //跳到了空方块上
                this.setCurState(GameState.GS_INIT);
            }
        } else {
            // 跳过了最大长度
            this.setCurState(GameState.GS_INIT);
        }
    }

    /**
     * @description 角色跳跃结束事件
     * @param moveIndex 移动的索引
     * @returns void
     */
    onPlayerJumpEnd(moveIndex: number) {
        // 检查 stepsLabel 是否存在，如果存在则更新其显示内容
        if (this.stepsLabel) {
            // 更新 stepsLabel 的显示内容，显示当前移动的索引，如果索引超过道路长度，则显示道路长度
            this.stepsLabel.string =
                "" +
                (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }

        // 调用 checkResult 方法，传入当前移动的索引，检查游戏结果
        this.checkResult(moveIndex);
    }
}
