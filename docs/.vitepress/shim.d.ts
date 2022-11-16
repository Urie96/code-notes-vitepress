declare module '*.vue' {
    import { ComponentOptions } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module 'valine';
