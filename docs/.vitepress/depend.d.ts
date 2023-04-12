import { DefaultTheme } from 'vitepress';

declare namespace DependType {
    type SidebarGroup = DefaultTheme.SidebarGroup;
    type SidebarItem = DefaultTheme.SidebarItem;
    type ThemeConfig = DefaultTheme.Config;
}

export = DependType;
export as namespace DependType;
