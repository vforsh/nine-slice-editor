import { Main } from "./Main"
import { UrlParams } from "./UrlParams"
import { NinePatchPlugin } from "@koreez/phaser3-ninepatch"

export enum RendererType {
	WEBGL = "webgl",
	CANVAS = "canvas",
}

export enum AudioType {
	NO_AUDIO = "no_audio",
	HTML5_AUDIO = "html5_audio",
	WEB_AUDIO = "web_audio",
}

export function createGameConfig(): Phaser.Types.Core.GameConfig {
	return {
		scale: getScaleConfig(),
		parent: "canvas-container",
		type: getRenderType(),
		render: {
			clearBeforeRender: false,
			failIfMajorPerformanceCaveat: true,
			maxTextures: getMaxTexturesNum(),
		},
		banner: {
			background: ["rgba(0,0,255,0.4)"],
		},
		audio: {
			noAudio: true,
		},
		plugins: {
			global: [
				{
					key: "rexWebfontLoader",
					plugin: rexwebfontloaderplugin,
					start: true,
				},
				{
					key: "rexawaitloaderplugin",
					plugin: rexawaitloaderplugin,
					start: true,
				},
				{
					key: "NinePatchPlugin",
					plugin: NinePatchPlugin,
					start: true,
				},
			],
		},
		callbacks: {
			preBoot: preBootCallback.bind(this),
			postBoot: postBootCallback.bind(this),
		},
	}
}

function getMaxTexturesNum(): number {
	if (UrlParams.has("maxTextures")) {
		return UrlParams.getNumber("maxTextures", 0)
	}
	
	return undefined
}

function getScaleConfig(): Phaser.Types.Core.ScaleConfig {
	return {
		mode: Phaser.Scale.RESIZE,
	} as Phaser.Types.Core.ScaleConfig
}

function getRenderType(): number {
	let canvas = UrlParams.getBool("forceCanvas")
	if (canvas) {
		return Phaser.CANVAS
	}
	
	return Phaser.AUTO
}

function preBootCallback(game: Main): void {
}

function postBootCallback(game: Main): void {
}

