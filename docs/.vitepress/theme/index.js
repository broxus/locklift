import './main.scss';
// Theme components
import DefaultTheme from 'vitepress/theme';

import BDKLayout from './components/BDKLayout.vue';
import BDKPage from './components/BDKPage.vue';
import BDKOutlineComponent from './components/shared/outline/BDKOutline.vue';
import BDKOutlineItem from './components/shared/outline/BDKOutlineItem.vue';
import BDKAccordionComponent from './components/shared/BDKAccordion.vue';
import BDKDisconnectIcon from './components/shared/BDKDisconnectIcon.vue';

import PluginCard from './../../src/components/plugins/PluginCard.vue';
import PluginCardList from './../../src/components/plugins/PluginCardList.vue';

export default {
  ...DefaultTheme,
  Layout: BDKLayout,
  enhanceApp({ app }) {
    DefaultTheme.enhanceApp({ app });
    app.component('BDKPage', BDKPage);
    app.component('BDKOutline', BDKOutlineComponent);
    app.component('BDKOutlineItem', BDKOutlineItem);
    app.component('BDKDisconnectIcon', BDKDisconnectIcon);
    app.component('BDKAccordion', BDKAccordionComponent);

    app.component('PluginCard', PluginCard);
    app.component('PluginCardList', PluginCardList);
  },
};
