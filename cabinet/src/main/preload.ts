import { contextBridge, ipcRenderer } from 'electron';
import type { RcadeAPI } from '../shared/types';

const rcadeAPI: RcadeAPI = {
  getGames: () => ipcRenderer.invoke('get-games'),
};

contextBridge.exposeInMainWorld('rcade', rcadeAPI);
