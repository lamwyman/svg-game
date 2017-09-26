// The point and size class used in this program
function Point(x, y) {
    this.x = (x)? parseFloat(x) : 0.0;
    this.y = (y)? parseFloat(y) : 0.0;
}

function Size(w, h) {
    this.w = (w)? parseFloat(w) : 0.0;
    this.h = (h)? parseFloat(h) : 0.0;
}

// Helper function for checking intersection between two rectangles
function intersect(pos1, size1, pos2, size2) {
    return (pos1.x < pos2.x + size2.w && pos1.x + size1.w > pos2.x &&
            pos1.y < pos2.y + size2.h && pos1.y + size1.h > pos2.y);
}


// The player class used in this program
function Player() {
    this.node = svgdoc.getElementById("player");
    this.position = PLAYER_INIT_POS;
    this.motion = motionType.NONE;
    this.verticalSpeed = 0;
}

Player.prototype.isOnPlatform = function() {
    var platforms = svgdoc.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));

        if (((this.position.x + PLAYER_SIZE.w > x && this.position.x < x + w) ||
             ((this.position.x + PLAYER_SIZE.w) == x && this.motion == motionType.RIGHT) ||
             (this.position.x == (x + w) && this.motion == motionType.LEFT)) &&
            this.position.y + PLAYER_SIZE.h == y) return true;
    }
    if (this.position.y + PLAYER_SIZE.h == SCREEN_SIZE.h) return true;

    return false;
}

Player.prototype.collidePlatform = function(position) {
    var platforms = svgdoc.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));
        var pos = new Point(x, y);
        var size = new Size(w, h);

        if (intersect(position, PLAYER_SIZE, pos, size)) {
            position.x = this.position.x;
            if (intersect(position, PLAYER_SIZE, pos, size)) {
                if (this.position.y >= y + h)
                    position.y = y + h;
                else
                    position.y = y - PLAYER_SIZE.h;
                this.verticalSpeed = 0;
            }
        }
    }
}

Player.prototype.collideScreen = function(position) {
    if (position.x < 0) position.x = 0;
    if (position.x + PLAYER_SIZE.w > SCREEN_SIZE.w) position.x = SCREEN_SIZE.w - PLAYER_SIZE.w;
    if (position.y < 0) {
        position.y = 0;
        this.verticalSpeed = 0;
    }
    if (position.y + PLAYER_SIZE.h > SCREEN_SIZE.h) {
        position.y = SCREEN_SIZE.h - PLAYER_SIZE.h;
        this.verticalSpeed = 0;
    }
}


//
// Below are constants used in the game
//
var PLAYER_SIZE = new Size(40, 40);         // The size of the player
var SCREEN_SIZE = new Size(600, 560);       // The size of the game screen
var PLAYER_INIT_POS  = new Point(0, 420);   // The initial position of the player

var MOVE_DISPLACEMENT = 5;                  // The speed of the player in motion
var JUMP_SPEED = 15;                        // The speed of the player jumping
var VERTICAL_DISPLACEMENT = 1;              // The displacement of vertical speed

var GAME_INTERVAL = 25;                     // The time interval of running the game

var BULLET_SIZE = new Size(10, 10);         // The speed of a bullet
var BULLET_SPEED = 10.0;                    // The speed of a bullet
                                            //  = pixels it moves each game loop
var SHOOT_INTERVAL = 200.0;                 // The period when shooting is disabled
var canShoot = true;                        // A flag indicating whether the player can shoot a bullet

var MONSTER_SIZE = new Size(40, 40);        // The speed of a bullet


//
// Variables in the game
//
var motionType = {NONE:0, LEFT:1, RIGHT:2}; // Motion enum

var svgdoc = null;                          // SVG root document node
var player = null;                          // The player object
var gameInterval = null;                    // The interval
var zoom = 1.0;                             // The zoom level of the screen
var score = 0;                              // The score of the game

var cheatMode = false;

//
// The load function for the SVG document
//

var audbgm = new Audio("bgm.mp3");

var nid = null;
function load(evt) {
    // Set the root node to the global variable
    svgdoc = evt.target.ownerDocument;

    // Attach keyboard events
    svgdoc.documentElement.addEventListener("keydown", keydown, false);
    svgdoc.documentElement.addEventListener("keyup", keyup, false);

    // Remove text nodes in the 'platforms' group
    cleanUpGroup("platforms", true);
	
	audbgm.play();
}


