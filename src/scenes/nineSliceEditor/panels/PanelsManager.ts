import { NineSliceEditor } from "../NineSliceEditor"
import { GridPanel } from "./GridPanel"
import { ImportPanel } from "./ImportPanel"
import { ResizePanel } from "./ResizePanel"
import { NineSliceControlsPanel } from "./NineSliceControlsPanel"
import { NineSlicePatchesPanel } from "./NineSlicePatchesPanel"
import { ExportPanel } from "./ExportPanel"

export class PanelsManager extends Phaser.Events.EventEmitter {
	
	private readonly scene: NineSliceEditor
	public leftPanels: HTMLElement
	public rightPanels: HTMLElement
	
	public gridPanel: GridPanel
	public nineSlicePanel: NineSliceControlsPanel
	public resizePanel: ResizePanel
	
	public importPanel: ImportPanel
	public exportPanel: ExportPanel
	public nineSliceDataPanel: NineSlicePatchesPanel
	
	constructor(scene: NineSliceEditor) {
		super()
		
		this.scene = scene
		
		this.addPanelContainers()
		
		let config = this.scene.config
		
		// left panel
		this.gridPanel = new GridPanel(this.scene, this.leftPanels, config.grid)
		this.nineSlicePanel = new NineSliceControlsPanel(this.scene, this.leftPanels, config.nineSliceControls)
		this.resizePanel = new ResizePanel(this.scene, this.leftPanels, config.resizeControls)
		
		// right panels
		this.importPanel = new ImportPanel(this.scene, this.rightPanels, config.import)
		this.exportPanel = new ExportPanel(this.scene, this.rightPanels, config.export)
		this.nineSliceDataPanel = new NineSlicePatchesPanel(this.scene, this.rightPanels, config.nineSlice)
		
		this.addKeyboardCallbacks()
	}
	
	private addPanelContainers() {
		this.leftPanels = this.getPanelsContainer("left-sidebar")
		this.rightPanels = this.getPanelsContainer("right-sidebar")
		
		let zoom = this.scene.game.store.getValue("editor_zoom")
		this.setZoom(zoom)
	}
	
	private getPanelsContainer(elementId: string): HTMLDivElement {
		return document.getElementById(elementId) as HTMLDivElement ?? this.createPanelsContainer(elementId)
	}
	
	private createPanelsContainer(elementId: string): HTMLDivElement {
		let container = document.createElement("div")
		container.id = elementId
		container.classList.add("editor-panels")
		
		this.scene.game.canvas.parentNode.insertBefore(container, this.scene.game.canvas.nextSibling)
		
		return container
	}
	
	public enablePanels(): void {
		this.leftPanels.classList.remove("disable-panel-input")
		this.rightPanels.classList.remove("disable-panel-input")
	}
	
	public disablePanels(): void {
		this.leftPanels.classList.add("disable-panel-input")
		this.rightPanels.classList.add("disable-panel-input")
	}
	
	private addKeyboardCallbacks() {
		this.scene.onKeyDown("PLUS", (e: KeyboardEvent) => {
			if (e.shiftKey) {
				this.changeZoom(0.05)
			}
		})
		
		this.scene.onKeyDown("MINUS", (e: KeyboardEvent) => {
			if (e.shiftKey) {
				this.changeZoom(-0.05)
			}
		})
		
		this.scene.onKeyDown("ZERO", (e: KeyboardEvent) => {
			if (e.shiftKey) {
				this.setZoom(1)
			}
		})
	}
	
	public changeZoom(delta = 0.1): void {
		let currentZoom = this.scene.game.store.getValue("editor_zoom")
		currentZoom = Math.max(0.2, currentZoom + delta)
		currentZoom = Phaser.Math.RoundTo(currentZoom, -2)
		this.setZoom(currentZoom)
	}
	
	public setZoom(value: number): void {
		let transform = `scale(${value})`
		let width = `${(100 / value).toFixed(0)}%`
		this.rightPanels.style.transform = transform
		this.rightPanels.style.width = width
		this.leftPanels.style.transform = transform
		this.leftPanels.style.width = width
		this.scene.game.store.saveValue("editor_zoom", value)
	}
	
	public destroy(): void {
		super.destroy()
		
		this.gridPanel.destroy()
		this.nineSlicePanel.destroy()
		this.resizePanel.destroy()
		
		this.importPanel.destroy()
	}
}
