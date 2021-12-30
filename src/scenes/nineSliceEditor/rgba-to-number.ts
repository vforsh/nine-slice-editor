import { RGB, RGBA } from "./ProjectConfig"

export function rgbaToNumber(rgb: RGBA | RGB): number {
	let { r, g, b } = rgb
	let a = rgb["a"] ?? 1
	
	return Phaser.Display.Color.GetColor32(r, g, b, a)
}
