class Context {
    constructor(locklift) {
        this.locklift = locklift;
        this.contracts_map = {}
    }

    addContract(address, contract) {
        this.contracts_map[address] = contract;
    }

    getContract(address) {
        if (Object.keys(this.contracts_map).indexOf(address) === -1) {
            return null;
        }
        return this.contracts_map[address]
    }

    getContext() {
        return this.contracts_map;
    }
}


module.exports = Context