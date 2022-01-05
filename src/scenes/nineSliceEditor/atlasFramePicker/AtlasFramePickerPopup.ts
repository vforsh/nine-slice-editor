type AtlasFrame = Phaser.GameObjects.Rectangle & { frame?: Phaser.Textures.Frame }

export enum AtlasFramePickerPopupEvent {
	FRAME_PICK = "AtlasFramePickerPopup_FRAME_PICK",
}

/**
 * TODO
 * - add zooming and atlas dragging
 * - will need to add mask to atlasContainer
 */
export class AtlasFramePickerPopup extends Phaser.GameObjects.Container {
	
	private texture: Phaser.Textures.Texture
	private back: Phaser.GameObjects.Image
	private atlasBack: Phaser.GameObjects.Image
	private atlasContainer: Phaser.GameObjects.Container
	private atlasTexture: Phaser.GameObjects.Image
	private atlasFrames: AtlasFrame[]
	private text: Phaser.GameObjects.Text
	private readonly defaultTextContent = "Double click frame to select it"
	private lastClickedFrame: AtlasFrame
	private lastClickedFrameTs = 0
	
	constructor(scene: Phaser.Scene, atlasTexture: Phaser.Textures.Texture) {
		super(scene)
		
		this.name = `atlas_frame_picker__${atlasTexture.key}`
		
		this.texture = atlasTexture
		
		this.addBack()
		this.addAtlasBack()
		this.addAtlas()
		this.addAtlasFrames()
		this.addText()
		
		this.setSize(this.back.displayWidth, this.back.displayHeight)
	}
	
	private addBack() {
		this.back = this.scene.add.image(0, 0, "popup_back")
		this.add(this.back)
	}
	
	private addAtlasBack() {
		this.atlasBack = this.scene.add.image(0, 0, "atlas_back")
		this.atlasBack.setOrigin(0)
		this.add(this.atlasBack)
		
		let margin = (this.back.displayWidth - this.atlasBack.displayWidth) / 2
		this.atlasBack.x = this.back.left + margin
		this.atlasBack.y = this.back.top + margin
	}
	
	private addAtlas() {
		this.atlasTexture = this.scene.add.image(0, 0, this.texture.key, "__BASE")
		this.atlasTexture.setOrigin(0)
		this.atlasTexture.x -= this.atlasTexture.width / 2
		this.atlasTexture.y -= this.atlasTexture.height / 2
		
		let { x, y } = this.atlasBack.getCenter()
		this.atlasContainer = this.scene.add.container(this.atlasBack.x, this.atlasBack.y, this.atlasTexture)
		this.atlasContainer.name = "atlas_container"
		this.atlasContainer.x = x
		this.atlasContainer.y = y
		this.atlasContainer.width = this.atlasTexture.width
		this.atlasContainer.height = this.atlasTexture.height
		this.add(this.atlasContainer)
		this.fitAtlas()
	}
	
	private fitAtlas(): void {
		let maxWidth = this.atlasBack.displayWidth
		let maxHeight = this.atlasBack.displayHeight
		let scale = Math.min(1, maxWidth / this.atlasContainer.width, maxHeight / this.atlasContainer.height)
		this.atlasContainer.setScale(scale)
	}
	
	private addAtlasFrames() {
		let color = 0x1765C0
		
		this.atlasFrames = Object.values(this.texture.frames)
			.filter((frame: Phaser.Textures.Frame) => frame.name !== "__BASE")
			.map((frame: Phaser.Textures.Frame) => {
				let rect = this.scene.add.rectangle(frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, color, 0.2) as AtlasFrame
				rect.x += this.atlasTexture.x
				rect.y += this.atlasTexture.y
				rect.setOrigin(0, 0)
				rect.setStrokeStyle(1, color, 1)
				rect.frame = frame
				rect.alpha = 0.001
				rect.setInteractive()
				rect.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, this.onFramePointerOver.bind(this, rect))
				rect.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, this.onFramePointerOut.bind(this, rect))
				rect.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onFramePointerDown.bind(this, rect))
				
				return rect
			})
		
		this.atlasContainer.add(this.atlasFrames)
	}
	
	private onFramePointerOver(frame: AtlasFrame): void {
		frame.alpha = 1
		
		this.updateTextContent(frame.frame.name, frame.frame.cutWidth, frame.frame.cutHeight)
	}
	
	private onFramePointerOut(frame: AtlasFrame): void {
		frame.alpha = 0.001
		
		this.text.setText(this.defaultTextContent)
	}
	
	private onFramePointerDown(frame: AtlasFrame, pointer: Phaser.Input.Pointer, x, y, event): void {
		if (this.lastClickedFrame === frame) {
			let timePassed = Date.now() - this.lastClickedFrameTs
			if (timePassed < 250) {
				this.lastClickedFrame = null
				this.lastClickedFrameTs = 0
				this.emit(AtlasFramePickerPopupEvent.FRAME_PICK, frame.frame)
				return
			}
		}
		
		this.lastClickedFrame = frame
		this.lastClickedFrameTs = Date.now()
	}
	
	private addText() {
		let content = this.defaultTextContent
		let style: Phaser.Types.GameObjects.Text.TextStyle = {
			fontFamily: "arial",
			fontStyle: "400",
			fontSize: "30px",
			color: "#ffffff",
			align: "center",
			resolution: 2,
			padding: { x: 0, y: 2 },
		}
		
		this.text = this.scene.add.text(0, 0, content, style)
		this.text.setOrigin(0.5, 0.5)
		this.add(this.text)
		this.alignText()
	}
	
	private alignText() {
		let top = this.atlasBack.bottom
		let bottom = this.back.bottom
		let height = bottom - top
		this.text.y = top + height / 2
	}
	
	private updateTextContent(frameName: string, width: number, height: number): void {
		this.text.setText(`${frameName}\n${width}x${height}`)
	}
	
	public enableFrames(): void {
		this.atlasFrames.forEach(frame => frame.setInteractive())
	}
	
	public disableFrames(): void {
		this.atlasFrames.forEach(frame => frame.disableInteractive())
	}
	
}
