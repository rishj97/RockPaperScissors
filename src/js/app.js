App = {
  web3Provider: null,
  contracts: {},
  registrationEther: 1e18,
  registrationGas:3e6,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("RockPaperScissors.json", function(rps) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.RPS = TruffleContract(rps);
      // Connect provider to interact with contract
      App.contracts.RPS.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      instance.WrongReveal().watch(function(error, event) {
        console.log("wrong weapon revealed!", event)
        App.render();
      });
    });

    App.contracts.RPS.deployed().then(function(instance) {
      instance.CorrectReveal().watch(function(error, event) {
        console.log("Correct weapon revealed!", event)
        App.render();
      });
    });

    App.contracts.RPS.deployed().then(function(instance) {
      instance.Winner().watch(function(error, event) {
        console.log("Winner event!", event);
        App.winnerStatusRecv(event.args.winner.c[0]);
        App.render();
      });
    });
  },

  render: function() {
    App.getPlayerRegistryStatus();

    App.getRegistryStatus();

    App.getAttackStatus();
    App.getCanAttackStatus();

    App.getRevealStatus();
    App.getCanRevealStatus();

    App.getCanGetWinnerStatus();
  },

  attack: function() {
    var weaponSelected = App.selectedWeapon;
    var privateKey = $('#privateKey').val();
    var weaponHash = '0x' + keccak256(weaponSelected + privateKey);
    var weaponHashStr = new String(weaponHash);
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.attack(weaponHash.valueOf());
    }).then(function(result) {
      App.render();
      // location.reload();
    }).catch(function(err) {
      console.error(err);
    });
  },

  reveal: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      var weaponSelected = App.selectedWeapon;
      var privateKey = $('#privateKey').val();
      return instance.revealChosenWeapon(weaponSelected, privateKey);
    }).then(function(result) {
      App.render();
    }).catch(function(err) {
      console.error(err);
    });
  },

  registerPlayer1: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.setPlayer1({from: web3.eth.accounts[0], gas: App.registrationGas, value: App.registrationEther});
    }).then(function(result) {
      App.render();
    }).catch(function(err) {
      console.error(err);
    });
  },

  registerPlayer2: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.setPlayer2({from: web3.eth.accounts[0], gas: App.registrationGas, value: App.registrationEther});
    }).then(function(result) {
      App.render();
    }).catch(function(err) {
      console.error(err);
    });
  },

  getWinner: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.getWinner();
    }).catch(function(err) {
      console.error(err);
    });
  },

  winnerStatusRecv: function(winner) {
    var msg = "";
    if (winner == 0) {
      msg = "Its a draw!";
    } else {
      msg = "Player " + winner + " won!!";
    }
    var winnerHTML = document.getElementById("winner");
    winnerHTML.innerText = msg;
    alert(msg);
  },

  getRegistryStatus: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.registryStatus();
    }).then(function(result) {
      App.registryStatusRecv(result.c[0]);
    }).catch(function(err) {
      console.error(err);
    });
  },

  registryStatusRecv: function(returnedStatus) {
    var status = getStatusMsg(returnedStatus, "Registered by:");
    var statusHtml = document.getElementById("registryStatus");
    statusHtml.innerText = status;
  },

  getPlayerRegistryStatus: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.isRegistered();
    }).then(function(result) {
      App.playerRegistryStatusRecv(result.c[0]);
    }).catch(function(err) {
      console.error(err);
    });
  },

  playerRegistryStatusRecv: function(returnedStatus) {
    if (returnedStatus == 1 || returnedStatus == 2) {
      var btn = document.getElementById("p1btn");
      btn.disabled = true;
      btn = document.getElementById("p2btn");
      btn.disabled = true;
    }
    var status = getStatusMsg(returnedStatus, "You are registered as:")
    var registry = document.getElementById("registry");
    registry.innerText = status;
  },

  getAttackStatus: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.attackStatus();
    }).then(function(result) {
      App.attackStatusRecv(result.c[0]);
    }).catch(function(err) {
      console.error(err);
    });
  },

  attackStatusRecv: function(returnedStatus) {
    var status = getStatusMsg(returnedStatus, "Attacked by:");
    var statusHtml = document.getElementById("attackStatus");
    statusHtml.innerText = status;
  },


  getCanAttackStatus: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.canAttack();
    }).then(function(result) {
      App.canAttackRecv(result);
    }).catch(function(err) {
      console.error(err);
    });
  },

  canAttackRecv: function(returnedStatus) {
    var btn = document.getElementById("attackBtn");
    btn.disabled = !returnedStatus;
  },


  getCanRevealStatus: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.canReveal();
    }).then(function(result) {
      App.canRevealRecv(result);
    }).catch(function(err) {
      console.error(err);
    });
  },

  canRevealRecv: function(returnedStatus) {
    var btn = document.getElementById("revealBtn");
    btn.disabled = !returnedStatus;
  },


  getCanGetWinnerStatus: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.canGetWinner();
    }).then(function(result) {
      App.canGetWinnerRecv(result);
    }).catch(function(err) {
      console.error(err);
    });
  },

  canGetWinnerRecv: function(returnedStatus) {
    var btn = document.getElementById("winnerBtn");
    btn.disabled = !returnedStatus;
  },

  getRevealStatus: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.revealStatus();
    }).then(function(result) {
      App.revealStatusRecv(result.c[0]);
    }).catch(function(err) {
      console.error(err);
    });
  },

  revealStatusRecv: function(returnedStatus) {
    var status = getStatusMsg(returnedStatus, "Revealed by:");
    var statusHtml = document.getElementById("revealStatus");
    statusHtml.innerText = status;
  },

  deselectAllWeapons: function() {
    document.getElementById("rock").style.webkitBoxShadow='';
    document.getElementById("paper").style.webkitBoxShadow='';
    document.getElementById("scissors").style.webkitBoxShadow='';
  },

  selectWeapon: function(weapon) {
    App.deselectAllWeapons();
    document.getElementById(weapon).style.webkitBoxShadow='0px 0px 15px 5px rgba(255, 0, 0, 0.5)';
    App.selectedWeapon = weapon;
  }
};
$(function() {
  $(window).load(function() {
    App.init();
  });
});

function getStatusMsg(returnedStatus, type) {
  var status = "";
  switch (returnedStatus) {
    case 0:
      status = "no one";
      break;
    case 1:
      status = "player 1";
      break;
    case 2:
      status = "player 2";
      break;
    case 3:
      status = "both players";
      break;
    default:
      status = "!!invalid status!!";
  }
  return type + " " + status;
}
