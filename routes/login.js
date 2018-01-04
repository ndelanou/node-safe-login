var express = 	require('express');
var router = 	express.Router();
var md5 = 		require('md5');

router.get('/', function(req, res) {
	var md5str = md5('hash' + Math.random() + 'key' + Math.random());
	req.session.hashkey = md5str;
	res.json({token: md5str});
})

router.post('/', function(req, res) {
	if(req.session.hashkey) {
		if(req.body.login && req.body.password) {
			var db = req.app.get('db');
			db.connect(function(client, done) {
				var query_str = 'SELECT id, login, password FROM users WHERE login= $1::text LIMIT 1;'
				client.query(query_str, [req.body.login], function(err, data) {
					if(!err && data && data.rows && data.rows.length > 0) {
						var user = data.rows[0];
						var db_pwd = user.password;
						if(md5(req.session.hashkey + db_pwd) == req.body.password) {
							delete req.session.user;
							req.session.user = {}
							req.session.user.id = user.id;
							req.session.user.login = user.login;
							console.log('LOGIN: SUCCESS')
							client.query('UPDATE users SET last_connection_date=current_timestamp WHERE id=$1::int', [user.id], function(err, result) {
								res.status(200)
								res.redirect('/user')
								done()
							})
						} else {
							res.status(401)
							res.json({error: 'Password is incorrect'});
							done()
							console.log('LOGIN: FAILED (Password incorrect)')
						}
						
					} else {
						res.status(404);
						res.json({error: 'No user with this login'});
						done()
						console.log('LOGIN: FAILED (No user with this login)')
					}
				});
			});
		} else {
			res.status(400)
			res.json({error: 'One parameter or more is missing'});
		}
	} else {
		res.status(400)
		res.json({error: 'Hashkey is missing'});
	}
})

router.post('/signup', function(req, res) {
	var user_info = req.body
	if('login' in user_info && 'password' in user_info && 'company_name' in user_info && 'public_mail' in user_info && 'public_phone' in user_info) {
		var db = req.app.get('db');
		db.connect(function(client, done) {
			client.query('SELECT * FROM users WHERE login=$1::text ;', [req.body.login], function(err, data) {
				if(!err && data.rows && data.rows.length == 0) {
					delete req.session.user;
					delete req.session.hashkey
					client.query('INSERT INTO address (street, city, cp) VALUES ($1::text, $1::text, $1::text),($1::text, $1::text, $1::text) RETURNING id', [''], function(err, data) {
						if(!err && data.rows) {
							var address_id = data.rows[0].id
							var facture_address_id = data.rows[1].id
							
							client.query('INSERT INTO users (login, password, company_name, public_mail, public_phone, address_id, facture_address_id) VALUES ( $1::text, $2::text, $3::text, $4::text, $5::text, $6::int, $7::int) RETURNING id, login;',
							[user_info.login, user_info.password, user_info.company_name, user_info.public_mail, user_info.public_phone, address_id, facture_address_id], function(err, result) {
								if(!err && result && result.rows) {
									var user = result.rows[0];
									req.session.user = {}
									req.session.user.id = user.id;
									req.session.user.login = user.login;
									res.redirect('/user')
									done()
								} else {
									res.status(500)
									res.json({error: 'Error inserting new user'});
									done()
								}
							})
						} else {
							res.status = 500
							res.json({error: 'Error inserting new addresses'})
							done()
						}
					})
				} else {
					res.status(400)
					res.json({error: 'Login already used'});
					done()
				}
			})
		})
	} else {
		res.status(400)
		res.json({error: 'One parameter or more is missing'});
	}
})

router.get('/logout', function(req, res) {
	if(req.session.user) {
		res.send('Logout successful');
	} else {
		res.send('Already logged out');
	}
	req.session.destroy();
})

router.get('/autologin', function(req, res) {
	delete req.session.user
	delete req.session.hashkey
	var md5str = md5('hash' + Math.random() + 'key' + Math.random());
	req.session.hashkey = md5str
	req.session.user = {}
	req.session.user.id = 1
	req.session.user.login = 'testuser'
	res.redirect('/user')
})

module.exports = router;