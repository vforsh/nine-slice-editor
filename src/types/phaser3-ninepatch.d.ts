type NinePatchBase = import("@koreez/phaser3-ninepatch/lib/com/koreez/plugin/ninepatch/NinePatch").NinePatch
type IPatchesConfig = import("@koreez/phaser3-ninepatch/lib/com/koreez/plugin/ninepatch/IPatchesConfig").IPatchesConfig

declare class NinePatch {
	constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, key: string, frame?: string | number, config?: IPatchesConfig);
}

declare interface NinePatch extends NinePatchBase {
	readonly originTexture: Phaser.Textures.Texture
	readonly originFrame: Phaser.Textures.Frame
	readonly config: IPatchesConfig
}

declare module Phaser {
	
	namespace GameObjects {
		
		interface GameObjectFactory {
			ninePatch: (x: number, y: number, width: number, height: number, key: string, frame?: string | number, patchesConfig?: IPatchesConfig) => NinePatch
		}
		
		interface GameObjectCreator {
			ninePatch: (config: { width: number, height: number, key: string, frame?: string | number, patchesConfig?: IPatchesConfig }, addToScene?: boolean) => NinePatch
		}
		
	}
}






