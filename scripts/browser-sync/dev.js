require("dotenv").config()

const files = [
	"dev/assets/configs/shop_offers.json",
	"dev/assets/graphics/*.json",
	"dev/assets/graphics/*.jpg",
	"dev/assets/audio/**",
	"dev/js/game.config.js",
	"dev/js/game.js",
	"dev/js/phaser.custom.js",
	"dev/css/*.css",
	"dev/index.html",
]

const ignore = []

const { texture, atlas, frame } = process.env
const queryString = new URLSearchParams({
	...(texture && { texture }),
	...(atlas && { atlas }),
	...(frame && { frame }),
})

/**
 * @type {browserSync.Options}
 */
module.exports = {
	files,
	ignore,
	server: true,
	startPath: `dev/index.html?${queryString.toString()}`,
	timestamps: true,
	notify: false,
	reloadDebounce: 500,
	ui: false,
	online: false,
	middleware: [
		{
			route: "/screenshot",
			handle: require("./middleware/save-screenshot"),
		},
		{
			route: "/read-file",
			handle: require("./middleware/read-file"),
		},
		{
			route: "/write-file",
			handle: require("./middleware/write-file"),
		},
		{
			route: "/open",
			handle: require("./middleware/open"),
		},
		{
			route: "/command",
			handle: require("./middleware/command"),
		},
	],
}
