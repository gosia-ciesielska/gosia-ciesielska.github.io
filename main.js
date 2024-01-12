import { loadSpritesheet } from "./modules/aseprite.js";
import $ from 'jquery';
import Victor from "victor";
import { Application, AnimatedSprite, BaseTexture, Ticker, Spritesheet } from 'pixi.js';

class Game {
    app;
    playMusic = false;
    musicPlayer = new Audio('./music/chill.0.mp3');
    thingySprite;
    thingySpritesheet;
    thingyMoveTarget = { x: 0, y: 0 }
    thingyMoveSpeed = 0;
    thingyMovingLeft = false;
    thingyAnimationAtlas;
    thingyHappiness = 0.5;
    thingyHunger = 0.5;
    thingyHealth = 1;
    cookieSpritesheet;

    async main() {
        this.musicPlayer.loop = true;
        $('#music-toggle').on('click', () => this.#toggleMusic());
        this.app = this.#createApplication('#canvas-container');
        await this.#initializeThingy();
        this.app.stage.addChild(this.thingySprite);
        let updateTicker = new Ticker();
        updateTicker.add((deltaT) => this.moveThingy(deltaT));
        updateTicker.add((deltaT) => this.updateThingyStatus(deltaT));
        updateTicker.start();
        $(window).on('resize', () => {
            this.app.resize();
            this.thingyMoveTarget.x = this.app.screen.width / 8;
            this.thingyMoveTarget.y = this.app.screen.height / 8;
        });
    }

    #createApplication(containerSelector) {
        let container = $(containerSelector)
        let app = new Application({ background: '#819796', resizeTo: container[0] });
        app.stage.scale.set(4);
        BaseTexture.defaultOptions.scaleMode = 0;
        container.append(app.view);
        return app;
    }

    async #initializeThingy() {
        this.thingySpritesheet = await loadSpritesheet('./sprites/Thingy.json');
        this.thingyAnimationAtlas = this.buildAnimationAtlas();
        this.thingySprite = new AnimatedSprite(this.thingySpritesheet.animations.bounce_right);
        this.thingySprite.anchor.set(0.5, 1);
        this.thingySprite.play();
        this.thingySprite.x = -this.thingySprite.width;
        this.thingySprite.y = this.app.screen.height / 8;
        this.thingyMoveTarget.x = this.app.screen.width / 8;
        this.thingyMoveTarget.y = this.app.screen.height / 8;
    }

    async #initializeCookie() {
        this.cookieSpritesheet = await loadSpritesheet('./sprites/Cookie.json');
        this.thingyAnimationAtlas = this.buildAnimationAtlas();
        this.thingySprite = new AnimatedSprite(this.thingySpritesheet.animations.bounce_right);
        this.thingySprite.anchor.set(0.5, 1);
        this.thingySprite.play();
        this.thingySprite.x = -this.thingySprite.width;
        this.thingySprite.y = this.app.screen.height / 8;
    }

    #toggleMusic() {
        this.playMusic = !this.playMusic;
        if (this.playMusic) {
            this.musicPlayer.play();
            $('#music-toggle').removeClass('faded');
        } else {
            this.musicPlayer.pause();
            this.musicPlayer.fastSeek(0);
            $('#music-toggle').addClass('faded');
        }
    }

    moveThingy(deltaT) {
        let moveLength = deltaT / 2;
        let moveVector = this.#thingyMoveVector();
        if (moveVector.length() < 1) {
            return;
        }
        let deltaPos = moveVector.normalize().multiplyScalar(moveLength);
        this.thingySprite.x += deltaPos.x;
        this.thingySprite.y += deltaPos.y;
        if ((deltaPos.x < 0 && !this.thingyMovingLeft) || (deltaPos.x > 0 && this.thingyMovingLeft)) {
            this.flipThingy();
        }
    }

    updateThingyStatus(deltaT) {
        let oldHappiness = this.thingyHappiness;
        if (this.thingySprite.x < 0 || this.thingySprite.y < 0 || this.thingySprite.x > this.app.screen.width / 4 || this.thingySprite.y > this.app.screen.height / 4) {
            this.thingyHappiness = Math.max(0, this.thingyHappiness - deltaT * 0.005);
        } else {
            this.thingyHappiness = Math.min(1, this.thingyHappiness + deltaT * 0.001);
        }
        if (this.thingyHappiness >= 0.25 && oldHappiness < 0.25
            || this.thingyHappiness < 0.25 && oldHappiness >= 0.25
            || this.thingyHappiness >= 0.75 && oldHappiness < 0.75
            || this.thingyHappiness < 0.75 && oldHappiness >= 0.75) {
            this.changeAnimation(this.selectThingyAnimation());
        }
    }

    feedThingy(deltaT) {

    }

    #thingyMoveVector() {
        let thingyPos = Victor.fromObject(this.thingySprite);
        let targetPos = Victor.fromObject(this.thingyMoveTarget);
        return targetPos.subtract(thingyPos);
    }

    buildAnimationAtlas() {
        let atlas = {};
        for (let animationName in this.thingySpritesheet.animations) {
            atlas[animationName] = new AnimatedSprite(this.thingySpritesheet.animations[animationName]);
        }
        return atlas;
    }

    selectThingyAnimation() {
        let direction = this.thingyMovingLeft ? '_left' : '_right';
        let mood = '';
        if (this.thingyHappiness > 0.75) {
            mood = '_happy';
        } else if (this.thingyHappiness < 0.25) {
            mood = '_angry';
        }
        return 'bounce' + direction + mood;
    }

    flipThingy() {
        this.thingyMovingLeft = !this.thingyMovingLeft;
        this.changeAnimation(this.selectThingyAnimation());
    }

    changeAnimation(animationName) {
        this.thingySprite.textures = this.thingyAnimationAtlas[animationName].textures;
        this.thingySprite._durations = this.thingyAnimationAtlas[animationName]._durations;
        this.thingySprite.play();
    }
}

var game = new Game();
window.onload = () => game.main();