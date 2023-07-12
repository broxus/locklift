import vue from '@vitejs/plugin-vue';

const HELP_URL = 'https://t.me/everdev';
const FEEDBACK_URL = '';
const GITHUB_URL = 'https://github.com/broxus/locklift';

module.exports = {
  title: 'Locklift Documentation',
  base: '/',
  description: 'Documentation for Locklift',

  plugins: [vue()],
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Feedback', link: FEEDBACK_URL },
      { text: 'Community', link: HELP_URL },
    ],
    sidebar: [
      {
        items: [
          {
            text: 'Overview',
            link: '/',
          },
          {
            text: 'Installation & Quick Start',
            link: 'guides/installation-quick-start.md',
          },
          {
            text: 'Configuration',
            link: '/guides/configuration.md',
          },
        ],
      },
      {
        text: 'Core Concepts',
        collapsable: false,
        items: [
          {
            text: 'Accounts & Wallets',
            link: '/guides/concepts/accounts-wallets.md',
          },
          {
            text: 'Internal & External Messages',
            link: '/guides/concepts/messages.md',
          },
          {
            text: 'Transaction Finalization',
            link: '/guides/concepts/transaction-finalization.md',
          },
          {
            text: 'Compute and Action Phases',
            link: '/guides/concepts/compute-action-phases.md',
          },
        ],
      },
      {
        text: 'Guide',
        collapsable: false,

        items: [
          {
            text: 'Setting Up a Project',
            link: '/guides/setting-up-a-project.md',
          },
          {
            text: 'Compiling Contracts',
            link: '/guides/compilation-contracts.md',
          },
          {
            text: 'Debugging & Testing Contracts',
            link: '/guides/debug-test-contracts.md',
          },
        ],
      },
      // {
      //   text: 'API Reference',
      //   collapsable: false,

      //   items: [
      //     {
      //       text: 'Sample Page',
      //       collapsable: false,
      //       link: '/api-reference/sample-page.md',
      //     },
      //   ],
      // },
    ],

    socialLinks: [{ icon: 'github', link: GITHUB_URL }],
  },

  esbuild: {
    target: ['chrome89', 'edge89', 'firefox79', 'safari14.1'],
  },
};
