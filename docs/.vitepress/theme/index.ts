import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import MyLayout from './components/MyLayout.vue';
import RecoIcon from './components/RecoIcon.vue';
import ModuleTransition from './components/ModuleTransition.vue';
import './styles/index.styl';

const theme: Theme = {
    extends: DefaultTheme,
    enhanceApp: ({ app }) => {
        app.component('reco-icon', RecoIcon);
        app.component('ModuleTransition', ModuleTransition);
    },
    Layout: MyLayout,
};

export default theme;
