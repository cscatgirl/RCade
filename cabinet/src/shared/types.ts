import { z } from 'zod';

export const VersionsSchema = z.object({
  node: z.string(),
  chrome: z.string(),
  electron: z.string(),
});

export type Versions = z.infer<typeof VersionsSchema>;

export interface GameInfo {
  id: string;
  name: string;
  latestVersion: string;
}

export interface RcadeAPI {
  getGames: () => Promise<GameInfo[]>;
}
