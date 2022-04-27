import {WebSocketServer} from 'ws'

import {promises as fs} from 'fs'
import {createServer} from 'https'
let SECURE = false


function tank(a){
	let [x, y, health, vote, token, ...name] = a.split(' ')
	name = name.join(' ')
	return {x, y, name, health: +health[0], range: +health[1], points: +health.slice(2), token, vote: +vote}
}
function tostring(t){
	return `\n${t.x} ${t.y} ${t.health}${t.range}${t.points} ${t.vote} ${t.token} ${t.name}`
}
function tostringclient(t){
	return `\n${t.x} ${t.y} ${t.health}${t.range}${t.points} ${t.name}`
}

let [META, ...GAME] = (await fs.readFile('game').catch(e => `432e5 20 20 -3`)).toString().split('\n')
let [FREQ, WIDTH, HEIGHT, POINTS] = META.split(' ')
FREQ *= 1; WIDTH *= 1; HEIGHT *= 1; POINTS *= 1
GAME = GAME.map(tank)
let POSITIONS = new Set(GAME.map(a=>a.x+' '+a.y))

let MAX_PLAYERS = Math.ceil(WIDTH * HEIGHT / 25)

let savegame = () => fs.writeFile('game', `${FREQ} ${WIDTH} ${HEIGHT} ${POINTS}` + GAME.map(tostring).join(''))

setInterval(savegame, 10000)
function newplayer(token, name, sock){
	let tank = {x: 0, y: 0, token, health: 3, points: POINTS, name, range: 2, vote: -1}
	let pos = null
	while(!pos || POSITIONS.has(pos))pos = (Math.floor(Math.random() * (WIDTH - 2)) + 1) + ' ' + (Math.floor(Math.random() * (HEIGHT - 2)) + 1);
	POSITIONS.add(pos)
	pos = pos.split(' ')
	tank.x = pos[0]; tank.y = pos[1]
	wss.clients.forEach(cli => cli != sock && cli.send(`newplayer${tostringclient(tank)}`))
	return GAME.push(tank) - 1
}

function broadcast(a){
	wss.clients.forEach(cli => cli.send(a))
}

function move(i, x, y){
	let t = GAME[i]
	POSITIONS.delete(t.x + ' ' + t.y)
	t.x = x
	t.y = y
	POSITIONS.add(x + ' ' + y)
	broadcast(`moved ${i} ${x} ${y}`)
}

function update(){
	POINTS++
	let votes = GAME.map(() => 0)
	for(let s of GAME){
		if(s.health < 1 && POINTS%2 == 1 && GAME[s.vote] && GAME[s.vote].health > 0){
			votes[s.vote]++
			s.vote = -1
		}else if(s.health > 0) s.points++
	}
	if(POINTS%2 == 1){
		let max = 0, indexes = []
		for(let i in votes)if(votes[i] > max){max  = votes[+i];indexes = [i]}else if(max > 0 && votes[i] == max)indexes.push(+i)
		let winner = indexes[Math.floor(Math.random() * indexes.length)]
		if(GAME[winner])GAME[winner].points += 3
		broadcast(`gotpoints ${winner} 3`)
	}
	broadcast('actionpoint')
	let next = FREQ - ((Date.now()+500)%FREQ)
	if(next < FREQ / 2)next += FREQ
	setTimeout(update, next)
}

let wss
if(SECURE){
	wss = new WebSocketServer({ server: createServer({key: await fs.readFile('a.key'),
	cert: await fs.readFile('a.pem') }).listen(443) })
}else wss = new WebSocketServer({ port: 80 })

setTimeout(update, 5000)

wss.on('connection', async function(sock, {url}){
	let [, token, name] = url.split('/')
	let index = GAME.findIndex(a => a.token == token), me = GAME[index]
	if(!me && POINTS < 1 && GAME.length < MAX_PLAYERS)me = GAME[index = newplayer(token, name, sock)]
	sock.send(`board ${FREQ} ${WIDTH} ${HEIGHT} ${index}` + GAME.map(tostringclient).join(''))
	sock.on('message', function(msg){
		msg = msg.toString()
		let [code] = msg.split('\n'), meta;
		[code, ...meta] = code.split(' ')
		if(code == 'vote'){
			let tank = GAME[meta[0] >>> 0]
			if(!tank || tank.health < 1 || me.health > 0)return
			me.vote = meta[0] >>> 0
			return
		}
		if(me.health < 1)return
		if(code == 'move'){
			let [x, y] = meta
			x >>>= 0; y >>>= 0
			if(x >= WIDTH || y >= HEIGHT || Math.abs(x - me.x) + Math.abs(y - me.y) > 1 || me.points < 1)return
			me.points--
			move(index, x, y)
		}else if(code == 'shoot'){
			let tank = GAME[meta[0] >>> 0]
			if(!tank || tank.health < 1 || Math.max(Math.abs(me.x - tank.x), Math.abs(me.y - tank.y)) > me.range || me.points < 1)return
			tank.health--
			me.points--
			broadcast(`shot ${index} ${meta[0] >>> 0}`)
		}else if(code == 'upgrade'){
			if(me.points < me.range + 1 || me.range >= 9)return
			me.points -= me.range + 1
			me.range++
			broadcast(`upgraded ${index}`)
		}else if(code == 'donate'){
			let tank = GAME[meta[0] >>> 0]
			if(!tank || tank.health < 1 || me.points < 1)return
			tank.points++
			me.points--
			broadcast(`donated ${index} ${meta[0] >>> 0}`)
		}
	})
})

import repl from 'basic-repl'

repl('$',_=>eval(_))