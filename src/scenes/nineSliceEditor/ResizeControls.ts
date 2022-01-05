import { NinePatch } from "@koreez/phaser3-ninepatch"

export enum ResizeControlsEvent {
	RESIZE = "ResizeControls_RESIZE",
}

type ResizeControl = Phaser.GameObjects.Image & { corners?: CornerControl[] }

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
	private topLeft: CornerControl
	private topRight: CornerControl
	private bottomRight: CornerControl
	private bottomLeft: CornerControl
	private cornerControls: CornerControl[]
	private image: NinePatch
	
	constructor(scene: Phaser.Scene, options: ResizeControlsOptions) {
		super(scene)
		
		this.name = "resize-controls"
		this.options = options
		this.addControls()
		this.addCornerControls()
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
			control.on(Phaser.Input.Events.DRAG_START, this.onDragStart.bind(this, control))
			control.on(Phaser.Input.Events.DRAG, this.onDrag.bind(this, control))
			control.on(Phaser.Input.Events.DRAG_END, this.onDragEnd.bind(this, control))
			control.setInteractive()
			control.input.cursor = "pointer"
			
			this.scene.input.setDraggable(control)
		})
		
		this.add(this.controls)
	}
	
	private onPointerOver(control: ResizeControl): void {
		control.setTintFill(this.ACTIVE_TINT)
		control.corners.forEach(corner => corner.setFillStyle(this.ACTIVE_TINT))
		
		this.bringToTop(control)
		this.bringToTop(control.corners[0])
		this.bringToTop(control.corners[1])
	}
	
	private onPointerOut(control: ResizeControl): void {
		control.setTintFill(this.INACTIVE_TINT)
		control.corners.forEach(corner => corner.setFillStyle(this.INACTIVE_TINT))
	}
	
	private onDragStart(control: ResizeControl): void {
		// console.log("drag START", arguments)
	}
	
	private onDrag(control: ResizeControl, pointer: Phaser.Input.Pointer): void {
		let position = this.pointToContainer({ x: pointer.x, y: pointer.y }) as { x: number, y: number }
		let center = { x: 0, y: 0 }
		
		let config = this.image.config
		let padding = this.options.padding
		let minWidth = config.left + config.right + padding * 2
		let minHeight = config.top + config.bottom + padding * 2
		
		if (control === this._top) {
			let max = center.y - minHeight / 2
			this._top.y = Math.min(position.y, max)
			
			let offset = center.y - this._top.y
			this._bottom.y = center.y + offset
		} else if (control === this._bottom) {
			let min = center.y + minHeight / 2
			this._bottom.y = Math.max(min, position.y)
			
			let offset = this._bottom.y - center.y
			this._top.y = center.y - offset
		} else if (control === this._left) {
			let max = center.x - minWidth / 2
			this._left.x = Math.min(max, position.x)
			
			let offset = center.x - this._left.x
			this._right.x = center.x + offset
		} else if (control === this._right) {
			let min = center.x + minWidth / 2
			this._right.x = Math.max(min, position.x)
			
			let offset = this._right.x - center.x
			this._left.x = center.x - offset
		}
		
		if (control === this._top || control === this._bottom) {
			this.updateVerticalLines()
		} else {
			this.updateHorizontalLines()
		}
		
		this.updateCornerPositions()
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