//
// This function removes all/certain nodes under a group
//
function cleanUpGroup(id, textOnly) {
    var node, next;
    var group = svgdoc.getElementById(id);
    node = group.firstChild;
    while (node != null) {
        next = node.nextSibling;
        if (!textOnly || node.nodeType == 3) // A text node
            group.removeChild(node);
        node = next;
    }
}


//
// This function creates the monsters in the game
//
var createboss = false;
var tmpdir;
function createMonster(x, y) {
	if(!createboss){
		var monsterb = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");
		tmpdir = Math.floor(Math.random()*4);
		monsterb.setAttribute("dir", tmpdir);
		if(tmpdir==2) {
			monsterb.setAttribute("isleft", true);
			//monsterb.setAttribute("transform","translate(" + ( x+40 )  + "," + y + ") scale(-1, 1)");
		}
		else{
			monsterb.setAttribute("isleft", false);
		}
		monsterb.setAttribute("x", x);
		monsterb.setAttribute("y", y);
		monsterb.setAttribute("id", "boss");
		monsterb.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monsterboss");
		svgdoc.getElementById("monsters").appendChild(monsterb);
		createboss = true;
	} else{
		var monster = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");
		tmpdir = Math.floor(Math.random()*4);
		monster.setAttribute("dir", tmpdir);
		if(tmpdir==2) {
			monster.setAttribute("isleft", true);
			//monster.setAttribute("transform","translate(" + ( x+40 )  + "," + y + ") scale(-1, 1)");
		}
		else{
			monster.setAttribute("isleft", false);
		}
		monster.setAttribute("x", x);
		monster.setAttribute("y", y);
		monster.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monster");
		svgdoc.getElementById("monsters").appendChild(monster);
	}
}

//
// This function shoots a bullet from the player
//
var bullet_num = 8;
//var bshoot = true;
function shootBullet() {
	if(cheatMode){
		bullet_num++;
	}
	
	// Disable shooting for a short period of time
	canShoot = false;
	if(bullet_num!=0){
		setTimeout("canShoot = true", SHOOT_INTERVAL);

		// Create the bullet using the use node
		var bullet = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");
		bullet.setAttribute("x", player.position.x + PLAYER_SIZE.w / 2 - BULLET_SIZE.w / 2);
		bullet.setAttribute("y", player.position.y + PLAYER_SIZE.h / 2 - BULLET_SIZE.h / 2);
		
		if(isleft)
			bullet.setAttribute("speed",-BULLET_SPEED);
		else
			bullet.setAttribute("speed", BULLET_SPEED);
		
		bullet.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#bullet");
		svgdoc.getElementById("bullets").appendChild(bullet);
		
		bullet_num--;
		svgdoc.getElementById("bullet_text").firstChild.data = bullet_num;
		
		var audshoot = new Audio("shoot.mp3");
		audshoot.play();
	}
}

var boss_bullet_num = 1;
function shootM(){
	var boss = svgdoc.getElementById("boss");
	
	if(boss!=null){
		var tmpdir = boss.getAttribute("dir");
		var x = parseFloat(boss.getAttribute("x"));
		var y = parseFloat(boss.getAttribute("y"));

		if(boss_bullet_num!=0){

			// Create the bullet using the use node
			var boss_bullet = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");
			boss_bullet.setAttribute("x", x + 40 / 2 - 10 / 2);
			boss_bullet.setAttribute("y", y + 40 / 2 - 10 / 2);
			
			if(tmpdir==2)
				boss_bullet.setAttribute("speed",-BULLET_SPEED);
			else
				boss_bullet.setAttribute("speed", BULLET_SPEED);
			
			boss_bullet.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#boss_bullet");
			svgdoc.getElementById("boss_bullets").appendChild(boss_bullet);
			
			boss_bullet_num--;
		}
	}
}


