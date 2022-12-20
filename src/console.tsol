// SPDX-License-Identifier: MIT
pragma ever-solidity >=0.57.1;


library console {
    event Log(string _log);

    function log(string _log) internal {
      address CONSOLE_ADDRESS = address.makeAddrExtern(0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF123456789ABCDE, 256);
      emit Log{dest: CONSOLE_ADDRESS}(_log);
    }
}
