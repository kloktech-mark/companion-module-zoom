var instance_skel = require('../../instance_skel');
var debug;
var log;
var Client  = require('node-rest-client').Client;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	return self;
}

instance.prototype.CHOICES_predefined = [
	{ id: 'predefined1', label: 'Predefined Message #1'},
	{ id: 'predefined2', label: 'Predefined Message #2'},
	{ id: 'predefined3', label: 'Predefined Message #3'},
];

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;

	self.buildPredefinedArray();

	self.actions();
}

instance.prototype.init = function() {
	var self = this;

	self.status(self.STATE_OK);

	debug = self.debug;
	log = self.log;

	self.buildPredefinedArray();

	self.actions(); // export actions
}

instance.prototype.buildPredefinedArray = function() {
	var self = this;

	self.CHOICES_predefined[0].label = self.config.predefined1;
	self.CHOICES_predefined[1].label = self.config.predefined2;
	self.CHOICES_predefined[2].label = self.config.predefined3;
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'Use this module to send custom messages to your Zoom channel.Follow these instructions to set up : <a href="https://zoomappdocs.docs.stoplight.io/incoming-webhook-chatbot"> Zoom incoming-webhook-chatbot </a>'
		},
		{
			type: 'textinput',
			id: 'zoomURL',
			label: 'Endpoint',
			width: 12,
			required: true
		},
		{
			type: 'textinput',
			id: 'token',
			label: 'Verification Token',
			width: 12,
			required: true
		},
		{
			type: 'textinput',
			id: 'predefined1',
			label: 'Predefined Message #1',
			width: 12
		},
		{
			type: 'textinput',
			id: 'predefined2',
			label: 'Predefined Message #2',
			width: 12
		},
		{
			type: 'textinput',
			id: 'predefined3',
			label: 'Predefined Message #3',
			width: 12
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;
	debug("destroy");
}

instance.prototype.actions = function(system) {
	var self = this;

	self.setActions({
		'predefined': {
			label: 'Send A Predefined Message',
			options: [
				{
					type: 'dropdown',
					label: 'Message',
					id: 'message',
					default: 'predefined1',
					choices: self.CHOICES_predefined
				}
			]
		},
		'custom': {
			label: 'Send A Custom Message',
			options: [
				{
					type: 'textinput',
					label: 'Message',
					id: 'message',
					default: ''
				}
			]
		},
		'blockkit': {
			label: 'Send A Block Kit Message',
			options: [
				{
					type: 'textinput',
					label: 'Block Kit Body (JSON)',
					id: 'body',
					default: '{}'
				}
			]
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd = self.config.zoomURL,
	body = {},
	parameters = {},
	headers = {};

	headers['Authorization'] = self.config.token;
	parameters['format'] = 'fields';

	switch(action.action) {
		case 'predefined':
			body.companion = self.config[action.options.message];
			break;
		case 'custom':
			body.companion = action.options.message;
			break;
		case 'blockkit':
			try {
				body = JSON.parse(action.options.body);
			} catch (e) {
				self.log('error', 'Zoom Webhook Send Aborted: Malformed JSON Body (' + e.message+ ')');
				self.status(self.STATUS_ERROR, e.message);
				return;
			}
			break;
		default:
			break;
	};

	var client = new Client();

	var args = {
		headers: { "Content-Type": "application/json" },
	  data: body,
	  parameters: parameters
	};

	if (headers !== undefined) {
	  for (var header in headers) {
	    args.headers[header] = headers[header];
	  }
	}

	client.post(cmd, args, function (data, response) {
		self.log('info', response.statusCode + ' ' + response.statusMessage);
		self.log('info', JSON.stringify(data));
		self.status(self.STATUS_OK, result.data);
	}).on('error', function(error) {
	  // debug('error response:', error);
	  // cb(true, { error: error });
		self.log('error', 'Zoom Webhook Send Failed (' + error.code + ')');
		self.status(self.STATUS_ERROR, error.code);
	});

}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
