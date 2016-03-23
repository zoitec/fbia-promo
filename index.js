'use strict';

const Hapi = require('hapi');

let FbiaRssBuilder = require('./lib/fbia-rss-builder');

const server = new Hapi.Server();
server.connection({ port: 5000 });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        var fs = require('fs');
        var payload = JSON.parse(fs.readFileSync('./testData2gal.json', 'utf8'));
        var config = {
            'noVideos': request.params.noVideos|| 0,
            'embedVideos': request.params.embedVideos || 0,
            'removeRelateds': request.params.removeRelateds || 1,
            'preferredVideo': 'ios_1240',
            'videoCDN': 'http://ht3.cdn.turner.com/cnn/big',
            'preferredImage': 'exlarge16to9',
            'galleryPreferredImage': 'exlarge16:9',
            'inStoryImage': 'mediumplus16to9',
            'imageCDN': 'http://i2.cdn.turner.com/cnnnext/dam/assets',
            'contentHost': 'http://www.cnn.com'
        }

        var fbiaRssBuilder = new FbiaRssBuilder(payload, config);


        reply(fbiaRssBuilder.getFeed()).header('Content-Type',' text/xml');
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: function (request, reply) {
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

// index.js
/*
var express = require("express");
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.send('Hello World!');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});*/