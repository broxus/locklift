pragma ever-solidity >= 0.61.2;
pragma AbiHeader expire;
pragma AbiHeader pubkey;


contract Sample {
    uint16 static _nonce;

    uint state;

    event StateChange(uint _state);

    constructor(uint _state) public {
        tvm.accept();

        setState(_state);
    }

    function setState(uint _state) public {
        tvm.accept();
        state = _state;

        emit StateChange(_state);
    }

    function getDetails()
        external
        view
    returns (
        uint _state
    ) {
        return state;
    }
}
