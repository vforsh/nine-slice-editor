import { BaseScene } from "../../robowhale/phaser3/scenes/BaseScene"
import { ScaleType } from "../../robowhale/phaser3/scenes/Scaler"
import { PanelsManager } from "./panels/PanelsManager"
import { BrowserSyncService } from "../../BrowserSyncService"
import { Config } from "../../Config"
import { cloneDeep, merge } from "lodash-es"
import { blobToImage } from "../../robowhale/phaser3/utils/blob-to-json"
import { DEFAULT_CONFIG, ProjectConfig, RGB, RGBA } from "./ProjectConfig"
import { Grid } from "./Grid"
import { GridPanelConfig } from "./panels/GridPanel"
import { JsonValue } from "type-fest"
import { IPatchesConfig, NinePatch } from "@koreez/phaser3-ninepatch"
import { NineSliceControls, NineSliceControlsEvent } from "./NineSliceControls"
import { ResizeControls, ResizeControlsEvent } from "./ResizeControls"
import { NineSliceControlsPanelConfig } from "./panels/NineSliceControlsPanel"
import { ResizePanelConfig } from "./panels/ResizePanel"
import { UrlParams } from "../../UrlParams"
import { copyToClipboard } from "../../robowhale/utils/copy-to-clipboard"
import { renderTextureToBlob } from "../../robowhale/phaser3/utils/render-texture-to-blob"
import { downloadBlob } from "../../robowhale/phaser3/utils/download-blob"
import slash from "slash"
import { type ExecaReturnValue } from "execa"
import { GetTexturePackerPathPanel } from "./modals/GetTexturePackerPathPanel"
import { ModalPanelEvent } from "./modals/ModalPanel"
import RenderTexture = Phaser.GameObjects.RenderTexture

export class NineSliceEditor extends BaseScene {
	
	public static readonly DEFAULT_IMAGE = "default-image"
	
	public isReady: boolean
	public config: ProjectConfig
	private panels: PanelsManager
	private background: Phaser.GameObjects.Image
	private grid: Grid
	private image: NinePatch
	private nineSliceControls: NineSliceControls
	private resizeControls: ResizeControls
	
	public init(): void {
		super.init()
		
		this.isReady = false
		this.config = cloneDeep(DEFAULT_CONFIG)
	}
	
	public preload(): void {
		this.load.image(NineSliceEditor.DEFAULT_IMAGE, "assets/graphics/board.png")
	}
	
	public async create() {
		let texture = UrlParams.get("texture")
		let atlas = UrlParams.get("atlas")
		let frame = UrlParams.get("frame")
		
		if (!texture) {
			this.doCreate()
			return
		}
		
		if (texture && !atlas && !frame) {
			let { textureKey } = await this.loadSingleTexture(texture)
			this.doCreate(textureKey)
			return
		}
		
		if (texture && atlas && !frame) {
			// TODO log frames list to the console
			frame = prompt("Please set the frame to load")
			let { textureKey } = await this.loadAtlas(texture, atlas, frame)
			this.doCreate(textureKey, frame)
			return
		}
		
		if (texture && !atlas && frame) {
			atlas = prompt("Please set path to the atlas JSON data")
			let { textureKey } = await this.loadAtlas(texture, atlas, frame)
			this.doCreate(textureKey, frame)
			return
		}
		
		if (texture && atlas && frame) {
			let { textureKey } = await this.loadAtlas(texture, atlas, frame)
			this.doCreate(textureKey, frame)
		}
	}
	
	public doCreate(textureKey?: string, frame?: string) {
		this.initCanvasDrop()
		this.addPanels()
		this.addBackground()
		this.addGrid()
		this.addImage(textureKey ?? NineSliceEditor.DEFAULT_IMAGE, frame)
		this.addNineSliceControls()
		this.addResizeControls()
		
		this.nineSliceControls.revive()
		this.nineSliceControls.setImage(this.image)
		
		this.resizeControls.revive()
		this.resizeControls.setImage(this.image)
		
		this.updateBackgroundColor(this.rgbaToNumber(this.config.grid.bgColor))
		
		this.addKeyboardCallbacks()
		
		this.addPointerCallbacks()
		
		this.isReady = true
		this.resize()
	}
	
