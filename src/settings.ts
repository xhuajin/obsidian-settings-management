import { App, PluginSettingTab } from "obsidian";
import { EnabledCssSnippets, EnabledPlugins } from "./types";

import SettingsManagement from "./main";

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
  plugin: SettingsManagement;
  
  constructor(app: App, plugin: SettingsManagement) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this
    containerEl.empty()
  }
}