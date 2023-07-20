---
outline: deep
---

<script>
import { ref } from 'vue';

export default {
  name: 'Plugins',
  setup() {
    const officialPlugins = ref([
      {
        name: 'locklift-verifier',
        npmPackage: '@broxus/locklift-verifier',
        author: 'Broxus',
        authorUrl:  'https://twitter.com/Broxus',
        description: 'Automatically verifies smart contracts within the Locklift',
        tags: ["Verification"],
      },
      {
        name: 'locklift-deploy',
        npmPackage: 'locklift-deploy-artifacts',
        author: "Broxus",
        authorUrl:'https://twitter.com/Broxus',
        description: 'Facilitates manageable deployments and streamlined testing',
        tags: ["Deployment", "Testing"],
      }
    ]);

    const communityPlugins = ref([
      {
        name: 'locklift-deploy-artifacts',
        npmPackage: 'locklift-deploy-artifacts',
        author: "Venom Foundation",
        authorUrl:'https://twitter.com/VenomFoundation',
        description: 'Enables storage of build artifacts across contract migrations',
        tags: ["Deployment", "Artifacts"],
      }
    ]);

    return {
      officialPlugins,
      communityPlugins
    }
  }
}
</script>

# Plugins

Plugins in Locklift are modules that extend the framework's functionality. They can add new commands, modify existing ones, or provide additional runtime features. This customization allows you to enhance the Locklift environment to suit your specific needs.

Refer to the [Building Plugins](./advanced//building-plugins.md) guide to learn how to create your own, and submit a [pull request](https://github.com/broxus/locklift/docs/src/pages/plugins.md#L26) to have it listed here.

Enhance Locklift's functionality with the plugins below.

<br>

### Official Plugins

<br>

<EntityCardList :entities="officialPlugins" />

### Community Plugins

<br>

<EntityCardList :entities="communityPlugins" />