	private initCanvasDrop() {
		let canvas = this.game.canvas
		if (canvas.ondrop !== null) {
			return
		}
		
		canvas.ondragenter = (evt) => {
			// TODO show drop overlay
		}
		
		canvas.ondragleave = (evt) => {
			// TODO hide drop overlay
		}
		
		canvas.ondragover = (evt) => {
			evt.preventDefault()
		}
		
		canvas.ondrop = (evt) => {
			evt.preventDefault()
			
			let files = this.getFiles(evt.dataTransfer)
			this.handleDroppedFiles(files)
		}
	}
	
	private getFiles(dataTransfer: DataTransfer): File[] {
		if (dataTransfer.files) {
			return Array.from(dataTransfer.files)
		}
		
		return Array.from(dataTransfer.items)
			.filter(item => item.kind === "file")
			.map(item => item.getAsFile())
	}
	
	private handleDroppedFiles(files: File[]): void {
		if (files.length === 1) {
			this.handleDroppedTexture(files[0])
			return
		}
		
		this.handleDroppedAtlas(files)
	}
	
	private async handleDroppedTexture(file: File) {
		if (file.type.includes("image") === false) {
			console.warn(`Wrong file type - ${file.type}! Please drop an image!`)
			return
		}
		
		let key = Phaser.Math.RND.uuid()
		let image = await blobToImage(file)
		this.textures.addImage(key, image)
		this.updateImage(key)
	}
	
	private async handleDroppedAtlas(files: File[]) {
		console.log(`handling dropped atlas...`, { files })
	}
	
	private addPanels() {
		this.panels = new PanelsManager(this)
		this.panels.gridPanel.on("change", this.onGridChange, this)
		this.panels.nineSlicePanel.on("change", this.onNineSliceSettingsChange.bind(this))
		this.panels.resizePanel.on("change", this.onResizeSettingsChange.bind(this))
		this.panels.importPanel.loadButton.on("click", this.onLoadImageButtonClick.bind(this))
		this.panels.exportPanel.exportButton.on("click", this.onExportButtonClick.bind(this))
		this.panels.nineSliceDataPanel.copyButton.on("click", this.onCopyPatchesConfigButtonClick.bind(this))
	}
	
	private onGridChange<K extends keyof GridPanelConfig>(config: GridPanelConfig, prop: K, value: GridPanelConfig[K]): void {
		if (config.display) {
			this.grid.revive()
		} else {
			this.grid.kill()
		}
		
		this.redrawGrid()
	}
	
	private onNineSliceSettingsChange(config: NineSliceControlsPanelConfig, prop: keyof NineSliceControlsPanelConfig): void {
		switch (prop) {
			case "display":
				if (config.display) {
					this.nineSliceControls.revive()
				} else {
					this.nineSliceControls.kill()
				}
				break
			
			case "thickness":
				this.nineSliceControls.setThickness(config.thickness)
				break
			
			case "padding":
				this.nineSliceControls.setPadding(config.padding)
				break
			
			case "symmetric":
				this.nineSliceControls.setUniformUpdate(config.symmetric)
				break
			
			default:
				break
		}
	}
	
	private onResizeSettingsChange(config: ResizePanelConfig, prop: keyof ResizePanelConfig): void {
		switch (prop) {
			case "display":
				if (config.display) {
					this.resizeControls.revive()
				} else {
					this.resizeControls.kill()
				}
				break
			
			case "thickness":
				this.resizeControls.setThickness(config.thickness)
				break
			
			case "padding":
				this.resizeControls.setPadding(config.padding)
				break
			
			default:
				break
		}
	}
	
	private async onExportButtonClick() {
		this.panels.exportPanel.exportButton.disabled = true
		
		let rt = this.createRenderTextureFromNinepatch(this.image)
		let blob = await renderTextureToBlob(rt)
		
		rt.destroy()
		
		let texturePath = this.config.export.texture
		if (!texturePath) {
			await downloadBlob(blob, "image.png")
			this.panels.exportPanel.exportButton.disabled = false
			return
		}
		
		BrowserSyncService.writeFile(texturePath, blob)
			.then(response => this.onExportComplete(response))
			.catch(error => console.log(`Can't save texture!`, error))
			.finally(() => {
				this.panels.exportPanel.exportButton.disabled = false
			})
	}
	
	private createRenderTextureFromNinepatch(source: NinePatch): RenderTexture {
		let rt = this.make.renderTexture({ width: source.width, height: source.height }, false)
		rt.draw(source, source.width / 2, source.height / 2)
		
		return rt
	}
	
