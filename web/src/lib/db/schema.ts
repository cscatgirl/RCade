import { relations } from 'drizzle-orm';
import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const games = sqliteTable('games', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("id").notNull(),
    description: text("description").notNull(),
    visibility: text("visibility", { enum: ["public", "private", "personal"] }).notNull(),
    version: text("version").notNull(),
    github_author: text("github_author").notNull(),
    github_repo: text("github_repo").notNull(),
    owner_rc_id: numeric("owner_rc_id").notNull(),
});

export const gameAuthors = sqliteTable('game_authors', {
    gameId: text("game_id").notNull().references(() => games.id),
    recurse_id: integer("recurse_id"),
    display_name: text("display_name").notNull(),
});

export const gamesRelations = relations(games, ({ many }) => ({
    authors: many(gameAuthors),
}));