const { contextBridge, ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Verificar se estamos em ambiente Electron
  isElectron: true,
  platform: process.platform,
  
  // APIs para arquivos
  fs: {
    writeFile: (filePath, data) => ipcRenderer.invoke('fs-write-file', filePath, data),
    readFile: (filePath) => ipcRenderer.invoke('fs-read-file', filePath),
    exists: (filePath) => ipcRenderer.invoke('fs-exists', filePath),
    mkdir: (dirPath) => ipcRenderer.invoke('fs-mkdir', dirPath)
  },
  
  // APIs para o banco de dados
  database: {
    path: () => ipcRenderer.invoke('get-database-path'),
    backup: (data) => ipcRenderer.invoke('backup-database', data),
    restore: (filePath) => ipcRenderer.invoke('restore-database', filePath),
    initialize: () => ipcRenderer.invoke('initialize-database')
  }
});

// Expor informações do processo para debug
window.electronProcess = {
  platform: process.platform,
  arch: process.arch,
  version: process.version,
  versions: process.versions
};