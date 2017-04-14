var Store = require("jfs");
var db = require('monk');
var uuid = require('uuid/v4');

module.exports = function(config) {
	if (!config) {
		throw new Error('You must pass a config to botkit-interactive-storage');
	}

	if (!config.mongo_uri && !config.path) {
		throw new Error('You must pass a mongo_uri or path property');
	}

	if (config.mongo_uri && config.path) {
		throw new Error('Please pass a mongo_uri OR path property, not both')
	}

	var isLocal = config.path != null;

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
	else {
		msg_db = db(config.mongo_uri).get('interactive-storage');
	}

	var messages = {
		save: function(msg, cb) {
			msg.id = uuid();
			if (isLocal) {
				msg_db.save(msg.id, msg, cb);
			}
			else {
				msg_db.insert(msg, function(err, result) {
					cb(null, result.id);
				});
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
			else {
				msg_db.find({ id: id }, unwrapFromList(function(err, result) {
					msg_db.remove({ id: id }, function(err) {
						cb(null, result);
					});
				}));
			}
		}
	};

	return messages;
};