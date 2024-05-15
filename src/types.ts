import { App } from "obsidian";

export interface PluginInfo {
  name: string;
  id: string;
  enabled: boolean;
}

export interface PluginsGroup {
  id: string;
  plugins: PluginInfo[];
}

export interface PluginsGroups {
  templates: PluginsGroup[];
}

/* App */
export interface AppActiveTab {
  app: App;
  id: string;
  name: string;
}

export interface AppSettingTab {
  id: string;
  name: string;
}

export interface AppSetting {
  activeTabValue: AppActiveTab;
  settingTabs: AppSettingTab[];
  tabContentContainer: HTMLElement;
}