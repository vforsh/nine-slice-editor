import { ModalPanel } from "./ModalPanel"
import { InputBindingApi } from "@tweakpane/core"

export interface SetImageSizePanelConfig {
	width: number
	height: number
	minWidth: number
	minHeight: number
}

export class SetImageSizePanel extends ModalPanel<SetImageSizePanelConfig> {
	
	private widthInput: InputBindingApi<unknown, number>
	private heightInput: InputBindingApi<unknown, number>
	
	constructor(scene: Phaser.Scene, config: SetImageSizePanelConfig) {
		super(scene, "Set Image Size")
		
		this.config = config
		
		this.widthInput = this.panel.addInput(this.config, "width", { step: 1, min: this.config.minWidth, max: 2000 })
		this.widthInput.controller_.view.element.addEventListener('wheel', ({ deltaX, deltaY, shiftKey }) => {
			let delta = shiftKey ? -Math.sign(deltaX) * 10 : -Math.sign(deltaY)
			this.config.width = Phaser.Math.Clamp(this.config.width + delta, this.config.minWidth, 2000)
			this.widthInput.refresh()
		})
		
		this.heightInput = this.panel.addInput(this.config, "height", { step: 1, min: this.config.minHeight, max: 2000 })
		this.heightInput.controller_.view.element.addEventListener('wheel', ({ deltaX, deltaY, shiftKey }) => {
			let delta = shiftKey ? -Math.sign(deltaX) * 10 : -Math.sign(deltaY)
			this.config.height = Phaser.Math.Clamp(this.config.height + delta, this.config.minWidth, 2000)
			this.heightInput.refresh()
		})
		
		this.addCancelButton()
		this.addOkButton()
		
		this.addKeyboardCallbacks()
	}
	
	private addKeyboardCallbacks() {
		let keyboard = this.scene.input.keyboard
		
		keyboard.on(`keydown-UP`, (event: KeyboardEvent) => {
			let delta = event.shiftKey ? 10 : 1
			this.config.height = this.config.height + delta
			this.refreshConfig(this.config)
		}, this)
		
		keyboard.on(`keydown-DOWN`, (event: KeyboardEvent) => {
			let delta = event.shiftKey ? 10 : 1
			this.config.height = Math.max(this.config.minHeight, this.config.height - delta)
			this.refreshConfig(this.config)
		}, this)
		
		keyboard.on(`keydown-RIGHT`, (event: KeyboardEvent) => {
			let delta = event.shiftKey ? 10 : 1
			this.config.width = this.config.width + delta
			this.refreshConfig(this.config)
		}, this)
		
		keyboard.on(`keydown-LEFT`, (event: KeyboardEvent) => {
			let delta = event.shiftKey ? 10 : 1
			this.config.width = Math.max(this.config.minWidth, this.config.width - delta)
			this.refreshConfig(this.config)
		}, this)
	}
	
	public destroy() {
		this.removeKeyboardCallbacks()
		
		super.destroy()
	}
	
	private removeKeyboardCallbacks(): void {
		let keyboard = this.scene.input.keyboard
		
		keyboard.off(`keydown-UP`, null, this)
		keyboard.off(`keydown-DOWN`, null, this)
		keyboard.off(`keydown-RIGHT`, null, this)
		keyboard.off(`keydown-LEFT`, null, this)
	}
	
}
