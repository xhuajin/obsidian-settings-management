import { App, Plugin, addIcon, setIcon } from 'obsidian';
import { DEFAULT_SETTINGS, SettingsOptionsManagementSettings } from './settings';

// import { PluginsGroup } from './types';

// Remember to rename these classes and interfaces!

declare module "obsidian" {
  interface App {
    setting: AppSetting;
    activeTabValue: AppActiveTab;
    settingTabs: AppSettingTab[];
    tabContentContainer: HTMLElement;
  }
  interface AppActiveTab {
    app: App;
    id: string;
    name: string;
  }
  interface AppSettingTab {
    id: string;
    name: string;
  }
  interface AppSetting {
    activeTabValue: AppActiveTab;
    settingTabs: AppSettingTab[];
    tabContentContainer: HTMLElement;
  }
}

export default class SettingsOptionsManagement extends Plugin {
  app: App;
	settings: SettingsOptionsManagementSettings;
  optionsmenuEl: HTMLElement | null;
  optionsid: string[];

	async onload() {
    await this.loadSettings();
    await this.saveSettings();
    // this.addSettingTab(new PluginsManagementSettingTab(this.app, this)); // 准备用于存放备份设置

    this.optionsid = ['appearance', 'hotkeys','plugins', 'community-plugins'];
    
    // add new svg icons: toggle-none which is not available in lucide. It's a toggle icon but the circle is in the middle of the rect.
    this.addNewSvgIcons(); 
    await this.createSettingsOptionsMenu();
  }

	onunload() {
    this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

  createSettingsOptionsMenu() : void {
    Object.defineProperty(this.app.setting, 'activeTab', {
      get() {
        return this.app.setting.activeTabValue;
      },
      set: (value) => {
        this.app.setting.activeTabValue = value;
        if (this.optionsmenuEl) {
          this.deleteMenu();
        }
        if (this.optionsid && this.optionsid.includes(value?.id)) {
            this.createSwitcher();
            this.createGridStyle();
            // this.createSaveButton(); // a button to backup the current settings options
          }
        }
    });
  }

  addNewSvgIcons() {
    addIcon('toggle-none', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-toggle-left"><rect width="20" height="12" x="2" y="6" rx="6" ry="6"/><circle cx="12" cy="12" r="2"/></svg>')
  }

  createSwitcher() : void {
    if (!this.optionsmenuEl) {
      const containerEl = document.querySelector('.vertical-tab-content-container') || null;
      if (!containerEl) { return;}
      this.optionsmenuEl = containerEl.createEl('div', { attr: { class: 'pm-tabs' } });
    }
    const switcherEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-tab', value: 'switcher' } });
    setIcon(switcherEl, 'toggle-none');
    switcherEl.addEventListener('click', () => {
      if (document.body.classList.contains('pm-show-enabled')) {
        document.body.classList.remove('pm-show-enabled');
        document.body.classList.add('pm-show-disabled');
        setIcon(switcherEl, 'toggle-left');
      } else if (document.body.classList.contains('pm-show-disabled')) {
        document.body.classList.remove('pm-show-disabled');
        setIcon(switcherEl, 'toggle-none');
      } else {
        document.body.classList.add('pm-show-enabled');
        setIcon(switcherEl, 'toggle-right');
      }
    });
  }

  createGridStyle() : void {
    if (!this.optionsmenuEl) {
      const containerEl = document.querySelector('.vertical-tab-content-container') || null;
      if (!containerEl) { return;}
      this.optionsmenuEl = containerEl.createEl('div', { attr: { class: 'pm-tabs' } });
    }
    const gridStyleEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-tab', value: 'grid' } });
    if (this.settings.pluginsgridtype === 'grid') {
      document.body.classList.add('pm-grid');
      setIcon(gridStyleEl, 'layout-grid');
    } else if (this.settings.pluginsgridtype === 'list') {
      setIcon(gridStyleEl, 'menu');
    }
    
    gridStyleEl.addEventListener('click', () => {
      if (this.settings.pluginsgridtype === 'grid') {
        document.body.classList.remove('pm-grid');
        setIcon(gridStyleEl, 'menu');
        this.settings.pluginsgridtype = 'list';
      } else {
        document.body.classList.add('pm-grid');
        setIcon(gridStyleEl, 'layout-grid');
        this.settings.pluginsgridtype = 'grid';
      }
    });
    this.saveSettings();
  }

  // createSaveButton() : void {
  //   if (!this.optionsmenuEl) {
  //     return;
  //   }
  //   const saveEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-tab', value: 'save' } });
  //   setIcon(saveEl, 'save');
  //   saveEl.addEventListener('click', () => {
  //     savePluginsGroups(this);
  //   });
  // }

  deleteMenu() : void {
    if (this.optionsmenuEl) {
      this.optionsmenuEl.remove();
      this.optionsmenuEl = null;
      document.body.classList.remove('pm-show-enabled');
      document.body.classList.remove('pm-show-disabled');
      document.body.classList.remove('pm-grid');
    }
  }
}

// export function createPluginInfo(key: string) {
//   return {
//     id: this.app.plugins.plugins[key].manifest.id,
//     name: this.app.plugins.plugins[key].manifest.name,
//     enabled: !!this.app.plugins.enabledPlugins[this.app.plugins.plugins[key].manifest.id],
//   }
// }

// export function savePluginsGroups(plugin: SettingsOptionsManagement) {
//   // @ts-ignore
//   const pluginsgroup = {id: "Plugin Group: " + new Date().getTime().toString(), plugins: []} as PluginsGroup;
//   for (const key in this.app.plugins.plugins) {
//     pluginsgroup.plugins.push(createPluginInfo.call(this, key));
//   }
//   if (!plugin.settings.pluginsbackup) {
//     plugin.settings.pluginsbackup = [];
//   }
//   plugin.settings.pluginsbackup.push(pluginsgroup);
//   plugin.saveSettings();
// }