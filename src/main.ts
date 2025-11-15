import { App, CanvasCoords, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Menu, setIcon, setTooltip } from 'obsidian';
import { resizeNode } from './utils/utils';
import { EditorView } from "@codemirror/view";
import { CanvasNode, Canvas, MenuOption } from './@types/Canvas';

// Remember to rename these classes and interfaces!

interface AutoExpandNodeSettings {
	mySetting: boolean;
}

const DEFAULT_SETTINGS: AutoExpandNodeSettings = {
	mySetting: true
}

export default class AutoExpandNodePlugin extends Plugin {
	settings: AutoExpandNodeSettings;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AutoExpandNodeSettingTab(this.app, this));
		// this.registerCanvasEvents()

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (!file) return;

				// Only run for canvas files
				if (file.extension === "canvas") {
					console.log("Canvas file opened:", file.path);

					// You might need to wait for the view to render:
					setTimeout(() => {
						const canvas = this.app.workspace.getLeavesOfType('canvas')[0].view.canvas
						if (canvas) {
							console.log("CanvasView is ready");
						}

						// Step 2 — wait one more micro-cycle for nodes to fully render
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								console.log("Canvas fully rendered:", canvas);
					
								for (const [id, node] of canvas.nodes) {
									console.log("Rendered node:", id, node);
									const container = node.nodeEl.querySelector(".canvas-node-container");
									if (container) {
										// Example: apply border style from styleAttributes
										const border = node.getData().styleAttributes?.border;
										container.style.border = border;
									}
								}
							});
						});
					}, 50);
				}
			})
		);
		this.registerEvent(this.app.workspace.on("canvas:node-menu", (menu: Menu, node: CanvasNode,) => {
			const canvas: Canvas = node.canvas;
			console.log(`canvas.getData(): ${JSON.stringify(canvas.getData())}`)
			const container = node.nodeEl.querySelector(".canvas-node-container") as HTMLElement;
			const border = node.getData().styleAttributes?.border;
			console.log(`border: ${border}`)
			if (container) container.style.border = border || "";
			menu.addItem(item => {
				item.setTitle("Border Emphasize")
					.setIcon("square-dashed-top-solid") // Obsidian icon
					.onClick(() => {
						const container = node.nodeEl.querySelector(".canvas-node-container") as HTMLElement;
						if (!container) return;

						// Check current border
						const currentBorder = container.style.border;
						const newBorder = currentBorder ? "" : "3px solid orange";
						container.style.border = newBorder;

						const nodeData = node.getData()

						// Only apply the attribute if the node type is allowed
						node.setData({
							...nodeData,
							styleAttributes: {
								...nodeData.styleAttributes,
								border: newBorder
							}
						})
						console.log(`nodeData.styleAttributes: ${JSON.stringify(nodeData.styleAttributes)}`)
						console.log(`canvas.getData(): ${JSON.stringify(canvas.getData())}`)
						canvas.pushHistory(canvas.getData())
						canvas.requestSave();
					});
			});
		}))

		// this.registerEvent(
		// 	this.app.workspace.on("canvas:render-node", (node: CanvasNode) => {
		// 		const container = node.nodeEl.querySelector(".canvas-node-container") as HTMLElement;
		// 		const border = node.getData().styleAttributes?.border;
		// 		if (container) container.style.border = border || "";
		// 	})
		// );

		// document.addEventListener("click", (evt) => {
		// 	// Check if the click was inside a canvas node
		// 	const nodeEl = (evt.target as HTMLElement).closest(".canvas-node");

		// 	if (nodeEl) {
		// 		const nodeId = nodeEl.dataset.nodeId; // Canvas node ID
		// 		console.log("Left-clicked node element:", nodeEl, "Node ID:", nodeId);

		// 		// Optional: get the Canvas object
		// 		const leaf = this.app.workspace.getLeavesOfType("canvas")[0];
		// 		const canvas = leaf?.view.canvas;
		// 		if (canvas && nodeId) {
		// 			const nodeData = canvas.nodes[nodeId];
		// 			console.log("Node data from canvas:", nodeData);
		// 		}
		// 	}
		// });

		//Canvas menu in progress

		// observer.observe(nodeEl.querySelector(".cm-content"), {
		// 	childList: true,
		// 	characterData: true,
		// 	subtree: true,
		// });

		// document.addEventListener("click", (evt) => {
		// 	// Check if the click was inside a canvas node
		// 	const nodeEl = (evt.target as HTMLElement).closest(".canvas-node");

		// 	if (nodeEl) {
		// 		const nodeId = nodeEl.dataset.nodeId; // Canvas node ID
		// 		console.log("Left-clicked node element:", nodeEl, "Node ID:", nodeId);

		// 		// Optional: get the Canvas object
		// 		const leaf = this.app.workspace.getLeavesOfType("canvas")[0];
		// 		const canvas = leaf?.view.canvas;
		// 		if (canvas && nodeId) {
		// 			const nodeData = canvas.nodes[nodeId];
		// 			console.log("Node data from canvas:", nodeData);
		// 		}
		// 	}
		// });


		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		const originalTrigger = this.app.workspace.trigger;
		this.app.workspace.trigger = function (...args) {
			console.log("Triggered:", args);
			return originalTrigger.apply(this, args);
		}


	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	//canvas menu test 
	addPopupMenuOption(canvas: Canvas, element: HTMLElement, index = -1) {
		const popupMenuEl = canvas?.menu?.menuEl
		if (!popupMenuEl) return
		if (element.id) {
			const optionToReplace = popupMenuEl.querySelector(`#${element.id}`)
			if (optionToReplace && index === -1) index = Array.from(popupMenuEl.children).indexOf(optionToReplace) - 1
			optionToReplace?.remove()
		}

		const sisterElement = index >= 0 ? popupMenuEl.children[index] : popupMenuEl.children[popupMenuEl.children.length + index]
		popupMenuEl.insertAfter(element, sisterElement)
		console.log(`popupMenuEl: ${popupMenuEl.outerHTML}`)
	}

	createPopupMenuOption(menuOption: MenuOption): HTMLElement {
		const menuOptionElement = document.createElement('button')
		if (menuOption.id) menuOptionElement.id = menuOption.id
		menuOptionElement.classList.add('clickable-icon')
		setIcon(menuOptionElement, menuOption.icon)
		setTooltip(menuOptionElement, menuOption.label, { placement: 'top' })
		menuOptionElement.addEventListener('click', () => menuOption.callback?.())
		return menuOptionElement
	}

}

class AutoExpandNodeSettingTab extends PluginSettingTab {
	plugin: AutoExpandNodePlugin;

	constructor(app: App, plugin: AutoExpandNodePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable Auto Expand')
			.setDesc('It\'s a secret')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
					this.display();
				}))
	}
}


