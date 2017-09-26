//
// A score record JavaScript class to store the name and the score of a player
//
function ScoreRecord(name, score) {
    this.name = name;
    this.score = score;
}


//
// This function reads the high score table from the cookies
//
function getHighScoreTable() {
    var table = new Array();

    for (var i = 0; i < 10; i++) {
        // Contruct the cookie name
        // Get the cookie value using the cookie name
        // If the cookie does not exist exit from the for loop
        // Extract the name and score of the player from the cookie value
        // Add a new score record at the end of the array

		var play = "player" + i;
		var tmp = getCookie(play);
		if(tmp == null) break;
		var temp = tmp.split("~");
		table.push(new ScoreRecord(temp[0],parseInt(temp[1])));
    }
    return table;
}


//
// This function stores the high score table to the cookies
//
function setHighScoreTable(table) {
    for (var i = 0; i < 10; i++) {
        // If i is more than the length of the high score table exit
        // from the for loop
        if (i >= table.length) break;

        // Contruct the cookie name

        // Store the ith record as a cookie using the cookie name
        var player = "player" + i;

        //setCookie(player,table[i],true,true,true,true);
        setCookie(player, table[i].name+"~"+table[i].score);
    }
}


//
// This function adds a high score entry to the text node
//
var bool1 = true;
var bool2 = true;
function addHighScore(record, node) {
    // Create the name text span
    var name2 = svgdoc.createElementNS("http://www.w3.org/2000/svg", "tspan");
	name2.setAttribute("x", 100);
	name2.setAttribute("dy", 40);
	name2.appendChild(svgdoc.createTextNode(record.name));
	
	if(record.name==curr_name&&record.score==curr_score){
		if(bool1){
		name2.setAttribute("style", "fill:red;font-size:20px;font-weight:bold");
		bool1 = false;
		}	
	} else{
		bool1=true;
	}
	node.appendChild(name2);	
	
    // Create the score text span
    var score2 = svgdoc.createElementNS("http://www.w3.org/2000/svg", "tspan");
	score2.setAttribute("x", 400);
	score2.appendChild(svgdoc.createTextNode(record.score));
	
	if(record.name==curr_name&&record.score==curr_score){
		if(bool2){
		score2.setAttribute("style", "fill:red;font-size:20px;font-weight:bold");
		bool2 = false;
		}	
	} else{
		bool2=true;
	}
	
	node.appendChild(score2);
}


//
// This function shows the high score table to SVG
//
function showHighScoreTable(table) {
    // Show the table
    var node = svgdoc.getElementById("highscoretable");
    node.style.setProperty("visibility", "visible", null);

    // Get the high score text node
    var node = svgdoc.getElementById("highscoretext");

    for (var i = 0; i < 10; i++) {
        // If i is more than the length of the high score table exit
        // from the for loop
        if (i >= table.length) break;

        // Add the record at the end of the text node
        addHighScore(table[i], node);
    }
}


//
// The following functions are used to handle HTML cookies
//

//
// Set a cookie
//
function setCookie(name, value, expires, path, domain, secure) {
    var curCookie = name + "=" + escape(value) +
        ((expires) ? "; expires=" + expires.toGMTString() : "") +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        ((secure) ? "; secure" : "");
    document.cookie = curCookie;
}


//
// Get a cookie
//
function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    } else
        begin += 2;
    var end = document.cookie.indexOf(";", begin);
    if (end == -1)
        end = dc.length;
    return unescape(dc.substring(begin + prefix.length, end));
}


//
// Delete a cookie
//
function deleteCookie(name, path, domain) {
    if (get_cookie(name)) {
        document.cookie = name + "=" +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}
