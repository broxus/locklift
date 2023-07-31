import './main.scss';
import 'vue-toastification/dist/index.css';

import Toast from 'vue-toastification';
import SimpleToast from './components/BDKSimpleToast.vue';
// Theme components
import DefaultTheme from 'vitepress/theme';

import BDKLayout from './components/BDKLayout.vue';
import BDKPage from './components/BDKPage.vue';
import BDKOutlineComponent from './components/shared/outline/BDKOutline.vue';
import BDKOutlineItem from './components/shared/outline/BDKOutlineItem.vue';
import BDKAccordionComponent from './components/shared/BDKAccordion.vue';
import BDKDisconnectIcon from './components/shared/BDKDisconnectIcon.vue';
import BDKImgContainer from './components/shared/BDKImgContainer.vue';

import EntityCard from './../../src/components/EntityCard.vue';
import EntityCardList from './../../src/components/EntityCardList.vue';
import DeployAccount from './../../src/components/demos/DeployAccount.vue';
import ComputeActionPhases from './../../src/components/demos/ComputeActionPhases.vue';
import TransactionFinalization from './../../src/components/demos/TransactionFinalization.vue';

export default {
  ...DefaultTheme,
  Layout: BDKLayout,
  enhanceApp({ app }) {
    DefaultTheme.enhanceApp({ app });
    app.use(Toast, {
      position: 'top-right',
      timeout: 5000,
      closeOnClick: false,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.7,

      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: 'button',
      icon: true,
      rtl: false,
    });

    app.component('SimpleToast', SimpleToast);
    app.component('BDKPage', BDKPage);
    app.component('BDKOutline', BDKOutlineComponent);
    app.component('BDKOutlineItem', BDKOutlineItem);
    app.component('BDKDisconnectIcon', BDKDisconnectIcon);
    app.component('BDKAccordion', BDKAccordionComponent);
    app.component('BDKImgContainer', BDKImgContainer);

    app.component('EntityCard', EntityCard);
    app.component('EntityCardList', EntityCardList);

    app.component('DeployAccount', DeployAccount);
    app.component('ComputeActionPhases', ComputeActionPhases);
    app.component('TransactionFinalization', TransactionFinalization);
  },
};
