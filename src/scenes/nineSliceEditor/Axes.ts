import { RGB } from "./ProjectConfig"
import { rgbaToNumber } from "./rgba-to-number"
import { times } from "lodash-es"
import { BitmapFont } from "../../GameFonts"

export interface AxesOptions {
	width: number
	height: number
	step: number
	subSteps: number
	thickness: number
	color: RGB
	alpha: number
}

export class Axes extends Phaser.GameObjects.Container {
	
	private graphics: Phaser.GameObjects.Graphics
	private texts: Phaser.GameObjects.BitmapText[]
	
	private readonly axisLength = 2400
	private readonly stepHeight = 10
	private readonly subStepHeight = 4
	
	constructor(scene: Phaser.Scene) {
		super(scene)
		
		this.name = "axes"
		
		this.graphics = this.scene.add.graphics()
		this.add(this.graphics)
		
		this.texts = times(100, () => this.createText())
	}
	
	private createText(): Phaser.GameObjects.BitmapText {
		let text = this.scene.add.bitmapText(0, 0, BitmapFont.AXES_DIGITS, "0", 18)
		text.kill()
		
		this.add(text)
		
		return text
	}
	
	public redraw(options: AxesOptions): void {
		this.alpha = options.alpha
		
		this.graphics.clear()
		this.graphics.lineStyle(options.thickness, rgbaToNumber(options.color))
		
		this.texts.forEach(text => text.kill())
		
		this.drawXAxis(options)
		this.drawYAxis(options)
	}
	
	private drawXAxis(options: AxesOptions) {
		let left = -options.width / 2
		let right = options.width / 2
		this.graphics.lineBetween(left, 0, right, 0)
		
		let textTint = rgbaToNumber(options.color)
		
		let stepSize = options.step
		let subStepSize = stepSize / options.subSteps
		let start = Phaser.Math.Snap.Floor(left, stepSize)
		let end = Phaser.Math.Snap.Ceil(right, stepSize)
		for (let x = start; x <= end; x += stepSize) {
			if (x !== 0) {
				this.graphics.lineBetween(x, -this.stepHeight, x, this.stepHeight)
				this.addText(x, 20, Math.abs(x).toString(), textTint).setOrigin(0.5, 0)
			}
			
			if (x !== end) {
				for (let i = 1; i <= options.subSteps - 1; i++) {
					let subStepX = x + subStepSize * i
					this.graphics.lineBetween(subStepX, -this.subStepHeight, subStepX, this.subStepHeight)
				}
			}
		}
	}
	
	private drawYAxis(options: AxesOptions) {
		let top = -options.height / 2
		let bottom = options.height / 2
		this.graphics.lineBetween(0, top, 0, bottom)
		
		let textTint = rgbaToNumber(options.color)
		
		let stepSize = options.step
		let subStepSize = stepSize / options.subSteps
		let start = Phaser.Math.Snap.Floor(top, stepSize)
		let end = Phaser.Math.Snap.Ceil(bottom, stepSize)
		for (let y = start; y <= end; y += stepSize) {
			if (y !== 0) {
				this.graphics.lineBetween(-this.stepHeight, y, this.stepHeight, y)
				this.addText(-20, y, Math.abs(y).toString(), textTint).setOrigin(1, 0.5)
			}
			
			if (y !== end) {
				for (let i = 1; i <= options.subSteps - 1; i++) {
					let subStep = y + subStepSize * i
					this.graphics.lineBetween(-this.subStepHeight, subStep, this.subStepHeight, subStep)
				}
			}
		}
	}
	
	private addText(x: number, y: number, content: string, tint: number): Phaser.GameObjects.BitmapText {
		let text = this.texts.find(text => !text.active)
		if (!text) {
			text = this.createText()
			this.texts.push(text)
		}
		
		text.x = x
		text.y = y
		text.setText(content)
		text.setTint(tint)
		text.revive()
		
		return text
	}
}
