import { EditorPanel } from "./EditorPanel"
import { ProjectConfig } from "../ProjectConfig"

export type AxesPanelConfig = ProjectConfig["axes"]

export class AxesPanel extends EditorPanel {
	
	private config: AxesPanelConfig
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: AxesPanelConfig) {
		super(scene, container, "Axes")
		
		this.config = config
		
		this.panel.addInput(this.config, "step", {
			step: 10,
			min: 10,
			max: 200,
		}).on("change", event => this.emit("change", this.config, event.presetKey, event.value))
		
		this.panel.addInput(this.config, "subSteps", {
			step: 1,
			min: 1,
			max: 10,
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
			step: 0.5,
			min: 1,
			max: 5,
		}).on("change", event => this.emit("change", this.config, event.presetKey, event.value))
		
		this.panel.addInput(this.config, "display").on("change", event => this.emit("change", this.config, event.presetKey, event.value))
	}
	
}
