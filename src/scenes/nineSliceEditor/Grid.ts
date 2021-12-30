import { RGB } from "./ProjectConfig"
import { rgbaToNumber } from "./rgba-to-number"

export interface GridOptions {
	width: number
	height: number
	xStep: number
	yStep: number
	thickness: number
	color: RGB
	alpha: number
}

export class Grid extends Phaser.GameObjects.Container {
	
	private graphics: Phaser.GameObjects.Graphics
	
	constructor(scene: Phaser.Scene) {
		super(scene)
		
		this.name = "grid"
		
		this.graphics = this.scene.add.graphics()
		this.add(this.graphics)
	}
	
	public redraw(options: GridOptions): void {
		this.graphics.clear()
		
		this.drawLines(options)
	}
	
	private drawLines(options: GridOptions) {
		this.graphics.lineStyle(options.thickness, rgbaToNumber(options.color), options.alpha)
		
		let { xStep, yStep, width, height } = options
		
		let left = Phaser.Math.Snap.Floor(-width / 2, xStep)
		let right = Phaser.Math.Snap.Ceil(width / 2, xStep)
		let top = Phaser.Math.Snap.Floor(-height / 2, yStep)
		let bottom = Phaser.Math.Snap.Ceil(height / 2, yStep)
		
		for (let x = left; x < right; x += xStep) {
			this.graphics.lineBetween(x, top, x, bottom)
		}
		
		for (let y = top; y <= bottom; y += yStep) {
			this.graphics.lineBetween(left, y, right, y)
		}
	}
}
