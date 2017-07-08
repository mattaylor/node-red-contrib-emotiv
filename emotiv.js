var Emocore = require("emocore")

var streams = ['dev', 'eeg', 'cog', 'mot', 'fac', 'pow']

var cortex = null

var emoConf = { 
	port: 54321,
	username: 'cortextest',
  password: 'Zxcvbnm1',
  client_id: 'dLtw8yCxBXdIqdlDKHmhB2Sx5gI91amybjUGnaJx',
  client_secret: 'Bg84uRfKi4k58tYxkUS0fGpEvrANaYrvQ6CwNwXyRnvWtUTxagerHUW47LxWdWvSlSlGlt6cMdrGL8Pi6iSQwYXrpcTxXE2x0BHDTsYbZjn6iYVqF0Mu0XptfEY5zgjo' 
}

module.exports = function (RED) {

function Emotiv(config) {

	RED.nodes.createNode(this,config)
	
	console.log('CREDS:', this.credentials)

	if (!cortex) cortex = new Emocore(emoConf).newSession()

  this.on('input', msg => {
		console.log('CORTEX INPUT:', msg)
		if (msg.jsonrpc) cortex.call(msg.method, msg.params)
	})
	this.on('close', msg => cortex.set({status:'closed'}))
	streams.map((stream, output) => this[stream] && cortex.on(stream, msg => this.send(streams.map(s => s == stream ? msg : null))))
}

var emoCreds = { 
	port: { value: 54321},
	username: { type: 'text', value: "cortextest"},
  password: { type: 'password', value:"Zxcvbnm1"},
  client_id:{ value: "dLtw8yCxBXdIqdlDKHmhB2Sx5gI91amybjUGnaJx" },
  client_secret: { value: "Bg84uRfKi4k58tYxkUS0fGpEvrANaYrvQ6CwNwXyRnvWtUTxagerHUW47LxWdWvSlSlGlt6cMdrGL8Pi6iSQwYXrpcTxXE2x0BHDTsYbZjn6iYVqF0Mu0XptfEY5zgjo"} ,
}

RED.nodes.registerType("emotiv",Emotiv, { credentials:emoCreds } )

}