//
// This is the keydown handling function for the SVG document
//
var isleft = null;
function keydown(evt) {
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "A".charCodeAt(0):
			isleft = true;
            player.motion = motionType.LEFT;
            break;

        case "D".charCodeAt(0):
			isleft = false;
            player.motion = motionType.RIGHT;
            break;

        case "W".charCodeAt(0):
            if (player.isOnPlatform()) {
                player.verticalSpeed = JUMP_SPEED;
            }
			if(cheatMode){
				player.verticalSpeed = JUMP_SPEED;
			}
            break;
			
		case "C".charCodeAt(0):
			cheatMode = true;
			canShoot = true;
			player.node.setAttribute("opacity",0.5);
			break;
			
		case "V".charCodeAt(0):
			cheatMode = false;
			player.node.setAttribute("opacity",1);
			break;

        case 32:
            if (canShoot) shootBullet();
            break;
    }
}


//
// This is the keyup handling function for the SVG document
//
function keyup(evt) {
    // Get the key code
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "A".charCodeAt(0):
            if (player.motion == motionType.LEFT) player.motion = motionType.NONE;
            break;

        case "D".charCodeAt(0):
            if (player.motion == motionType.RIGHT) player.motion = motionType.NONE;
            break;
    }
}


//
// This function checks collision
//
var rewardnum = 8;
function collisionDetection() {
    // Check whether the player collides with a monster
    var monsters = svgdoc.getElementById("monsters");
    for (var i = 0; i < monsters.childNodes.length; i++) {
        var monster = monsters.childNodes.item(i);
        var x = parseInt(monster.getAttribute("x"));
        var y = parseInt(monster.getAttribute("y"));
		
		if(!cheatMode){
			if (intersect(new Point(x, y), MONSTER_SIZE, player.position, PLAYER_SIZE)) {
				var audplayerdie = new Audio("playerdie.mp3");
				audplayerdie.play();
				gameover();
			}
		}
    }

    // Check whether a bullet hits a monster
    var bullets = svgdoc.getElementById("bullets");
    for (var i = 0; i < bullets.childNodes.length; i++) {
        var bullet = bullets.childNodes.item(i);
        var x = parseInt(bullet.getAttribute("x"));
        var y = parseInt(bullet.getAttribute("y"));

        for (var j = 0; j < monsters.childNodes.length; j++) {
            var monster = monsters.childNodes.item(j);
            var mx = parseInt(monster.getAttribute("x"));
            var my = parseInt(monster.getAttribute("y"));

            if (intersect(new Point(x, y), BULLET_SIZE, new Point(mx, my), MONSTER_SIZE)) {
                monsters.removeChild(monster);
                j--;
                bullets.removeChild(bullet);
                i--;

				var audmonsterdie = new Audio("monsterdie.mp3");
				audmonsterdie.play();
				
                //write some code to update the score
            	if(zoom==2.0)
					score+=2;
				else
					score++;
            	svgdoc.getElementById("score").firstChild.data = score;
            }
        }
    }
	
	// check monster bullet hit player
    var boss_bullet = svgdoc.getElementById("boss_bullets");
	var bull = boss_bullet.firstChild;
	if(bull!=null){	
		var bx = parseInt(bull.getAttribute("x"));
		var by = parseInt(bull.getAttribute("y"));
			
		if(!cheatMode){
			if (intersect(new Point(bx, by), BULLET_SIZE, player.position, PLAYER_SIZE)) {
				var audplayerdie = new Audio("playerdie.mp3");
				audplayerdie.play();
					
				gameover();
			}
		}
	}	
	
	//collect medkit
	var res = svgdoc.getElementById("rewards");
    for (var i = 0; i < res.childNodes.length; i++) {
    	var re = res.childNodes.item(i);
    	var x = parseInt(re.getAttribute("x"));
    	var y = parseInt(re.getAttribute("y"));

    	if (intersect(new Point(x, y), new Size(10,10), player.position, PLAYER_SIZE)) {
    		res.removeChild(re);
    		i--;
    		if(zoom == 2.0)
            	score += 4;
            else
            	score += 2;
            svgdoc.getElementById("score").firstChild.data = score;
			rewardnum--;
    	}
    }
	
	//check exit
	if(rewardnum==0){
		if(intersect(new Point(0,20),new Size(40,40), player.position, PLAYER_SIZE)){
			score += timeleft;
			svgdoc.getElementById("score").firstChild.data = score;
			
			var audreachexit = new Audio("reachexit.mp3");
			audreachexit.play();
			
			gameover();
		}
	}
	
	//check teleport
	if(intersect(new Point(560,0),new Size(40,10), player.position, PLAYER_SIZE)){
    	player.position.x = 10;
    	player.position.y = 280;
    	player.node.setAttribute("transform", "translate(" + player.position.x + "," + player.position.y + ")");
    }
	if(intersect(new Point(0,280),new Size(10,40), player.position, PLAYER_SIZE)){
    	player.position.x = 560;
    	player.position.y = 20;
    	player.node.setAttribute("transform", "translate(" + player.position.x + "," + player.position.y + ")");
    }
}


