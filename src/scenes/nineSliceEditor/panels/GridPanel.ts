import { EditorPanel } from "./EditorPanel"
import { ProjectConfig } from "../ProjectConfig"

export type GridPanelConfig = ProjectConfig["grid"]

export class GridPanel extends EditorPanel {
	
	private config: GridPanelConfig
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: GridPanelConfig) {
		super(scene, container, "Grid")
		
		this.config = config
		
		this.panel.addInput(this.config, "xStep", {
			step: 5,
			min: 1,
			max: 50,
		}).on("change", event => this.emit("change", this.config, event.presetKey, event.value))
		
		this.panel.addInput(this.config, "yStep", {
			step: 5,
			min: 1,
			max: 50,
		}).on("change", event => this.emit("change", this.config, event.presetKey, event.value))
		
		this.panel.addInput(this.config, "color", {
			input: "color.rgba",
		}).on("change", event => this.emit("change", this.config, event.presetKey, event.value))
		
		this.panel.addInput(this.config, "alpha", {
			step: 0.1,
			min: 0.1,
			max: 1,
		}).on("change", event => this.emit("change", this.config, event.presetKey, event.value))
		
		this.panel.addInput(this.config, "thickness", {
			step: 0.1,
			min: 0.3,
			max: 2,
		}).on("change", event => this.emit("change", this.config, event.presetKey, event.value))
		
		this.panel.addInput(this.config, "display").on("change", event => this.emit("change", this.config, event.presetKey, event.value))
	}
	
}
