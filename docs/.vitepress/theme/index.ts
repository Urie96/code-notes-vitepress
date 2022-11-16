import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import MyLayout from './components/MyLayout.vue';
import Badge from './components/Badge.vue';
import RecoIcon from './components/RecoIcon.vue';
import ModuleTransition from './components/ModuleTransition.vue';
import './styles/index.styl';

const theme: Theme = {
    ...DefaultTheme,
    enhanceApp: ({ app }) => {
        app.component('Badge', Badge);
        app.component('reco-icon', RecoIcon);
        app.component('ModuleTransition', ModuleTransition);
    },
    Layout: MyLayout,
};

export default theme;
