declare module '*.vue' {
    import { ComponentOptions } from 'vue';
    // rome-ignore lint/suspicious/noExplicitAny: <explanation>
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

type StyleValue = Partial<CSSStyleDeclaration>;

declare module 'valine';
// declare module 'shiki';

interface Page {
    sort: number;
    categories: string[];
    tags: string[];
    link: string;
    date: number;
    excerpt: string;
    title?: string;
}

interface Category {
    name: string;
    num: number;
}

type Tag = Category;

type SidebarItem = DependType.SidebarItem & Pick<Page, 'date' | 'sort'>;

type Sidebar = (DependType.SidebarGroup & { items: SidebarItem[] })[];

type ReadonlySidebar = Readonly<Sidebar>;

type ThemeConfig = DependType.ThemeConfig & {
    author: string;
    authorAvatar: string;
    personalInfoSocialLinks: {
        icon: string;
        link: string;
    }[];
    pageData: {
        categories: Category[];
        tags: Category[];
        pages: Page[];
    };
    valineConfig: {
        appId: string;
        appKey: string;
        placeholder: string;
        lang: string;
    };
};

type ReadonlyThemeConfig = Readonly<ThemeConfig>;
