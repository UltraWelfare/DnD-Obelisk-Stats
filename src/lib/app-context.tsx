import {createContext, useContext} from "react";
import type {App} from "obsidian";

export const AppContext = createContext<App | undefined>(undefined);

export const useApp = (): App => {
	const app = useContext(AppContext);
	if (!app) throw new Error("App context not found");
	return app;
}
