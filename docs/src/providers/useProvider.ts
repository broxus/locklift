/* eslint-disable */
import { createApp, h, inject, nextTick, provide, reactive, ref, shallowRef, watch } from 'vue';

import {
  Permissions,
  Provider,
  ProviderEvent,
  ProviderNotInitializedException,
  ProviderRpcClient,
  ProviderMethod,
  RawProviderRequest,
  RawProviderApiResponse,
  RawProviderEventData,
  Address,
} from 'everscale-inpage-provider';

import { testContract } from './../helpers';

import ProviderSelector from './../../.vitepress/theme/components/ProviderSelector.vue';

type ConnectorWallet = {
  title: string;
  injected: {
    object: string;
    flag?: string;
    event?: string;
  };
};

type ConnectorParams = {
  supportedWallets: ConnectorWallet[];
};

let ensurePageLoaded: Promise<void>;

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    ensurePageLoaded = Promise.resolve();
  } else {
    ensurePageLoaded = new Promise<void>(resolve => {
      window.addEventListener('load', () => {
        resolve();
      });
    });
  }
} else {
  // Provide a default value when document and window are not available
  // You might want to adjust this part based on your use case
  ensurePageLoaded = Promise.resolve();
}

class ProviderProxy implements Provider {
  inner?: Provider;

  async request<T extends ProviderMethod>(
    data: RawProviderRequest<T>
  ): Promise<RawProviderApiResponse<T>> {
    if (this.inner == null) {
      throw new ProviderNotInitializedException();
    } else {
      return this.inner.request(data);
    }
  }

  addListener<T extends ProviderEvent>(
    eventName: T,
    listener: (data: RawProviderEventData<T>) => void
  ): this {
    this.inner?.addListener(eventName, listener);

    return this;
  }

  removeListener<T extends ProviderEvent>(
    eventName: T,
    listener: (data: RawProviderEventData<T>) => void
  ): this {
    this.inner?.removeListener(eventName, listener);

    return this;
  }

  on<T extends ProviderEvent>(
    eventName: T,
    listener: (data: RawProviderEventData<T>) => void
  ): this {
    this.inner?.on(eventName, listener);

    return this;
  }

  once<T extends ProviderEvent>(
    eventName: T,
    listener: (data: RawProviderEventData<T>) => void
  ): this {
    this.inner?.once(eventName, listener);

    return this;
  }

  prependListener<T extends ProviderEvent>(
    eventName: T,
    listener: (data: RawProviderEventData<T>) => void
  ): this {
    this.inner?.prependListener(eventName, listener);

    return this;
  }

  prependOnceListener<T extends ProviderEvent>(
    eventName: T,
    listener: (data: RawProviderEventData<T>) => void
  ): this {
    this.inner?.prependOnceListener(eventName, listener);

    return this;
  }
}

class Connector {
  private readonly provider: ProviderProxy = new ProviderProxy();
  private providerPromise?: Promise<Provider>;
  private providerResolve?: (provider: Provider) => void;

  constructor(private readonly params: ConnectorParams) {}

  public asProviderFallback(): () => Promise<Provider> {
    return () => {
      if (!this.providerPromise) {
        this.providerPromise = new Promise<Provider>(resolve => {
          this.providerResolve = resolve;

          const savedProviderKey = getSavedProviderKey();
          if (savedProviderKey) {
            const savedProvider = this.getProviderByKey(savedProviderKey);
            if (savedProvider) {
              this.provider.inner = savedProvider;
              this.providerResolve(savedProvider);
              this.providerResolve = undefined;
            }
          }
        });
      }
      return this.providerPromise;
    };
  }

  public initiateConnection() {
    if (this.providerResolve) {
      const savedProviderKey = getSavedProviderKey();
      if (savedProviderKey) {
        const savedProvider = this.getProviderByKey(savedProviderKey);
        if (savedProvider) {
          this.provider.inner = savedProvider;
          this.providerResolve(savedProvider);
          this.providerResolve = undefined;

          return;
        }
      }

      const onSelect = async (provider: Provider) => {
        this.provider.inner = provider;
        this.providerResolve!(provider);
        this.providerResolve = undefined;
        const providerKey = this.getKeyByProvider(provider);
        if (providerKey) {
          this.setCookie('savedProviderKey', providerKey, 7);
        }
      };

      if (!this.selectProvider(onSelect)) {
        ensurePageLoaded.then(() => {
          if (!this.selectProvider(onSelect)) {
            for (const { injected } of this.params.supportedWallets) {
              if (
                typeof injected.flag !== 'undefined' &&
                typeof injected.event !== 'undefined' &&
                (window as any)[injected.flag] === true
              ) {
                window.addEventListener(injected.event, _ => {
                  this.selectProvider(onSelect);
                });
              }
            }
          }
        });
      }
    }
  }

  getProviderByKey(key: string): Provider | undefined {
    const wallet = this.params.supportedWallets.find(w => w.title === key);

    if (wallet) {
      return (window as any)[wallet.injected.object];
    }

    return undefined;
  }

