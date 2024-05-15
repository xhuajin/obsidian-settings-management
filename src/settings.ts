import { App, PluginSettingTab } from "obsidian";

import { PluginsGroup } from "./types";
import SettingsOptionsManagement from "./main";

export interface SettingsOptionsManagementSettings {
  pluginsbackup: PluginsGroup[];
  snippetsbackup: PluginsGroup[];
  pluginsgridtype: 'list' | 'grid';
}

export const DEFAULT_SETTINGS: SettingsOptionsManagementSettings = {
  pluginsbackup: [],
  snippetsbackup: [],
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

    // Iterate
    // containerEl.createEl('h2', { text: 'Plugins Templates' });
    // const pluginsTemplates = this.plugin.settings.pluginsbackup;
    // pluginsTemplates.forEach((pluginsTemplate) => {
    //   const templateContainer = containerEl.createEl('div', { cls: 'plugins-template' });
    //   templateContainer.createEl('h3', { text: pluginsTemplate.id });
    //   templateContainer.createEl('div', { text: pluginsTemplate.plugins.map(plugin => plugin.name).join(', ') });
    // });
  }
}