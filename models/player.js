'use strict';
module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define('Player', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    nickName: DataTypes.STRING,
    email: DataTypes.STRING,
    birth: DataTypes.DATE,
    confirmed: DataTypes.BOOLEAN,
    narodnost: DataTypes.STRING,
    pohlavie: DataTypes.STRING
  }, {});
  Player.associate = function(models) {
    Player.belongsToMany(models.Tournament, {
      as: "tournaments",
      through: 'OrganizatorsList', 
      foreignKey: 'playerId'
    }),
    Player.belongsToMany(models.Tournament, {
      as: "playing",
      through: 'PlayersLists', 
      foreignKey: 'playerId'
    });
  };
  return Player;
};