import { ButtonComponent, Menu, Modal, Notice, Platform, Plugin, Setting, addIcon, setIcon } from 'obsidian';
import { DEFAULT_SETTINGS, SettingsOptionsManagementSettings } from './settings';
import { EnabledCssSnippets, EnabledPlugins } from './types';

declare module "obsidian" {
  interface App {
    setting: AppSetting;
    activeTabValue: AppActiveTab;
    settingTabs: AppSettingTab[];
    tabContentContainer: HTMLElement;
    plugins: PluginsConfig;
    isMobile: boolean;
  }
  interface AppActiveTab {
    app: App;
    id: string;
    name: string;
    installedPluginsEl: HTMLElement;
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
  interface PluginsConfig {
    manifests: {
      [key: string]: PluginManifest;
    };
    enabledPlugins: Set<string>;
    plugins: {
      [key: string]: Plugin;
    }
  }
}

export default class SettingsOptionsManagement extends Plugin {
  settings: SettingsOptionsManagementSettings;
  optionsmenuEl: HTMLElement | null;
  optionsid: string[];
  currentActiveTab: string;
  configListEl: HTMLElement | null;

  async onload() {
    if (Platform.isMobileApp || this.app.isMobile) {
      console.log(`Settings Management is useless on mobile`);
      return;
    }
    await this.loadSettings();
    await this.saveSettings();
    // this.addSettingTab(new PluginsManagementSettingTab(this.app, this)); // Haven't use settingTab temporarily.

    this.optionsid = ['appearance', 'hotkeys', 'plugins', 'community-plugins'];
    this.currentActiveTab = '';
    this.optionsmenuEl = null;

    // add new svg icons: toggle-center which is not available in lucide. It's a toggle icon but the circle is in the middle of the rect.
    this.addNewSvgIcons();
    await this.createSettingsOptionsMenu();
  }

