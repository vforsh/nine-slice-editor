import { IPatchesConfig } from "@koreez/phaser3-ninepatch"

export type RGB = {
	r: number
	g: number
	b: number
}
export type RGBA = RGB & {
	a: number
}

export interface ProjectConfig {
	grid: {
		bgColor: RGB
		xStep: number
		yStep: number
		color: RGB
		alpha: number
		thickness: number
		display: boolean
	},
	nineSliceControls: {
		thickness: number
		padding: number
		symmetric: boolean
		display: boolean
	},
	resizeControls: {
		thickness: number
		padding: number
		display: boolean
	},
	import: {
		texture: string
		atlas: string
		frame: string
	},
	export: {
		texture: string
		texturePacker: string
	},
	nineSlice: Required<IPatchesConfig>,
}

export const DEFAULT_CONFIG: ProjectConfig = Object.freeze({
	grid: {
		bgColor: { r: 104, g: 104, b: 104 },
		xStep: 20,
		yStep: 20,
		color: { r: 255, g: 255, b: 255 },
		alpha: 0.25,
		thickness: 1,
		display: true,
	},
	nineSliceControls: {
		padding: 5,
		thickness: 2,
		symmetric: true,
		display: true,
	},
	resizeControls: {
		padding: 10,
		thickness: 2,
		display: true,
	},
	import: {
		texture: "",
		atlas: "",
		frame: "",
	},
	export: {
		texture: "",
		texturePacker: "",
	},
	nineSlice: {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
	},
})
