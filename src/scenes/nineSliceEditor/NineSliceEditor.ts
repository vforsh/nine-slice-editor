import { BaseScene } from "../../robowhale/phaser3/scenes/BaseScene"
import { ScaleType } from "../../robowhale/phaser3/scenes/Scaler"
import { PanelsManager } from "./panels/PanelsManager"
import { BrowserSyncService } from "../../BrowserSyncService"
import { Config } from "../../Config"
import { cloneDeep, mergeWith } from "lodash-es"
import { blobToImage, blobToJson } from "../../robowhale/phaser3/utils/blob-to-json"
import { DEFAULT_CONFIG, ProjectConfig, SizeConfig } from "./ProjectConfig"
import { Axes } from "./Axes"
import { AxesPanelConfig } from "./panels/AxesPanel"
import { JsonValue } from "type-fest"
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
import { AtlasFramePickerScreen } from "./atlasFramePicker/AtlasFramePickerScreen"
import { NineSliceEditorDepth } from "./NineSliceEditorDepth"
import { PhaserScreenEvent } from "../../robowhale/phaser3/gameObjects/container/screen/Screen"
import { AtlasFramePickerPopupEvent } from "./atlasFramePicker/AtlasFramePickerPopup"
import { rgbaToNumber } from "./rgba-to-number"
import RenderTexture = Phaser.GameObjects.RenderTexture

export class NineSliceEditor extends BaseScene {
	
	public static readonly DEFAULT_IMAGE = "default-image"
	
	public isReady: boolean
	public config: ProjectConfig
	private uploadInput: HTMLInputElement
	private panels: PanelsManager
	private background: Phaser.GameObjects.Image
	private axes: Axes
	private image: NinePatch
	private nineSliceControls: NineSliceControls
	private resizeControls: ResizeControls
	private atlasFramePicker: AtlasFramePickerScreen
	
	public init(): void {
		super.init()
		
		this.isReady = false
		this.atlasFramePicker = null
		this.config = cloneDeep(DEFAULT_CONFIG)
	}
	
	public preload(): void {
		this.load.image(NineSliceEditor.DEFAULT_IMAGE, "assets/graphics/board.png")
		this.load.image("popup_back", "assets/graphics/popup_back.png")
		this.load.image("atlas_back", "assets/graphics/atlas_back.png")
	}
	
	public async create() {
		let texture = UrlParams.get("texture")
		let atlas = UrlParams.get("atlas")
		let frame = UrlParams.get("frame")
		
		if (!texture) {
			this.updateImportConfig({ texture, atlas, frame })
			this.doCreate()
			return
		}
		
		if (texture && !atlas && !frame) {
			let { textureKey } = await this.loadSingleTexture(texture)
			this.updateImportConfig({ texture, atlas, frame })
			this.doCreate(textureKey)
			return
		}
		
		if (texture && atlas && !frame) {
			let { textureKey } = await this.loadAtlas(texture, atlas)
			let frame = await this.promptAtlasFrame(textureKey)
			this.updateImportConfig({ texture, atlas, frame })
			this.doCreate(textureKey, frame)
			return
		}
		
		if (texture && !atlas && frame) {
			atlas = prompt("Please set path to the atlas JSON data")
			let { textureKey } = await this.loadAtlas(texture, atlas)
			this.updateImportConfig({ texture, atlas, frame })
			this.doCreate(textureKey, frame)
			return
		}
		
		if (texture && atlas && frame) {
			let { textureKey } = await this.loadAtlas(texture, atlas)
			this.updateImportConfig({ texture, atlas, frame })
			this.doCreate(textureKey, frame)
		}
	}
	
