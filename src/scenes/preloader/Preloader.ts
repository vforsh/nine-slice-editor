import { SceneKey } from "../SceneKey"
import { ISceneTransition } from "../../sceneTransition/ISceneTransition"
import { CanvasSceneTransition } from "../../sceneTransition/CanvasSceneTransition"
import { BaseScene } from "../../robowhale/phaser3/scenes/BaseScene"
import { GameStore } from "../../store/GameStore"
import { BitmapFont } from "../../GameFonts"
import { NineSliceEditor } from "../nineSliceEditor/NineSliceEditor"

export class Preloader extends BaseScene {
	
	public init(data?: any) {
		super.init(data)
		
		this.game.loadingScreen.showPreloader()
	}
	
	public preload() {
		this.loadGraphics()
		this.loadFonts()
		this.loadSaveData()
	}
	
	private loadGraphics() {
		this.load.image(NineSliceEditor.DEFAULT_IMAGE, "assets/graphics/board.png")
		this.load.image("popup_back", "assets/graphics/popup_back.png")
		this.load.image("atlas_back", "assets/graphics/atlas_back.png")
	}
	
	private loadFonts() {
		this.load.bitmapFontJson(BitmapFont.AXES_DIGITS, "assets/fonts/bitmap/axes-digits.png", "assets/fonts/bitmap/axes-digits.json")
	}
	
	private loadSaveData() {
		this.load.rexAwait("init_game_store", {
			callback: (onSuccess) => {
				this.game.store = new GameStore(this.game, `bmfont-editor`)
				this.game.store.initActualStorage()
					.catch((error) => {
						this.game.analytics.sendError(`Storage:Not_Available`)
					})
					.finally(async () => {
						await this.game.store.loadInitialValues()
						onSuccess()
					})
			},
		})
	}
	
	public create() {
		this.initStore()
		this.addScenesTransition()
		this.addToasts()
		
		this.startScene(SceneKey.NINE_SLICE_EDITOR)
	}
	
	private initStore() {
		this.game.store.changeNumber("login_num", 1)
	}
	
	private addScenesTransition() {
		let transition: ISceneTransition = new CanvasSceneTransition(this.game.globalScene, "__BLACK")
		this.game.globalScene.addSceneTranstion(transition)
		this.game.globalScene.sceneTransition.instantChange = true
		
		this.game.sentry.trackSceneChanges(transition)
	}
	
	private addToasts() {
		this.game.toasts = this.game.globalScene.addToasts()
	}
	
	private startScene(scene: SceneKey | string, data?: any): void {
		this.game.changeScene(this.scene.key, scene, data)
	}
	
	public resize(): void {
		super.resize()
	}
	
	public onShutdown() {
		super.onShutdown()
		
		this.game.loadingScreen.fadeOut()
	}
}
