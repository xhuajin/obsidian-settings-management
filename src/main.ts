import { ButtonComponent, Menu, Modal, Notice, Platform, Plugin, Setting, SettingTab, addIcon, setIcon } from 'obsidian';
import { DEFAULT_SETTINGS, SettingsOptionsManagementSettings as SettingsManagementSettings } from './settings';
import { EnabledCssSnippets, EnabledPlugins } from './types';

declare module "obsidian" {
  interface App {
    setting: AppSetting;
    plugins: PluginsConfig;
  }
  // this.app.setting
  interface AppSetting {
    activeTab: SettingTab;
    settingTabs: SettingTab[];
    tabContentContainer: HTMLElement;
    lastTabId: string;
    onOpen(): void;
    openTabById(id: string): boolean;
    openTab(tab: SettingTab): void;
  }

  interface SettingTab {
    id: string;
    name: string;
    containerEl: HTMLElement;
    navEl: HTMLElement;
    installedPluginsEl?: HTMLElement;
  }
  // this.app.plugins
  interface PluginsConfig {
    manifests: {
      [key: string]: PluginManifest;
    };
    enabledPlugins: Set<string>;
    plugins: {
      [key: string]: Plugin;
    }
    isEnabled(pluginid: string): boolean;
    enablePluginAndSave(pluginid: string): Promise<void>;
    disablePluginAndSave(pluginid: string): Promise<void>;
  }
}

export default class SettingsManagement extends Plugin {
  settings: SettingsManagementSettings;
  settingTabs: SettingTab[];
  settingstabId: string[];
  optionsId: string[];
  activeTab: SettingTab;
  optionsmenuEl: HTMLElement | null;
  configListEl: HTMLElement | null;

  async onload() {
    await this.loadSettings();
    await this.saveSettings();
    // this.addSettingTab(new PluginsManagementSettingTab(this.app, this)); // Haven't use settingTab temporarily.

    this.settingstabId = this.app.setting.settingTabs.map(tab => tab.id);
    this.optionsId = ['appearance', 'hotkeys', 'plugins', 'community-plugins'];
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
    this.activeTab = this.app.setting.activeTab;
    if (this.activeTab && this.optionsId.includes(this.app.setting.activeTab.id)) {
      this.createMenu(this.app.setting.activeTab.id);
    }

    const setting = this.app.setting;
    setting.onOpen = () => {
      setting.openTabById(setting.lastTabId) || setting.openTab(setting.settingTabs[0])
      this.activeTab = setting.activeTab;
      this.createMenu(this.activeTab.id);
    }

    // 监听每个 tab 是否被点击
    setting.settingTabs.forEach(async (tab) => {
      this.registerDomEvent(tab.navEl, 'click', () => {
        setting.openTabById(tab.id) || setting.openTab(tab);
        this.createMenu(tab.id);
      });
    });
  }

  createMenu(id: string): void {
    this.deleteMenu();
    if (this.optionsId.includes(id)) {
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
      // document.body.classList.remove('pm-grid');
      this.app.setting.activeTab.containerEl.classList.remove('pm-grid');
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
      // document.body.classList.add('pm-grid');
      this.app.setting.activeTab.containerEl.classList.add('pm-grid');
      gridStyleButton.setIcon('layout-grid');
      gridStyleButton.setTooltip('Grid layout');
    } else {
      // document.body.classList.remove('pm-grid');
      this.app.setting.activeTab.containerEl.classList.remove('pm-grid');
      gridStyleButton.setIcon('menu');
      gridStyleButton.setTooltip('List layout');
    }

    gridStyleButton.onClick(async () => {
      if (this.settings.pluginsgridtype === 'grid') {
        // document.body.classList.remove('pm-grid');
        this.app.setting.activeTab.containerEl.classList.remove('pm-grid');
        gridStyleButton.setIcon('menu');
        gridStyleButton.setTooltip('List layout');
        this.settings.pluginsgridtype = 'list';
      } else {
        // document.body.classList.add('pm-grid');
        this.app.setting.activeTab.containerEl.classList.add('pm-grid');
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
    const activeTab = this.app.setting.lastTabId;
    switch (activeTab) {
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
    if (this.app.setting.lastTabId === 'community-plugins') {
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
          item.setTitle('Modify').setIcon('pencil');
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
    if (!this.optionsmenuEl) { return; }
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
      configItemButton.setTooltip(this.settings.enabledpluginsgroup[i].name);
      configItemButton.setIcon(this.settings.enabledpluginsgroup[i].icon);
      configItemButton.onClick(async () => {
        this.loadComPluginsConfig(this.settings.enabledpluginsgroup[i]);
        this.configListEl && this.configListEl.remove();
        this.configListEl = null;
        // await settingtabs[6].display(); // 性能问题，快速切换配置时会无法显示，因此不使用 disaplay() 刷新页面。
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
            if (this.configListEl && this.configListEl.children.length === 1) {
              this.configListEl.remove();
              this.configListEl = null;
            }
          });
        });
        menu.addItem(item => {
          item.setTitle('Modify').setIcon('pencil');
          item.onClick(() => {
            this.modifyComPluginsConfig(i);
          });
        });
        menu.showAtMouseEvent(event);
      });
    }
  }