  getKeyByProvider(provider: Provider): string | undefined {
    const wallet = this.params.supportedWallets.find(
      w => (window as any)[w.injected.object] === provider
    );
    if (wallet) {
      return wallet.title;
    }

    return undefined;
  }

  selectProvider(onSelect: (provider: Provider) => void): boolean {
    const savedProviderKey = getSavedProviderKey();

    if (savedProviderKey) {
      const savedProvider = this.getProviderByKey(savedProviderKey);
      if (savedProvider) {
        this.provider.inner = savedProvider;

        return true;
      }
    }

    const providers = this.getProviders();

    if (providers.length === 0) {
      return false;
    } else if (providers.length === 1) {
      onSelect(providers[0].provider);

      return true;
    }

    const modal = ref<HTMLDivElement | null>(null);

    const selector = createApp({
      setup() {
        return () =>
          h(ProviderSelector, {
            providers: providers.map(({ provider, wallet }) => ({
              title: wallet.title,
              object: provider,
            })),
            onSelect: (provider: Provider) => {
              if (modal.value) {
                modal.value.remove();
              }
              onSelect(provider);
            },
          });
      },
    });

    nextTick(() => {
      if (typeof document === 'undefined') {
        return;
      }

      let appContainer = document.getElementById('app');

      if (appContainer) {
        modal.value = document.createElement('div');
        document.body.appendChild(modal.value);
        selector.mount(modal.value);
      }
    });

    return true;
  }

  getProviders(): { provider: Provider; wallet: ConnectorWallet }[] {
    const providers = new Array<{ provider: Provider; wallet: ConnectorWallet }>();

    if (typeof window === 'undefined') {
      return providers;
    }

    for (const wallet of this.params.supportedWallets) {
      const object = wallet.injected.object;
      const provider = (window as any)[object];
      if (provider != null) {
        providers.push({
          provider,
          wallet,
        });
      }
    }

    return providers;
  }

  setCookie(name: string, value: string, days: number) {
    if (typeof document === 'undefined') {
      return;
    }

    let expires = '';
    if (days) {
      let date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }

  deleteCookie(name: string) {
    if (typeof document === 'undefined') {
      return;
    }
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  }

  disconnectProvider() {
    this.provider.inner = undefined;

    this.providerPromise = undefined;

    this.deleteCookie('savedProviderKey');
  }
}

const connector = new Connector({
  supportedWallets: [
    {
      title: 'EVER Wallet',
      injected: {
        object: '__ever',
        event: 'ever#initialized',
      },
    },
    {
      title: 'VENOM Wallet',
      injected: {
        object: '__venom',
      },
    },
  ],
});

export const getSavedProviderKey = (name: string = 'savedProviderKey') => {
  if (typeof document === 'undefined') {
    return null;
  }

  let nameEQ = name + '=';
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// NOTE: it uses fallback to allow using other extensions
const provider = new ProviderRpcClient({
  forceUseFallback: true,
  fallback: connector.asProviderFallback(),
});

const connectToWallet = async () => {
  connector.initiateConnection();
  const provider = new ProviderRpcClient({
    forceUseFallback: true,
    fallback: connector.asProviderFallback(),
  });

  await provider.requestPermissions({
    permissions: ['basic', 'accountInteraction'],
  });
};

const changeAccount = async () => {
  await provider.changeAccount();
};

const disconnect = async () => {
  await provider.disconnect();

  connector.disconnectProvider();
  location.reload();
};

const hasProvider = ref(false);
const selectedAccount = shallowRef<Permissions['accountInteraction']>();
const selectedAccountBalance = ref<string>();
const selectedNetwork = ref<string>();

provider.hasProvider().then(async hasTonProvider => {
  if (!hasTonProvider) {
    return;
  }
  hasProvider.value = true;

  await provider.ensureInitialized();

  (await provider.subscribe('permissionsChanged')).on('data', event => {
    selectedAccount.value = event.permissions.accountInteraction;
  });

  (await provider.subscribe('networkChanged')).on('data', event => {
    selectedNetwork.value = event.networkId.toString();
  });

  const currentProviderState = await provider.getProviderState();
  selectedNetwork.value = currentProviderState.networkId.toString();

  if (currentProviderState.permissions.accountInteraction != null) {
    await connectToWallet();
  }
});

watch(
  [selectedAccount, selectedNetwork],
  async ([selectedAccount], _old, onCleanup) => {
    const address = selectedAccount?.address;
    if (address == null) {
      return;
    }
    selectedAccountBalance.value = undefined;

    const { state } = await provider.getFullContractState({ address });
    if (selectedAccount?.address != address) {
      return;
    }
    selectedAccountBalance.value = state?.balance;

    const subscription = await provider.subscribe('contractStateChanged', { address });
    onCleanup(() => subscription.unsubscribe().catch(console.error));

    subscription.on('data', event => {
      if (event.address.equals(selectedAccount?.address)) {
        selectedAccountBalance.value = event.state.balance;
      }
    });
  },
  {
    immediate: true,
  }
);

export function useProvider() {
  return {
    provider,
    hasProvider,
    selectedAccount,
    selectedAccountBalance,
    selectedNetwork,
    connectToWallet,
    changeAccount,
    disconnect,
  };
}
