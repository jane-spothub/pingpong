import Phaser from "phaser";

class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.image("player", "assets/img/player-paddle.png");
        this.load.image("bot", "assets/img/bot-paddle.png");
        this.load.image("ball", "assets/img/ball.png");
    }

    create() {
        // table bg
        this.add.rectangle(400, 400, 800, 600, 0x75c93f);

        // paddles
        this.player = this.physics.add.image(400, 750, "player").setImmovable(true);
        this.bot = this.physics.add.image(400, 50, "bot").setImmovable(true);

        // ball
        this.ball = this.physics.add.image(400, 400, "ball");
        this.ball.setCollideWorldBounds(true).setBounce(1);

        // collisions
        this.physics.add.collider(this.ball, this.player, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball, this.bot, this.hitPaddle, null, this);

        // input
        this.input.on("pointermove", (p) => {
            this.player.x = Phaser.Math.Clamp(p.x, 50, 750);
        });

        // bot AI
        this.botSpeed = 200;
    }

    hitPaddle(ball, paddle) {
        ball.setVelocityY(ball.body.velocity.y * -1);
    }

    update(time, delta) {
        // Bot follows ball
        if (this.ball.x < this.bot.x) this.bot.x -= this.botSpeed * delta / 1000;
        if (this.ball.x > this.bot.x) this.bot.x += this.botSpeed * delta / 1000;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    physics: { default: "arcade" },
    scene: [GameScene],
};

const game = new Phaser.Game(config);
