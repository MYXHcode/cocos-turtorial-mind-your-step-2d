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
    Prefab,
    Node,
    instantiate,
} from "cc";
import { BLOCK_SIZE } from "./PlayerController";
const { ccclass, property } = _decorator;

/**
 * @description 方块类型
 */
enum BlockType {
    /**
     * @description 无
     */
    BT_NONE,

    /**
     * @description 石头
     */
    BT_STONE,
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

    start() {
        this.generateRoad();
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
        // startPos
        this._road.push(BlockType.BT_STONE);

        // 生成路径数组，根据前一个块类型决定当前块类型
        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {
                // 如果前一个块是BT_NONE，则当前块为BT_STONE
                this._road.push(BlockType.BT_STONE);
            } else {
                // 否则，随机生成0或1
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        // 根据路径数组生成对应的块并添加到当前节点下
        for (let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockByType(this._road[j]);

            if (block) {
                this.node.addChild(block);
                // 设置块的位置，每个块之间的间隔为BLOCK_SIZE
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
            // 如果没有预制体，则返回null
            return null;
        }

        let block: Node | null = null;

        // 根据块类型生成对应的块节点
        switch (type) {
            case BlockType.BT_STONE:
                // 如果块类型是BT_STONE，则生成boxPrefab的实例
                block = instantiate(this.boxPrefab);
                break;
        }

        return block;
    }

    update(deltaTime: number) {}
}
