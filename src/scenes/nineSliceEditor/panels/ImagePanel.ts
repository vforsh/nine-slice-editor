import { EditorPanel } from "./EditorPanel"
import { ProjectConfig } from "../ProjectConfig"
import { ButtonApi, MonitorBindingApi } from "@tweakpane/core"
import { JsonObject } from "type-fest"

export type ImagePanelConfig = ProjectConfig["image"]

export class ImagePanel extends EditorPanel {
	
	public config: ImagePanelConfig
	private sizeConfig: { data: string }
	private sizeMonitor: MonitorBindingApi<string>
	private patchesConfig: { data: string }
	private patchesMonitor: MonitorBindingApi<string>
	public copyButton: ButtonApi
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: ImagePanelConfig) {
		super(scene, container, "Image")
		
		this.config = config
		
		this.sizeConfig = { data: this.stringifyConfig(this.config.size) }
		this.sizeMonitor = this.panel.addMonitor(this.sizeConfig, "data", {
			multiline: true,
			lineCount: 4,
			label: "size",
		})
		
		this.panel.addSeparator()
		
		this.patchesConfig = { data: this.stringifyConfig(this.config.patches) }
		this.patchesMonitor = this.panel.addMonitor(this.patchesConfig, "data", {
			multiline: true,
			lineCount: 6,
			label: "patches",
		})
		
		this.copyButton = this.panel.addButton({ title: "Copy to clipboard" })
	}
	
	private stringifyConfig(config: JsonObject): string {
		return JSON.stringify(config, null, "\t").replace(/"(\w+)"/gm, "$1")
	}
	
	public updateSizeMonitor(): void {
		this.sizeConfig.data = this.stringifyConfig(this.config.size)
		this.sizeMonitor.refresh()
	}
	
	public getSizeMonitorValue(): string {
		return this.sizeConfig.data
	}
	
	public updatePatchesMonitor(): void {
		this.patchesConfig.data = this.stringifyConfig(this.config.patches)
		this.patchesMonitor.refresh()
	}
	
	public getPatchesMonitorValue(): string {
		return this.patchesConfig.data
	}
	
}
