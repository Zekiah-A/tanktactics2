
///// Options regarding how the game is initialized /////
export const FORCE_DEFAULT = false //If false, the following properties will only have an effect when you start a new game. If true, they will be replace right away
//Beware when changing some properties, that they might break the existing board (e.g players getting stuck outside the map)
export const DEFAULT_WIDTH = 20
export const DEFAULT_HEIGHT = 20
export const DEFAULT_FREQUENCY = 43200 //Time in seconds it takes to get an action point


///// Options regarding people joining /////
export const DEFAULT_RANGE = 2 //Range that tanks start out with
export const ALLOW_MIDGAME_JOINS = false //Allow people to join mid-game
export const MAX_PLAYERS = 1 / 25  //Maximum number of players. If smaller than one, it's interpreted as a ratio of the number of tiles on the board
export const ALLOW_RENAMING = true //Allow people to change their name midgame

///// Options regarding tank behaviour /////
export const ALLOW_JURY = true //Allow for dead tanks to vote for a person to recieve bonus action points
export const RANGE_CHECKS = true //Development only feature. If false, it will allow hackers to move / shoot however far they want