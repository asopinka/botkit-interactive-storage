var Store = require("jfs");
var db = require('monk');
var redis = require('redis');

var uuid = require('uuid/v4');

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
	}

	var messages = {
		save: function(msg, cb) {
			if (!msg.id) {
				msg.id = uuid();
			}
			
			if (isLocal) {
				msg_db.save(msg.id, msg, cb);
			}
			else if (isMongo) {
				msg_db.insert(msg, function(err, result) {
					cb(null, result.id);
				});
			}
			else {
				msg_db.set(msg.id, JSON.stringify(msg), function(err, result) {
					cb(null, result.id);
				})
			}
		},
		get: function(id, cb) {
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
				msg_db.get(msg.id, function(err, result) {
					cb(null, JSON.parse(result));
				});
			}
		}
	};

	return messages;
};