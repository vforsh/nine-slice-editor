export function downloadBlob(blob: Blob, name: string): HTMLAnchorElement {
	let blobUrl = URL.createObjectURL(blob)
	let link = document.createElement("a")
	link.href = blobUrl
	link.download = name
	
	document.body.appendChild(link)
	
	// Dispatch click event on the link
	// This is necessary as link.click() does not work on the latest firefox
	link.dispatchEvent(
		new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window,
		}),
	)
	
	document.body.removeChild(link)
	
	return link
}
