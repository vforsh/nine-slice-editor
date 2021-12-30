import { EditorPanel } from "./EditorPanel"
import { ProjectConfig } from "../ProjectConfig"
import { ButtonApi, MonitorBindingApi } from "@tweakpane/core"

export type NineSlicePatchesPanelConfig = ProjectConfig["nineSlice"]

export class NineSlicePatchesPanel extends EditorPanel {
	
	public config: NineSlicePatchesPanelConfig
	private monitorConfig: { config: string }
	private monitor: MonitorBindingApi<string>
	public copyButton: ButtonApi
	
	constructor(scene: Phaser.Scene, container: HTMLElement, config: NineSlicePatchesPanelConfig) {
		super(scene, container, "Patches Config")
		
		this.config = config
		
		this.monitorConfig = {
			config: this.stringifyConfig(this.config),
		}
		
		this.monitor = this.panel.addMonitor(this.monitorConfig, "config", {
			multiline: true,
			lineCount: 6,
		})
		
		this.copyButton = this.panel.addButton({ title: "Copy to clipboard" })
	}
	
	private stringifyConfig(config: NineSlicePatchesPanelConfig): string {
		return JSON.stringify(config, null, "\t").replace(/"(\w+)"/gm, "$1")
	}
	
	public updateMonitor(): void {
		this.monitorConfig.config = this.stringifyConfig(this.config)
		this.monitor.refresh()
	}
	
	public getMonitorValue(): string {
		return this.monitorConfig.config
	}
	
}
