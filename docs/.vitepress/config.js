import vue from '@vitejs/plugin-vue';

const HELP_URL = 'https://t.me/everdev';
const FEEDBACK_URL = '';
const GITHUB_URL = 'https://github.com/broxus/locklift';

const NAV = [
  {
    text: 'Broxus Docs',
    items: [
      { text: 'Home', link: 'https://docs.broxus.com' },
      { text: 'Inpage Provider', link: 'https://provider-docs.broxus.com/' },
      { text: 'Nekoton-python', link: 'https://nekoton-py-docs.broxus.com/ ' },
      { text: 'OctusBridge Integration', link: 'https://integrate.octusbridge.io/' },
      {
        text: 'TIP-3 Api Reference',
        link: 'https://tip3-api-reference.netlify.app/',
      },
    ],
  },
  { text: 'Feedback', link: FEEDBACK_URL },
  { text: 'Community', link: HELP_URL },
];

module.exports = {
  title: 'Locklift Documentation',
  base: '/',
  description: 'Documentation for Locklift',
  lastUpdated: true,

  plugins: [vue()],
  rewrites: {
    'src/pages/installation-quick-start.md': 'installation-quick-start.md',
    'src/pages/configuration.md': 'configuration.md',
    'src/pages/locklift-network/overview.md': 'locklift-network/overview.md',
    'src/pages/concepts/accounts-wallets.md': 'concepts/accounts-wallets.md',
    'src/pages/concepts/messages.md': 'concepts/messages.md',
    'src/pages/concepts/transaction-finalization.md': 'concepts/transaction-finalization.md',
    'src/pages/concepts/compute-action-phases.md': 'concepts/compute-action-phases.md',

    'src/pages/guides/setting-up-a-project.md': 'guides/setting-up-a-project.md',
    'src/pages/guides/compilation-contracts.md': 'guides/compilation-contracts.md',
    'src/pages/guides/debug-test-contracts.md': 'guides/debug-test-contracts.md',
    'src/pages/guides/deploying-contracts.md': 'guides/deploying-contracts.md',
    'src/pages/guides/writing-scripts.md': 'guides/writing-scripts.md',
    'src/pages/guides/getting-help.md': 'guides/getting-help.md',
    'src/pages/advanced/compilation-artifacts.md': 'advanced/compilation-artifacts.md',
    'src/pages/advanced/building-plugins.md': 'advanced/building-plugins.md',
    'src/pages/plugins.md': 'plugins.md',
    'src/pages/projects.md': 'projects.md',
  },
  themeConfig: {
    logo: {
      light: '/locklift-logo-light.svg',
      dark: '/locklift-logo-dark.svg',
      alt: 'LockLift Logo',
    },
    search: {
      provider: 'local',
    },
    nav: NAV,
    sidebar: [
      {
        text: 'Locklift Runner',
        items: [
          { text: 'Overview', link: '/index.md' },
          {
            text: 'Installation & Quick Start',
            link: '/installation-quick-start.md',
          },
        ],
      },

      {
        text: 'Configuration',
        link: '/configuration.md',
      },
      {
        text: 'Locklift Network',
        items: [{ text: 'Overview', link: '/locklift-network/overview.md' }],
      },
      {
        text: 'Core Concepts',
        collapsable: false,
        items: [
          {
            text: 'Accounts & Wallets',
            link: '/concepts/accounts-wallets.md',
          },
          {
            text: 'Internal & External Messages',
            link: '/concepts/messages.md',
          },
          {
            text: 'Transaction Finalization',
            link: '/concepts/transaction-finalization.md',
          },
          {
            text: 'Compute and Action Phases',
            link: '/concepts/compute-action-phases.md',
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
          { text: 'Deploying Contracts', link: '/guides/deploying-contracts.md' },
          { text: 'Writing Scripts', link: '/guides/writing-scripts.md' },
          { text: 'Getting help', link: '/guides/getting-help.md' },
        ],
      },
      {
        text: 'Advanced',
        collapsable: false,
        items: [
          {
            text: 'Compilation Artifacts',
            link: '/advanced/compilation-artifacts.md',
          },
          {
            text: 'Building plugins',
            link: '/advanced/building-plugins.md',
          },
        ],
      },
      {
        text: 'Plugins',
        link: '/plugins.md',
      },
      {
        text: 'Projects',
        link: '/projects.md',
      },
    ],
    editLink: {
      pattern: 'https://github.com/broxus/locklift/edit/docs/docs/:path',
    },

    socialLinks: [{ icon: 'github', link: GITHUB_URL }],
  },

  esbuild: {
    target: ['chrome89', 'edge89', 'firefox79', 'safari14.1'],
  },
};
