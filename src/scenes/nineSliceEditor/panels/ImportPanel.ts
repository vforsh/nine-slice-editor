import { EditorPanel } from "./EditorPanel"
import { ButtonApi } from "@tweakpane/core"
import { ProjectConfig } from "../ProjectConfig"

export type ImportPanelConfig = ProjectConfig["import"]

export class ImportPanel extends EditorPanel {
	
	public config: ImportPanelConfig
	public importButton: ButtonApi
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: ImportPanelConfig) {
		super(scene, container, "Import")
		
		this.config = config
		
		this.panel.addInput(this.config, "texture")
		this.panel.addInput(this.config, "atlas")
		this.panel.addInput(this.config, "frame")
		this.importButton = this.panel.addButton({ title: "Import" })
	}
}
