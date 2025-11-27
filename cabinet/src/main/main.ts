import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Game } from '@rcade/api';
import type { GameInfo } from '../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

const apiClient = Client.new();

const fullscreen = !isDev;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    fullscreen: fullscreen,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('get-games', async (): Promise<GameInfo[]> => {
    const games = await apiClient.getAllGames();
    return games.map((game: Game) => ({
      id: game.id(),
      name: game.name(),
      latestVersion: game.latest().version(),
    }));
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
