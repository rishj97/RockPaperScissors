pragma solidity 0.4.25;
contract RockPaperScissors {

    address player1 = address(0);
    address player2 = address(0);

    bytes32 public player1WeaponHash;
    bytes32 public player2WeaponHash;

    string public player1Weapon = "";
    string public player2Weapon = "";

    mapping (string => mapping(string => int)) resultsMap;

    event CorrectReveal (
        int player, string weapon, bytes32 revealed
    );

    event WrongReveal (
        int player, bytes32 revealedHash, bytes32 storedHash
    );

    event ChosenWeaponHash (
        bytes32 hashValue
    );

    constructor () public {
      resultsMap["rock"]["rock"] = 0;
      resultsMap["rock"]["paper"] = 2;
      resultsMap["rock"]["scissors"] = 1;
      resultsMap["paper"]["rock"] = 1;
      resultsMap["paper"]["paper"] = 0;
      resultsMap["paper"]["scissors"] = 2;
      resultsMap["scissors"]["rock"] = 2;
      resultsMap["scissors"]["paper"] = 1;
      resultsMap["scissors"]["scissors"] = 0;
    }

    modifier validWeapon (string memory weapon) {
        require(
          resultsMap[weapon][weapon] == 0,
          "Invalid weapon."
        );
        _;
    }

    modifier notAlreadyRegistered (address playerAddress) {
        require(
          playerAddress == address(0),
          "This player is already registered."
        );
        _;
    }

    function setPlayer1 () public notAlreadyRegistered(player1) {
        player1 = msg.sender;
    }

    function setPlayer2 () public notAlreadyRegistered(player2) {
        player2 = msg.sender;
    }

    function chosenWeaponHash (bytes32 weaponHash) public returns (bool) {
        emit ChosenWeaponHash(weaponHash);
        if (msg.sender == player1) {
            player1WeaponHash = weaponHash;
            return true;
        } else if (msg.sender == player2) {
            player2WeaponHash = weaponHash;
            return true;
        } else {
            return false;
        }
    }

    // TODO: Check whether they gave the chosenWeaponHash before revealing
    function revealChosenWeapon (string memory weapon, string memory privateKey) public validWeapon(weapon) {
        bytes32 revealedHash = keccak256(abi.encodePacked(weapon, privateKey));
        if (msg.sender == player1) {
            if (revealedHash == player1WeaponHash) {
                player1Weapon = weapon;
                emit CorrectReveal(1, weapon, revealedHash);
            } else {
                emit WrongReveal(1, revealedHash, player1WeaponHash);
            }
        } else if (msg.sender == player2) {
            if (revealedHash == player2WeaponHash) {
                player2Weapon = weapon;
                emit CorrectReveal(2, weapon, revealedHash);
            } else {
                emit WrongReveal(2, revealedHash, player2WeaponHash);
            }
        }
    }

    function getWinner () public view returns (int) {
        require(
          !strEq(player1Weapon, "") && !strEq(player2Weapon, ""),
          "Not all players have revealed their weapons yet."
        );

      return resultsMap[player1Weapon][player2Weapon];
    }

    function isRegistered () public view returns (int) {
      if (msg.sender == player1) {
        return 1;
      } else if (msg.sender == player2) {
        return 2;
      }
      return 0;
    }

    function registryStatus () public view returns (int) {
      bool player1Reg = player1 != address(0);
      bool player2Reg = player2 != address(0);
      if (player1Reg && player2Reg) {
          return 3;
      } else if (player1Reg) {
          return 1;
      } else if (player2Reg) {
          return 2;
      } else {
          return 0;
      }
    }

    function attackStatus () public view returns (int) {
      bool player1Attacked = player1WeaponHash != 0;
      bool player2Attacked = player2WeaponHash != 0;
      if (player1Attacked && player2Attacked) {
          return 3;
      } else if (player1Attacked) {
          return 1;
      } else if (player2Attacked) {
          return 2;
      } else {
          return 0;
      }
    }

    function revealStatus () public view returns (int) {
      bool player1Revealed = !strEq(player1Weapon, "");
      bool player2Revealed = !strEq(player2Weapon, "");
      if (player1Revealed && player2Revealed) {
          return 3;
      } else if (player1Revealed) {
          return 1;
      } else if (player2Revealed) {
          return 2;
      } else {
          return 0;
      }
    }

    function strEq (string memory a, string memory b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
