import { PhaserScreen, PhaserScreenOptions } from "../../../robowhale/phaser3/gameObjects/container/screen/Screen"
import { AtlasFramePickerPopup } from "./AtlasFramePickerPopup"

export class AtlasFramePickerScreen extends PhaserScreen {
	
	public popup: AtlasFramePickerPopup
	
	constructor(scene: Phaser.Scene, atlasTexture: Phaser.Textures.Texture) {
		super(scene, {
			name: "atlas-frame-picker",
			backgroundKey: "black_rect",
			backgroundFrame: "",
			backgroundAlpha: 0.85,
			backgroundInteractive: true,
		} as PhaserScreenOptions)
		
		this.addPopup(atlasTexture)
		
		this.background.once(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.hide, this)
	}
	
	private addPopup(atlasTexture: Phaser.Textures.Texture) {
		this.popup = new AtlasFramePickerPopup(this.scene, atlasTexture)
		this.add(this.popup)
		this.pin(this.popup, 0.5, 0.5)
	}
	
	public resize(): void {
		super.resize()
		
		this.alignPopup()
	}
	
	private alignPopup() {
		let maxWidth = this.screenWidth * 0.92
		let maxHeight = this.screenHeight * 0.92
		let scale = Math.min(1, maxWidth / this.popup.width, maxHeight / this.popup.height)
		this.popup.setScale(scale)
	}
	
	public show() {
		this.emitShowEvent()
		this.revive()
	}
	
	public hide() {
		this.emitHideStartEvent()
		this.kill()
		this.emitHideCompleteEvent()
	}
	
}
