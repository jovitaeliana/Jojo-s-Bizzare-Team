"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  // Add IPC methods here as needed
  sendMessage: (channel, data) => {
    electron.ipcRenderer.send(channel, data);
  },
  onMessage: (channel, callback) => {
    electron.ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  // Window controls
  windowControls: {
    minimize: () => electron.ipcRenderer.send("window-minimize"),
    maximize: () => electron.ipcRenderer.send("window-maximize"),
    close: () => electron.ipcRenderer.send("window-close")
  }
});
