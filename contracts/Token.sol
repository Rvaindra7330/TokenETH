pragma solidity  ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract Token is ERC20{
    constructor() ERC20("Damon","DMN"){
        _mint(msg.sender,10000 * 10**18);
    }
    
}