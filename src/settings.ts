import { App, PluginSettingTab } from "obsidian";
import { EnabledCssSnippets, EnabledPlugins } from "./types";

import SettingsOptionsManagement from "./main";

export interface SettingsOptionsManagementSettings {
  enabledpluginsgroup: EnabledPlugins[];
  enabledcsssnippets: EnabledCssSnippets[];
  pluginsgridtype: 'list' | 'grid';
}

export const DEFAULT_SETTINGS: SettingsOptionsManagementSettings = {
  enabledpluginsgroup: [],
  enabledcsssnippets: [],
  pluginsgridtype: 'list',
}

export class SettingOptionsManagementSettingTab extends PluginSettingTab {
  plugin: SettingsOptionsManagement;
  
  constructor(app: App, plugin: SettingsOptionsManagement) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this
    containerEl.empty()
  }
}