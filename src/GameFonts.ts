export enum FontWeight {
	NORMAL = "400",
	BOLD = "700",
}

export enum FontFamily {
	VERDANA = "Verdana",
	SANS_SERIF = "sans-serif",
}

export class WebFonts {
	public static DEFAULT_FAMILY: FontFamily = FontFamily.VERDANA
	public static DEFAULT_WEIGHT: FontWeight = FontWeight.NORMAL
}

export enum BitmapFont {
	AXES_DIGITS = "AXES_DIGITS",
}
