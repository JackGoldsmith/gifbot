var request = require('request');
var https = require('https');
var groupId = process.env.groupId;
var botName = process.env.botName;
var botIdAlt = process.env.botIdAlt;
var botId = process.env.botId;

//scan messages
function respond() {
  var request = JSON.parse(this.req.chunks[0]);
  this.res.writeHead(200);
  trigger = request.text.substring(0,1);
  searchTerm = request.text.substring(1).trim();
  botTag = request.text.indexOf('@' + botName);
  if (request.group_id == groupId && request.name !== botName) {
    console.log(request.name + ' : ' + request.text);
    checkMessage(trigger, botTag, searchTerm, botId);
  } else if (botIdAlt !== null && request.name !== botName) {
  botId = process.env.botIdAlt;
  console.log(request.name + ' : ' + request.text);
  checkMessage(trigger, botTag, searchTerm, botId);
  }
  this.res.end();
}

//check for triggers
function checkMessage(trigger, botTag, searchTerm, botId) {
  
  //HELP ?
  if (trigger == '?' || botTag >= 0) {
    postMessage('Need help?\nStocks = $ + (ticker symbol)\nGIFS = # + (search keyword)\nTag me to see this again', botId);
  }

  //GIF #
  if (trigger == '#') {
	request('https://api.giphy.com/v1/gifs/translate?s=' + searchTerm + '&api_key=dc6zaTOxFJmzC&rating=r', function (error, response, body) {
	parsedData = JSON.parse(body);
	if (!error && response.statusCode == 200 && parsedData && parsedData.data.images) {
	  postMessage(parsedData.data.images.downsized.url, botId);
	} else {
	postMessage('"' + searchTerm + '" is invalid\nTag me for help', botId);
	}
	});
  }

  //STOCK TICKER $
  if (trigger == '$') {
	  request('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + searchTerm + '%22)%0A%09%09&env=http%3A%2F%2Fdatatables.org%2Falltables.env&format=json', function (error, response, body) {
	  parsedData = JSON.parse(body); 
	  name = String(parsedData.query.results.quote.Name.substring(0,23));  
	  last = Number((parseFloat(parsedData.query.results.quote.LastTradePriceOnly)).toFixed(2));   
	  change = Number((parseFloat(parsedData.query.results.quote.ChangeinPercent)).toFixed(2));
	  if (change > 0) {
		change = String('+' + change);
	  }
	  if (!error && response.statusCode == 200 && name !== 'null' && name !== 'undefined') {
		postMessage(name + '\n$' + last + ' | ' + change + 'pct\n' + 'www.finance.yahoo.com/quote/' + searchTerm, botId);
	  } else {
	  postMessage('"' + searchTerm + '" is invalid\nTag me for help', botId);
	  } 
	  }); 
  }
}

//Post message
function postMessage(botResponse, botId) {
  var options, body, botReq;
  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botId,
    "text" : botResponse 
  };

  botReq = https.request(options, function(res) {
      if(res.statusCode == 202) {
        console.log('Post success ' + res.statusCode + ' ' + botResponse);
      } else {
      console.log('Bad status code ' + res.statusCode);
      }
  });
  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

exports.respond = respond;