//
// This function updates the position of the bullets
//
function moveBullets() {
    // Go through all bullets
    var bullets = svgdoc.getElementById("bullets");
	for (var i = 0; i < bullets.childNodes.length; i++) {
		var node = bullets.childNodes.item(i);

		// Update the position of the bullet
		var x = parseInt(node.getAttribute("x"));
		//node.setAttribute("x", x + BULLET_SPEED);
		node.setAttribute("x",parseInt(node.getAttribute("x")) + parseInt(node.getAttribute("speed")));
		
		// If the bullet is not inside the screen delete it from the group
		if (x > SCREEN_SIZE.w || x<0) {
			bullets.removeChild(node);
			i--;
		}
	}
	
	//boss_bullet
	var boss_bullets = svgdoc.getElementById("boss_bullets");
	for (var i = 0; i < boss_bullets.childNodes.length; i++) {
		var node = boss_bullets.childNodes.item(i);
		
		// Update the position of the bullet
		var x = parseInt(node.getAttribute("x"));
		//node.setAttribute("x", x + BULLET_SPEED);
		node.setAttribute("x",parseInt(node.getAttribute("x")) + parseInt(node.getAttribute("speed")));
		
		// If the bullet is not inside the screen delete it from the group
		if (x > SCREEN_SIZE.w || x<0) {
			boss_bullets.removeChild(node);
			i--;
			boss_bullet_num = 1;
		}
	}
	
}


//
// This function updates the position and motion of the player in the system
//
function gamePlay() {
    // Check collisions
    collisionDetection();

    // Check whether the player is on a platform
    var isOnPlatform = player.isOnPlatform();

    // Update player position
    var displacement = new Point();

    // Move left or right
    if (player.motion == motionType.LEFT)
        displacement.x = -MOVE_DISPLACEMENT;
    if (player.motion == motionType.RIGHT)
        displacement.x = MOVE_DISPLACEMENT;

    // Fall
    if (!isOnPlatform && player.verticalSpeed <= 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
    }

    // Jump
    if (player.verticalSpeed > 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
        if (player.verticalSpeed <= 0)
            player.verticalSpeed = 0;
    }

    // Get the new position of the player
    var position = new Point();
    position.x = player.position.x + displacement.x;
    position.y = player.position.y + displacement.y;

    //disappearing platform
    if(svgdoc.getElementById("dis1")){
		var platform = svgdoc.getElementById("dis1");
		if((parseInt(platform.getAttribute("y")) == (player.position.y + PLAYER_SIZE.h))
			&& ((player.position.x + PLAYER_SIZE.w) > parseInt(platform.getAttribute("x")))
			&& (player.position.x < (parseInt(platform.getAttribute("x")) + parseInt(platform.getAttribute("width"))))){
			var platformOpacity = parseFloat((platform.getAttribute("opacity")*10 - 1)/10);
			platform.setAttribute("opacity",platformOpacity);
			if( parseFloat(platform.getAttribute("opacity"))== 0)
				platform.parentNode.removeChild(platform);
		}
	}
    if(svgdoc.getElementById("dis2")){
		var platform = svgdoc.getElementById("dis2");
		if((parseInt(platform.getAttribute("y")) == (player.position.y + PLAYER_SIZE.h))
			&& ((player.position.x + PLAYER_SIZE.w) > parseInt(platform.getAttribute("x")))
			&& (player.position.x < (parseInt(platform.getAttribute("x")) + parseInt(platform.getAttribute("width"))))){
			var platformOpacity = parseFloat((platform.getAttribute("opacity")*10 - 1)/10);
			platform.setAttribute("opacity",platformOpacity);
			if( parseFloat(platform.getAttribute("opacity"))== 0)
				platform.parentNode.removeChild(platform);
		}
	}
    if(svgdoc.getElementById("dis3")){
		var platform = svgdoc.getElementById("dis3");
		if((parseInt(platform.getAttribute("y")) == (player.position.y + PLAYER_SIZE.h))
			&& ((player.position.x + PLAYER_SIZE.w) > parseInt(platform.getAttribute("x")))
			&& (player.position.x < (parseInt(platform.getAttribute("x")) + parseInt(platform.getAttribute("width"))))){
			var platformOpacity = parseFloat((platform.getAttribute("opacity")*10 - 1)/10);
			platform.setAttribute("opacity",platformOpacity);
			if( parseFloat(platform.getAttribute("opacity"))== 0)
				platform.parentNode.removeChild(platform);
		}
	}
	
	// Check collision with platforms and screen
    player.collidePlatform(position);
    player.collideScreen(position);

    // Set the location back to the player object (before update the screen)
    player.position = position;

	
	shootM();
	
    // Move the bullets
    moveBullets();
	
	//move monsters
	moveM();
    
	updateScreen();
}
//if(platform.getAttribute("x1")<=player.position.x&&platform.getAttribute("x2")>=player.position.x&&platform.getAttribute("y1")>=player.position.y){		


