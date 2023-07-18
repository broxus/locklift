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
        authorUrl:  'https://github.com/broxus',
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

Refer to the [Building Plugins](./../advanced/building-plugins.md) guide to learn how to create your own, and submit a [pull request](https://github.com/broxus/locklift/docs/src/pages/plugins.md#L26) to have it listed here.

Enhance Locklift's functionality with the plugins below.

<br>
<br>

### Official Plugins

<br>
<br>

<PluginCardList :plugins="officialPlugins" />

### Community Plugins

<br>
<br>

<PluginCardList :plugins="communityPlugins" />
