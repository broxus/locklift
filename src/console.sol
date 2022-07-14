// SPDX-License-Identifier: MIT
pragma ton-solidity >=0.57.1;


interface Console {
    function log(string _log) external;
}


library console {
    address constant CONSOLE_ADDRESS = address.makeAddrStd(0, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF123456789ABCDE);

    function log(string _log) internal {
        Console(CONSOLE_ADDRESS).log{value: 10 milli, bounce: false}(_log);
    }
}