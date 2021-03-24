class Keys {
  constructor(locklift) {
    this.locklift = locklift;
  }

  async getKeyPairs() {
    return this.keyPairs;
  }
  
  async setup() {
    const keysHDPaths = [...Array(this.locklift.networkConfig.keys.amount).keys()]
      .map(i => this.locklift.networkConfig.keys.path.replace('INDEX', i));
    
    this.keyPairs = await Promise.all(keysHDPaths.map(async (path) => {
      return this.locklift.ton.client.crypto.mnemonic_derive_sign_keys({
        dictionary: 1,
        wordCount: 12,
        phrase: this.locklift.networkConfig.keys.phrase,
        path,
      });
    }));
  }
}


module.exports = Keys;
