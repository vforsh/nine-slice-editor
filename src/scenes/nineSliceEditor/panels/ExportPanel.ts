import { EditorPanel } from "./EditorPanel"
import { ButtonApi } from "@tweakpane/core"
import { ProjectConfig } from "../ProjectConfig"

export type ExportPanelConfig = ProjectConfig["export"]

export class ExportPanel extends EditorPanel {
	
	public config: ExportPanelConfig
	public exportButton: ButtonApi
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: ExportPanelConfig) {
		super(scene, container, "Export")
		
		this.config = config
		
		this.panel.addInput(this.config, "texture")
		this.panel.addInput(this.config, "texturePacker")
		this.exportButton = this.panel.addButton({ title: "Export" })
	}
}