  onunload() {
    this.deleteMenu();
    this.saveSettings();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async createSettingsOptionsMenu() {
    if (this.optionsid && this.app.setting.activeTabValue && this.optionsid.includes(this.app.setting.activeTabValue.id)) {
      this.createMenu(this.app.setting.activeTabValue.id);
    }

    Object.defineProperty(this.app.setting, 'activeTab', {
      get() {
        return this.app.setting.activeTabValue;
      },
      set: (value) => {
        this.app.setting.activeTabValue = value;
        if (value) {
          this.createMenu(value.id);
        }
      }
    });
  }

  createMenu(id: string): void {
    this.deleteMenu();
    if (this.optionsid && this.optionsid.includes(id)) {
      this.createSwitcher();
      this.createGridStyle();
      if (id === 'appearance' || id === 'community-plugins') {
        this.createSaveButton();
        this.createSetConfigButton();
      }
    }
  }

  deleteMenu(): void {
    if (this.optionsmenuEl) {
      this.optionsmenuEl.remove();
      this.optionsmenuEl = null;
      document.body.classList.remove('pm-show-enabled');
      document.body.classList.remove('pm-show-disabled');
      document.body.classList.remove('pm-grid');
    }
  }

  addNewSvgIcons() {
    addIcon('toggle-center', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-toggle-center"><rect width="20" height="12" x="2" y="6" rx="6" ry="6"/><circle cx="12" cy="12" r="2"/></svg>')
  }

  createSwitcher(): void {
    if (!this.optionsmenuEl) {
      const containerEl = this.app.setting.tabContentContainer || document.querySelector('.vertical-tab-content-container') || null;
      if (!containerEl) { return; }
      this.optionsmenuEl = containerEl.createEl('div', { attr: { class: 'pm-tabs' } });
    }
    const switcherEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-tab', value: 'switcher' } });
    const switcherButton = new ButtonComponent(switcherEl);
    if (document.body.classList.contains('pm-show-enabled')) {
      switcherButton.setIcon('toggle-right');
      switcherButton.setTooltip('Enabled');
    } else if (document.body.classList.contains('pm-show-disabled')) {
      switcherButton.setIcon('toggle-left');
      switcherButton.setTooltip('Disabled');
    } else {
      switcherButton.setIcon('toggle-center');
      switcherButton.setTooltip('All');
    }

    switcherButton.onClick(() => {
      if (document.body.classList.contains('pm-show-enabled')) {
        document.body.classList.remove('pm-show-enabled');
        document.body.classList.add('pm-show-disabled');
        switcherButton.setIcon('toggle-left');
        switcherButton.setTooltip('Disabled');
      } else if (document.body.classList.contains('pm-show-disabled')) {
        document.body.classList.remove('pm-show-disabled');
        switcherButton.setIcon('toggle-center');
        switcherButton.setTooltip('All');
      } else {
        document.body.classList.add('pm-show-enabled');
        switcherButton.setIcon('toggle-right');
        switcherButton.setTooltip('Enabled');
      }
    });
  }

  createGridStyle(): void {
    if (!this.optionsmenuEl) {
      const containerEl = this.app.setting.tabContentContainer || document.querySelector('.vertical-tab-content-container') || null;
      if (!containerEl) { return; }
      this.optionsmenuEl = containerEl.createEl('div', { attr: { class: 'pm-tabs' } });
    }
    const gridStyleEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-tab', value: 'grid' } });
    const gridStyleButton = new ButtonComponent(gridStyleEl);
    if (this.settings.pluginsgridtype === 'grid') {
      document.body.classList.add('pm-grid');
      gridStyleButton.setIcon('layout-grid');
      gridStyleButton.setTooltip('Grid layout');
    } else {
      document.body.classList.remove('pm-grid');
      gridStyleButton.setIcon('menu');
      gridStyleButton.setTooltip('List layout');
    }

    gridStyleButton.onClick(async () => {
      if (this.settings.pluginsgridtype === 'grid') {
        document.body.classList.remove('pm-grid');
        gridStyleButton.setIcon('menu');
        gridStyleButton.setTooltip('List layout');
        this.settings.pluginsgridtype = 'list';
      } else {
        document.body.classList.add('pm-grid');
        gridStyleButton.setIcon('layout-grid');
        gridStyleButton.setTooltip('Grid layout');
        this.settings.pluginsgridtype = 'grid';
      }
      await this.saveSettings();
    });
  }

  createSaveButton(): void {
    if (!this.optionsmenuEl) {
      return;
    }
    // 保存按钮
    const saveEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-tab', value: 'save' } });
    const saveButton = new ButtonComponent(saveEl);
    saveButton.setIcon('save');
    saveButton.setTooltip('Save current configuration.');
    saveButton.onClick(async () => {
      this.saveCurrentConfig();
      await this.saveSettings();
    });
  }

  saveCurrentConfig(): void {
    const activeTab = this.app.setting.activeTabValue;
    switch (activeTab.id) {
      case 'appearance':
        this.saveCssSnippetsConfig();
        break;
      case 'community-plugins':
        this.saveCommunityPluginsConfig();
        break;
      default:
        break;
    }
  }

  createSetConfigButton(): void {
    if (!this.optionsmenuEl) {
      return;
    }
    // 创建一个配置列表，用于存放配置，点击后可以使用对应的配置
    const configList = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-tab', value: 'config' } });
    setIcon(configList, 'boxes');
    if (this.app.setting.activeTabValue.id === 'community-plugins') {
      this.registerDomEvent(configList, 'click', () => {
        this.createComPluginsConfigList();
      });
    } else {
      this.registerDomEvent(configList, 'click', () => {
        this.createCssSnippetsConfigList();
      });
    }
  }

  /* css snippets */
  createCssSnippetsConfigList(): void {
    if (!this.optionsmenuEl) {
      return;
    }
    if (this.settings.enabledcsssnippets.length === 0) {
      new Notice('No saved configuration');
      return;
    }
    this.configListEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-configs' } });
    const configCloseEl = this.configListEl.createEl('div', { attr: { class: 'pm-tab pm-config pm-config-close', value: 'close-icon' } });
    setIcon(configCloseEl, 'x');
    this.registerDomEvent(configCloseEl, 'click', () => {
      this.configListEl && this.configListEl.remove();
      this.configListEl = null;
    });

    for (let i = 0; i < this.settings.enabledcsssnippets.length; i++) {
      const configItemEl = this.configListEl.createEl('div', { attr: { class: 'pm-tab pm-config', value: this.settings.enabledcsssnippets[i].id } });
      const configItemButton = new ButtonComponent(configItemEl);
      configItemButton.setIcon('puzzle');
      configItemButton.setTooltip(this.settings.enabledcsssnippets[i].name);
      configItemButton.onClick(() => {
        this.loadCssSnippetsConfig(this.settings.enabledcsssnippets[i]);
        this.configListEl && this.configListEl.remove();
        this.configListEl = null;
      });
      this.registerDomEvent(configItemEl, 'contextmenu', (event) => {
        event.preventDefault();
        const menu = new Menu();
        menu.addItem(item => {
          item.setTitle('Delete').setIcon('trash');
          item.onClick(() => {
            this.settings.enabledcsssnippets.splice(i, 1);
            configItemEl.remove();
            this.saveSettings();
          });
        });
        menu.addItem(item => {
          item.setTitle('Rename').setIcon('pencil');
          item.onClick(() => {
            this.renameCssSnippetsConfig(i);
          });
        });
        menu.showAtMouseEvent(event);
      });
    }
  }

  loadCssSnippetsConfig(config: EnabledCssSnippets): void {
    const snippetsListEl = this.app.setting.tabContentContainer.querySelectorAll('.setting-item.setting-item-heading:has(.clickable-icon) ~ .setting-item.mod-toggle');
    for (let i = 0; i < snippetsListEl.length; i++) {
      const snippetEl = snippetsListEl[i] as HTMLElement;
      const snippetName = snippetEl.querySelector('.setting-item-name')?.textContent;
      if (!snippetName) { continue; }
      if (config.enabledcsssnippets.includes(snippetName)) {
        const snippetToggleButton = snippetEl.querySelector('.checkbox-container') as HTMLElement;
        if (snippetToggleButton && !snippetToggleButton.classList.contains('is-enabled')) {
          snippetToggleButton.click();
        }
      }
      else if (!config.enabledcsssnippets.includes(snippetName)) {
        const snippetToggleButton = snippetEl.querySelector('.checkbox-container') as HTMLElement;
        if (snippetToggleButton && snippetToggleButton.classList.contains('is-enabled')) {
          snippetToggleButton.click();
        }
      }
      else {
        console.log(`Can't find snippet: ${snippetName}`);
      }
    }
  }

  renameCssSnippetsConfig(index: number): void {
    const getNameModal = new Modal(this.app).setTitle('Rename css snippets config');
    getNameModal.onOpen = () => {
      let configName = ''
      new Setting(getNameModal.contentEl)
        .setName('Config name')
        .addText(text => text
          .setPlaceholder(this.settings.enabledcsssnippets[index].name)
          .onChange((value) => {
            configName = value;
          }
          ))
        .addButton(button => button
          .setButtonText('Save')
          .onClick(() => {
            if (configName === '') {
              new Notice('Config name is empty.');
              return;
            } else {
              this.settings.enabledcsssnippets[index].name = configName;
              this.saveSettings();
              getNameModal.close();
            }
          })
        )
      getNameModal.contentEl.find('input').focus();
    }
    getNameModal.open();
  }

  async saveCssSnippetsConfig() {
    const getNameModal = new Modal(this.app).setTitle('Add new css snippets config');
    getNameModal.onOpen = () => {
      let configName = ''
      new Setting(getNameModal.contentEl)
        .setName('Config name')
        .addText(text => text
          .onChange((value) => {
            configName = value;
          }
          ))
        .addButton(button => button
          .setButtonText('Save')
          .onClick(() => {
            if (configName === '') {
              new Notice('Config name is empty.');
              return;
            } else {
              this.settings.enabledcsssnippets.push(
                this.createCurCssSnippetsConfig(this.app.setting.tabContentContainer, configName));
              this.saveSettings();
              getNameModal.close();
            }
          })
        )
      getNameModal.contentEl.find('input').focus();
    }
    getNameModal.open();

    await this.saveSettings();
  }

  createCurCssSnippetsConfig(container: HTMLElement, configName: string): EnabledCssSnippets {
    const snippetsListEl = container.querySelectorAll('.setting-item.setting-item-heading:has(.clickable-icon) ~ .setting-item.mod-toggle');
    const snippets = Array.from(snippetsListEl).map((snippetEl) => {
      return snippetEl.querySelector('.setting-item-name')?.textContent || '';
    });

    return {
      id: Date.now().toString(10),
      name: configName,
      enabledcsssnippets: snippets
    };
  }

  /* community plugins */
  createComPluginsConfigList(): void {
    if (!this.optionsmenuEl) {
      return;
    }
    if (this.settings.enabledpluginsgroup.length === 0) {
      new Notice('No saved configuration');
      return;
    }
    this.configListEl = this.optionsmenuEl.createEl('div', { attr: { class: 'pm-configs' } });
    const configCloseEl = this.configListEl.createEl('div', { attr: { class: 'pm-tab pm-config pm-config-close', value: 'close-icon' } });
    setIcon(configCloseEl, 'x');
    this.registerDomEvent(configCloseEl, 'click', () => {
      this.configListEl && this.configListEl.remove();
      this.configListEl = null;
    });

    for (let i = 0; i < this.settings.enabledpluginsgroup.length; i++) {
      const configItemEl = this.configListEl.createEl('div', { attr: { class: 'pm-tab pm-config', value: this.settings.enabledpluginsgroup[i].id } });
      const configItemButton = new ButtonComponent(configItemEl);
      configItemButton.setIcon('puzzle');
      configItemButton.setTooltip(this.settings.enabledpluginsgroup[i].name);
      configItemButton.onClick(() => {
        this.loadComPluginsConfig(this.settings.enabledpluginsgroup[i]);
        this.configListEl && this.configListEl.remove();
        this.configListEl = null;
      });
      this.registerDomEvent(configItemEl, 'contextmenu', (event) => {
        event.preventDefault();
        const menu = new Menu();
        menu.addItem(item => {
          item.setTitle('Delete').setIcon('trash');
          item.onClick(() => {
            this.settings.enabledpluginsgroup.splice(i, 1);
            this.saveSettings();
            configItemEl.remove();
          });
        });
        menu.addItem(item => {
          item.setTitle('Rename').setIcon('pencil');
          item.onClick(() => {
            this.renameComPluginsConfig(i);
          });
        });
        menu.showAtMouseEvent(event);
      });
    }
  }

  renameComPluginsConfig(index: number): void {
    const getNameModal = new Modal(this.app).setTitle('Rename plugins config');
    getNameModal.onOpen = () => {
      let configName = ''
      new Setting(getNameModal.contentEl)
        .setName('Config name')
        .addText(text => text
          .setPlaceholder(this.settings.enabledpluginsgroup[index].name)
          .onChange((value) => {
            configName = value;
          }
          ))
        .addButton(button => button
          .setButtonText('Save')
          .onClick(() => {
            if (configName === '') {
              new Notice('Config name is empty.');
              return;
            } else {
              this.settings.enabledpluginsgroup[index].name = configName;
              this.saveSettings();
              getNameModal.close();
            }
          })
        )
      getNameModal.contentEl.find('input').focus();
    }
    getNameModal.open();
  }

  loadComPluginsConfig(config: EnabledPlugins): void {
    const pluginsListEl = this.app.setting.activeTabValue.installedPluginsEl.childNodes;
    for (let i = 0; i < pluginsListEl.length; i++) {
      const pluginEl = pluginsListEl[i] as HTMLElement;
      const pluginName = pluginEl.querySelector('.setting-item-name')?.textContent;
      if (!pluginName) { continue; }
      const pluginDescription = pluginEl.querySelector('.setting-item-description')?.lastChild?.textContent || '';
      const pluginId = this.nameToId(pluginName, pluginDescription);
      if (pluginId && config.enabledplugins.includes(pluginId)) {
        const pluginToggleButton = pluginEl.querySelector('.checkbox-container') as HTMLElement;
        if (pluginToggleButton && !pluginToggleButton.classList.contains('is-enabled')) {
          pluginToggleButton.click();
        }
      }
      else if (pluginId && !config.enabledplugins.includes(pluginId)) {
        const pluginToggleButton = pluginEl.querySelector('.checkbox-container') as HTMLElement;
        if (pluginToggleButton && pluginToggleButton.classList.contains('is-enabled')) {
          pluginToggleButton.click();
        }
      }
      else {
        console.log(`Can't find plugin: ${pluginName}`);
      }
    }
  }

  nameToId(name: string, description: string): string {
    return Object.keys(this.app.plugins.manifests).find(key =>
    (this.app.plugins.manifests[key].name === name &&
      this.app.plugins.manifests[key].description === description)) || '';
  }

  saveCommunityPluginsConfig(): void {
    const getNameModal = new Modal(this.app).setTitle('Add new community plugins config');
    getNameModal.onOpen = () => {
      let configName = ''
      new Setting(getNameModal.contentEl)
        .setName('Config name')
        .addText(text => text
          .onChange((value) => {
            configName = value;
          }
          ))
        .addButton(button => button
          .setButtonText('Save')
          .onClick(() => {
            if (configName === '') {
              new Notice('Config name is empty.');
              return;
            } else {
              this.settings.enabledpluginsgroup.push(this.createCurComPluginsConfig(this.app.plugins.enabledPlugins, configName));
              this.saveSettings();
              getNameModal.close();
            }
          })
        )
      getNameModal.contentEl.find('input').focus();
    }
    getNameModal.open();
  }

  createCurComPluginsConfig(enabledPlugins: Set<string>, name: string): EnabledPlugins {
    return {
      id: Date.now().toString(10),
      name: name,
      enabledplugins: Array.from(enabledPlugins)
    }
  }
}