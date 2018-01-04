var port = 			process.env.PORT || 3000
var private_key = 	'F6ZX]h*Fz{5@R6g[r?L9e4a897Y;s:a-zj2V+NT9'
var session_key = 	'75e6F1IY1l6cvm8fU10hNs8rp8OMTGhGP6Bj'

// Imports =========================================
var express = 				require('express');
var session = 				require('express-session');
var app = 					express();
var bodyParser = 			require('body-parser');
var fs = 					require('fs');
var path = 					require('path');

var db = 					require('./db/DB_Service');
var login = 				require('./routes/login');


// Configurations ==================================
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.set('db', db)

var sessionVar = session({
	secret: session_key,
	resave: true,
	saveUninitialized: true
})
app.use(sessionVar)

// Routes ==========================================
app.get('/', function (req, res) {
	res.send('')
})
app.use(login);

// check if user is logged
app.use(function(req, res, next) {
	if(req.session.user) {
		next()
	} else {
		res.status(401)
		res.json({error: 'You need to be logged to see this content'});
	}
})

// Routes accessible after login

app.use(function(req, res){
	res.status(404);
	
	// respond with json
	if (req.accepts('json')) {
		res.json({ error: 'Not found' });
		return;
	}

	// respond with html page
	if (req.accepts('html')) {
		res.send ('404 - ' + req.url.replace('/', ''));
		return;
	}

	// default to plain-text. send()
	res.type('txt').send('Not found');
})

app.listen(port);