function moveM(){
	var x,y;
	var flipdirection,changeflip;
    var monsters = svgdoc.getElementById("monsters");
    for (var i = 0; i < monsters.childNodes.length; i++) {
        var monster = monsters.childNodes.item(i);
		x = monster.getAttribute("x");
		y = monster.getAttribute("y");
		dir = monster.getAttribute("dir");
		
		flipdirection = Math.random();
		changeflip = Math.random();
		
		//if(dir==2)
		//	monster.setAttribute("transform","translate(" + (x + 40)  + "," + y + ") scale(-1, 1)");
		//else
		//	monster.setAttribute("transform", "translate(" + x + "," + y + ")");
	
		if(dir==0){
			if(y==0 || flipdirection<0.01) monster.setAttribute("dir",1);
			if(changeflip<0.01) monster.setAttribute("dir",2);
			y--;
			monster.setAttribute("y",y);
		}else if(dir==1){
			if(y==520 || flipdirection<0.01) monster.setAttribute("dir",0);
			if(changeflip<0.01) monster.setAttribute("dir",3);
			y++;
			monster.setAttribute("y",y);
		}else if(dir==2){
			monster.setAttribute("isleft",true);
			//monster.setAttribute("transform","translate(" + (x + 40)  + "," + y + ") scale(-1, 1)");
			if(x==0 || flipdirection<0.01) monster.setAttribute("dir",3);
			if(changeflip<0.01) monster.setAttribute("dir",1);
			x--;
			monster.setAttribute("x",x);
		}else if(dir==3){
			monster.setAttribute("isleft",false);
			//monster.setAttribute("transform", "translate(" + x + "," + y + ")");
			if(x==560 || flipdirection<0.01) monster.setAttribute("dir",2);
			if(changeflip<0.01) monster.setAttribute("dir",0);
			x++;
			monster.setAttribute("x",x);
		}
    }
	
	/*
	//transform monster
	var monsterisleft, mx, my;
	var monsters = svgdoc.getElementById("monsters");
	for (var i = 0; i < monsters.childNodes.length; i++) {
        var monster = monsters.childNodes.item(i);
		mx = monster.getAttribute("x");
		my = monster.getAttribute("y");
		
		monsterisleft = monster.getAttribute("isleft");
		if(monsterisleft){

			monster.setAttribute("transform","translate(" + (mx + 40)  + "," + my + ") scale(-1, 1)");
		}else{
			monster.setAttribute("transform", "translate(" + mx + "," + my + ")");
		}
		
		var tmpdir = monster.getAttribute("dir");
		
		if(tmpdir == 2){
			monster.setAttribute("transform","translate(" + (mx + 40)  + "," + my + ") scale(-1, 1)");			
		}
		else{
			monster.setAttribute("transform", "translate(" + mx + "," + my + ")");
		}
	}
	*/
	
}

