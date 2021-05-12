const fs = require("fs-extra");
const path = require("path");
const child_process = require("child_process");
const React = require("react");
const ReactDOM = require("react-dom");
const React_Contextmenu = require("react-contextmenu");
const Electron = require("electron");
const http = require("http");
const Tooltip = require("../ts/components/Tooltip");
const BsApi = require("./BsApi");
const popperJs = require("popper.js");
const classnames = require("classnames");
const https = require("https");

var Signal;
/** @type {Bettersignal} */
var Bs;
var bettersignalPath = path.join(process.env.APPDATA, "bettersignal");
var pluginsFolder = path.join(bettersignalPath, "plugins");
var themesFolder = path.join(bettersignalPath, "themes");
var settingsPath = path.join(bettersignalPath, "settings.json");
var translatePath = "./translate.json";
var selectorList = {
	avatarPopup: ".module-avatar-popup",
	avatarPopupItem: ".module-avatar-popup__item",
	avatarPopupItemIcon: ".module-avatar-popup__item__icon",
	avatarPopupItemText: ".module-avatar-popup__item__text",
	avatarPopupItemSettingsIcon: ".module-avatar-popup__item__icon-settings",
	index: ".index",
	messageStickerContainer: ".module-message__sticker-container",
	messageAttachmentContainer: ".module-message__attachment-container",
};
var classList = {
	avatarPopup: "module-avatar-popup",
	avatarPopupItem: "module-avatar-popup__item",
	avatarPopupItemIcon: "module-avatar-popup__item__icon",
	avatarPopupItemText: "module-avatar-popup__item__text",
	avatarPopupItemSettingsIcon: "module-avatar-popup__item__icon-settings",
	index: "index",
};

