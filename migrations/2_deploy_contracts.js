var RPS = artifacts.require("./RockPaperScissors.sol");

module.exports = function(deployer) {
  deployer.deploy(RPS);
};
