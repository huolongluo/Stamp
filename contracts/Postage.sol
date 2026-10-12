// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IReceiveAuth {
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

/// @title Postage
/// @notice Sunday money in AUSD. Mei signs the letter. A relayer lands it. The stamp is posted.
/// @dev The token domain name is "AUSD" / "1", matching the rehearsal. Read Agora's deployed
///      domain from the token before pointing this contract at mainnet AUSD.
contract Postage {
    uint256 public constant POSTED_STAMP = 300000;
    uint256 public constant QUOTE_WINDOW = 90 seconds;
    uint256 public constant MIN_AMOUNT = 1000000;

    bytes32 private constant LETTER_TYPEHASH = keccak256(
        "Letter(address from,address to,uint256 amount,uint256 stamp,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );
    bytes32 private constant RECEIVE_TYPEHASH = keccak256(
        "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );
    bytes32 private constant EIP712_DOMAIN =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    IReceiveAuth public immutable ausd;
    address public immutable postOffice;
    mapping(bytes32 => bool) public used;

    event Landed(address indexed from, address indexed to, uint256 amount, uint256 stamp, bytes32 nonce);

    error BadSigner();
    error BadToken();
    error Late();
    error Early();
    error Window();
    error Used();
    error Stamp();
    error Self();
    error Short();
    error Dust();

    struct Letter {
        address from;
        address to;
        uint256 amount;
        uint256 stamp;
        uint256 validAfter;
        uint256 validBefore;
        bytes32 nonce;
    }

    constructor(address ausd_, address postOffice_) {
        ausd = IReceiveAuth(ausd_);
        postOffice = postOffice_;
    }

    /// @param tokenSig ERC-3009 authorization paying amount+stamp to this contract.
    function land(Letter calldata letter, bytes calldata signature, bytes calldata tokenSig) external {
        if (letter.from == letter.to) revert Self();
        if (letter.stamp != POSTED_STAMP) revert Stamp();
        if (letter.amount < MIN_AMOUNT) revert Dust();
        if (letter.validBefore <= letter.validAfter) revert Window();
        if (letter.validBefore - letter.validAfter > QUOTE_WINDOW) revert Window();

        address recovered = _recover(_domain("Stamp", address(this), _letterHash(letter)), signature);
        if (recovered != letter.from) revert BadSigner();

        address tokenFrom = _recover(_domain("AUSD", address(ausd), _receiveHash(letter)), tokenSig);
        if (tokenFrom != letter.from) revert BadToken();

        if (block.timestamp < letter.validAfter) revert Early();
        if (block.timestamp > letter.validBefore) revert Late();
        if (used[letter.nonce]) revert Used();

        used[letter.nonce] = true;
        (uint8 v, bytes32 r, bytes32 s) = _split(tokenSig);
        ausd.receiveWithAuthorization(
            letter.from,
            address(this),
            letter.amount + letter.stamp,
            letter.validAfter,
            letter.validBefore,
            letter.nonce,
            v,
            r,
            s
        );
        if (!IERC20(address(ausd)).transfer(letter.to, letter.amount)) revert Short();
        if (!IERC20(address(ausd)).transfer(postOffice, letter.stamp)) revert Short();
        emit Landed(letter.from, letter.to, letter.amount, letter.stamp, letter.nonce);
    }

    function _letterHash(Letter calldata letter) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                LETTER_TYPEHASH,
                letter.from,
                letter.to,
                letter.amount,
                letter.stamp,
                letter.validAfter,
                letter.validBefore,
                letter.nonce
            )
        );
    }

    function _receiveHash(Letter calldata letter) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                RECEIVE_TYPEHASH,
                letter.from,
                address(this),
                letter.amount + letter.stamp,
                letter.validAfter,
                letter.validBefore,
                letter.nonce
            )
        );
    }

    function _domain(string memory name, address verifying, bytes32 structHash) private view returns (bytes32) {
        bytes32 domain = keccak256(
            abi.encode(EIP712_DOMAIN, keccak256(bytes(name)), keccak256(bytes("1")), block.chainid, verifying)
        );
        return keccak256(abi.encodePacked("\x19\x01", domain, structHash));
    }

    function _split(bytes calldata signature) private pure returns (uint8 v, bytes32 r, bytes32 s) {
        if (signature.length != 65) return (0, 0, 0);
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) return address(0);
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(digest, v, r, s);
    }
}