	private promptAtlasFrame(atlasKey: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let texture = this.textures.get(atlasKey)
			if (!texture) {
				return reject(`Atlas "${atlasKey}" doesn't exist!`)
			}
			
			this.atlasFramePicker = new AtlasFramePickerScreen(this, texture)
			this.atlasFramePicker.setDepth(NineSliceEditorDepth.ATLAS_FRAME_PICKER)
			
			this.atlasFramePicker.on(PhaserScreenEvent.SHOW, this.onAtlasFramePickerShow, this)
			
			this.atlasFramePicker.once(PhaserScreenEvent.HIDE_COMPLETE, () => {
				this.onAtlasFramePickerHideComplete()
				resolve(null)
			})
			
			this.atlasFramePicker.popup.once(AtlasFramePickerPopupEvent.FRAME_PICK, (frame: Phaser.Textures.Frame) => {
				this.onAtlasFramePickerHideComplete()
				resolve(frame.name)
			})
			
			this.atlasFramePicker.resize()
			this.atlasFramePicker.show()
			this.add.existing(this.atlasFramePicker)
		})
	}
	
	private onAtlasFramePickerShow(): void {
		this.cameras.main.zoom = 1
	}
	
	private onAtlasFramePickerHideComplete(): void {
		this.atlasFramePicker.destroy()
		this.atlasFramePicker = null
	}
	
	private updateImportConfig(importConfig: ProjectConfig["import"]): void {
		mergeWith(this.config.import, importConfig, (_, srcValue) => srcValue ?? "")
		this.panels?.importPanel.refresh()
	}
	
	public doCreate(textureKey?: string, frame?: string) {
		this.initUploadInput()
		this.initCanvasDrop()
		this.addPanels()
		this.addBackground()
		this.addGrid()
		this.addNineSliceImage({ textureKey: textureKey ?? NineSliceEditor.DEFAULT_IMAGE, frameName: frame })
		this.addNineSliceControls()
		this.addResizeControls()
		
		this.updateBackgroundColor(rgbaToNumber(this.config.axes.bgColor))
		
		this.updateSizeMonitor(this.getImageSizeConfig())
		this.updatePatchesMonitor(this.image.config)
		
		this.addKeyboardCallbacks()
		
		this.addPointerCallbacks()
		
		this.isReady = true
		this.resize()
	}
	
	private initUploadInput(): void {
		if (this.uploadInput) {
			return
		}
		
		this.uploadInput = document.getElementById("upload") as HTMLInputElement
		this.uploadInput.addEventListener("change", () => {
			let filesArr = Array.from(this.uploadInput.files)
			if (filesArr.length >= 1 && filesArr.length <= 2) {
				this.handleFiles(filesArr)
			}
		})
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
			this.handleFiles(files)
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
	
	private handleFiles(files: File[]): void {
		if (files.length === 1) {
			this.handleDroppedTexture(files[0])
			return
		}
		
		if (files.length === 2) {
			this.handleDroppedAtlas(files as [File, File])
			return
		}
		
		console.warn("Please drop image or image+json!", files)
	}
	
	private isImageFile(file: File): boolean {
		return file.type.includes("image")
	}
	
	private isJsonFile(file: File): boolean {
		return file.type === "application/json"
	}
	
	private async handleDroppedTexture(file: File) {
		if (!this.isImageFile(file)) {
			console.warn(`Wrong file type - ${file.type}! Please drop an image!`)
			return
		}
		
		let key = this.getAvailableTextureKey(file.name)
		let image = await blobToImage(file)
		this.textures.addImage(key, image)
		this.updateImportConfig({ texture: "", atlas: "", frame: "" })
		this.onImportComplete(key)
	}
	
	private handleDroppedAtlas(files: [File, File]) {
		let file_1 = files[0]
		let file_2 = files[1]
		
		if (this.isImageFile(file_1) && this.isJsonFile(file_2)) {
			this.doHandleDroppedAtlas(file_1, file_2)
		} else if (this.isJsonFile(file_1) && this.isImageFile(file_2)) {
			this.doHandleDroppedAtlas(file_2, file_1)
		} else {
			console.warn("Invalid files combo! It should be image and json file!")
		}
	}
	
	private async doHandleDroppedAtlas(imageFile: File, atlasData: File) {
		let key = this.getAvailableTextureKey(imageFile.name)
		let image = await blobToImage(imageFile)
		let atlas = await blobToJson(atlasData)
		this.textures.addAtlas(key, image, atlas)
		
		let frame = await this.promptAtlasFrame(key)
		this.updateImportConfig({ texture: "", atlas: "", frame: "" })
		this.onImportComplete(key, frame)
	}
	
	private addPanels() {
		this.panels = new PanelsManager(this)
		this.panels.axesPanel.on("change", this.onGridSettingsChange, this)
		this.panels.nineSlicePanel.on("change", this.onNineSliceSettingsChange.bind(this))
		this.panels.resizePanel.on("change", this.onResizeSettingsChange.bind(this))
		this.panels.importPanel.importButton.on("click", this.onImportButtonClick.bind(this))
		this.panels.exportPanel.exportButton.on("click", this.onExportButtonClick.bind(this))
		this.panels.imagePanel.copyButton.on("click", this.onCopyPatchesConfigButtonClick.bind(this))
	}
	
	private onGridSettingsChange<K extends keyof AxesPanelConfig>(config: AxesPanelConfig, prop: K, value: AxesPanelConfig[K]): void {
		if (config.display) {
			this.axes.revive()
		} else {
			this.axes.kill()
		}
		
		this.axes?.redraw({
			width: Config.GAME_WIDTH,
			height: Config.GAME_HEIGHT,
			...this.config.axes,
		})
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
		let filename = this.getExportFileName(this.image.originFrame)
		
		rt.destroy()
		
		let triggerBrowserDownload = !this.config.export.texture
		if (triggerBrowserDownload) {
			await downloadBlob(blob, filename)
			this.panels.exportPanel.exportButton.disabled = false
			return
		}
		
		BrowserSyncService.writeFile(this.config.export.texture, blob)
			.then(response => this.onExportComplete(response))
			.catch(error => console.log(`Can't export texture!`, error))
			.finally(() => {
				this.panels.exportPanel.exportButton.disabled = false
			})
	}
	
	private createRenderTextureFromNinepatch(source: NinePatch): RenderTexture {
		let rt = this.make.renderTexture({ width: source.width, height: source.height }, false)
		rt.draw(source, source.width / 2, source.height / 2)
		
		return rt
	}
	
	private getExportFileName(originFrame: Phaser.Textures.Frame, extension = ".png"): string {
		let frameName = originFrame.name.split("/").pop()
		if (frameName === "__BASE") {
			frameName = originFrame.texture.key
		}
		
		if (!frameName.includes(extension)) {
			frameName += extension
		}
		
		return frameName
	}
	
	private async onExportComplete(response: Response) {
		let json = await response.json()
		console.log("NineSliceEditor.onExportComplete", json)
		
		console.group("Texture was exported! ✔")
		
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
		let value = this.panels.imagePanel.getPatchesMonitorValue()
		
		copyToClipboard(value)
			.then(() => console.log(`Patches config was copied to clipboard ✔`))
			.catch(error => console.log(`Can't copy patches config to clipboard!`, error))
	}
	
	private async onImportButtonClick() {
		let { texture, atlas, frame } = this.config.import
		
		if (!texture) {
			this.triggerFileUpload()
			return
		}
		
		if (texture && !atlas && !frame) {
			let { textureKey } = await this.loadSingleTexture(texture)
			this.updateImportConfig({ texture, atlas, frame })
			this.onImportComplete(textureKey)
			return
		}
		
		if (texture && atlas && !frame) {
			let { textureKey } = await this.loadAtlas(texture, atlas)
			let frame = await this.promptAtlasFrame(textureKey)
			this.updateImportConfig({ texture, atlas, frame })
			this.onImportComplete(textureKey, frame)
			return
		}
		
		if (texture && !atlas && frame) {
			atlas = prompt("Please set path to the atlas JSON data")
			let { textureKey } = await this.loadAtlas(texture, atlas)
			this.updateImportConfig({ texture, atlas, frame })
			this.onImportComplete(textureKey, frame)
			return
		}
		
		if (texture && atlas && frame) {
			let { textureKey } = await this.loadAtlas(texture, atlas)
			this.updateImportConfig({ texture, atlas, frame })
			this.onImportComplete(textureKey, frame)
		}
	}
	
	private onImportComplete(textureKey: string, frameName?: string): void {
		this.destroyNineSliceImage()
		this.addNineSliceImage({ textureKey, frameName })
		this.updateSizeMonitor(this.getImageSizeConfig())
		this.updatePatchesMonitor(this.image.config)
		this.nineSliceControls.setImage(this.image)
		this.resizeControls.setImage(this.image)
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
	
	private async loadSingleTexture(texturePath: string): Promise<{ textureKey: string }> {
		let key = this.getAvailableTextureKey(texturePath)
		let image = await this.loadTexture(texturePath)
		
		this.textures.addImage(key, image)
		
		return { textureKey: key }
	}
	
	private async loadAtlas(texturePath: string, atlasPath: string): Promise<{ textureKey: string }> {
		let key = this.getAvailableTextureKey(texturePath)
		let [texture, atlas] = await Promise.all([
			this.loadTexture(texturePath),
			this.loadAtlasData(atlasPath),
		])
		
		this.textures.addAtlas(key, texture, atlas as object)
		
		return { textureKey: key }
	}
	
	private getAvailableTextureKey(texturePath: string): string {
		let base = this.getTextureKey(texturePath)
		
		if (!this.textures.exists(base)) {
			return base
		}
		
		let n = 1
		let key: string
		do {
			key = `${base}_${n++}`
		} while (this.textures.exists(key))
		
		return key
	}
	
	private getTextureKey(texturePath: string): string {
		let path = slash(texturePath)
		let key = path.split("/").pop()
		
		let dotIndex = key.indexOf(".")
		if (dotIndex > -1) {
			return key.slice(0, dotIndex)
		}
		
		return key
	}
	
	private addBackground() {
		this.background = this.add.image(0, 0, "__WHITE")
		this.size(this.background, ScaleType.FILL)
		this.pin(this.background, 0.5, 0.5)
	}
	
	private addGrid() {
		this.axes = new Axes(this)
		this.axes.setDepth(NineSliceEditorDepth.GRID)
		this.add.existing(this.axes)
		this.pin(this.axes, 0.5, 0.5)
	}
	
	private addNineSliceImage(options: { textureKey: string, frameName?: string, width?: number, height?: number, patches?: IPatchesConfig }): void {
		let frame = this.textures.getFrame(options.textureKey, options.frameName)
		let width = options.width ?? frame.width
		let height = options.height ?? frame.height
		let patches = options.patches ?? {
			top: height * 0.25,
			bottom: height * 0.25,
			left: width * 0.25,
			right: width * 0.25,
		}
		
		this.image = this.add.ninePatch(0, 0, width, height, options.textureKey, options.frameName, patches)
		this.image.setDepth(NineSliceEditorDepth.NINE_SLICE_IMAGE)
		this.pin(this.image, 0.5, 0.5)
		this.pinner.align(this.image, Config.GAME_WIDTH, Config.GAME_HEIGHT, Config.ASSETS_SCALE)
	}
	
	private destroyNineSliceImage(): void {
		if (!this.image) {
			return
		}
		
		this.image.originTexture.getFrameNames(false).forEach(frame => {
			// NinePatch plugin adds frames to the source texture in a format FRAMENAME|[0][0]
			let match = /\|\[\d+\]\[\d+\]/.test(frame)
			if (match) {
				this.image.originTexture.remove(frame)
			}
		})
		
		this.image.destroy()
		this.image = null
	}
	
	private addNineSliceControls() {
		this.nineSliceControls = new NineSliceControls(this, this.config.nineSliceControls)
		this.nineSliceControls.setDepth(NineSliceEditorDepth.NINE_SLICE_CONTROLS)
		this.nineSliceControls.on(NineSliceControlsEvent.PATCHES_CHANGE, this.onPatchesChange, this)
		this.nineSliceControls.revive()
		this.nineSliceControls.setImage(this.image)
		this.add.existing(this.nineSliceControls)
		this.pin(this.nineSliceControls, 0.5, 0.5)
	}
	
	private onPatchesChange(patches: IPatchesConfig): void {
		let { width, height } = this.image
		let frame = this.image.originFrame
		let textureKey = frame.texture.key
		let frameName = frame.name
		
		this.destroyNineSliceImage()
		this.addNineSliceImage({ textureKey, frameName, width, height, patches })
		this.updateSizeMonitor(this.getImageSizeConfig())
		this.updatePatchesMonitor(this.image.config)
		
		this.nineSliceControls.setImage(this.image)
		this.resizeControls.setImage(this.image)
	}
	
	private addResizeControls() {
		this.resizeControls = new ResizeControls(this, this.config.resizeControls)
		this.resizeControls.setDepth(NineSliceEditorDepth.RESIZE_CONTROLS)
		this.resizeControls.on(ResizeControlsEvent.RESIZE, this.onSizeChange, this)
		this.resizeControls.revive()
		this.resizeControls.setImage(this.image)
		this.add.existing(this.resizeControls)
		this.pin(this.resizeControls, 0.5, 0.5)
	}
	
	private onSizeChange(size: { width: number, height: number }): void {
		this.image.resize(size.width, size.height)
		this.nineSliceControls.setImage(this.image)
		this.updateSizeMonitor(this.getImageSizeConfig())
	}
	
	private updateBackgroundColor(color: number): void {
		let { r, g, b, a } = Phaser.Display.Color.ColorToRGBA(color)
		this.game.canvas.parentElement.style.backgroundColor = `rgba(${r},${g},${b},${a})`
		
		this.background?.setTintFill(color)
	}
	
	private updateSizeMonitor(config: SizeConfig): void {
		mergeWith(this.config.image.size, config, (_, srcValue) => Phaser.Math.RoundTo(srcValue, -2))
		this.panels.imagePanel.updateSizeMonitor()
	}
	
	private updatePatchesMonitor(config: IPatchesConfig): void {
		mergeWith(this.config.image.patches, config, (_, srcValue) => Phaser.Math.RoundTo(srcValue, -2))
		this.panels.imagePanel.updatePatchesMonitor()
	}
	
	private getImageSizeConfig(): SizeConfig {
		return {
			width: this.image.width,
			height: this.image.height,
		}
	}
	
	private addKeyboardCallbacks() {
		this.onKeyDown("A", this.toggleAxes, this)
		this.onKeyDown("Q", this.toggleNineSliceControls, this)
		this.onKeyDown("W", this.toggleResizeControls, this)
		this.onKeyDown("I", this.triggerFileUpload, this)
		this.onKeyDown("U", this.triggerFileUpload, this)
		this.onKeyDown("E", this.onExportButtonClick, this)
		this.onKeyDown("C", this.onCopyPatchesConfigButtonClick, this)
		this.onKeyDown("R", this.resetNineSliceImage, this)
		this.onKeyDown("OPEN_BRACKET", () => this.axes.setDepth(NineSliceEditorDepth.GRID))
		this.onKeyDown("CLOSED_BRACKET", () => this.axes.setDepth(NineSliceEditorDepth.GRID_ON_TOP))
		this.onKeyDown("ONE", this.resetCameraZoom, this)
		this.onKeyDown("F", this.setCameraMaxZoom, this)
	}
	
	private toggleAxes(): void {
		this.config.axes.display = !this.config.axes.display
		this.panels.axesPanel.refresh()
	}
	
	private toggleNineSliceControls(): void {
		this.config.nineSliceControls.display = !this.config.nineSliceControls.display
		this.panels.nineSlicePanel.refresh()
	}
	
	private toggleResizeControls(): void {
		this.config.resizeControls.display = !this.config.resizeControls.display
		this.panels.resizePanel.refresh()
	}
	
	private triggerFileUpload(): void {
		this.uploadInput.click()
	}
	
	private resetNineSliceImage(): void {
		let frame = this.image.originFrame
		let textureKey = frame.texture.key
		let frameName = frame.name
		
		this.destroyNineSliceImage()
		this.addNineSliceImage({ textureKey, frameName })
		this.updateSizeMonitor(this.getImageSizeConfig())
		this.updatePatchesMonitor(this.image.config)
		this.nineSliceControls.setImage(this.image)
		this.resizeControls.setImage(this.image)
		
		this.resetCameraZoom()
	}
	
	private addPointerCallbacks() {
		this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this)
		this.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onPointerWheel, this)
		this.input.on(Phaser.Input.Events.GAME_OUT, this.onPointerGameOut, this)
	}
	
	private onPointerDown(pointer: Phaser.Input.Pointer): void {
		if (pointer.button === 1) { // wheel button (at least for my mouse)
			this.resetCameraZoom()
		}
	}
	
	private resetCameraZoom() {
		this.cameras.main.zoom = 1
	}
	
	private setCameraMaxZoom(): void {
		let padding = 20
		let maxWidth = Config.GAME_WIDTH - padding * 2
		let maxHeight = Config.GAME_HEIGHT - padding * 2
		let zoom = Math.min(maxWidth / this.image.width, maxHeight / this.image.height)
		
		let camera = this.cameras.main
		let isMaxZoom = Phaser.Math.Fuzzy.Equal(camera.zoom, zoom, 0.01)
		if (isMaxZoom) {
			camera.zoom = Math.max(1, zoom / 2)
		} else {
			camera.zoom = zoom
		}
	}
	
	private onPointerWheel(pointer: Phaser.Input.Pointer, objects, dx, dy: number): void {
		if (this.atlasFramePicker) {
			return
		}
		
		let camera = this.cameras.main
		let k = pointer.event.shiftKey ? 2 : 1
		let delta = Phaser.Math.Sign(dy) * -0.1 * k
		camera.zoom = Math.max(0.1, camera.zoom + delta)
	}
	
	private onPointerGameOut(): void {
	
	}
	
	public resize(): void {
		super.resize()
		
		this.axes?.redraw({
			width: Config.GAME_WIDTH,
			height: Config.GAME_HEIGHT,
			...this.config.axes,
		})
		
		this.atlasFramePicker?.resize()
	}
	
	public onShutdown() {
		super.onShutdown()
		
		this.panels.destroy()
		this.panels = null
	}
}