  modifyComPluginsConfig(index: number): void {
    const getNameModal = new Modal(this.app).setTitle('Modify plugins config');
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
              this.settings.enabledpluginsgroup[index].icontype = icontype;
              this.settings.enabledpluginsgroup[index].icon = icon;
              this.saveSettings();
              getNameModal.close();
            }
          })
        );
      
      let icontype = this.settings.enabledpluginsgroup[index].icontype;
      let icon = this.settings.enabledpluginsgroup[index].icon;
      const iconSetting = new Setting(getNameModal.contentEl)
        .setName('Config icon')
        .setDesc('Accepts lucide icon.(Click the icon to refresh. Svg icon in the future.)');

      // iconSetting.addDropdown(dropdown => dropdown
      //   .addOptions({
      //     'lucide': 'Lucide',
      //     'svg': 'SVG'
      //   })
      //   .setValue(this.settings.enabledpluginsgroup[index].icontype)
      //   .onChange((value) => {
      //     if (value !== icontype) {
      //       icontype = value;
      //       if (!iconnameEl) { return; }
      //       iconnameEl.value = value === 'lucide' ? 'puzzle' : '';
      //       setIcon(previewIcon, 'refresh-cw');
      //     }
      //   }))
      let iconnameEl: HTMLInputElement;
      iconSetting
        .addText(text => {
            text
              .setValue(this.settings.enabledpluginsgroup[index].icon)
              .onChange((value) => {
                icon = value;
                setIcon(previewIcon, 'refresh-cw');
              })
            iconnameEl = text.inputEl;
          }
        )
      
      const previewIcon = iconSetting.controlEl.createDiv({ attr: { class: 'pm-preview-icon' } });
      setIcon(previewIcon, this.settings.enabledpluginsgroup[index].icon);
      
      this.registerDomEvent(previewIcon, 'click', () => {
        if (icontype === 'lucide') {
          setIcon(previewIcon, icon);
        } else if (icontype === 'svg') {
          addIcon('newconfigicon', icon)
          setIcon(previewIcon, icon);
        }
      });

      getNameModal.contentEl.find('input').focus();
    }
    getNameModal.open();
  }

  loadComPluginsConfig(config: EnabledPlugins): void {
    if (!this.app.setting.settingTabs[6].installedPluginsEl) { return; }
    const pluginsListEl = this.app.setting.settingTabs[6].installedPluginsEl.childNodes;
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
          })
        )
        .addButton(button => button
          .setButtonText('Save')
          .onClick(() => {
            if (configName === '') {
              new Notice('Config name is empty.');
              return;
            } else {
              this.settings.enabledpluginsgroup.push(this.createCurComPluginsConfig(this.app.plugins.enabledPlugins, configName, icontype, icon));
              this.saveSettings();
              getNameModal.close();
            }
          })
        )
      
      let icontype = 'lucide';
      let icon = 'puzzle';
      const iconSetting = new Setting(getNameModal.contentEl)
        .setName('Config icon')
        .setDesc('Accepts lucide icon.(Click the icon to refresh. Svg icon in the future.)');

      // iconSetting.addDropdown(dropdown => dropdown
      //   .addOptions({
      //     'lucide': 'Lucide',
      //     'svg': 'SVG'
      //   })
      //   .setValue(icontype)
      //   .onChange((value) => {
      //     if (value !== icontype) {
      //       icontype = value;
      //       if (!iconnameEl) { return; }
      //       iconnameEl.value = value === 'lucide' ? 'puzzle' : '';
      //       setIcon(previewIcon, 'refresh-cw');
      //     }
      //   }))
      let iconnameEl: HTMLInputElement;
      iconSetting
        .addText(text => {
            text.setValue(icon).onChange((value) => {
              icon = value;
              setIcon(previewIcon, 'refresh-cw');
            })
            iconnameEl = text.inputEl;
          }
        )
      
      const previewIcon = iconSetting.controlEl.createDiv({ attr: { class: 'pm-preview-icon' } });
      setIcon(previewIcon, 'puzzle');
      this.registerDomEvent(previewIcon, 'click', () => {
        if (icontype === 'lucide') {
          setIcon(previewIcon, icon);
        } else if (icontype === 'svg') {
          addIcon('newconfigicon', icon)
          setIcon(previewIcon, icon);
        }
      });

      
      getNameModal.contentEl.find('input').focus();
    }
    getNameModal.open();
  }

  createCurComPluginsConfig(enabledPlugins: Set<string>, name: string, icontype: string, icon: string): EnabledPlugins {
    return {
      id: Date.now().toString(10),
      name: name,
      icontype: icontype,
      icon: icon,
      enabledplugins: Array.from(enabledPlugins)
    }
  }
}