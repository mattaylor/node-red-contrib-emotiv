var Emocore = require("emocore")
var streams = ['dev', 'eeg', 'cog', 'mot', 'fac', 'pow']

function Emotiv(config) {
	RED.nodes.createNode(this,config)
	var cortex = new Emocore(this.credentials).newSession()
   	this.on('input', msg => if (msg.jsonrpc) cortex.call(msg.method, msg.params))
	this.on('close', msg => cortex.set({status:'closed'})
	streams.map(stream => if (this[stream]) cortex.on(stream, msg => this.send(msg)))
}

var emoCreds = { 
	username: {type:"text"}, 
  	password: {type:"password"}, 
	license: {type:"text" }, 
	client_id: {type:"text"},
	client_secret: {type:"text"}
}

RED.nodes.registerType("emotiv",Emotiv, { credentials:emoCreds } )
		 
										       }
						  });
