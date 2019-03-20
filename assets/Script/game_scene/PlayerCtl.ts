import SpriteCtl from "./SpriteCtl"
import { ArmsStatus } from "../RES";
const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


    // LIFE-CYCLE CALLBACKS:
    @property(SpriteCtl)
    SpriteCtl: SpriteCtl = null;

    isSelf = false;     // 是否是自己
    seatId = -1;        // 座位号
    direction = 0;         // 0表示没有移动 -1表示正在向左移动, 1表示右
    jumping = false;        // 0表示没有跳起, 1表示正在空中
    turnFace = 1;
    

    @property(cc.Node)
    selfFlag: cc.Node = null;
    @property(cc.Node)
    runArms: cc.Node = null;

    @property(Number)
    maxSpeed = cc.v2(1000, 1000);
    @property(Number)
    gravity = -1000;
    @property(Number)
    drag = 1000;
    @property(Number)
    jumpSpeed = 300;
    @property(Number)
    speed = cc.v2(0, 0);          // 移动的速度

    armsSpeed = cc.v2(0, 0);

    /**
     * ------------------
     */
    collisionX = 0;         // 碰撞方向
    collisionY = 0;
    touchingNumber = 0;     // 是否在碰撞中

    prePosition = cc.v2();
    preStep = cc.v2();


    /**
     * 攻击系统
     */
    armsStatus = ArmsStatus.OnHand; // 武器的状态   0表示武器在玩家手上, 1表示武器扔出去, 2表示武器在地上, 3表示武器收回来
    // onLoad () {}

    start () {

    }

    init() {

    }
    /**
     * -------------------------------------- 数据设置 -------------------------------
     */
    setSwitchArrowRotation(isStop: boolean) {
        this.SpriteCtl.switchArrowRotation(isStop);
    }
    getArrorRotationIsRun() {
        return this.SpriteCtl.arrowRotationFlag;
    }

    showSelfFlag() {
        this.isSelf = true;
        this.selfFlag.active = true;
    }

    /**
     * ------------------------------------------------- 玩家移动 扔出斧头----------------------------------------
     * @param direction
     * @param speed 
     */
    setDirection(direction: number, speed: number) {
        this.direction = direction;
        if(this.direction) {
            this.turnFace = this.direction;
            this.node.scaleX = this.turnFace;
        }
    }
    
    setJumping() {
        if(!this.jumping) {
            return ;
        }
        this.jumping = true;
        this.speed.y = this.jumpSpeed;
    }


    thowArms(curPos: cc.Vec2, speed: cc.Vec2, turnFace: number) {
        if(this.armsStatus != ArmsStatus.OnHand) {
            return ;
        }
        this.armsStatus = ArmsStatus.Runing;
        this.SpriteCtl.hideArmSp();

        this.runArms.active = true;
        this.runArms.x = curPos.x;
        this.runArms.y = curPos.y + 20;

        speed.x *= turnFace;

        speed.x *= 500;
        speed.y *= 500;
        this.armsSpeed = speed;
        console.log(this.armsSpeed);
    }

    recoveryArms() {
        if(this.armsStatus != ArmsStatus.onGround) {
            return ;
        }
    }
    /**
     * ------------------ 控制spriteCtl的方法 -----------------------
     */
    getArrowRotation() {
        return this.SpriteCtl.getArrowRotation();
    }


    /**
     * -----------------------------------------------------   碰撞回调   ---------------------------------------------------------
     */
    onCollisionEnter(other: cc.BoxCollider, self: cc.BoxCollider) {
        this.touchingNumber ++;
        
        let otherAabb = other["world"].aabb;
        let otherPreAabb = other["world"].preAabb.clone();

        let selfAabb = self["world"].aabb;
        let selfPreAabb = self["world"].preAabb.clone();

        // console.log(otherAabb, selfAabb);

        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.x < 0 && (selfPreAabb.xMax > otherPreAabb.xMax)) {
                
                this.node.x = this.node.parent.convertToNodeSpaceAR(cc.v2(otherPreAabb.xMax+selfPreAabb.width/2, 0)).x;
                this.collisionX = -1;
                // console.log(otherPreAabb.xMax);
                // console.log(this.node.x);
            }
            else if (this.speed.x > 0 && (selfPreAabb.xMin < otherPreAabb.xMin)) {
                // this.node.x = otherPreAabb.xMin - selfPreAabb.width;
                this.node.x = this.node.parent.convertToNodeSpaceAR(cc.v2(otherPreAabb.xMin-selfPreAabb.width/2, 0)).x;
                this.collisionX = 1;
            }

            this.speed.x = 0;
            other["touchingX"] = true;
            return;
        }

        // 3rd step
        // forward y-axis, check whether collision on y-axis
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.y < 0 && (selfPreAabb.yMax > otherPreAabb.yMax)) {
                // this.node.y = otherPreAabb.yMax - this.node.parent.y;
                this.node.y = this.node.parent.convertToNodeSpaceAR(cc.v2(0, otherPreAabb.yMax)).y;
                this.jumping = false;
                this.collisionY = -1;
            }
            else if (this.speed.y > 0 && (selfPreAabb.yMin < otherPreAabb.yMin)) {
                // this.node.y = otherPreAabb.yMin - selfPreAabb.height - this.node.parent.y;
                this.node.y = this.node.parent.convertToNodeSpaceAR(cc.v2(0, otherPreAabb.yMin - selfPreAabb.height)).y;
                this.collisionY = 1;
            }
            
            this.speed.y = 0;
            other["touchingY"] = true;
        }    
    }

    onCollisionStay(other: cc.BoxCollider, self: cc.BoxCollider) {

    }

    onCollisionExit(other: cc.BoxCollider, self: cc.BoxCollider) {
        this.touchingNumber --;         // 减去一次碰撞

        if (this.touchingNumber === 0) {
            
        }

        if (other["touchingX"]) {
            this.collisionX = 0;
            other["touchingX"] = false;
        }
        else if (other["touchingY"]) {
            other["touchingY"] = false;
            this.collisionY = 0;
            this.jumping = true;
        }
    }

    /**
     * --------------------------------------------------------------- 帧事件更新 -------------------------------------------------------------------
     * @param dt 
     */
    frameUpdate(dt: number) {
        this.updataMove(dt);
        this.updateArrowRotation(dt);
        this.updateArmsPosition(dt);
    }

    updataMove(dt: number) {
        // this.node.x += dt * this.direction * 100;
        if (this.collisionY === 0) {
            this.speed.y += this.gravity * dt;
            if (Math.abs(this.speed.y) > this.maxSpeed.y) {
                this.speed.y = this.speed.y > 0 ? this.maxSpeed.y : -this.maxSpeed.y;
            }
        }

        if (this.direction === 0) {
            if (this.speed.x > 0) {
                this.speed.x -= this.drag * dt;
                if (this.speed.x <= 0) this.speed.x = 0;
            }
            else if (this.speed.x < 0) {
                this.speed.x += this.drag * dt;
                if (this.speed.x >= 0) this.speed.x = 0;
            }
        }
        else {
            this.speed.x += (this.direction > 0 ? 1 : -1) * this.drag * dt;
            if (Math.abs(this.speed.x) > this.maxSpeed.x) {
                this.speed.x = this.speed.x > 0 ? this.maxSpeed.x : -this.maxSpeed.x;
            }
        }

        if (this.speed.x * this.collisionX > 0) {
            this.speed.x = 0;
        }
        
        this.prePosition.x = this.node.x;
        this.prePosition.y = this.node.y;

        this.preStep.x = this.speed.x * dt;
        this.preStep.y = this.speed.y * dt;
        
        this.node.x += this.speed.x * dt;
        this.node.y += this.speed.y * dt;
        if(Math.abs(this.speed.x) > 0) {
            this.SpriteCtl.playPlayerAnimByIndex(1);
        }else {
            this.SpriteCtl.playPlayerAnimByIndex(0);
        }

        if(this.jumping) {
            this.SpriteCtl.playPlayerAnimByIndex(2);
        }
    }

    /**
     * 更新箭头的旋转角度
     */
    updateArrowRotation(dt: number) {
        this.SpriteCtl.updateArrowRotation(dt);
    }

    /**
     * 运动斧头
     */
    updateArmsPosition(dt: number) {
        if(this.armsStatus == ArmsStatus.Runing || this.armsStatus == ArmsStatus.Recycling) {
            this.runArms.x += this.armsSpeed.x * dt;
            this.runArms.y += this.armsSpeed.y * dt;
        }
    }

    // update (dt) {}
}
