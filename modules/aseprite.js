import { Spritesheet, BaseTexture } from 'pixi.js';

/**
 * Fetches the spritesheet json exported from aseprite and performs all the transformations necessary to directly use aseprite tags as the animationsin PIXI library
 * @param {string} url url of json spritesheet file
 * @returns PIXI.Spritesheet object representing spritesheet
 */
export async function loadSpritesheet(url) {
    return fetch(url)
        .then(response => response.json())
        .then(json => processSpriteSheetJson(url, json))
        .catch(error => console.error(error));
}

async function processSpriteSheetJson(url, spritesheetJson) {
    spritesheetJson.meta.image = relativeImageUrl(url, spritesheetJson.meta.image);
    spritesheetJson.animations = animationsFromTags(spritesheetJson);
    const spritesheet = new Spritesheet(BaseTexture.from(spritesheetJson.meta.image), spritesheetJson);
    await spritesheet.parse();
    spritesheet.animations = postProcessAnimations(spritesheet);
    spritesheet
    return spritesheet;
}

function relativeImageUrl(jsonUrl, imageUrl) {
    let directory = jsonUrl.substring(0, jsonUrl.lastIndexOf('/')) + '/';
    return directory + imageUrl;
}

function animationsFromTags(spritesheet) {
    return Object.fromEntries(spritesheet.meta.frameTags.map(tag => [tag.name, buildAnimationFromTag(spritesheet.frames, tag)]));
}

function buildAnimationFromTag(frames, tag) {
    const forwardNames = [];
    var frameIndex = 0;
    for (var frameName in frames) {
        if (frameIndex > tag.to) {
            break;
        }
        if (frameIndex >= tag.from) {
            forwardNames.push(frameName);
        }
        frameIndex++;
    }
    const direction = tag.direction.toLowerCase();
    if (direction === 'forward') {
        return forwardNames;
    }
    const reverseNames = forwardNames.reverse();
    if (direction === 'reverse') {
        return reverseNames;
    } else if (direction === 'pingpong') {
        return forwardNames.concat(reverseNames);
    }
    else if (direction === 'pingpong_reverse') {
        return reverseNames.concat(forwardNames);
    }
    console.error('Could not process the sprite sheet, unsupported tag direction');
}

function postProcessAnimations(spritesheet) {
    let output = {};
    for (let animationName in spritesheet.animations) {
        output[animationName] = processAnimation(spritesheet.animations[animationName], spritesheet);
    }
    return output;
}

function processAnimation(animation, spritesheet) {
    return animation.map(frame => processFrame(frame, spritesheet));
}

function processFrame(frame, spritesheet) {
    let sheetFrameId = frame.textureCacheIds[0];
    return { texture: frame, time: spritesheet._frames[sheetFrameId].duration };
}

