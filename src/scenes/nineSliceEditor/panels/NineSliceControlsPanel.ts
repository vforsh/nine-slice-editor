import { EditorPanel } from "./EditorPanel"
import { ProjectConfig } from "../ProjectConfig"

export type NineSliceControlsPanelConfig = ProjectConfig["nineSliceControls"]

export class NineSliceControlsPanel extends EditorPanel {
	
	public config: NineSliceControlsPanelConfig
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: NineSliceControlsPanelConfig) {
		super(scene, container, "9-Slice Controls")
		
		this.config = config
		
		this.panel.addInput(this.config, "thickness", {
			step: 1,
			min: 1,
			max: 10,
		}).on("change", (e) => this.emit("change", this.config, e.presetKey, e.value))
		
		this.panel.addInput(this.config, "padding", {
			step: 1,
			min: 1,
			max: 50,
		}).on("change", (e) => this.emit("change", this.config, e.presetKey, e.value))
		
		this.panel.addInput(this.config, "symmetric")
			.on("change", (e) => this.emit("change", this.config, e.presetKey, e.value))
		
		this.panel.addInput(this.config, "display")
			.on("change", (e) => this.emit("change", this.config, e.presetKey, e.value))
	}
}