//
// This function updates the position of the player's SVG object and
// set the appropriate translation of the game screen relative to the
// the position of the player
//
function updateScreen() {
    // Transform the player
	if(isleft)
        player.node.setAttribute("transform","translate(" + (player.position.x + PLAYER_SIZE.w)  + "," + player.position.y + ") scale(-1, 1)");
	else
		player.node.setAttribute("transform", "translate(" + player.position.x + "," + player.position.y + ")");
	
    // Calculate the scaling and translation factors
    var scale = new Point(zoom, zoom);
    var translate = new Point();

    translate.x = SCREEN_SIZE.w / 2.0 - (player.position.x + PLAYER_SIZE.w / 2) * scale.x;
    if (translate.x > 0)
        translate.x = 0;
    else if (translate.x < SCREEN_SIZE.w - SCREEN_SIZE.w * scale.x)
        translate.x = SCREEN_SIZE.w - SCREEN_SIZE.w * scale.x;

    translate.y = SCREEN_SIZE.h / 2.0 - (player.position.y + PLAYER_SIZE.h / 2) * scale.y;
    if (translate.y > 0)
        translate.y = 0;
    else if (translate.y < SCREEN_SIZE.h - SCREEN_SIZE.h * scale.y)
        translate.y = SCREEN_SIZE.h - SCREEN_SIZE.h * scale.y;

    // Transform the game area
    svgdoc.getElementById("gamearea").setAttribute("transform", "translate(" + translate.x + "," + translate.y + ") scale(" + scale.x + "," + scale.y + ")");

	nid.setAttribute("x", player.position.x+15);
	nid.setAttribute("y", player.position.y-5);
}


//
// This function sets the zoom level to 2
//
function setZoom() {
    zoom = 2.0;
}

var newPlatform1 = null;
var newPlatform2 = null;
var newPlatform3 = null;
var curr_name = "";
var tmpname= "";

var tmpzoom;

function check_mode(zoooom){
	audbgm.play();
	tmpzoom = zoooom;
	
	clearInterval(gameInterval);
	clearInterval(timer);
	cheatMode = false;
	
	cleanUpGroup("bullets", false);
	if(zoooom==1){
		setZoom();
	}
	svgdoc.getElementById("main").style.visibility = "hidden";

	// Create the player
	player = new Player();
	curr_name = prompt("What is your name?", tmpname);
	if(curr_name == "" || curr_name == null || curr_name.length == 0) 
		curr_name = "Anonymous";
	tmpname = curr_name;
	svgdoc.getElementById("nval").firstChild.data = curr_name;
	nid = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");
	nid.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#user");
	svgdoc.getElementById("user_name").appendChild(nid);
	nid.setAttribute("x", player.position.x);
	nid.setAttribute("y", player.position.y-5);

	for(var i=0; i<8; i++){
		createReward();
	}
	
	// Create the monsters
	var tx,ty;
	for(var i=0; i<4; i++){
		tx = Math.floor(Math.random()*560);
		ty = Math.floor(Math.random()*520);
		if((tx>=100&&tx<=560)&&(ty>=0&&ty<=300)){
			createMonster(tx, ty);
		}
		else
			i--;
	}
	for(var i=0; i<2; i++){
		tx = Math.floor(Math.random()*560);
		ty = Math.floor(Math.random()*520);
		if((tx>=150&&tx<=560)&&(ty>=400&&ty<=520))
				createMonster(tx, ty);
		else
			i--;
	}
	
	var platforms = svgdoc.getElementById("platforms");
	var newPlatform1 = svgdoc.createElementNS("http://www.w3.org/2000/svg", "rect");
	newPlatform1.setAttribute("x", 130);
	newPlatform1.setAttribute("y", 100);
	newPlatform1.setAttribute("width", 70);
	newPlatform1.setAttribute("height", 20);
	newPlatform1.setAttribute("type", "disappearing");
	newPlatform1.setAttribute("opacity", 1);
	newPlatform1.setAttribute("style", "fill:black;");
	newPlatform1.setAttribute("id", "dis1");
	platforms.appendChild(newPlatform1);
	var newPlatform2 = svgdoc.createElementNS("http://www.w3.org/2000/svg", "rect");
	newPlatform2.setAttribute("x", 400);
	newPlatform2.setAttribute("y", 100);
	newPlatform2.setAttribute("width", 70);
	newPlatform2.setAttribute("height", 20);
	newPlatform2.setAttribute("type", "disappearing");
	newPlatform2.setAttribute("opacity", 1);
	newPlatform2.setAttribute("style", "fill:black;");
	newPlatform2.setAttribute("id", "dis2");
	platforms.appendChild(newPlatform2);
	var newPlatform3 = svgdoc.createElementNS("http://www.w3.org/2000/svg", "rect");
	newPlatform3.setAttribute("x", 270);
	newPlatform3.setAttribute("y", 420);
	newPlatform3.setAttribute("width", 70);
	newPlatform3.setAttribute("height", 20);
	newPlatform3.setAttribute("type", "disappearing");
	newPlatform3.setAttribute("opacity", 1);
	newPlatform3.setAttribute("style", "fill:black;");
	newPlatform3.setAttribute("id", "dis3");
	platforms.appendChild(newPlatform3);
	
	timer = setInterval("time()", 1000);

	// Start the game interval
   	gameInterval = setInterval("gamePlay()", GAME_INTERVAL);
}

