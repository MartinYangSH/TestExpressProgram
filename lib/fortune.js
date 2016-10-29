var fortuneCookies = [
	"Maybe You are the lucky one",
	"Maybe You are the lucky two",
	"Maybe You are the lucky three",
	"Maybe You are the lucky four"
];

exports.getFortune = function(){
	var idx = Math.floor(Math.random()*fortuneCookies.length);
	return fortuneCookies[idx];
}