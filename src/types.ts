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