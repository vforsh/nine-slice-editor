type Vector2Like = Phaser.Types.Math.Vector2Like
type Control = Phaser.GameObjects.Image

export enum NineSliceControlsEvent {
	PATCHES_CHANGE = "NineSliceControls_PATCHES_CHANGE",
}

/**
 * TODO
 * - add texts (top, bottom, left, right)
 * - use dotted lines
 */

export interface NineSliceControlsOptions {
	thickness: number
	padding: number
	symmetric: boolean
}

export class NineSliceControls extends Phaser.GameObjects.Container {
	
	private readonly INACTIVE_ALPHA = 0.8
	private readonly ACTIVE_ALPHA = 1
	
	public readonly options: NineSliceControlsOptions
	private _top: Control
	private _bottom: Control
	private _left: Control
	private _right: Control
	private controls: Control[]
	private image: NinePatch
	private tempVec: Vector2Like
	
	constructor(scene: Phaser.Scene, options: NineSliceControlsOptions) {
		super(scene)
		
		this.name = "nine-slice-controls"
		
		this.options = options
		
		this.tempVec = { x: 0, y: 0 }
		
		this.addControls()
		this.updateControlsHitAreas()
		this.setThickness(this.options.thickness)
		this.addTexts()
	}
	
	private addControls() {
		this._top = this.scene.add.image(0, 0, "__WHITE")
		this._bottom = this.scene.add.image(0, 0, "__WHITE")
		this._left = this.scene.add.image(0, 0, "__WHITE")
		this._right = this.scene.add.image(0, 0, "__WHITE")
		
		this.controls = [this._top, this._bottom, this._left, this._right]
		this.controls.forEach((control) => {
			control.alpha = this.INACTIVE_ALPHA
			control.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, this.onPointerOver.bind(this, control))
			control.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, this.onPointerOut.bind(this, control))
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
	
	private onPointerOver(control: Control): void {
		control.alpha = this.ACTIVE_ALPHA
	}
	
	private onPointerOut(control: Control): void {
		control.alpha = this.INACTIVE_ALPHA
	}
	
	private onDragStart(control: Control): void {
		// console.log("drag START", arguments)
	}
	
	private onDrag(control: Control, pointer: Phaser.Input.Pointer): void {
		let { x, y } = this.getLocalPointerPosition(pointer)
		let updateSymmetric = pointer.event.shiftKey || this.options.symmetric
		let center = { x: 0, y: 0 }
		let padding = this.options.padding
		
		if (control === this._top) {
			let min = -this.image.height / 2 + padding
			let max = center.y - padding
			this._top.y = Phaser.Math.Clamp(y, min, max)
			
			if (updateSymmetric) {
				let offset = this._top.y - (min - padding)
				this._bottom.y = this.image.height / 2 - offset
			}
		} else if (control === this._bottom) {
			let min = center.y + padding
			let max = this.image.height / 2 - padding
			this._bottom.y = Phaser.Math.Clamp(y, min, max)
			
			if (updateSymmetric) {
				let offset = (max + padding) - this._bottom.y
				this._top.y = -this.image.height / 2 + offset
			}
		} else if (control === this._left) {
			let min = -this.image.width / 2 + padding
			let max = center.x - padding
			this._left.x = Phaser.Math.Clamp(x, min, max)
			
			if (updateSymmetric) {
				let offset = this._left.x - (min - padding)
				this._right.x = this.image.width / 2 - offset
			}
		} else if (control === this._right) {
			let min = center.x + padding
			let max = this.image.width / 2 - padding
			this._right.x = Phaser.Math.Clamp(x, min, max)
			
			if (updateSymmetric) {
				let offset = (max + padding) - this._right.x
				this._left.x = -this.image.width / 2 + offset
			}
		}
	}
	
	private getLocalPointerPosition(pointer: Phaser.Input.Pointer): Vector2Like {
		pointer.positionToCamera(this.scene.cameras.main, this.tempVec)
		this.pointToContainer(this.tempVec, this.tempVec)
		
		return this.tempVec
	}
	
	private onDragEnd(control: Control): void {
		this.emit(NineSliceControlsEvent.PATCHES_CHANGE, this.getPatches())
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
	
	private addTexts() {
	
	}
	
	public setImage(image: NinePatch): void {
		this.image = image
		
		let { top, bottom, left, right } = this.getImageBounds()
		
		let config = this.image.config
		
		this._left.displayHeight = bottom - top
		this._left.x = left + config.left
		
		this._right.displayHeight = bottom - top
		this._right.x = right - config.right
		
		this._top.displayWidth = right - left
		this._top.y = top + config.top
		
		this._bottom.displayWidth = right - left
		this._bottom.y = bottom - config.bottom
	}
	
	public getPatches(): IPatchesConfig | undefined {
		if (!this.image) {
			return
		}
		
		let { top, bottom, left, right } = this.getImageBounds()
		
		return {
			top: this._top.y - top,
			bottom: bottom - this._bottom.y,
			left: this._left.x - left,
			right: right - this._right.x,
		}
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
	
	public setUniformUpdate(value: boolean) {
		this.options.symmetric = value
	}
}
