import { BitmapFont } from "../../GameFonts"

type Vector2Like = Phaser.Types.Math.Vector2Like

export enum ResizeControlsEvent {
	RESIZE = "ResizeControls_RESIZE",
	DOUBLE_CLICK = "ResizeControls_DOUBLE_CLICK",
}

type ResizeControl = Phaser.GameObjects.Image & {
	corners?: CornerControl[],
	lastClickTs?: number,
}

type CornerControl = Phaser.GameObjects.Ellipse

export interface ResizeControlsOptions {
	thickness: number
	padding: number
}

export class ResizeControls extends Phaser.GameObjects.Container {
	
	private readonly INACTIVE_TINT = 0xE1E1E1
	private readonly ACTIVE_TINT = 0XFFFFFF
	
	private options: ResizeControlsOptions
	private _top: ResizeControl
	private _bottom: ResizeControl
	private _left: ResizeControl
	private _right: ResizeControl
	private controls: ResizeControl[]
	private topText: Phaser.GameObjects.BitmapText
	private bottomText: Phaser.GameObjects.BitmapText
	private leftText: Phaser.GameObjects.BitmapText
	private rightText: Phaser.GameObjects.BitmapText
	private texts: Phaser.GameObjects.BitmapText[]
	private topLeft: CornerControl
	private topRight: CornerControl
	private bottomRight: CornerControl
	private bottomLeft: CornerControl
	private cornerControls: CornerControl[]
	private image: NinePatch
	private tempVec: Vector2Like
	
	constructor(scene: Phaser.Scene, options: ResizeControlsOptions) {
		super(scene)
		
		this.name = "resize-controls"
		
		this.options = options
		
		this.tempVec = { x: 0, y: 0 }
		
		this.addControls()
		this.updateControlsHitAreas()
		this.addCornerControls()
		this.addTexts()
		this.setThickness(this.options.thickness)
	}
	
	private addControls() {
		this._top = this.scene.add.image(0, 0, "__WHITE")
		this._bottom = this.scene.add.image(0, 0, "__WHITE")
		this._left = this.scene.add.image(0, 0, "__WHITE")
		this._right = this.scene.add.image(0, 0, "__WHITE")
		
		this.controls = [this._top, this._bottom, this._left, this._right]
		this.controls.forEach((control) => {
			control.setTintFill(this.INACTIVE_TINT)
			control.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, this.onPointerOver.bind(this, control))
			control.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, this.onPointerOut.bind(this, control))
			control.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onPointerDown.bind(this, control))
			control.on(Phaser.Input.Events.DRAG_START, this.onDragStart.bind(this, control))
			control.on(Phaser.Input.Events.DRAG, this.onDrag.bind(this, control))
			control.on(Phaser.Input.Events.DRAG_END, this.onDragEnd.bind(this, control))
			control.setInteractive()
			control.input.cursor = "pointer"
			