class Bettersignal {
	constructor() {}
	copyImage(src) {
		let isURL = src.isURL();
		if (isURL ? (isURL.protocol === "http:" || isURL.protocol === "https:" ? true : false) : false) {
			http.request(src, { encoding: null }, (error, response, buffer) => {
				var file = path.join(process.env.TEMP, `BsTempFile-${new Date().format("YYYY-MM-DD_hh-mm-ss")}`);
				fs.writeFileSync(file, buffer, { encoding: null });
				Electron.clipboard.write({
					image: file,
				});
				fs.unlinkSync(file);
				Bs.toast.new(Bs.translate.get("imageCopied"), {
					type: "success",
					icon: "ok",
				});
			});
		} else {
			src = src.replace("file:///", "");
			if (!fs.existsSync(src)) return false;
			Electron.clipboard.write({
				image: src,
			});
			Bs.toast.new(Bs.translate.get("imageCopied"), {
				type: "success",
				icon: "ok",
			});
			return true;
		}
	}
	copyText(text) {
		if (typeof text != "string") return false;
		navigator.clipboard.writeText(text);
		return true;
	}
	url = {
		parse(url) {
			if (url.isURL()) {
				return new URL(url);
			} else {
				return null;
			}
		},
		open(url) {
			if (url instanceof String ? url.isURL() : false) {
				Electron.shell.openExternal(url);
				return true;
			} else {
				return false;
			}
		},
	};
	path = {
		parse(path) {
			if (!path.isPath()) return null;
			var normalized = Bs.path.normalize(path);
			var parsed = {
				origin: path,
				protocol: "file:///",
				normalized: normalized,
				dir: normalized.match(/(?<=(file:\/\/\/)?([a-z]:))(([\\\/][^\\\/\n\:\*\?\"\<\>\|]+)+[\\\/]?)/gi)[0],
				path: normalized.match(/((?<=(?<!\/\/)[\\\/])[^\\\/\n\:\*\?\"\<\>\|]+)/gi),
				base: /((?<=(?<!\/\/)[\\\/])[^\\\/\n\:\*\?\"\<\>\|]+)$/gi.test(path) ? normalized.match(/((?<=(?<!\/\/)[\\\/])[^\\\/\n\:\*\?\"\<\>\|]+)$/gi)[0] : null,
				ext: /(?<=(?<=(?<!\/\/)[\\\/])[^\\\/\n\:\*\?\"\<\>\|]+)((?<=\.)[a-z]+)$/gi.test(path) ? normalized.match(/(?<=(?<=(?<!\/\/)[\\\/])[^\\\/\n\:\*\?\"\<\>\|]+)((?<=\.)[a-z]+)$/gi)[0] : null,
			};
			return parsed;
		},
		normalize(path) {
			if (!path.isPath()) return null;
			var normalized = path.replace(/file:\/\/\//gi, "").replace(/\\/gi, "/");
			return normalized;
		},
	};
	messages = {
		async getFromElement(elem) {
			var parent = elem.closest(Bs.signal.selectorList.messageContainer);
			return await Bs.message.getById(parent.id);
		},
		async getById(id) {
			return await Signal.Data.getMessageById(id);
		},
		send: function () {
			let target = document.querySelector(".module-composition-area__input .ql-editor.ql-editor--loaded");
			if (!target) return false;
			let event = new KeyboardEvent("keydown", {
				key: "Enter",
				which: 13,
				keyCode: 13,
				metaKey: false,
				ctrlKey: false,
				shiftKey: false,
				altKey: false,
				target: target,
				srcElement: target,
			});
			target.click()
			let success = target.dispatchEvent(event);
			if(success) return true;
			else return false;
		}.bind(this),
	};
	conversation = {
		getAll: async function () {
			return await window.getConversations();
		}.bind(this),
		get: async function (id) {
			var conversations = await this.conversation.getAll();
			var conversation = conversations.get(id);
			if (!conversation) return false;
			return conversation;
		}.bind(this),
		current: async function () {
			let conversationElement = document.querySelector("[id*=conversation-].conversation");
			if (!conversationElement) return false;
			var conversation = await this.conversation.get(conversationElement.id.match(/(?<=conversation\-).*$/gim)[0]);
			if (!conversation) return false;
			var view = new window.Whisper.ConversationView({
				model: conversation,
			});
			view.attachmentListView.el = document.querySelector(".module-composition-area__attachment-list");
			return view;
		}.bind(this),
	};
	components = {
		spinner({ moduleClassName, size, svgSize, direction }) {
			return React.createElement(
				"div",
				{
					className: `module-spinner__container module-spinner__container--${svgSize} ${direction ? `module-spinner__container--${direction}` : null} ${direction ? `module-spinner__container--${svgSize}-${direction}` : null} ${moduleClassName ? `${moduleClassName}__container` : null}`,
					style: {
						height: size,
						width: size,
					},
				},
				React.createElement("div", {
					className: `module-spinner__circle module-spinner__circle--${svgSize} ${direction ? `module-spinner__circle--${direction}` : null} ${direction ? `module-spinner__circle--${svgSize}-${direction}` : null} ${moduleClassName ? `${moduleClassName}__circle` : null}`,
				}),
				React.createElement("div", {
					className: `module-spinner__arc module-spinner__arc--${svgSize} ${direction ? `module-spinner__arc--${direction}` : null} ${direction ? `module-spinner__arc--${svgSize}-${direction}` : null} ${moduleClassName ? `${moduleClassName}__arc` : null}`,
				})
			);
		},
		switch(value, callback) {
			return E("div").set({
				props: {
					class: "BsSwitch",
					value: Boolean(value),
				},
				events: {
					click: function (e) {
						var elem;
						if (!e.target.classList.contains("BsSwitch")) elem = e.target.parentElement;
						else elem = e.target;
						if (elem.getAttribute("value") == "true") elem.setAttribute("value", "false");
						else elem.setAttribute("value", "true");
						callback(elem);
					},
				},
				children: [E("div")],
			});
		},
		svgIcons: {
			website:
				"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 20 20' fill='%23FFFFFF' style='width: 18px; height: 18px;'%3E%3Cpath d='M0 0h24v24H0z' fill='none'%3E%3C/path%3E%3Cpath d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z'%3E%3C/path%3E%3C/svg%3E",
			discord:
				"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32' style='&%2310; fill: white;&%2310;'%3E%3Cpath d='M26.964 0c1.875 0 3.385 1.516 3.474 3.302v28.698l-3.568-3.031-1.958-1.781-2.141-1.865 0.891 2.938h-18.714c-1.87 0-3.385-1.417-3.385-3.302v-21.651c0-1.786 1.516-3.302 3.391-3.302h22zM18.807 7.578h-0.042l-0.271 0.266c2.766 0.802 4.104 2.052 4.104 2.052-1.781-0.891-3.391-1.339-4.995-1.521-1.156-0.177-2.318-0.083-3.297 0h-0.271c-0.625 0-1.958 0.271-3.745 0.984-0.62 0.271-0.979 0.448-0.979 0.448s1.333-1.339 4.281-2.052l-0.182-0.177c0 0-2.229-0.089-4.635 1.693 0 0-2.406 4.193-2.406 9.359 0 0 1.333 2.318 4.99 2.406 0 0 0.536-0.708 1.073-1.333-2.052-0.625-2.854-1.875-2.854-1.875s0.182 0.089 0.448 0.266h0.078c0.042 0 0.063 0.021 0.083 0.042v0.010c0.021 0.021 0.042 0.036 0.078 0.036 0.443 0.182 0.88 0.359 1.24 0.536 0.625 0.266 1.422 0.536 2.401 0.714 1.24 0.182 2.661 0.266 4.281 0 0.797-0.182 1.599-0.354 2.401-0.714 0.516-0.266 1.156-0.531 1.859-0.984 0 0-0.797 1.25-2.938 1.875 0.438 0.62 1.057 1.333 1.057 1.333 3.661-0.083 5.083-2.401 5.161-2.302 0-5.161-2.422-9.359-2.422-9.359-2.177-1.62-4.219-1.682-4.578-1.682l0.073-0.026zM19.031 13.464c0.938 0 1.693 0.797 1.693 1.776 0 0.99-0.76 1.786-1.693 1.786-0.938 0-1.693-0.797-1.693-1.776 0-0.99 0.76-1.786 1.693-1.786zM12.974 13.464c0.932 0 1.688 0.797 1.688 1.776 0 0.99-0.76 1.786-1.693 1.786-0.938 0-1.698-0.797-1.698-1.776 0-0.99 0.76-1.786 1.698-1.786z'/%3E%3C/svg%3E",
			github: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFFFFF' style='width: 18px; height: 18px;'%3E%3Cpath d='m12 .5c-6.63 0-12 5.28-12 11.792 0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.56 4.801-1.548 8.236-5.97 8.236-11.173 0-6.512-5.373-11.792-12-11.792z'%3E%3C/path%3E%3C/svg%3E",
			patreon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFFFFF' style='width: 18px; height: 18px;'%3E%3Cpath d='m0 .5h4.219v23h-4.219z'%3E%3C/path%3E%3Cpath d='m15.384.5c-4.767 0-8.644 3.873-8.644 8.633 0 4.75 3.877 8.61 8.644 8.61 4.754 0 8.616-3.865 8.616-8.61 0-4.759-3.863-8.633-8.616-8.633z'%3E%3C/path%3E%3C/svg%3E",
			support:
				"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 20 20' fill='%23FFFFFF' style='width: 18px; height: 18px;'%3E%3Cpath d='M0 0h24v24H0z' fill='none'%3E%3C/path%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z'%3E%3C/path%3E%3C/svg%3E",
			donate: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 20 20' fill='%23FFFFFF' style='width: 18px; height: 18px;'%3E%3Cpath d='M0 0h24v24H0z' fill='none'%3E%3C/path%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z'%3E%3C/path%3E%3C/svg%3E",
		},
	};
	signal = {
		classList: {},
		selectorList: {
			messageContainer: ".module-timeline__message-container",
		},
	};
	log = {
		info(...args) {
			if (console._log) console._log(...args);
			else console.log(...args);
		},
		error(...args) {
			if (console._error) console._error(...args);
			else console.error(...args);
		},
		warn(...args) {
			if (console._warn) console._warn(...args);
			else console.warn(...args);
		},
	};
	css = {
		inject: function (obj) {
			var css = ``;
			Object.entries(obj).forEach(([key, value]) => {
				var prop = ``;
				Object.entries(value).forEach(([key, value]) => {
					prop += `\n    ${key}: ${value};`;
				});
				css += `${css.length === 0 ? "" : "\n"}${key} {${prop}\n}`;
			});
			var e = E("style").set({
				props: {
					type: "text/css",
				},
				children: [css],
			});
			document.head.querySelector("BsStyle").append(e);
		},
	};
	storage = {
		saveData({ data, name }) {
			return new Promise((resolve) => {
				Signal.Migrations.saveAttachmentToDisk({ data, name }).then(({ fullPath, name }) => {
					resolve({ fullPath, name });
				});
			});
		},
		open(path) {
			child_process.exec(`start "" ${path}`);
		},
	};
	wait = {
		element: function (selector, callback) {
			const observer = new MutationObserver((mutations) => {
				let element = document.querySelector(selector);
				if (element) {
					mutations.forEach((mutation) => {
						mutation.addedNodes
							? mutation.addedNodes.forEach((node) => {
									if (element.isSameNode(node) || node.contains(element)) callback(element);
							  })
							: null;
					});
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
			return observer;
		},
		elementOnce: function (selector) {
			return new Promise((resolve) => {
				if (document.querySelector(selector)) {
					return resolve(document.querySelector(selector));
				}
				const observer = new MutationObserver((mutations) => {
					if (document.querySelector(selector)) {
						resolve(document.querySelector(selector));
						observer.disconnect();
					}
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true,
				});
			});
		},
	};
	popup = {
		new: function (content, { size = "auto", actions = [], type = "info" }) {
			return new Popup(content, { size: size, actions: actions, type: type });
		},
		progress: function (message) {
			var root = document.createElement("div");
			document.querySelector("BsPopups").append(root);
			ReactDOM.render(React.createElement("div", { role: "presentation", className: "module-progress-dialog__overlay" }, React.createElement("div", { className: "module-progress-dialog" }, React.createElement("div", { className: "module-progress-dialog__spinner" }, React.createElement(this.components.spinner, { svgSize: "normal", size: "39px", direction: "on-progress-dialog" })), React.createElement("div", { className: "module-progress-dialog__text" }, message))), root);
			return {
				remove: () => {
					root.remove();
				},
			};
		},
		confirm: function ({ message, resolve = () => {}, okText, confirmStyle, cancelText, reject }) {
			window.showConfirmationDialog({
				message: message,
				resolve: resolve,
				okText: okText,
				confirmStyle: confirmStyle,
				cancelText: cancelText,
				reject: reject,
			});
		},
	};
	toast = {
		new: function (message, { events, initialize, type, icon } = {}) {
			var props = {
				render_attributes() {
					return { toastMessage: message };
				},
			};
			var _classList = ["BsToast"];
			if (events) {
				props.events = {};
				Object.entries(events).forEach(([key, value]) => {
					if ((key = "click")) _classList.push("toast-clickable");
					props.events[key] = value;
				});
			}
			if (type === "error" || type === "success" || type === "warning") _classList.push("BsToast-" + type);
			if (typeof initialize === "function") props.initialize = initialize;
			if (icon === "ok") _classList.push("BsToastIcon-" + icon);
			props.className = _classList.join(" ");
			var toast = window.Whisper.ToastView.extend(props);
			var _toast = new toast();
			_toast.$el.appendTo(document.querySelector("BsToasts"));
			_toast.render();
		},
	};
	translate = {
		get: function (key, substitutions = {}, messages, locale) {
			if (!messages) var messages = this.translate.messages;
			if (!locale) var locale = Bs.settings.props.language ? Bs.settings.props.language : "en";
			if (!messages[key]) return "";
			if (!messages[key]["en"]) return "";
			/** @type {String} */
			var text = messages[key][locale] ? messages[key][locale] : messages[key]["en"];
			Object.entries(substitutions ? (typeof substitutions === "object" ? substitutions : {}) : {}).forEach(([key, value]) => {
				text = text.replaceAll(`{{${key}}}`, value);
			});
			return text;
		}.bind(this),
		messages: require(translatePath),
	};
}
class Plugins extends Bettersignal {
	constructor() {
		super();
		this.list = {};
		var files = fs.readdirSync(pluginsFolder, {
			withFileTypes: ".plugin.js",
		});
		files.forEach((file) => {
			var pluginName = file.name.replace(".plugin.js", "");
			var pluginPath = path.join(pluginsFolder, file.name);
			this.list[pluginName] = this.load(pluginPath, pluginName);
			if (this.list[pluginName] === undefined) {
				delete this.list[pluginName];
			}
		});
	}
	load(pluginPath, pluginName) {
		try {
			var plugin = new (require(pluginPath))();
			if (pluginName == plugin.name) {
				plugin.path = pluginPath;
				this.toast.new(
					this.translate.get("pluginLoadedToast", {
						name: pluginName,
					}),
					{
						initialize: function () {
							this.timeout = 5000;
						},
					}
				);
				return plugin;
			} else return undefined;
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}
	unload(plugin) {
		return delete require.cache[require.resolve(plugin.path)]
			? delete this.list[plugin.name]
				? (this.toast.new(
						this.translate.get("pluginUnloadedToast", {
							name: plugin.name,
						}),
						{
							initialize: function () {
								this.timeout = 5000;
							},
						}
				  ),
				  true)
				: false
			: false;
	}
	start(plugin) {
		plugin.main.call(plugin);
		this.toast.new(
			this.translate.get("pluginStartedToast", {
				name: plugin.name,
			}),
			{
				initialize: function () {
					this.timeout = 5000;
				},
			}
		);
	}
	stop(plugin) {
		plugin.stop();
		this.toast.new(
			this.translate.get("pluginStopedToast", {
				name: plugin.name,
			}),
			{
				initialize: function () {
					this.timeout = 5000;
				},
			}
		);
	}
	delete(plugin) {
		this.popup.confirm({
			message: this.translate.get("confirmDeletePlugin"),
			resolve: function () {
				plugin.stop();
				fs.unlink(plugin.path, () => {
					this.toast.new(
						this.translate.get("pluginDeletedToast", {
							name: plugin.name,
						})
					);
				});
				delete this.list[plugin.name];
				Bs.settings.loadRightPanel("plugins");
			},
		});
	}
	startAll() {
		Bs.settings.props.enabledPlugins.forEach((plugin) => {
			if (this.list[plugin]) {
				this.start(this.list[plugin]);
			}
		});
	}
	onChangePluginsFolder() {}
	enablePlugin(plugin) {
		if (Bs.settings.props.enabledPlugins.includes(plugin.name)) {
			Bs.plugins.stop(plugin);
			Bs.settings.props.enabledPlugins.splice(Bs.settings.props.enabledPlugins.indexOf(plugin.name), 1);
			var pluginCardButton = document.querySelector(`.BsPluginCard[name="${plugin.name}"] .BsPluginCardHeadButton`);
			pluginCardButton.setAttribute("value", "false");
		} else {
			// TODO if settings open
			Bs.plugins.start(plugin);
			Bs.settings.props.enabledPlugins.push(plugin.name);
			var pluginCardButton = document.querySelector(`.BsPluginCard[name="${plugin.name}"] .BsPluginCardHeadButton`);
			pluginCardButton.setAttribute("value", "true");
		}
		Bs.settings.save();
	}
	openSettings() {}
	reloadAll() {
		Object.entries(this.list).forEach(([key, value]) => {
			this.reload(value);
		});
	}
	reload(plugin) {
		this.unload(plugin) ? (this.list[plugin.name] = this.load(plugin.path, plugin.name)) : null;
	}
}
class Themes extends Bettersignal {
	constructor() {
		super();
		this.list = {};
		var files = fs.readdirSync(themesFolder, {
			withFileTypes: ".theme.css",
		});
		files.forEach((file) => {
			var name = file.name.replace(".theme.css", "");
			var _path = path.join(themesFolder, file.name);
			let theme = new Theme(_path, name);
			if (theme.name != undefined) this.list[name] = theme;
		});
	}
	load(_path, name) {}
	startAll() {
		Bs.settings.props.enabledThemes.forEach((theme) => {
			if (this.list[theme]) {
				this.start(this.list[theme]);
			}
		});
	}
	start(theme) {
		document.head.querySelector("BsThemes").append(
			E("style").set({
				props: {
					name: theme.name,
				},
				children: [theme.style],
			})
		);
		this.toast.new(
			this.translate.get("themeStartedToast", {
				name: theme.name,
			}),
			{
				initialize: function () {
					this.timeout = 5000;
				},
			}
		);
	}
	stop(theme) {
		try {
			document.querySelector(`style[name=${theme.name}]`).remove();
		} finally {
			this.toast.new(
				this.translate.get("themeStopedToast", {
					name: theme.name,
				}),
				{
					initialize: function () {
						this.timeout = 5000;
					},
				}
			);
		}
	}
	openSettings() {}
	enableTheme(theme) {
		if (Bs.settings.props.enabledThemes.includes(theme.name)) {
			Bs.themes.stop(theme);
			Bs.settings.props.enabledThemes.splice(Bs.settings.props.enabledThemes.indexOf(theme.name), 1);
			var themeCardButton = document.querySelector(`.BsThemeCard[name="${theme.name}"] .BsThemeCardHeadButton`);
			themeCardButton.setAttribute("value", "false");
		} else {
			// TODO if settings open
			Bs.themes.start(theme);
			Bs.settings.props.enabledThemes.push(theme.name);
			var themeCardButton = document.querySelector(`.BsThemeCard[name="${theme.name}"] .BsThemeCardHeadButton`);
			themeCardButton.setAttribute("value", "true");
		}
		Bs.settings.save();
	}
	delete(theme) {
		this.popup.confirm({
			message: this.translate.get("confirmDeleteTheme"),
			resolve: function () {
				theme.stop();
				fs.unlink(plugin.path, () => {
					this.toast.new(
						this.translate.get("themeDeletedToast", {
							name: plugin.name,
						})
					);
				});
				delete this.list[plugin.name];
				Bs.settings.loadRightPanel("plugins");
			},
		});
	}
	onChangeThemesFolder() {}
}
class Theme {
	constructor(_path, name) {
		if (!fs.existsSync(_path)) throw new Error("Load Theme: invalid path");
		var data = fs.readFileSync(_path, { encoding: "utf8" });
		var links = [];
		let _links = data.match(/(?<=\* @links ).*(?<!\n)/gm);
		if (_links) {
			data.match(/(?<=\* @links ).*(?<!\n)/gm)[0]
				.split(";")
				.forEach((element) => {
					var link = element.split("=>");
					if (link[1].trim().isURL()) {
						links.push({
							name: link[0].trim(),
							src: new URL(link[1]).href,
						});
					}
				});
		}
		let _name = data.match(/(?<=\* @name ).*(?<!\n)/gm) ? data.match(/(?<=\* @name ).*(?<!\n)/gm)[0] : undefined;
		this.name = _name === name ? name : undefined;
		this.author = data.match(/(?<=\* @author ).*(?<!\n)/gm) ? data.match(/(?<=\* @author ).*(?<!\n)/gm)[0] : undefined;
		this.description = data.match(/(?<=\* @description ).*(?<!\n)/gm) ? data.match(/(?<=\* @description ).*(?<!\n)/gm)[0] : undefined;
		this.version = data.match(/(?<=\* @version ).*(?<!\n)/gm) ? data.match(/(?<=\* @version ).*(?<!\n)/gm)[0] : undefined;
		this.website = data.match(/(?<=\* @website ).*(?<!\n)/gm) ? data.match(/(?<=\* @website ).*(?<!\n)/gm)[0] : undefined;
		this.source = data.match(/(?<=\* @source ).*(?<!\n)/gm) ? data.match(/(?<=\* @source ).*(?<!\n)/gm)[0] : undefined;
		this.changelog = data.match(/(?<=\* @changelog ).*(?<!\n)/gm) ? data.match(/(?<=\* @changelog ).*(?<!\n)/gm)[0] : undefined;
		this.links = links;
		this.path = _path;
		this.style = data;
		if (this.name != undefined) {
			Bs.toast.new(
				Bs.translate.get("themeLoadedToast", {
					name: name,
				}),
				{
					initialize: function () {
						this.timeout = 5000;
					},
				}
			);
		}
	}
}
class Settings extends Bettersignal {
	constructor() {
		super();
		this.props = require(settingsPath);
		this.editableSettings = {
			interface: {
				language: {
					type: "selector",
					possibleValue: {
						fr: {
							fr: "Français",
							en: "English",
						},
						en: {
							fr: "Français",
							en: "English",
						},
					},
					onchange: function (e) {
						this.popup.confirm({
							message: Bs.translate.get("confirmRestart"),
							resolve: function () {
								this.props.language = e.target.value;
								this.save().then(() => {
									Electron.remote.app.relaunch();
									Electron.remote.app.exit();
								});
							}.bind(this),
						});
					},
					title: {
						fr: "Langue",
						en: "Language",
					},
					description: {
						fr: "Permet de changer la langue de l'interface de BetterSignal, changer ce paramètre entraine un redémarrage de Signal.",
						en: "Allow you to change BetterSignal interface language, change this setting will cause a application restart.",
					},
				},
			},
		};
	}
	open() {
		this.sections = {
			general: {
				menu: this.translate.get("general"),
				rightPanel: E("div").set({
					children: [
						E("div").set({
							props: {
								style: "display: flex",
							},
							children: [
								E("div").set({
									props: {
										class: "settingsRightPanelTitle",
										style: "height: 34px",
									},
									children: [this.translate.get("general")],
								}),
							],
						}),
						Object.entries(this.editableSettings).map(([key, value]) => {
							return E("div").set({
								props: {
									name: key,
									class: "BsSettingsCategory",
								},
								children: [
									E("span").set({
										events: {
											click: this.collapseCategory.bind(null, key),
										},
										children: [this.translate.get(key)],
									}),
									E("div").set({
										props: {
											class: "BsSettingsItems",
										},
										children: [
											Object.entries(value).map(([key1, value1]) => {
												/**@type {HTMLElement} */
												var button;
												if (value1.type === "selector") {
													button = E("select").set({
														props: {
															class: "BsSelect",
														},
														events: {
															change: value1.onchange.bind(Bs.settings),
														},
														children: [
															Object.entries(this.translateSettings(value1.possibleValue, Bs.settings.props.language)).map(([key2, value2]) => {
																var props = {
																	value: key2,
																};
																if (Bs.settings.props[key1] === key2) {
																	props.selected = true;
																}
																return E("option").set({
																	props,
																	children: [value2],
																});
															}),
														],
													});
												} else if (value1.type === "boolean") {
													button = this.components.switch(Bs.settings.props[key1], value1.onchange.bind(Bs.settings));
												}
												return E("div").set({
													props: {
														class: "BsSettingsItem",
													},
													children: [
														button,
														E("span").set({
															props: {
																class: "BsSettingsItemTitle",
															},
															children: [this.translateSettings(value1.title, Bs.settings.props.language)],
														}),
														E("span").set({
															props: {
																class: "BsSettingsItemDescription",
															},
															children: [this.translateSettings(value1.description, Bs.settings.props.language)],
														}),
													],
												});
											}),
										],
									}),
								],
							});
						}),
					],
				}),
			},
			plugins: {
				menu: this.translate.get("plugins"),
				rightPanel: E("div").set({
					children: [
						E("div").set({
							props: {
								style: "display: flex",
							},
							children: [
								E("div").set({
									props: {
										class: "settingsRightPanelTitle",
									},
									children: [this.translate.get("plugins")],
								}),
								E("div").set({
									props: {
										class: "settingsRightPanelButton BsButton1",
									},
									events: {
										click: this.storage.open.bind(this, pluginsFolder),
									},
									children: [this.translate.get("openPluginsFolder")],
								}),
							],
						}),
						E("div").set({
							props: {
								class: "BsSearch",
							},
							children: [
								E("input").set({
									events: {
										input: function (node) {
											var e = document.querySelector('#settingsRightPanel[name="plugins"] div.BsSearch input');
											var text = e.value;
											var root = document.querySelector("#BsPlugins");
											if (!e || e.value === undefined || !root) return;
											root.innerHTML = "";
											Object.entries(Bs.plugins.list).map(([key, value]) => {
												if (value.name.toLowerCase().includes(text.toLowerCase()) || value.description.toLowerCase().includes(text.toLowerCase()) || value.author.toLowerCase().includes(text.toLowerCase())) {
													root.append(this.loadPluginCard(value));
												}
											});
										}.bind(this),
									},
									props: {
										type: "text",
										placeholder: this.translate.get("searchPlugins"),
									},
								}),
								E("img").set({
									props: {
										src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='' fill='%23FFFFFF' viewBox='0 0 24 24' style='width: 16px; height: 16px;'%3E%3Cpath fill='none' d='M0 0h24v24H0V0z'%3E%3C/path%3E%3Cpath d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'%3E%3C/path%3E%3C/svg%3E",
									},
								}),
							],
						}),
						E("div").set({
							props: {
								id: "BsPlugins",
							},
							children: Object.entries(Bs.plugins.list).map(([key, value]) => {
								return this.loadPluginCard(value);
							}),
						}),
					],
				}),
			},
			themes: {
				menu: this.translate.get("themes"),
				rightPanel: E("div").set({
					children: [
						E("div").set({
							props: {
								style: "display: flex",
							},
							children: [
								E("div").set({
									props: {
										class: "settingsRightPanelTitle",
									},
									children: [this.translate.get("themes")],
								}),
								E("div").set({
									props: {
										class: "settingsRightPanelButton BsButton1",
									},
									events: {
										click: this.storage.open.bind(this, themesFolder),
									},
									children: [this.translate.get("openThemesFolder")],
								}),
							],
						}),
						E("div").set({
							props: {
								class: "BsSearch",
							},
							children: [
								E("input").set({
									events: {
										input: function () {
											var e = document.querySelector('#settingsRightPanel[name="themes"] div.BsSearch input');
											var text = e.value;
											var root = document.querySelector("#BsThemes");
											if (!e || e.value === undefined || !root) return;
											root.innerHTML = "";
											Object.entries(Bs.themes.list).map(([key, value]) => {
												if (value.name.toLowerCase().includes(text.toLowerCase()) || value.description.toLowerCase().includes(text.toLowerCase()) || value.author.toLowerCase().includes(text.toLowerCase())) {
													root.append(this.loadThemeCard(value));
												}
											});
										}.bind(this),
									},
									props: {
										type: "text",
										placeholder: this.translate.get("searchThemes"),
									},
								}),
								E("img").set({
									props: {
										src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='' fill='%23FFFFFF' viewBox='0 0 24 24' style='width: 16px; height: 16px;'%3E%3Cpath fill='none' d='M0 0h24v24H0V0z'%3E%3C/path%3E%3Cpath d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'%3E%3C/path%3E%3C/svg%3E",
									},
								}),
							],
						}),
						E("div").set({
							props: {
								id: "BsThemes",
							},
							children: Object.entries(Bs.themes.list).map(([key, value]) => {
								return this.loadThemeCard(value);
							}),
						}),
					],
				}),
			},
		};
		this.page = E("div").set({
			props: {
				id: "settingsPage",
				class: "settings-page",
			},
			children: [
				E("div").set({
					props: {
						id: "settingsLeftPanel",
					},
					children: [
						E("div").set({
							props: {
								class: "settingsLeftPanelTitle",
							},
							children: [this.translate.get("settings")],
						}),
						Object.entries(this.sections).map(([key, value]) => {
							return E("div").set({
								props: {
									name: key,
									class: "settingsLeftPanelItem" + (key === "general" ? " settingsLeftPanelItemActive" : ""),
								},
								events: {
									click: this.changeSection.bind(this, key),
								},
								children: [value.menu],
							});
						}),
					],
				}),
				E("div").set({
					props: {
						id: "settingsRightPanel",
						name: "general",
					},
					children: [this.loadRightPanel("general")],
				}),
			],
		});
		this.popup = this.popup.new(this.page, { size: "big" });
		this.popup.open();
	}
	loadRightPanel(section) {
		if (this.sections[section]) return this.sections[section].rightPanel;
		else return this.sections["general"].rightPanel;
	}
	changeSection(section) {
		var root = document.querySelector("#settingsRightPanel");
		root.innerHTML = "";
		root.append(this.loadRightPanel(section));
		root.setAttribute("name", section);
		var active = document.querySelector(".settingsLeftPanelItemActive");
		if (active) active.classList.remove("settingsLeftPanelItemActive");
		var menu = document.querySelector(`.settingsLeftPanelItem[name="${section}"]`);
		if (menu) menu.classList.add("settingsLeftPanelItemActive");
	}
	save() {
		return new Promise((resolve) => {
			fs.writeFile(settingsPath, JSON.stringify(Bs.settings.props), { encoding: "utf8" }, () => {
				resolve();
			});
		});
	}
	loadPluginCard(plugin) {
		return E("div").set({
			props: {
				name: plugin.name,
				class: "BsPluginCard",
			},
			children: [
				E("div").set({
					props: {
						class: "BsPluginCardHead",
					},
					children: [
						E("div").set({
							props: {
								class: "BsPluginCardHeadInfos",
							},
							children: [
								E("div").set({
									props: {
										class: "BsPluginCardHeadName",
									},
									children: [plugin.name],
								}),
								E("div").set({
									props: {
										class: "BsPluginCardHeadAuthor",
									},
									children: [
										this.translate.get("versionAndAuthor", {
											version: plugin.version,
											author: plugin.author,
										}),
									],
								}),
							],
						}),
						E("div").set({
							props: {
								value: Bs.settings.props.enabledPlugins.includes(plugin.name),
								class: "BsPluginCardHeadButton",
							},
							events: {
								click: Bs.plugins.enablePlugin.bind(Bs.plugins, plugin),
							},
							children: [E("div")],
						}),
					],
				}),
				E("div").set({
					props: {
						class: "BsPluginCardFoot",
					},
					children: [
						E("div").set({
							props: {
								class: "BsPluginCardFootDescription",
							},
							children: [plugin.description],
						}),
						E("div").set({
							props: {
								class: "BsPluginCardFootButtonBar",
							},
							children: [
								E("div").set({
									props: {
										class: "BsPluginCardFootLinks",
									},
									children: [
										plugin.links.map((item) => {
											return E("a").set({
												props: {
													title: item.name,
													href: item.src,
												},
												children: [
													E("img").set({
														props: {
															// TODO change
															src: this.components.svgIcons["website"],
														},
													}),
												],
											});
										}),
									],
								}),
								E("div").set({
									props: {
										class: "BsPluginCardFootActionButton",
									},
									children: [
										E("div").set({
											props: {
												title: this.translate.get("settings"),
											},
											events: {
												click: Bs.plugins.openSettings.bind(this, plugin),
											},
											children: [
												E("img").set({
													props: {
														src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Capa_1' x='0px' y='0px' width='507.451px' height='507.45px' viewBox='0 0 507.451 507.45' style='enable-background:new 0 0 507.451 507.45;fill: white;' xml:space='preserve'%3E%3Cg%3E%3Cg id='settings'%3E%3Cpath d='M440.813,280.5c0-7.65,2.55-15.3,2.55-25.5s0-17.85-2.55-25.5l53.55-43.35c5.1-5.1,5.1-10.2,2.55-15.3l-51-89.25 c-2.55-2.55-7.649-5.1-15.3-2.55l-63.75,25.5c-12.75-10.2-28.05-17.85-43.35-25.5l-10.2-66.3C315.863,5.1,308.212,0,303.113,0 h-102c-5.101,0-12.75,5.1-12.75,10.2l-10.2,68.85c-15.3,5.1-28.05,15.3-43.35,25.5l-61.2-25.5c-7.65-2.55-12.75,0-17.851,5.1 l-51,89.25c-2.55,2.55,0,10.2,5.1,15.3l53.55,40.8c0,7.65-2.55,15.3-2.55,25.5s0,17.85,2.55,25.5l-53.55,43.35 c-5.1,5.101-5.1,10.2-2.55,15.301l51,89.25c2.55,2.55,7.649,5.1,15.3,2.55l63.75-25.5c12.75,10.2,28.05,17.85,43.35,25.5 l10.2,66.3c0,5.1,5.1,10.2,12.75,10.2h102c5.101,0,12.75-5.101,12.75-10.2l10.2-66.3c15.3-7.65,30.6-15.3,43.35-25.5l63.75,25.5 c5.101,2.55,12.75,0,15.301-5.101l51-89.25c2.55-5.1,2.55-12.75-2.551-15.3L440.813,280.5z M252.113,344.25 c-48.45,0-89.25-40.8-89.25-89.25s40.8-89.25,89.25-89.25s89.25,40.8,89.25,89.25S300.563,344.25,252.113,344.25z'/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3C/svg%3E",
													},
												}),
											],
										}),
										E("div").set({
											props: {
												class: "BsPluginCardFootActionButtonDelete",
												title: this.translate.get("delete"),
											},
											events: {
												click: Bs.plugins.delete.bind(Bs.plugins, plugin),
											},
											children: [
												E("img").set({
													props: {
														src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Capa_1' x='0px' y='0px' width='753.23px' height='753.23px' viewBox='0 0 753.23 753.23' style='enable-background:new 0 0 753.23 753.23;fill: white;' xml:space='preserve'%3E%3Cg%3E%3Cg id='_x34__18_'%3E%3Cg%3E%3Cpath d='M635.538,94.154h-141.23V47.077C494.308,21.067,473.24,0,447.23,0H306c-26.01,0-47.077,21.067-47.077,47.077v47.077 h-141.23c-26.01,0-47.077,21.067-47.077,47.077v47.077c0,25.986,21.067,47.053,47.03,47.077h517.917 c25.986-0.024,47.054-21.091,47.054-47.077V141.23C682.615,115.221,661.548,94.154,635.538,94.154z M447.23,94.154H306V70.615 c0-12.993,10.545-23.539,23.538-23.539h94.154c12.993,0,23.538,10.545,23.538,23.539V94.154z M117.692,659.077 c0,51.996,42.157,94.153,94.154,94.153h329.539c51.996,0,94.153-42.157,94.153-94.153V282.461H117.692V659.077z M470.77,353.077 c0-12.993,10.545-23.539,23.538-23.539s23.538,10.545,23.538,23.539v282.461c0,12.993-10.545,23.539-23.538,23.539 s-23.538-10.546-23.538-23.539V353.077z M353.077,353.077c0-12.993,10.545-23.539,23.539-23.539s23.538,10.545,23.538,23.539 v282.461c0,12.993-10.545,23.539-23.538,23.539s-23.539-10.546-23.539-23.539V353.077z M235.384,353.077 c0-12.993,10.545-23.539,23.539-23.539s23.539,10.545,23.539,23.539v282.461c0,12.993-10.545,23.539-23.539,23.539 s-23.539-10.546-23.539-23.539V353.077z'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3C/svg%3E",
													},
												}),
											],
										}),
									],
								}),
							],
						}),
					],
				}),
			],
		});
	}
	loadThemeCard(theme) {
		return E("div").set({
			props: {
				name: theme.name,
				class: "BsThemeCard",
			},
			children: [
				E("div").set({
					props: {
						class: "BsThemeCardHead",
					},
					children: [
						E("div").set({
							props: {
								class: "BsThemeCardHeadInfos",
							},
							children: [
								E("div").set({
									props: {
										class: "BsThemeCardHeadName",
									},
									children: [theme.name],
								}),
								E("div").set({
									props: {
										class: "BsThemeCardHeadAuthor",
									},
									children: [
										this.translate.get("versionAndAuthor", {
											version: theme.version,
											author: theme.author,
										}),
									],
								}),
							],
						}),
						E("div").set({
							props: {
								value: Bs.settings.props.enabledThemes.includes(theme.name),
								class: "BsThemeCardHeadButton",
							},
							events: {
								click: Bs.themes.enableTheme.bind(Bs.themes, theme),
							},
							children: [E("div")],
						}),
					],
				}),
				E("div").set({
					props: {
						class: "BsThemeCardFoot",
					},
					children: [
						E("div").set({
							props: {
								class: "BsThemeCardFootDescription",
							},
							children: [theme.description],
						}),
						E("div").set({
							props: {
								class: "BsThemeCardFootButtonBar",
							},
							children: [
								E("div").set({
									props: {
										class: "BsThemeCardFootLinks",
									},
									children: [
										theme.links.map((item) => {
											return E("a").set({
												props: {
													title: item.name,
													href: item.src,
												},
												children: [
													E("img").set({
														props: {
															// TODO change
															src: this.components.svgIcons.website,
														},
													}),
												],
											});
										}),
									],
								}),
								E("div").set({
									props: {
										class: "BsThemeCardFootActionButton",
									},
									children: [
										E("div").set({
											props: {
												title: this.translate.get("settings"),
											},
											events: {
												click: Bs.themes.openSettings.bind(this, theme),
											},
											children: [
												E("img").set({
													props: {
														src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Capa_1' x='0px' y='0px' width='507.451px' height='507.45px' viewBox='0 0 507.451 507.45' style='enable-background:new 0 0 507.451 507.45;fill: white;' xml:space='preserve'%3E%3Cg%3E%3Cg id='settings'%3E%3Cpath d='M440.813,280.5c0-7.65,2.55-15.3,2.55-25.5s0-17.85-2.55-25.5l53.55-43.35c5.1-5.1,5.1-10.2,2.55-15.3l-51-89.25 c-2.55-2.55-7.649-5.1-15.3-2.55l-63.75,25.5c-12.75-10.2-28.05-17.85-43.35-25.5l-10.2-66.3C315.863,5.1,308.212,0,303.113,0 h-102c-5.101,0-12.75,5.1-12.75,10.2l-10.2,68.85c-15.3,5.1-28.05,15.3-43.35,25.5l-61.2-25.5c-7.65-2.55-12.75,0-17.851,5.1 l-51,89.25c-2.55,2.55,0,10.2,5.1,15.3l53.55,40.8c0,7.65-2.55,15.3-2.55,25.5s0,17.85,2.55,25.5l-53.55,43.35 c-5.1,5.101-5.1,10.2-2.55,15.301l51,89.25c2.55,2.55,7.649,5.1,15.3,2.55l63.75-25.5c12.75,10.2,28.05,17.85,43.35,25.5 l10.2,66.3c0,5.1,5.1,10.2,12.75,10.2h102c5.101,0,12.75-5.101,12.75-10.2l10.2-66.3c15.3-7.65,30.6-15.3,43.35-25.5l63.75,25.5 c5.101,2.55,12.75,0,15.301-5.101l51-89.25c2.55-5.1,2.55-12.75-2.551-15.3L440.813,280.5z M252.113,344.25 c-48.45,0-89.25-40.8-89.25-89.25s40.8-89.25,89.25-89.25s89.25,40.8,89.25,89.25S300.563,344.25,252.113,344.25z'/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3C/svg%3E",
													},
												}),
											],
										}),
										E("div").set({
											props: {
												class: "BsThemeCardFootActionButtonDelete",
												title: this.translate.get("delete"),
											},
											events: {
												click: Bs.themes.delete.bind(Bs.themes, theme),
											},
											children: [
												E("img").set({
													props: {
														src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Capa_1' x='0px' y='0px' width='753.23px' height='753.23px' viewBox='0 0 753.23 753.23' style='enable-background:new 0 0 753.23 753.23;fill: white;' xml:space='preserve'%3E%3Cg%3E%3Cg id='_x34__18_'%3E%3Cg%3E%3Cpath d='M635.538,94.154h-141.23V47.077C494.308,21.067,473.24,0,447.23,0H306c-26.01,0-47.077,21.067-47.077,47.077v47.077 h-141.23c-26.01,0-47.077,21.067-47.077,47.077v47.077c0,25.986,21.067,47.053,47.03,47.077h517.917 c25.986-0.024,47.054-21.091,47.054-47.077V141.23C682.615,115.221,661.548,94.154,635.538,94.154z M447.23,94.154H306V70.615 c0-12.993,10.545-23.539,23.538-23.539h94.154c12.993,0,23.538,10.545,23.538,23.539V94.154z M117.692,659.077 c0,51.996,42.157,94.153,94.154,94.153h329.539c51.996,0,94.153-42.157,94.153-94.153V282.461H117.692V659.077z M470.77,353.077 c0-12.993,10.545-23.539,23.538-23.539s23.538,10.545,23.538,23.539v282.461c0,12.993-10.545,23.539-23.538,23.539 s-23.538-10.546-23.538-23.539V353.077z M353.077,353.077c0-12.993,10.545-23.539,23.539-23.539s23.538,10.545,23.538,23.539 v282.461c0,12.993-10.545,23.539-23.538,23.539s-23.539-10.546-23.539-23.539V353.077z M235.384,353.077 c0-12.993,10.545-23.539,23.539-23.539s23.539,10.545,23.539,23.539v282.461c0,12.993-10.545,23.539-23.539,23.539 s-23.539-10.546-23.539-23.539V353.077z'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3C/svg%3E",
													},
												}),
											],
										}),
									],
								}),
							],
						}),
					],
				}),
			],
		});
	}
	translateSettings(messages, locale) {
		if (messages[locale]) {
			return messages[locale];
		} else if (messages["en"]) {
			return messages["en"];
		} else {
			return "";
		}
	}
	collapseCategory(key) {
		var e = document.querySelector(".BsSettingsCategory[name=" + key + "]");
		if (!e) return;
		if (e.classList.contains("collapsed")) e.classList.remove("collapsed");
		else e.classList.add("collapsed");
	}
}
class Popup {
	constructor(content, { size, actions, type }) {
		this.content = content;
		this.actions = actions;
		this.size = size;
		this.id = Math.floor(Math.random() * 1000000000000);
		this.page = E("div").set({
			props: {
				id: "popup-" + this.id,
				class: "BsPopup",
				size: this.size === "big" || this.size === "medium" || this.size === "small" ? this.size : "auto",
			},
			children: [
				this.content,
				E("div").set({
					props: {
						class: "BsPopupExit",
						title: Bs.translate.get("exit"),
					},
					events: {
						click: this.close.bind(this),
					},
					children: [
						E("img").set({
							props: {
								src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Capa_1' x='0px' y='0px' viewBox='0 0 52.001 52.001' style='enable-background:new 0 0 52.001 52.001;fill: white;' xml:space='preserve'%3E%3Cg%3E%3Cg%3E%3Cpath style='/* fill:%23030104; */' d='M47.743,41.758L33.955,26.001l13.788-15.758c2.343-2.344,2.343-6.143,0-8.486 c-2.345-2.343-6.144-2.342-8.486,0.001L26,16.91L12.743,1.758C10.4-0.584,6.602-0.585,4.257,1.757 c-2.343,2.344-2.343,6.143,0,8.486l13.788,15.758L4.257,41.758c-2.343,2.343-2.343,6.142-0.001,8.485 c2.344,2.344,6.143,2.344,8.487,0L26,35.091l13.257,15.152c2.345,2.344,6.144,2.344,8.487,0 C50.086,47.9,50.086,44.101,47.743,41.758z'/%3E%3C/g%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3Cg%3E%3C/g%3E%3C/svg%3E",
							},
						}),
					],
				}),
			],
		});
	}
	open() {
		if (document.querySelector("#popup-" + this.id)) return false;
		var bsPopups = document.querySelector("BsPopups");
		document.body.click();
		var main = document.querySelector("body > div.index");
		main.getElementsByClassName.opacity = "0.5";
		var darkOverlay = document.createElement("div");
		darkOverlay.id = "dark-overlay-" + this.id;
		darkOverlay.classList.add("dark-overlay");
		bsPopups.append(darkOverlay, this.page);
		if (this.page.getAttribute("size") === "auto") {
			this.page.style.top = `calc(50% - ${this.page.clientHeight / 2}px)`;
			this.page.style.right = `calc(50% - ${this.page.clientWidth / 2}px)`;
		}
		return true;
	}
	close() {
		try {
			this.page.remove();
			document.querySelector(`#dark-overlay-${this.id}`) ? document.querySelector(`#dark-overlay-${this.id}`).remove() : null;
			return true;
		} catch (e) {
			throw new Error("Popup isn't open !");
		}
	}
}
class ContextMenu {
	constructor() {
		this.items = {
			selection: [
				{
					text: Bs.translate.get("copy"),
					onclick: function () {
						document.execCommand("Copy");
						Bs.toast.new(Bs.translate.get("copied"), {
							type: "success",
							icon: "ok",
						});
					},
					submenu: [],
				},
				{
					divider: true,
				},
				{
					text: Bs.translate.get("searchOn"),
					onclick: function () {
						var selection = document.getSelection().toString();
						var url = "https://www.google.com/search?q=" + selection.replace(" ", "+");
						Electron.shell.openExternal(url);
					},
					submenu: [
						{
							text: "Google",
							onclick: function () {
								var selection = document.getSelection().toString();
								var url = "https://www.google.com/search?q=" + selection.replace(" ", "+");
								Electron.shell.openExternal(url);
							},
						},
						{
							text: "Bing",
							onclick: function () {
								var selection = document.getSelection().toString();
								var url = "https://www.bing.com/search?q=" + selection.replace(" ", "+");
								Electron.shell.openExternal(url);
							},
						},
					],
				},
			],
			image: [
				{
					text: Bs.translate.get("saveAs"),
					onclick: function (e) {
						// var parent = e.closest(".module-message__attachment-container");
						// if (parent) {
						// 	var reactEventHandlers = parent[Object.keys(parent).find((_e) => _e.includes("__reactEventHandlers$"))];
						// 	var attachment = Object.values(reactEventHandlers.children.props.attachments).find((_e) => _e.thumbnail.url.replaceAll("\\", "/") === imageUrl || _e.url.replaceAll("\\", "/").replaceAll("file:///", ""));
						// 	if (!attachment) return false;
						// 	var fileName = attachment.fileName;
						// 	var ext = attachment.contentType.match(/(?!.*\/).*/gm)[0]
						// 	var link = attachment.url
						// } else {
						// 	var reactEventHandlers = e[Object.keys(e).find((_e) => _e.includes("__reactEventHandlers$"))];
						// 	var link = e.src.replaceAll("file:///", "").replaceAll("\\", "/");
						// }
						// var name = fileName ? fileName : `image-${new Date().format("YYYY-MM-DD_hh-mm-ss")}.${ext ? ext : "jpeg"}`;
						// Bs.storage.saveDataToDisk({
						// 	data: fs.readFileSync(link),
						// 	name: name,
						// }).then(({ fullPath }) => {
						// 	Bs.toast.new(Bs.translate.get("savedAsAndOpenFolder"), {
						// 		type: "success",
						// 		icon: "ok",
						// 		events: {
						// 			click: Signal.Migrations.openFileInFolder.bind(null, fullPath),
						// 		},
						// 	});
						// });
						var path = Bs.path.parse(e.src).path;
						// var shortThumbnailPath =
						var parent = e.closest(".module-timeline__message-container");
						if (parent ? parent.id : false) {
							var message = Bs.message.getFromElement(parent);
							var attachment = message.attributes.attachments.find((attachement) => {
								Bs.path.normalize("" + attachement.thumbnail.src) === Bs.path.normalize(e.src);
							});
							Bs.storage
								.saveDataToDisk({
									data: fs.readFileSync(attachment.src),
									name: name,
								})
								.then(({ fullPath }) => {
									Bs.toast.new(Bs.translate.get("savedAsAndOpenFolder"), {
										type: "success",
										icon: "ok",
										events: {
											click: Signal.Migrations.openFileInFolder.bind(null, fullPath),
										},
									});
								});
						}
					},
				},
				{
					// TODO convertir
					text: Bs.translate.get("copy"),
					onclick: function (e) {
						var img = e.querySelector("img");
						if (!img) return false;
						Bs.copyImage(img.src);
					},
					submenu: [
						{
							text: Bs.translate.get("image"),
							onclick: function (e) {
								var img = e.querySelector("img");
								if (!img) return false;
								Bs.copyImage(img.src);
							},
						},
						{
							text: Bs.translate.get("imageLink"),
							onclick: function (e) {
								var img = e.querySelector("img");
								if (!img) return false;
								Bs.copyText(img.src.replace("file:///", ""));
								Bs.toast.new(Bs.translate.get("copied"));
							},
						},
					],
				},
			],
			sticker: [
				{
					text: Bs.translate.get("saveAs"),
					onclick: function (e) {
						var parent = e.closest(selectorList.messageStickerContainer);
						if (!parent) return false;
						var reactEventHandlers = parent[Object.keys(parent).find((_e) => _e.includes("__reactEventHandlers$"))];
						var attachment = reactEventHandlers.children.props.attachments[0];
						var name = `sticker-${new Date().format("YYYY-MM-DD_hh-mm-ss")}.${attachment.contentType.match(/(?!.*\/).*/gm)[0]}`;
						var link = attachment.url;
						if (!name || !link) return false;
						Bs.storage
							.saveDataToDisk({
								data: fs.readFileSync(link),
								name: name,
							})
							.then(({ fullPath }) => {
								Bs.toast.new(Bs.translate.get("savedAsAndOpenFolder"), {
									type: "success",
									icon: "ok",
									events: {
										click: Signal.Migrations.openFileInFolder.bind(null, fullPath),
									},
								});
							});
					},
				},
			],
			link: [
				{
					text: Bs.translate.get("open"),
					onclick: function (e) {
						Electron.shell.openExternal(e.href);
					},
				},
				{
					text: Bs.translate.get("copyLink"),
					onclick: function (e) {
						Bs.copyText(e.href);
					},
				},
			],
			avatar: [
				{
					text: Bs.translate.get("saveAs"),
					onclick: function (e) {
						//var reactEventHandlers = e[Object.keys(e).find((_e) => _e.includes("__reactEventHandlers$"))]
						var imageUrl = e.src.replaceAll("file:///", "").replaceAll("\\", "/");
						if (!imageUrl) return false;
						Bs.storage
							.saveDataToDisk({
								data: fs.readFileSync(imageUrl),
								name: `avatar-${new Date().format("YYYY-MM-DD_hh-mm-ss")}.jpeg`,
							})
							.then(({ fullPath }) => {
								Bs.toast.new(Bs.translate.get("savedAsAndOpenFolder"), {
									type: "success",
									icon: "ok",
									events: {
										click: Signal.Migrations.openFileInFolder.bind(null, fullPath),
									},
								});
							});
					},
				},
				{
					text: Bs.translate.get("copy"),
					onclick: function (e) {
						if (!e) return false;
						Bs.copyImage(e.src);
					},
					submenu: [
						{
							text: Bs.translate.get("image"),
							onclick: function (e) {
								e;
								if (!E) return false;
								Bs.copyImage(e.src);
							},
						},
						{
							text: Bs.translate.get("imageLink"),
							onclick: function (e) {
								e;
								if (!e) return false;
								Bs.copyText(e.src.replace("file:///", ""));
								Bs.toast.new(Bs.translate.get("copied"));
							},
						},
					],
				},
			],
			divider: {
				divider: true,
			},
		}; // TODO Ajouter icon
		this.query = {
			// ".module-message__attachment-container .module-image": "image",
			// ".module-message__sticker-container .module-image": "sticker",
			a: "link",
			img: "image",
			// ".module-avatar img": "avatar",
		};
		this.ref = null;
	}
	render(type) {
		if (!this.items[type]) return false;
		return this.items[type].map((item) => {
			if (item.submenu ? item.submenu.length != 0 : false) {
				return this.renderSubmenu(item);
			} else {
				return this.renderItem(item);
			}
		});
	}
	renderItem(item) {
		if (item.divider) {
			return React.createElement(React_Contextmenu.MenuItem, {
				divider: true,
			});
		}
		if (!item.onclick) item.onclick = function () {};
		return React.createElement(
			React_Contextmenu.MenuItem,
			{
				onClick: item.onclick.bind(null, this.target ? this.target : null),
			},
			item.text
		);
	}
	renderSubmenu(item) {
		return React.createElement(
			React_Contextmenu.SubMenu,
			{
				title: item.text,
				//onClick: item.onclick.bind(null, this.target ? this.target : null),
			},
			item.submenu.map((subItem) => {
				if (subItem.submenu) {
					return this.renderSubmenu(subItem);
				} else {
					return this.renderItem(subItem);
				}
			})
		);
	}
	open(e) {
		e.preventDefault();
		this.target = e.target;
		this.root = document.querySelector("BsContextMenu");
		this.triggerRoot = document.querySelector("BsContextMenuTrigger");
		if (!this.root || !this.triggerRoot) return false;
		this.menu = null;
		this.trigger = React.createElement(React_Contextmenu.ContextMenuTrigger, {
			id: "BsContextMenu",
			ref: (c) => (this.ref = c),
			style: {
				display: "none",
			},
		});
		ReactDOM.render(this.trigger, this.triggerRoot);
		if (Boolean(window.getSelection().toString())) {
			this.menu = this.render("selection");
		} else {
			Object.entries(this.query).forEach(([key, value]) => {
				let element = e.target.closest(key);
				if (element && this.items[value]) {
					this.target = element;
					if (!this.menu) this.menu = [];
					else this.menu.push(this.renderItem(this.items.divider));
					this.menu = this.menu.concat(this.render(value));
				}
			});
		}
		if (this.menu) {
			ReactDOM.render(
				React.createElement(
					React_Contextmenu.ContextMenu,
					{
						id: "BsContextMenu",
					},
					this.menu
				),
				this.root
			);
			if (this.ref) this.ref.handleContextClick(e);
		}
	}
}

if (!fs.existsSync(bettersignalPath)) {
	fs.mkdirSync(bettersignalPath);
}
if (!fs.existsSync(pluginsFolder)) {
	fs.mkdirSync(pluginsFolder);
}
if (!fs.existsSync(themesFolder)) {
	fs.mkdirSync(themesFolder);
}
if (!fs.existsSync(settingsPath)) {
	fs.writeFileSync(
		settingsPath,
		JSON.stringify({
			enabledPlugins: [],
			enabledThemes: [],
			language: "en",
		})
	);
}

function E(type) {
	return document.createElement(type);
}
HTMLElement.prototype.set = function ({ props, events, children }) {
	if (typeof props === "object") {
		for (var i in props) {
			if (props[i] instanceof Array) this.setAttribute(i, props[i].join(" "));
			else this.setAttribute(i, props[i]);
		}
	}
	if (typeof events === "object") {
		for (var i in events) {
			this.addEventListener(i, events[i]);
		}
	}
	if (children instanceof Array) {
		for (var i in children) {
			if (children[i] instanceof Array) {
				for (var j in children[i]) {
					this.append(children[i][j]);
				}
			} else this.append(children[i]);
		}
	}
	return this;
};
String.prototype.isURL = function () {
	var pattern = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i;
	return !!pattern.test(this);
};
String.prototype.isPath = function () {
	var pattern = /(file:\/\/\/)?([a-z]:)(([\\\/][^\\\/\n\:\*\?\"\<\>\|]*)+[\\\/]?)/gi;
	return !!pattern.test(this);
};
Date.prototype.format = function (format) {
	return format
		.replaceAll("YYYY", this.getFullYear())
		.replaceAll("YY", this.getFullYear().toString().slice(2))
		.replaceAll("MM", (this.getMonth().toString().length == 1 ? "0" : "") + (this.getMonth() + 1))
		.replaceAll("DD", (this.getDate().toString().length == 1 ? "0" : "") + this.getDate())
		.replaceAll("ss", (this.getSeconds().toString().length == 1 ? "0" : "") + this.getSeconds())
		.replaceAll("mm", (this.getMinutes().toString().length == 1 ? "0" : "") + this.getMinutes())
		.replaceAll("hh", (this.getHours().toString().length == 1 ? "0" : "") + this.getHours());
};

window.onload = function () {
	Bs = new Bettersignal();
	Bs.settings = new Settings();
	Bs.contextMenu = new ContextMenu();
	BsApi(Bs, {
		E,
	});
	Bs.wait.elementOnce(".index").then(function () {
		Bs.wait.element(selectorList.avatarPopup, function (node) {
			if (document.querySelector("#module-avatar-popup__bettersignal-settings") == null) {
				var element = E("div").set({
					props: {
						class: classList.avatarPopupItem,
						id: "module-avatar-popup__bettersignal-settings",
					},
					events: {
						click: Bs.settings.open.bind(Bs.settings),
					},
					children: [
						E("div").set({
							props: {
								class: [classList.avatarPopupItemIcon, classList.avatarPopupItemSettingsIcon],
							},
						}),
						E("div").set({
							props: {
								class: classList.avatarPopupItemText,
							},
							children: [Bs.translate.get("settingsButton")],
						}),
					],
				});
				node.append(element);
			}
		});
		document.body.append(E("BsToasts"), E("BsContextMenu"), E("BsContextMenuTrigger"), E("BsPopups"));
		document.head.append(E("BsStyle"), E("BsThemes"));
		Bs.plugins = new Plugins();
		Bs.themes = new Themes();
		Bs.plugins.startAll();
		Bs.themes.startAll();
		fs.watch(pluginsFolder, Bs.plugins.onChangePluginsFolder.bind(Bs.plugins));
		document.body.addEventListener("contextmenu", Bs.contextMenu.open.bind(Bs.contextMenu));
		Signal = window.Signal;
	});
	// DEBUG
	window._Bs = Bs;
	window.React_Contextmenu = React_Contextmenu;
	window.Electron = Electron;
	window.fs = fs;
	window.path = path;
	window.child_process = child_process;
	window.http = http;
};

exports.Bettersignal = Bettersignal;

// window.BsApi = BsApi;
// module.exports = BsApi;
