import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Badge from './components/Badge.vue'
import './index.stylus'


const theme: Theme = {
    ...DefaultTheme,
    enhanceApp: ({ app }) => {
        app.component('Badge', Badge)
    }
    // Layout: MyLayout
    // enhanceApp: ({ app }) => {
    //     app.mixin({
    //         created: function () {
    //             console.log(1, this);
    //             var myOption = this.$options.myOption
    //             if (myOption) {
    //                 console.log(myOption)
    //             }
    //         }
    //     })
    // }
    // enhanceApp({ app }) {
    //     // register global components
    //     app.component('MyGlobalComponent', /* ... */)
    // }
}

export default theme
