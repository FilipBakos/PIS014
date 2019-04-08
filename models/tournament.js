'use strict';
module.exports = (sequelize, DataTypes) => {
  const Tournament = sequelize.define('Tournament', {
    name: DataTypes.STRING,
    date: DataTypes.DATE,
    miesto: DataTypes.STRING,
    maxC: DataTypes.INTEGER,
    minC: DataTypes.INTEGER,
    parovanie: DataTypes.STRING,
    sukromny: DataTypes.BOOLEAN,
    date1: DataTypes.DATE
  }, {});
  Tournament.associate = function(models) {

   Tournament.belongsToMany(models.Player, {
      through: 'OrganizatorsList', 
      foreignKey: 'tournamentId'
    }),
    Tournament.belongsToMany(models.Player, {
      as: 'players',
      through: 'PlayerList', 
      foreignKey: 'tournamentId'
    });

  };
  return Tournament;
};