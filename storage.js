var Store = require('jfs');
var db = require('monk');
var redis = require('redis');

var uuid = require('uuid/v4');

var Promise = require('bluebird');

module.exports = function(config) {
	if (!config) {
		throw new Error('You must pass a config to botkit-interactive-storage');
	}

	if (!config.mongo_uri && !config.path && !config.redis_uri) {
		throw new Error('You must pass a mongo_uri, redis_uri, or path property');
	}

	if ((config.mongo_uri && config.path) || (config.redis_uri && config.path)) {
		throw new Error('Please pass 1 of mongo_uri, redis_uri, or path property.');
	}

	var isLocal = config.path != null;
	var isMongo = config.mongo_uri != null;

	var unwrapFromList = function(cb) {
		return function(err, data) {
			if (err) {
				cb(err, data);
			} else {
				cb(err, data[0]);
			}
		};
	};

	var msg_db;
	if (isLocal) {
		msg_db = new Store(config.path + "/interactive-storage", { saveId: 'id' });
	}
	else if (isMongo) {
		msg_db = db(config.mongo_uri).get('interactive-storage');
	}
	else {
		msg_db = redis.createClient({
			url: config.redis_uri
		});

		msg_db.on('error', function (err) {
			console.log('Redis error: ' + err);
		});
	}

	var messages = {
		save: function(msg, cb) {
			if (cb) {
				if (!msg.id) {
					msg.id = uuid();
				}
				
				if (isLocal) {
					msg_db.save(msg.id, msg, function() {
						cb(null, msg.id);
					});
				}
				else if (isMongo) {
					msg_db.insert(msg, function(err, result) {
						cb(null, result.id);
					});
				}
				else {
					try {
						msg_db.set('interactive:' + msg.id, JSON.stringify(msg), function(err, result) {
							cb(null, msg.id);
						});
					}
					catch(ex) {
						try {
							setTimeout(function() {
								msg_db.set('interactive:' + msg.id, JSON.stringify(msg), function(err, result) {
									cb(null, msg.id);
								});
							}, 5000);
						}
						catch(ex) {
							cb(ex, null);
						}
					}
				}
			}
			else {
				return new Promise(function(resolve, reject) {
					if (!msg.id) {
						msg.id = uuid();
					}
					
					if (isLocal) {
						msg_db.save(msg.id, msg, function() {
							resolve(msg.id);
						});
					}
					else if (isMongo) {
						msg_db.insert(msg, function(err, result) {
							resolve(result.id);
						});
					}
					else {
						try {
							msg_db.set('interactive:' + msg.id, JSON.stringify(msg), function(err, result) {
								resolve(msg.id);
							});
						}
						catch(ex) {
							try {
								setTimeout(function() {
									msg_db.set('interactive:' + msg.id, JSON.stringify(msg), function(err, result) {
										resolve(msg.id);
									});
								}, 5000);
							}
							catch(ex) {
								reject(ex);
							}
						}
					}
				});
			}
		},
		get: function(id, cb) {
			if (cb) {
				if (isLocal) {
					msg_db.get(id, function(err, result) {
						msg_db.delete(id, function(err) {
							cb(null, result);
						});
					});
				}
				else if (isMongo) {
					msg_db.find({ id: id }, unwrapFromList(function(err, result) {
						msg_db.remove({ id: id }, function(err) {
							cb(null, result);
						});
					}));
				}
				else {
					try {
						msg_db.get('interactive:' + id, function(err, result) {
							cb(null, JSON.parse(result));
						});
					}
					catch(ex) {
						try {
							setTimeout(function() {
								msg_db.get('interactive:' + id, function(err, result) {
									cb(null, JSON.parse(result));
								});
							}, 5000);
						}
						catch(ex) {
							cb(ex, null);
						}
					}
				}
			}
			else {
				return new Promise(function(resolve, reject) {
					if (isLocal) {
						msg_db.get(id, function(err, result) {
							msg_db.delete(id, function(err) {
								resolve(result);
							});
						});
					}
					else if (isMongo) {
						msg_db.find({ id: id }, unwrapFromList(function(err, result) {
							msg_db.remove({ id: id }, function(err) {
								resolve(result);
							});
						}));
					}
					else {
						try {
							msg_db.get('interactive:' + id, function(err, result) {
								resolve(JSON.parse(result));
							});
						}
						catch(ex) {
							try {
								setTimeout(function() {
									msg_db.get('interactive:' + id, function(err, result) {
										resolve(JSON.parse(result));
									});
								}, 5000);
							}
							catch(ex) {
								reject(ex);
							}
						}
					}
				});
			}
		}
	};

	return messages;
};