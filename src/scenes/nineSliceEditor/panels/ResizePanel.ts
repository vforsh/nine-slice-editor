import { EditorPanel } from "./EditorPanel"
import { ProjectConfig } from "../ProjectConfig"

export type ResizePanelConfig = ProjectConfig["resizeControls"]

export class ResizePanel extends EditorPanel {
	
	public config: ResizePanelConfig
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: ResizePanelConfig) {
		super(scene, container, "Resize Controls")
		
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
		
		this.panel.addInput(this.config, "display")
			.on("change", (e) => this.emit("change", this.config, e.presetKey, e.value))
	}
}