	private async onExportComplete(response: Response) {
		let json = await response.json()
		console.log("NineSliceEditor.onExportComplete", json)
		
		console.group("Texture was exported! ✔")
		// console.log(`Texture: ${texture}`)
		// console.log(`Project: ${project}`)
		
		let texturePacker = this.config.export.texturePacker
		if (texturePacker) {
			let { error } = await this.updateTexturePackerProject(texturePacker)
			if (error) {
				console.warn("Can't update Texture Packer project!\n", error)
			} else {
				console.log(`Texture Packer Project: file:///${texturePacker}`)
			}
		}
		
		console.groupEnd()
	}
	
	private async updateTexturePackerProject(texturePackerProjectPath: string): Promise<{ error? }> {
		try {
			let texturePackerExePath = await this.getTexturePackerExePath()
			if (!texturePackerExePath) {
				throw "Path to TexturePacker.exe is not set!"
			}
			
			let command = `"${slash(texturePackerExePath)}" ${texturePackerProjectPath}`
			let response = await BrowserSyncService.command(command, { shell: true })
			let result = (await response.json()) as { success: boolean, error?, data? }
			if (!result.success) {
				throw result.error
			}
			
			let data = result.data as ExecaReturnValue
			if (data.exitCode !== 0) {
				throw data
			}
			
			return {}
		} catch (error) {
			return { error }
		}
	}
	
	private async getTexturePackerExePath(): Promise<string> {
		let path = this.game.store.getValue("texture_packer_exe")
		if (path) {
			return path
		}
		
		path = await this.promptTexturePackerExePath()
		
		if (path) {
			this.game.store.saveValue("texture_packer_exe", slash(path))
		}
		
		return path
	}
	
	private promptTexturePackerExePath(): Promise<string> {
		return new Promise((resolve, reject) => {
			let panel = new GetTexturePackerPathPanel(this, { path: "" })
			
			panel.once(ModalPanelEvent.OK_CLICK, () => {
				resolve(panel.config.path)
				panel.hide()
			})
			
			panel.once(ModalPanelEvent.HIDE, () => {
				resolve(null)
			})
			
			panel.show()
		})
	}
	
	private onCopyPatchesConfigButtonClick(): void {
		let value = this.panels.nineSliceDataPanel.getMonitorValue()
		
		copyToClipboard(value)
			.then(() => console.log(`Patches config was copied to clipboard ✔`))
			.catch(error => console.log(`Can't copy patches config to clipboard!`, error))
	}
	
	private async onLoadImageButtonClick() {
		let { texture, atlas, frame } = this.config.import
		
		if (!texture) {
			console.warn("Please set path to the texture file!")
			return
		}
		
		if (frame && !atlas) {
			console.warn("Please set path to the atlas file!")
			return
		}
		
		if (texture && !frame) {
			this.loadSingleTexture(texture)
			return
		}
		
		if (texture && frame) {
			this.loadAtlas(texture, atlas, frame)
		}
	}
	
	private async loadTexture(path: string): Promise<HTMLImageElement> {
		let response = await BrowserSyncService.readFile(path)
		let blob = await response.blob()
		return blobToImage(blob)
	}
	
	private async loadAtlasData(path: string): Promise<JsonValue> {
		let response = await BrowserSyncService.readFile(path)
		return response.json()
	}
	
	private async loadSingleTexture(path: string): Promise<{ textureKey: string }> {
		let image = await this.loadTexture(path)
		let key = Phaser.Math.RND.uuid()
		this.textures.addImage(key, image)
		
		return { textureKey: key }
		
		// this.updateImage(key)
	}
	
	private async loadAtlas(texturePath: string, atlasPath: string, frame: string): Promise<{ textureKey: string, frame: string }> {
		let key = Phaser.Math.RND.uuid()
		let [texture, atlas] = await Promise.all([
			this.loadTexture(texturePath),
			this.loadAtlasData(atlasPath),
		])
		
		this.textures.addAtlas(key, texture, atlas as object)
		
		return {
			textureKey: key,
			frame,
		}
		
		// this.updateImage(key, frame)
	}
	
	private updateImage(key: string, frame?: string): void {
		this.image?.destroy()
		
		let { width, height } = this.textures.getFrame(key, frame)
		
		let patches: IPatchesConfig = {
			top: height * 0.25,
			bottom: height * 0.25,
			left: width * 0.25,
			right: width * 0.25,
		}
		
		this.image = this.add.ninePatch(0, 0, width, height, key, frame, patches)
		this.pin(this.image, 0.5, 0.5)
		this.pinner.align(this.image, Config.GAME_WIDTH, Config.GAME_HEIGHT, Config.ASSETS_SCALE)
		
		this.updatePatchesMonitor(this.image["config"])
	}
	
