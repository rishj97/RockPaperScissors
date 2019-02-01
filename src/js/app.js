App = {
  web3Provider: null,
  contracts: {},
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
      instance.ChosenWeaponHash().watch(function(error, event) {
        console.log("Chosen weapon hash!", event)
        App.render();
      });
    });
  },

  p1Hash: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.player1WeaponHash();
    }).then(function(result) {
      console.log(result);
    }).catch(function(err) {
      console.error(err);
    });
  },

  render: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.isRegistered();
    }).then(function(result) {
      var status = "";
      switch (result.c[0]) {
        case 0:
          status = "You are not registered!";
          break;
        case 1:
          status = "Registered as player 1";
          break;
        case 2:
          status = "Registered as player 2";
          break;
        default:
          status = "Invalid registration status!";
      }
      var registry = document.getElementById("registry");
      registry.innerText = status;
    }).catch(function(err) {
      console.error(err);
    });

    App.contracts.RPS.deployed().then(function(instance) {
      return instance.registryStatus();
    }).then(function(result) {
      var status = "";
      switch (result.c[0]) {
        case 0:
          status = "No one registered";
          break;
        case 1:
          status = "Only player 1 registered";
          break;
        case 2:
          status = "Only player 2 registered";
          break;
        case 3:
          status = "Both players registered";
          break;
        default:
          status = "Invalid registration status!";
      }
      var statusHtml = document.getElementById("registryStatus");
      statusHtml.innerText = status;
    }).catch(function(err) {
      console.error(err);
    });

    App.contracts.RPS.deployed().then(function(instance) {
      return instance.attackStatus();
    }).then(function(result) {
      var status = "";
      switch (result.c[0]) {
        case 0:
          status = "No one attacked";
          break;
        case 1:
          status = "Only player 1 attacked";
          break;
        case 2:
          status = "Only player 2 attacked";
          break;
        case 3:
          status = "Both players attacked";
          break;
        default:
          status = "Invalid attack status!";
      }
      var statusHtml = document.getElementById("attackStatus");
      statusHtml.innerText = status;
    }).catch(function(err) {
      console.error(err);
    });

    App.contracts.RPS.deployed().then(function(instance) {
      return instance.revealStatus();
    }).then(function(result) {
      var status = "";
      switch (result.c[0]) {
        case 0:
          status = "No one revealed";
          break;
        case 1:
          status = "Only player 1 revealed";
          break;
        case 2:
          status = "Only player 2 revealed";
          break;
        case 3:
          status = "Both players revealed";
          break;
        default:
          status = "Invalid revealed status!";
      }
      var statusHtml = document.getElementById("revealStatus");
      statusHtml.innerText = status;
    }).catch(function(err) {
      console.error(err);
    });
  },

  attack: function() {
    var weaponSelected = $('#weaponSelect').val();
    var privateKey = $('#privateKey').val();
    var weaponHash = '0x' + keccak256(weaponSelected + privateKey);
    var weaponHashStr = new String(weaponHash);
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.chosenWeaponHash(weaponHash.valueOf());
    }).then(function(result) {
      // App.render();
      location.reload();
    }).catch(function(err) {
      console.error(err);
    });
  },

  reveal: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      var weaponSelected = $('#weaponSelect').val();
      var privateKey = $('#privateKey').val();
      return instance.revealChosenWeapon(weaponSelected, privateKey);
    }).then(function(result) {
      // App.render();
      location.reload();
    }).catch(function(err) {
      console.error(err);
    });
  },

  registerPlayer1: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.setPlayer1();
    }).then(function(result) {
      // App.render();
      location.reload();
    }).catch(function(err) {
      console.error(err);
    });
  },

  registerPlayer2: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.setPlayer2();
    }).then(function(result) {
      // App.render();
      location.reload();
    }).catch(function(err) {
      console.error(err);
    });
  },

  getWinner: function() {
    App.contracts.RPS.deployed().then(function(instance) {
      return instance.getWinner();
    }).then(function(winner) {
      var winnerHTML = document.getElementById("winner");
      winnerHTML.innerText = "Winner is: " + winner;
    }).catch(function(err) {
      console.error(err);
    });
  }
};
$(function() {
  $(window).load(function() {
    App.init();
  });
});

// 0x0000000000000000000000000000000000000000000000000000000000000001617364617364
// "1"
// "asdasd"
