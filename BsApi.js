const React = require("react");
const ReactDOM = require("react-dom");
const http = require("http");
const https = require("https");
const popperJs = require("popper.js");
const classnames = require("classnames");
const react_contextmenu = require("react-contextmenu");
const fs = require("fs");

const { Bettersignal } = require("./index")

module.exports = function (/** @type {Bettersignal} */Bs, { E }) {
	window.BsApi = {
		translate: {
			locale: Bs.settings.props.language,
			get: Bs.translate.get,
			messages: Bs.translate.messages, 
		},
		util: {
			React,
			ReactDOM,
			http,
			https,
			popperJs,
			classnames,
			E,
			react_contextmenu,
		},
		log: {
			info: Bs.log.info,
			error: Bs.log.error,
			warn: Bs.log.warn,
		},
		toast: {
			new: function (message, { events = {}, initialize = undefined, type = undefined } = {}) {
				return Bs.toast.new(message, { events, initialize, type });
			},
		},
		showConfirmationDialog({ message, resolve, okText, confirmStyle, cancelText, reject }) {
			return Bs.popup.confirm({
				message: message,
				resolve: resolve,
				okText: okText,
				confirmStyle: confirmStyle,
				cancelText: cancelText,
				reject: reject,
			});
		},
		waitForElement: function (selector, callback) {
			if (typeof selector !== "string") throw new Error("waitForElement: Invalid argument: 'selector' must be a selector string");
			if (typeof callback !== "function") throw new Error("waitForElement: Invalid argument: 'callback' must be a function");
			return Bs.wait.element(selector, callback);
		},
		waitForElementOnce: function (selector) {
			if (typeof selector !== "string") throw new Error("waitForElementOnce: Invalid argument: 'selector' must be a selector string");
			return Bs.wait.elementOnce(selector);
		},
		openFolder: function (path) {
			fs.access(path, fs.constants.R_OK, (err) => {
				if (err) throw new Error("openFolder: Invalid argument: Folder doesn't exist");
				return Bs.storage.open(path);
			});
		},
		newPopup: function (content, { size, actions, type } = {}) {
			if (!(typeof content === "string" || content instanceof HTMLElement)) throw new Error("newPopup: Invalid argument: content must be a string or a HTMLElement");
			if (!(actions instanceof Array) && actions !== undefined) throw new Error("newPopup: Invalid Argument: actions must be an array or undefined");
			if (actions !== undefined)
				actions.forEach((item) => {
					if (typeof item.name !== "string" && typeof item.callback !== "function") throw new Error("newPopup: Invalid Argument: object in actions array must have 'name' (string) and 'callback' (function) as properties");
				});
			if (typeof size !== "string" && size !== undefined) throw new Error("newPopup: Invalid Argument: size must be either 'big' or 'medium' or 'small' or 'auto' or undefined");
			if (typeof type !== "string" && type !== undefined) throw new Error("newPopup: Invalid Argument: type must be either 'confirmation' or 'accept' or undefined");
			return Bs.popup.new(content, { size: size, actions: actions, type: type });
		},
		css: {
			inject: function (cssObj) {
				return Bs.css.inject(cssObj);
			},
		},
		windows: {
			openFolder: function (path) {
				fs.access(path, fs.constants.R_OK, (err) => {
					if (err) throw new Error("openFolder: Invalid argument: Folder doesn't exist");
					return Bs.windows.openFolder(path);
				});
			},
		},
		wait: {
			element: function(selector, callback) {
				return Bs.wait.element(selector, callback);
			},
			elementOnce: function(selector) {
				return Bs.wait.elementOnce(selector)
			}
		},
		popup: {
			new: function (message, {size, actions, type}) {
				return Bs.popup.new(message, { size, actions, type})
			},
			progress: function(message) {
				return Bs.popup.progress(message)
			},
			confirm: function({ message, resolve = () => {}, okText, confirmStyle, cancelText, reject }) {
				return Bs.popup.confirm({ message, resolve, okText, confirmStyle, cancelText, reject })
			}
		},
		conversation: {
			get: function(id) {
				return Bs.conversation.get(id)
			},
			getAll: function() {
				return Bs.conversation.getAll()
			},
			current: function() {
				return Bs.conversation.current()
			}
		}
	};
};
