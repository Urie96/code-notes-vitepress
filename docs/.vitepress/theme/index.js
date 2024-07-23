// https://vitepress.dev/guide/custom-theme
import DefaultTheme from 'vitepress/theme';
import MyLayout from './components/MyLayout.vue';
import RecoIcon from './components/RecoIcon.vue';
import Asciinema from './components/Asciinema.vue';
import ModuleTransition from './components/ModuleTransition.vue';
import './styles/index.styl';

/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp: ({ app }) => {
    app.component('reco-icon', RecoIcon);
    app.component('ModuleTransition', ModuleTransition);
    app.component('Asciinema', Asciinema);
  },
};