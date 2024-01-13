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
    cookieSprite;
    feeding = false;

    async main() {
        this.musicPlayer.loop = true;
        $('#music-toggle').on('click', () => this.#toggleMusic());
        $('#feed').on('click', () => this.feedThingy());
        this.app = this.#createApplication('#canvas-container');
        await this.#initializeThingy();
        await this.#initializeCookie();
        this.app.stage.addChild(this.thingySprite);
        let updateTicker = new Ticker();
        updateTicker.add((deltaT) => this.moveThingy(deltaT));
        updateTicker.add((deltaT) => this.updateStatus(deltaT));
        updateTicker.start();
        $(window).on('resize', () => {
            this.app.resize();
            this.cookieSprite.stop();
            this.app.stage.removeChild(this.cookieSprite);
            this.changeAnimation(this.selectThingyAnimation());
            this.thingyMoveTarget.x = this.app.screen.width / 8;
            this.thingyMoveTarget.y = this.app.screen.height / 8;
            this.cookieSprite.x = this.app.screen.width / 8;
            this.cookieSprite.y = this.app.screen.height / 8 + this.thingySprite.height;
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
        this.thingySprite.on('mousemove', () => { 
            this.changeAnimation('bounce_lef_love');
        });
    }

    async #initializeCookie() {
        this.cookieSpritesheet = await loadSpritesheet('./sprites/Cookie.json');
        this.cookieSprite = new AnimatedSprite(this.cookieSpritesheet.animations.eat);
        this.cookieSprite.anchor.set(0.5, 1);
        this.cookieSprite.x = this.app.screen.width / 8;
        this.cookieSprite.y = this.app.screen.height / 8 + this.thingySprite.height;
        this.cookieSprite.loop = false;
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

    updateStatus(deltaT) {
        let hungerValue = this.thingyHunger * 100 + "%";
        let happinessValue = this.thingyHappiness * 100 + "%";
        $('#hunger_progress').width(hungerValue);
        $('#happiness_progress').width(happinessValue);
        this.thingyHunger = Math.max(0, this.thingyHunger - deltaT * 0.00003);
        if(this.thingyHunger < 0.1) {
            this.thingyHappiness = Math.max(0, this.thingyHappiness - deltaT * 0.005);
        } else {
            this.thingyHappiness = Math.max(0, this.thingyHappiness - deltaT * 0.00001);
        }
    }

    feedThingy() {
        this.cookieSprite.onComplete = () => {};
        this.thingySprite.x = this.app.screen.width / 8;
        this.thingySprite.y = this.app.screen.height / 8;
        this.app.stage.addChild(this.cookieSprite);
        this.changeAnimation('eat_right');
        this.cookieSprite.gotoAndPlay(0);
        this.cookieSprite.onComplete = () => {
            this.app.stage.removeChild(this.cookieSprite);
            this.changeAnimation('bounce_right');
            this.thingyHunger = Math.min(1, this.thingyHunger + 0.2);;
        };
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