---
outline: deep
---

<script lang='ts'>
import { ref } from 'vue';

export default {
  name: 'Projects',
  setup() {
    const projects = ref([
      {
        name: 'Locklift',
        githubUrl: 'https://github.com/broxus/locklift',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: 'Node JS framework for working with Everscale and Venom contracts. Inspired by Truffle and Hardhat. Helps you build, test, run and maintain your smart contracts',
        tags: ['Framework', 'Everscale', 'VENOM'],
      },
      {
        name: 'locklift-plugin-boilerplate',
        githubUrl: 'https://github.com/broxus/locklift-plugin-boilerplate',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: 'Boilerplate plugin for Locklift framework',
        tags: ['Plugin', 'Boilerplate', 'Locklift'],
      },
      {
        name: 'ever-contracts',
        githubUrl: 'https://github.com/broxus/ever-contracts',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: 'Set of reusable smart contracts for Everscale / VENOM developers',
        tags: ['Smart Contracts', 'Everscale', 'VENOM'],
      },
      {
        name: 'flatqube-contracts',
        githubUrl: 'https://github.com/broxus/flatqube-contracts',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: 'DEX contracts',
        tags: ['Smart Contracts', 'DEX'],
      },
      {
        name: 'flatqube-dao-contracts',
        githubUrl: 'https://github.com/broxus/flatqube-dao-contracts',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: '',
        tags: ['Smart Contracts', 'FlatQube', 'DAO'],
      },
      {
        name: 'octusbridge-contracts',
        githubUrl: 'https://github.com/broxus/octusbridge-contracts',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: 'Smart contract source for the bridge between arbitrary EVM and Everscale / VENOM',
        tags: ['Smart Contracts', 'Bridge'],
      },
      {
        name: 'gravix-contracts',
        githubUrl: 'https://github.com/broxus/gravix-contracts',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: ' ',

      },
      {
        name: 'stEver-contracts',
        githubUrl: 'https://github.com/broxus/stEver-contracts',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: 'Staking platform that aggregates real network validators in one place. This platform has the ability to automatically balance between validators',
        tags: ['Smart Contracts', 'Staking'],
      },
      {
        name: 'ever-wever',
        githubUrl: 'https://github.com/broxus/ever-wever',
        author: 'Broxus',
        authorUrl: 'https://twitter.com/Broxus',
        description: 'Wrapped EVER TIP3.1 Token, Vault, etc',
        tags: ['Smart Contracts', 'Wrapped Token'],
      },
      {
        name: 'DeNS',
        githubUrl: 'https://github.com/tonred/DeNS',
        author: 'TON RED',
        authorUrl: 'https://ton.red/',
        description: 'Decentralized Name Service',
        tags: ['Smart Contracts','Ever Name', 'ENS'],
      },
      {
        name: 'Versionable',
        githubUrl: 'https://github.com/tonred/Versionable',
        author: 'TON RED',
        authorUrl: 'https://ton.red/',
        description: 'Versionable abstract contracts',
        tags: ['Smart Contracts', 'Abstract'],
      },
      {
        name: 'ton-locklift',
        githubUrl: 'https://github.com/pavelkhachatrian/ton-locklift',
        npmPackage: '',
        author: 'Pavel Khachatrian',
        authorUrl: '',
        description: 'Node JS framework for working with FreeTON contracts. Inspired by Truffle and Hardhat. Helps you to build, test, run and maintain your smart contracts',
        tags: ['Framework', 'FreeTON'],
      },
      {
        name: 'VEP-1155',
        githubUrl: 'https://github.com/Numiverse/VEP-1155',
        author: 'Numiverse',
        authorUrl: 'https://github.com/Numiverse',
        description: 'VEP1155 MultiToken implementation',
        tags: ['Smart Contracts', 'Token'],
      },
      {
        name: 'everscale-ft-distribute',
        githubUrl: 'https://github.com/ever-guild/everscale-ft-distribute',
        author: 'Ever Guild',
        authorUrl: 'https://github.com/ever-guild',
        description: 'Everscale FT distribute',
        tags: ['Smart Contracts'],
      },
      {
        name: 'everscale-tip4-contracts',
        npmPackage: '@grandbazar-io/everscale-tip4-contracts',
        author: 'Grandbazar.io',
        authorUrl: 'https://grandbazar.io/ru',
        description: 'Customizable grandbazar.io NFT contracts. Based on Itgold standard. You can customize all contracts by extending them',
        tags: ['Smart Contracts', 'NFT'],
      },
      {
        name: 'Tip3vote',
        githubUrl: 'https://github.com/meisamtaher/Tip3vote',
        npmPackage: '',
        author: 'Meisamtaher',
        authorUrl: 'https://github.com/meisamtaher',
        description: 'A tip3 token that can have history of user balance',
        tags: ['Smart Contracts', 'Token'],
      },
      {
        name: 'tvm-timer-mining',
        githubUrl: 'https://github.com/kobzistiy/tvm-timer-mining',
        author: 'Kobzistiy',
        authorUrl: 'https://github.com/kobzistiy',
        description: ' ',
        tags: ['Smart Contracts', 'Timer', 'Mining'],
      },
      {
        name: 'everscale-bet-rates',
        githubUrl: 'https://github.com/kobzistiy/everscale-bet-rates',
        author: 'Kobzistiy',
        authorUrl: 'https://github.com/kobzistiy',
        description: ' ',
        tags: ['Smart Contracts'],
      },
      {
        name: 'DAOFactory',
        githubUrl: 'https://github.com/nemanjasimikic/DAOFactory',
        author: 'nemanjasimikic',
        authorUrl: 'https://github.com/nemanjasimikic',
        description: 'The DaoFactory smart contract is developed in order to provide users with the ability to create their own DAO without the need for mediator',
        tags: ['Smart Contracts', 'Factory', 'DAO'],
      },
      {
        name: 'tvm-contracts',
        githubUrl: 'https://github.com/VDeltex/tvm-contracts',
        npmPackage: '',
        author: 'VDeltex',
        authorUrl: 'https://github.com/VDeltex',
        description: ' ',
        tags: ["Smart Contracts"],
      },
      {
        name: 'Everscale Airdrop',
        githubUrl: 'https://github.com/snjava1195/EverscaleAirdrop',
        author: 'snjava1195',
        authorUrl: 'https://github.com/snjava1195',
        description: ' ',
        tags: ["Smart Contracts", "Airdrop"],
      },
      {
        name: 'dao-ipci-everscale',
        githubUrl: 'https://github.com/Multi-Agent-io/dao-ipci-everscale',
        npmPackage: '',
        author: 'Multi-Agent-io',
        authorUrl: 'https://github.com/Multi-Agent-io/',
        description: 'DAO-IPCI contracts for Everscale',
        tags: ["Smart Contracts", "DAO"],
      },
      {
        name: 'sad-local-node',
        githubUrl: 'https://github.com/30mb1/sad-local-node',
        author: '30mb1',
        authorUrl: 'https://github.com/30mb1',
        description: ' ',
        tags: [],
      },
      {
        name: 'EverscaleSimpleOracle',
        githubUrl: 'https://github.com/vp-mazekine/EverscaleSimpleOracle',
        author: 'vp-mazekine',
        authorUrl: 'https://github.com/vp-mazekine',
        description: ' ',
        tags: ["Smart Contracts", "Oracle", "Everscale"],
      },
      {
        name: 'everscale-tip-samples',
        githubUrl: 'https://github.com/itgoldio/everscale-tip-samples',
        author: 'itgoldio',
        authorUrl: 'https://itgold.io/',
        description: 'NFT samples for TIP4 standard from itgold team',
        tags: ["Smart Contracts", "NFT"],
      },
      {
        name: 'tip-3-modern-sample',
        githubUrl: 'https://github.com/qwadratic/tip-3-modern-sample',
        author: 'qwadratic',
        authorUrl: 'https://github.com/qwadratic',
        description: ' ',
        tags: ['Smart Contracts', 'TIP3'],
      },
      {
        name: 'venomdrop',
        githubUrl: 'https://github.com/venomdrop-core/venomdrop',
        author: 'venomdrop-core',
        authorUrl: 'https://github.com/venomdrop-core',
        description: 'Create and launch your NFT Drops effortlessly with VenomDrop, the platform built on the Venom Blockchain.',
        tags: ['Smart Contracts', 'NFT', 'VENOM'],
      },
      {
        name: 'dapp',
        githubUrl: 'https://github.com/clash-of-hex/dapp',
        author: 'clash-of-hex',
        authorUrl: 'https://clash-of-hex.github.io',
        description: 'A GameFi app on Everscale that allows players to compete to capture the most cells on an endless battlefield',
        tags: ['GameFi', 'Everscale'],
      },
      {
        name: 'vesting',
        githubUrl: 'https://github.com/venom-blockchain/vesting',
        author: 'venom-blockchain',
        authorUrl: 'https://github.com/venom-blockchain',
        description: 'Venom linear vesting contracts',
        tags: ['Smart Contracts', 'Vesting', 'VENOM'],
      },

    ]);

    return {
      projects
    }
  }
}
</script>

# Projects

Welcome to the Projects section! This is where we feature various projects that are using Locklift. Locklift, a powerful framework for blockchain development, has been the foundation for many incredible projects, from simple smart contracts to complex dApps.

Here you'll find a selection of projects that have been built with Locklift, showcasing its versatility and capability. We hope that this will not only give you an idea of what's possible with Locklift but also inspire you for your own projects. Check out the various ways that Locklift has been put to use, and feel free to dive deeper into any project that catches your eye. Happy exploring!

<br>
<br>

<EntityCardList :entities="projects" />
