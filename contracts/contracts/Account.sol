pragma solidity >= 0.6.0;
pragma AbiHeader expire;
pragma AbiHeader pubkey;


/*
    @title Simple externally owned contract
    @dev Allows to test internal logic
*/
contract Account {
    uint16 static _randomNonce;
    uint owner;

    constructor() public {
        require(tvm.pubkey() == msg.pubkey());
        tvm.accept();

        owner = msg.pubkey();
    }

    /*
        @notice Send transaction to another contract
        @param dest Destination address
        @param value Amount of attached balance
        @param bounce Message bounce
        @param flags Message flags
        @param payload Tvm cell encoded payload, such as method call
    */
    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload
    )
        public
        view
    {
        require(msg.pubkey() == owner, 101);
        tvm.accept();

        dest.transfer(value, bounce, flags, payload);
    }
}