			this.scene.input.setDraggable(control)
		})
		
		this._top.input.cursor = 'row-resize'
		this._bottom.input.cursor = 'row-resize'
		this._left.input.cursor = 'col-resize'
		this._right.input.cursor = 'col-resize'
		
		this.add(this.controls)
	}
	
	private onPointerOver(control: ResizeControl): void {
		control.setTintFill(this.ACTIVE_TINT)
		control.corners.forEach(corner => corner.setFillStyle(this.ACTIVE_TINT))
		
		if (control === this._top || control === this._bottom) {
			this.topText.revive()
			this.bottomText.revive()
		} else {
			this.leftText.revive()
			this.rightText.revive()
		}
		
		this.updateTexts()
		
		this.bringToTop(control)
		this.bringToTop(control.corners[0])
		this.bringToTop(control.corners[1])
	}
	
	private onPointerOut(control: ResizeControl): void {
		control.setTintFill(this.INACTIVE_TINT)
		control.corners.forEach(corner => corner.setFillStyle(this.INACTIVE_TINT))
		
		if (control === this._top || control === this._bottom) {
			this.topText.kill()
			this.bottomText.kill()
		} else {
			this.leftText.kill()
			this.rightText.kill()
		}
	}
	
	private onPointerDown(control: ResizeControl, pointer: Phaser.Input.Pointer): void {
		let now = Date.now()
		
		let timeBetweenClicks = now - (control.lastClickTs ?? 0)
		if (timeBetweenClicks <= 300) {
			this.emit(ResizeControlsEvent.DOUBLE_CLICK, this)
		}
		
		control.lastClickTs = now
	}
	
	private onDragStart(control: ResizeControl): void {
		// console.log("drag START", arguments)
	}
	
	private onDrag(control: ResizeControl, pointer: Phaser.Input.Pointer): void {
		let { x, y } = this.getLocalPointerPosition(pointer)
		let center = { x: 0, y: 0 }
		
		let config = this.image.config
		let padding = this.options.padding
		let minWidth = config.left + config.right + padding * 2
		let minHeight = config.top + config.bottom + padding * 2
		
		if (control === this._top) {
			let max = center.y - minHeight / 2
			this._top.y = Math.min(y, max)
			
			let offset = center.y - this._top.y
			this._bottom.y = center.y + offset
		} else if (control === this._bottom) {
			let min = center.y + minHeight / 2
			this._bottom.y = Math.max(min, y)
			
			let offset = this._bottom.y - center.y
			this._top.y = center.y - offset
		} else if (control === this._left) {
			let max = center.x - minWidth / 2
			this._left.x = Math.min(max, x)
			
			let offset = center.x - this._left.x
			this._right.x = center.x + offset
		} else if (control === this._right) {
			let min = center.x + minWidth / 2
			this._right.x = Math.max(min, x)
			
			let offset = this._right.x - center.x
			this._left.x = center.x - offset
		}
		
		if (control === this._top || control === this._bottom) {
			this.updateVerticalLines()
		} else {
			this.updateHorizontalLines()
		}
		
		this.updateCornerPositions()
		
		this.updateTexts()
		
		this.onDragEnd(control)
	}
	
	private getLocalPointerPosition(pointer: Phaser.Input.Pointer): Vector2Like {
		pointer.positionToCamera(this.scene.cameras.main, this.tempVec)
		this.pointToContainer(this.tempVec, this.tempVec)
		
		return this.tempVec
	}
	
	private updateVerticalLines(): void {
		let height = this._bottom.y - this._top.y
		this._left.displayHeight = height
		this._right.displayHeight = height
	}
	
	private updateHorizontalLines(): void {
		let width = this._right.x - this._left.x
		this._top.displayWidth = width
		this._bottom.displayWidth = width
	}
	
	private onDragEnd(control: ResizeControl): void {
		let width = this._right.x - this._left.x
		let height = this._bottom.y - this._top.y
		
		this.emit(ResizeControlsEvent.RESIZE, { width, height })
	}
	
	private updateControlsHitAreas(): void {
		let thickness = 20
		
		let top = this._top.input.hitArea as Phaser.Geom.Rectangle
		top.width = this._top.displayWidth
		top.height = thickness
		top.y = -thickness / 2
		
		let bottom = this._bottom.input.hitArea as Phaser.Geom.Rectangle
		bottom.width = this._bottom.displayWidth
		bottom.height = thickness
		bottom.y = -thickness / 2
		
		let left = this._left.input.hitArea as Phaser.Geom.Rectangle
		left.width = thickness
		left.height = this._left.displayHeight
		left.x = -thickness / 2
		
		let right = this._right.input.hitArea as Phaser.Geom.Rectangle
		right.width = thickness
		right.height = this._right.displayHeight
		right.x = -thickness / 2
	}
	
	private addCornerControls() {
		this.topLeft = this.createCornerControl()
		this.topRight = this.createCornerControl()
		this.bottomRight = this.createCornerControl()
		this.bottomLeft = this.createCornerControl()
		
		this.cornerControls = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
		this.cornerControls.forEach((control) => {
			control.setFillStyle(this.INACTIVE_TINT)
			// control.setInteractive()
			// control.input.cursor = "move"
			// control.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, this.onCornerControlOver.bind(this, control))
			// control.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, this.onCornerControlOut.bind(this, control))
			// control.on(Phaser.Input.Events.DRAG_START, this.onCornerControlDragStart.bind(this, control))
			// control.on(Phaser.Input.Events.DRAG, this.onCornerControlDrag.bind(this, control))
			// control.on(Phaser.Input.Events.DRAG_END, this.onCornerControlDragEnd.bind(this, control))
			//
			// this.scene.input.setDraggable(control)
		})
		
		this.add(this.cornerControls)
		
		this._top.corners = [this.topLeft, this.topRight]
		this._right.corners = [this.topRight, this.bottomRight]
		this._bottom.corners = [this.bottomRight, this.bottomLeft]
		this._left.corners = [this.bottomLeft, this.topLeft]
	}
	
	private createCornerControl(thickness = this.options.thickness): Phaser.GameObjects.Ellipse {
		return this.scene.add.ellipse(0, 0, thickness, thickness, this.ACTIVE_TINT)
	}
	
	private onCornerControlOver(control: CornerControl): void {
		control.setFillStyle(this.ACTIVE_TINT)
		this.bringToTop(control)
	}
	
	private onCornerControlOut(control: CornerControl): void {
		control.setFillStyle(this.INACTIVE_TINT)
	}
	
	private onCornerControlDragStart(control: CornerControl): void {
	
	}
	
	private onCornerControlDrag(control: CornerControl): void {
	
	}
	
	private onCornerControlDragEnd(control: CornerControl): void {
	
	}
	
	private updateCornerPositions(): void {
		let top = this._top.y
		let bottom = this._bottom.y
		let right = this._right.x
		let left = this._left.x
		
		this.topLeft.setPosition(left, top)
		this.topRight.setPosition(right, top)
		this.bottomRight.setPosition(right, bottom)
		this.bottomLeft.setPosition(left, bottom)
	}
	
	private addTexts() {
		this.topText = this.createText()
		this.topText.setOrigin(0, 1)
		
		this.bottomText = this.createText()
		this.bottomText.setOrigin(1, 0)
		
		this.leftText = this.createText()
		this.leftText.setOrigin(1, 0)
		
		this.rightText = this.createText()
		this.rightText.setOrigin(0, 1)
		
		this.texts = [this.topText, this.bottomText, this.rightText, this.leftText]
		this.texts.forEach(text => {
			text.kill()
		})
	}
	
	private createText(): Phaser.GameObjects.BitmapText {
		let text = this.scene.add.bitmapText(0, 0, BitmapFont.AXES_DIGITS, "0", 24)
		this.add(text)
		
		return text
	}
	
	private updateTexts(): void {
		let width = this.image.width.toString()
		let height = this.image.height.toString()
		
		let margin = 10
		
		this.topText.setText(height)
		this.topText.x = this._left.x + margin
		this.topText.y = this._top.y - margin
		
		this.bottomText.setText(height)
		this.bottomText.x = this._right.x - margin
		this.bottomText.y = this._bottom.y + margin
		
		this.leftText.setText(width)
		this.leftText.x = this._left.x - margin
		this.leftText.y = this._top.y + margin
		
		this.rightText.setText(width)
		this.rightText.x = this._right.x + margin
		this.rightText.y = this._bottom.y - margin
	}
	
	public setImage(image: NinePatch): void {
		this.image = image
		
		let { top, bottom, left, right } = this.getImageBounds()
		
		this._left.displayHeight = bottom - top
		this._left.x = left
		
		this._right.displayHeight = bottom - top
		this._right.x = right
		
		this._top.displayWidth = right - left
		this._top.y = top
		
		this._bottom.displayWidth = right - left
		this._bottom.y = bottom
		
		this.updateCornerPositions()
	}
	
	private getImageBounds(): { top: number, bottom: number, left: number, right: number } | undefined {
		if (!this.image) {
			return
		}
		
		return {
			top: -this.image.height / 2,
			bottom: this.image.height / 2,
			left: -this.image.width / 2,
			right: this.image.width / 2,
		}
	}
	
	public setThickness(thickness: number) {
		this._top.displayHeight = thickness
		this._bottom.displayHeight = thickness
		this._left.displayWidth = thickness
		this._right.displayWidth = thickness
		
		this.options.thickness = thickness
	}
	
	public setPadding(padding: number) {
		this.options.padding = padding
	}
}
