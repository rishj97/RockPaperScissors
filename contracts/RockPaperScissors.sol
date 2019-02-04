pragma solidity >=0.4.22 <0.5.2;
contract RockPaperScissors {

    address player1 = address(0);
    address player2  = address(0);

    bytes32 public player1WeaponHash;
    bytes32 public player2WeaponHash;

    string public player1Weapon = "";
    string public player2Weapon = "";

    uint public player1RevealTime;
    uint public player2RevealTime;

    mapping (string => mapping(string => int)) resultsMap;

    event CorrectReveal (
        int player, string weapon, bytes32 revealed
    );

    event WrongReveal (
        int player, bytes32 revealedHash, bytes32 storedHash
    );

    event Winner (
        int winner
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

    modifier registrationFeeSent (uint256 feeSent) {
        require(
          feeSent >= 1 ether,
          "This player is already registered."
        );
        _;
    }

    // Payable function to register player1
    function setPlayer1 () payable public notAlreadyRegistered(player1) registrationFeeSent(msg.value) {
        player1 = msg.sender;
    }

    // Payable function to register player2
    function setPlayer2 () payable public notAlreadyRegistered(player2) registrationFeeSent(msg.value) {
        player2 = msg.sender;
    }

    function canAttack () public view returns (bool) {
      if (msg.sender == player1) {
        return player1WeaponHash == 0;
      } else if (msg.sender == player2) {
        return player2WeaponHash == 0;
      }
      return false;
    }

    // Attack with weapon hash (revealed after both players have attacked).
    function attack (bytes32 weaponHash) public returns (bool) {
        require (canAttack(), "Player cannot attack.");

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

    function canReveal () public view returns (bool) {
      if (attackStatus() == 3) {
        return (msg.sender == player1 || msg.sender == player2);
      }
      return false;
    }

    // Reveal their weapons by providing their private keys.
    // This function compares the old hash with the new hash to
    // confirm that the player did not change their chosen weapon.
    function revealChosenWeapon (string memory weapon, string memory privateKey) public validWeapon(weapon) {
        require (canReveal(), "Player cannot reveal.");
        bytes32 revealedHash = keccak256(abi.encodePacked(weapon, privateKey));
        if (msg.sender == player1) {
            if (revealedHash == player1WeaponHash) {
                player1Weapon = weapon;
                player1RevealTime = now;
                emit CorrectReveal(1, weapon, revealedHash);
            } else {
                emit WrongReveal(1, revealedHash, player1WeaponHash);
            }
        } else if (msg.sender == player2) {
            if (revealedHash == player2WeaponHash) {
                player2Weapon = weapon;
                player2RevealTime = now;
                emit CorrectReveal(2, weapon, revealedHash);
            } else {
                emit WrongReveal(2, revealedHash, player2WeaponHash);
            }
        }
    }

    // Checks if both the players have revealed theor weapons or if there has been a timeout
    // since the first reveal.
    function canGetWinner () public view returns (bool) {
      int revealedStatus = revealStatus();
      bool bothRevealed = revealedStatus == 3;
      bool timeOut = false;
      if (revealedStatus == 1 || revealedStatus == 2) {
          timeOut = (now - (player1RevealTime + player2RevealTime)) >= 30 minutes;
      }
      return bothRevealed || timeOut;
    }


    // Emits a winner event and also sends the game reward to the winner.
    function getWinner () public {
        require(
          canGetWinner(),
          "Not all players have revealed their weapons yet."
        );
        int winner = 0;
        if (!player1Revealed()) {
            winner = 2;
        } else if (!player2Revealed()) {
            winner = 1;
        } else {
            winner = resultsMap[player1Weapon][player2Weapon];
        }

        if (canSendFundsToWinner()) {
          sendFundsTo(winner);
        }
        emit Winner(winner);
    }

    function canSendFundsToWinner() public view returns (bool) {
      return getBalance() != 0;
    }

    function sendFundsTo(int playerNum) private {
        if (playerNum == 1) {
            player1.transfer(getBalance());
        } else if (playerNum == 2) {
            player2.transfer(getBalance());
        } else {
            // Split the reward in case its a tie.
            player1.transfer(getBalance() / 2);
            player2.transfer(getBalance());
        }
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
      if (player1Revealed() && player2Revealed()) {
          return 3;
      } else if (player1Revealed()) {
          return 1;
      } else if (player2Revealed()) {
          return 2;
      } else {
          return 0;
      }
    }

    function player1Revealed() public view returns (bool) {
      return !strEq(player1Weapon, "");
    }

    function player2Revealed() public view returns (bool) {
      return !strEq(player2Weapon, "");
    }

    function strEq (string memory a, string memory b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