	private updatePatchesMonitor(config: IPatchesConfig): void {
		merge(this.config.nineSlice, config)
		this.panels.nineSliceDataPanel.updateMonitor()
	}
	
	private rgbaToNumber(rgb: RGBA | RGB): number {
		let { r, g, b } = rgb
		let a = rgb["a"] ?? 1
		
		return Phaser.Display.Color.GetColor32(r, g, b, a)
	}
	
	private updateBackgroundColor(color: number): void {
		let { r, g, b, a } = Phaser.Display.Color.ColorToRGBA(color)
		this.game.canvas.parentElement.style.backgroundColor = `rgba(${r},${g},${b},${a})`
		
		this.background?.setTintFill(color)
	}
	
	private addBackground() {
		this.background = this.add.image(0, 0, "__WHITE")
		this.size(this.background, ScaleType.FILL)
		this.pin(this.background, 0.5, 0.5)
	}
	
	private addGrid() {
		this.grid = new Grid(this)
		this.add.existing(this.grid)
		this.pin(this.grid, 0.5, 0.5)
	}
	
	private addImage(textureKey: string, frame?: string) {
		this.updateImage(textureKey, frame)
	}
	
	private addNineSliceControls() {
		this.nineSliceControls = new NineSliceControls(this, this.config.nineSliceControls)
		this.nineSliceControls.kill()
		this.nineSliceControls.setDepth(200)
		this.nineSliceControls.on(NineSliceControlsEvent.PATCHES_CHANGE, this.onPatchesChange, this)
		this.add.existing(this.nineSliceControls)
		this.pin(this.nineSliceControls, 0.5, 0.5)
	}
	
	private onPatchesChange(patches: IPatchesConfig): void {
		this.updatePatchesMonitor(patches)
		
		/*let { width, height } = this.image
		let frame = this.textures.getFrame("nine-patch")
		
		console.log("NineSliceEditor.onPatchesChange", patches)
		
		this.image.destroy()
		
		this.image = this.add.ninePatch(0, 0, width, height, frame.texture.key, null, patches)
		// this.image.resize(width, height)
		this.pin(this.image, 0.5, 0.5)
		this.pinner.align(this.image, Config.GAME_WIDTH, Config.GAME_HEIGHT, Config.ASSETS_SCALE)
		
		this.nineSliceControls.syncWithImage(this.image)*/
	}
	
	private addResizeControls() {
		this.resizeControls = new ResizeControls(this, this.config.resizeControls)
		this.resizeControls.kill()
		this.resizeControls.setDepth(201)
		this.resizeControls.on(ResizeControlsEvent.RESIZE, this.onSizeChange, this)
		this.add.existing(this.resizeControls)
		this.pin(this.resizeControls, 0.5, 0.5)
	}
	
	private onSizeChange(size: { width: number, height: number }): void {
		this.image.resize(size.width, size.height)
		this.nineSliceControls.setImage(this.image)
	}
	
	private addKeyboardCallbacks() {
	
	}
	
	private addPointerCallbacks() {
		this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this)
		this.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onPointerWheel, this)
		this.input.on(Phaser.Input.Events.GAME_OUT, this.onPointerGameOut, this)
	}
	
	private onPointerDown(pointer: Phaser.Input.Pointer): void {
	
	}
	
	private onPointerWheel(pointer: Phaser.Input.Pointer, objects, dx, dy: number): void {
		/*if (!this.image) {
			return
		}
		
		let { width, height } = this.image
		
		if (pointer.event.shiftKey) {
			width += 10 * Phaser.Math.Sign(dy)
		} else {
			height += 10 * Phaser.Math.Sign(dy)
		}
		
		this.image.resize(width, height)*/
		
		let camera = this.cameras.main
		let delta = Phaser.Math.Sign(dy) * -0.1
		camera.zoom = Math.max(0.1, camera.zoom + delta)
	}
	
	private onPointerGameOut(): void {
	
	}
	
	public resize(): void {
		super.resize()
		
		if (!this.isReady) {
			return
		}
		
		this.redrawGrid()
	}
	
	private redrawGrid() {
		this.grid.redraw({
			width: Config.GAME_WIDTH,
			height: Config.GAME_HEIGHT,
			...this.config.grid,
		})
	}
	
	public onShutdown() {
		super.onShutdown()
		
		this.panels.destroy()
		this.panels = null
	}
}
