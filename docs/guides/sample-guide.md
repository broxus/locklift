---
outline: deep
---

# Guide Page Template

Welcome to this guide page template. Use it as a starting point to create your own documentation pages.

## How to use a Vue Component in your Markdown files with VitePress

VitePress allows you to use Vue components directly in your markdown files. Let's look at an example of how to do this with a `PackDataSample` component.

### Step 1: Create the Component

First, create your Vue component. For instance, we'll have a `PackDataSample` component located at `@components/demos/PackDataSample.vue`. Here is an example of how this component may look:

```html
<template>
  <div class="demo">
    <div>
      <label for="name">Name:</label>
      <input id="name" v-model="user.name" type="text" />
    </div>
    <div>
      <label for="age">Age:</label>
      <input id="age" v-model="user.age" type="number" />
    </div>
    <button @click="packData">Pack Data</button>
    <pre v-if="packedData">{{ packedData }}</pre>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';

  export default defineComponent({
    setup() {
      const user = ref({
        name: '',
        age: null,
      });

      const packedData = ref('');

      function packData() {
        packedData.value = JSON.stringify(user.value, null, 2);
      }

      return {
        user,
        packedData,
        packData,
      };
    },
  });
</script>
```

In this component, we have two input fields to take user's name and age. The data from these fields is then packed into a JSON string and displayed on the screen when the "Pack Data" button is clicked.

### Step 2: Register the Component

Then, register your component globally in the VitePress theme. You can do this in the `.vitepress/theme/index.js` file:

```javascript
import BroxusTheme from 'broxus-docs-kit-dev/theme/broxusTheme';
import PackDataSample from '@components/demos/PackDataSample.vue';

export default {
  ...BroxusTheme,
  enhanceApp({ app }) {
    app.component('PackDataSample', PackDataSample);
  },
};
```

In the code snippet above, `enhanceApp` is a hook that allows you to interact with the Vue instance that VitePress uses. We're registering the `PackDataSample` component so it can be used anywhere in our markdown files.

### Step 3: Use the Component

Finally, use your Vue component in any markdown file like this:

```markdown
<PackDataSample />
```

Now, whenever you build your VitePress site, your Vue component will render wherever you've used its tag in your markdown files.

---

This guide should help you understand how to use Vue components in your markdown files when working with VitePress. Feel free to replace the `PackDataSample` component with any component you wish to use in your documentation.

## Advanced Vue Components Usage with VitePress

In the previous section, we covered the basics of using Vue components within your markdown files with VitePress. Now, let's dive deeper into a more advanced example, where we interact with the TVM blockchains using a custom Vue hook, `useProvider`.

### About `useProvider`

`useProvider` is a custom hook that facilitates interaction with the TON Blockchain. This hook returns a `provider` object that exposes various functionalities such as subscribing to events, getting the provider state, connecting to a wallet, changing the account, and disconnecting from the wallet.

### Using `useProvider` in a Component

Below is an example of a `WalletControl` component, which uses the `useProvider` hook to interact with the blockchain:

```html
<template>
  <div class="walletControl">
    <button v-if="connected" @click="changeAccountWallet">
      Change Account
    </button>
    <button
      v-if="connected"
      class="disconnectBtn"
      @click="disconnectWallet"
    >
      <DisconnectIcon :size="16" />
    </button>
    <button v-else @click="requestPermissions">Connect</button>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import { useProvider } from './../../providers/useProvider';
  import DisconnectIcon from './shared/BDKDisconnectIcon.vue';

  export default defineComponent({
    name: 'WalletControl',
    components: {
      DisconnectIcon,
    },
    setup() {
      const { provider, connectToWallet, changeAccount, disconnect } =
        useProvider();
      const connected = ref(false);

      onMounted(async () => {
        const subscription = await provider.subscribe(
          'permissionsChanged'
        );
        subscription.on('data', (permissions: any) => {
          connected.value =
            permissions.permissions.accountInteraction == null;
        });

        const providerState = await provider.getProviderState();
        connected.value =
          !!providerState.permissions.accountInteraction == null;
      });

      const requestPermissions = async () => {
        await connectToWallet();
        connected.value = true;
      };

      const disconnectWallet = async () => {
        await disconnect();
        connected.value = false;
      };

      const changeAccountWallet = async () => {
        await changeAccount();
      };

      return {
        connected,
        requestPermissions,
        disconnectWallet,
        changeAccountWallet,
      };
    },
  });
</script>

<style scoped>
  /* CSS code goes here */
</style>
```

In the `WalletControl` component, we use the `useProvider` hook to get the necessary functions to interact with the blockchain.

- **connectToWallet**: This function is used to connect to the user's wallet.
- **changeAccount**: This function changes the active account in the connected wallet.
- **disconnect**: This function disconnects the app from the user's wallet.

Additionally, we use the `provider` object to subscribe to the `'permissionsChanged'` event. This event is fired whenever the permissions associated with the current provider change. In this example, when the `'permissionsChanged'` event is fired, the `connected` ref is updated to reflect whether the user is connected to the blockchain.

The component includes three buttons to interact with the TON blockchain:

- **Change Account**: This button, when clicked, calls the `changeAccountWallet` function that changes the active account in the connected wallet.
- **Disconnect**: This button, when clicked, calls the `disconnectWallet` function that disconnects the app from the user's wallet.
- **Connect**: This button, visible only when the user is not connected, when clicked, calls the `requestPermissions` function that requests

permission to connect to the user's wallet.

---

With this, you now know how to use a custom Vue hook within a Vue component and use it in your markdown files. This opens up a world of possibilities, and you can now effectively create dynamic, interactive documentation that interacts with services such as TON Blockchain.