function createReward(){
	var reward = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");

    var Pos ;
    var find = false;
    var platforms = svgdoc.getElementById("platforms");

    while(!find){
        find = true;
        Pos = new Point(Math.random()*560, Math.random()*520);

        for (var i = 0; i < platforms.childNodes.length; i++) {
            var node = platforms.childNodes.item(i);
            if (node.nodeName != "rect") continue;

            var px = parseFloat(node.getAttribute("x"));
            var py = parseFloat(node.getAttribute("y"));
            var pw = parseFloat(node.getAttribute("width"));
            var ph = parseFloat(node.getAttribute("height"));
            
			var pos2 = new Point(px, py);
            var size = new Size(pw, ph);
            if (intersect(Pos, new Size(30,30), pos2, size)) {
                find = false
                break;
            }
        }
    }
    reward.setAttribute("x", Pos.x);
    reward.setAttribute("y", Pos.y);

    reward.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#reward");
    svgdoc.getElementById("rewards").appendChild(reward);
}


var timeleft = 60;
var timer;
function time(){
	timeleft--;
	if(timeleft == 0) gameover();
	svgdoc.getElementById("timer_text").firstChild.data = timeleft;
	svgdoc.getElementById("timer_bar").setAttribute("width", Math.floor(timeleft /60 * 140));
}

var curr_score;
function gameover(){
	curr_score = score;
	audbgm.pause();
	audbgm.currentTime = 0;
	clearInterval(gameInterval);
	clearInterval(timer);
	timeleft = 0;
	cheatMode = false;
	player.node.setAttribute("opacity",1);
	
	var table = new Array();
    table = getHighScoreTable();

    var record = new ScoreRecord(curr_name, score);
	
	var tmp = table.length;
	for(var i=0;i<table.length;i++){
		if (record.score>table[i].score){
			tmp = i;
			break;
		}
	}
	table.splice(tmp,0,record);
	setHighScoreTable(table);
	svgdoc.getElementById("highscoretable").style.visibility = "visible";
	showHighScoreTable(table);
    return;
}


function replay(){
	cleanUpGroup("user_name", false);
    cleanUpGroup("monsters", false);
	cleanUpGroup("rewards", false);
    cleanUpGroup("bullets", false);
    cleanUpGroup("highscoretext", false);
	
	rewardnum = 8;
	timeleft = 60;
	svgdoc.getElementById("timer_text").firstChild.data = timeleft;
	svgdoc.getElementById("timer_bar").setAttribute("width", Math.floor(timeleft /60 * 140));
	bullet_num = 8;
	svgdoc.getElementById("bullet_text").firstChild.data = bullet_num;
	svgdoc.getElementById("highscoretable").style.setProperty("visibility", "hidden", null);
	score=0;
	svgdoc.getElementById("score").firstChild.data = score;
	
	player.node.setAttribute("opacity",1);
	cheatMode = false;
	createboss = false;
	check_mode(tmpzoom);
}
