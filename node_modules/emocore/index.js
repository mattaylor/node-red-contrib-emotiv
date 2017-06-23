/* Cortex WebRTC Client */
class Cortex {

  constructor (opts = {}, next) {
    Object.assign(this, { opts:opts, api:{}, _rpc:{}, _sub:{}, queue:[]})
    //if (opts.socket) this.sock = polySocket(opts.socket)
    if (opts.socket) this.sock = opts.socket
    else this.sock = new WebSocket('ws://'+(opts.host||'localhost')+':'+(opts.port||8000))
    this.sock.onopen = () => this.queue.map(_ => this.sock.send(JSON.stringify(this.queue.shift())))
    if (opts.client_id) this.auth(opts)
    this.call('inspectApi')
    this.sock.onmessage = msg => {
      var data = JSON.parse(msg.data)
      console.log('RESPONSE:', data)
      if (data.methods) return this.init(data.methods, next)
      if (data.sid) return Object.keys(this._sub).map(key => data[key] && this._sub[key].map(cb => cb(data)))
      if (!this._rpc[data.id]) throw('Invalid Response: '+JSON.stringify(data), this._rpc)
      if (data.error && this._rpc[data.id].err) this._rpc[data.id].err(data.error)
      else this._rpc[data.id].res(data.result, data.error)
      delete this._rpc[data.id]
    }
  }

  state() { 
    return ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][this.sock.readyState]
  }

  is(state) { 
    return state.toUpperCase() == this.state()
  }

  /* Send authorization request and set this.creds as a promise to resolve to tokens  */
  auth (args = this.opts) {
    console.log('auth:', args)
    delete args.socket
    return this.creds = this.call('authorize', args).then(res => this.creds = res) 
   }

  /* Implement supported rpc api's from server discovery */
  init (api, next) {
    api.map(meth => { this.api[meth] = (args, cb) => this.call(meth, args, cb) })
    return next ? next(this) : true
  }

  /* Send RPC request and set callback or return a promise*/
  call (meth, args = {}, cb) {
    if (this.creds && this.creds._auth) args._auth = this.creds._auth
    else if (this.creds) return this.creds.then(_ => this.call(meth, args, cb)) 
    var rid = meth+'-'+Math.round(Math.random()*100)+'-'+new Date().getTime()
    var req = { id: rid, type: 'request', jsonrpc: '2.0', method: meth, params: args }
    console.log('REQUEST:', req)
    this.sock.readyState ? this.sock.send(JSON.stringify(req)) : this.queue.push(req)
    this._rpc[req.id] = cb ? { res: cb} : {}
    return new Promise((resolve, reject) => { this._rpc[req.id] = { res: resolve, err: reject } })
  }

  /* set callbacks for event handlers and auto subscribe to service if necessary*/
  on (stream, cb, filter) {
    var stream = stream.substring(0,3)
    if (!this._sub[stream]) this._sub[stream] = []
    if (cb) this._sub[stream].push(filter ? msg => filter(msg) && cb(msg) : cb)
    var prom = this.call('subscribe', {streams: [stream]})
    if (cb) return prom
    else return new Promise(res => { this._sub[stream].push(filter ? msg => filter(msg) && res(msg) : res) })
  }

  getHeadset(retry=10) { 
    if (!retry) return Promise.reject('No Headsets Found')
    return this.call('queryHeadsets').then(res => {
      for (let hset of res) if (hset.id.length && hset.id[0] != '-') return hset.id 
      return this.getHeadset(retry-1)
    })
  }

  /* Create a new session and return promise with 'on' event handler to handle session based message.*/
  newSession(args) {
    if (!args.status) args.status = 'active'
    var prom = (args.headset ? Promise.resolve() : this.getHeadset().then(id => args.headset = id))
    .then(_ => this.call('createSession', args))
    return { 
      call: (method, args) => prom.then(ses => this.call(method, Object.assign(args, {session:ses.id}))),
      off : (stream) => prom.then(ses => this.off(stream, ses.id)),
      set : (args) => prom.then(ses => this.call('updateSession', Object.assign(args, {session:ses.id}))),
      then: (ok, er) => prom.then(ok, er),
      on  : (stream, cb, filter) => prom.then(ses => this.on(stream, 
        msg => cb(this.toMap(msg, ses)),
        msg => msg.sid == ses.id && (!filter || filter(this.toMap(msg, ses)))
      ).then(def => {
        ses.streams = ses.streams || {}
        ses.streams[stream] = def[0][stream]
      }))
    }
  }
  
  toMap(msg, ses={}) {
    if (!msg.sid && !ses.id &! msg.sid == ses.id) return msg
    if (ses.streams) Object.keys(msg).map(key => {
      if (!ses.streams[key] || !ses.streams[key].cols) return
      var cols = ses.streams[key].cols.reduce((a, b) => a.map ? a.concat(b) : [a].concat(b))
      var vals = msg[key].reduce((a, b) => a.map  ? a.concat(b) : [a].concat(b))
      msg[key] = {}
      cols.map((col, ind) => msg[key][col] = vals[ind])
    })
    return msg
  }

  /* remove callbacks for event handlers and unsubscribe from service */
  off (stream) {
    var stream = stream.substring(0,3)
    if (!this._sub[stream]) return
    if (this.creds) this.call('unsubscribe', {streams: [stream]})
    delete this._sub[stream]
  }
}

//Polyfill W3C WebSocket from QML WebSocket
function wSocket(qSocket) {
  qSocket.onMessageReceived = function(message) { if (this.onmessage) this.onmessage(message) }
  qSocket.onStatusChanged   = function(status) {
    if (status == 'error' && this.onerror) return this.onerror()
    if (status == 'close' && this.onclose) return this.onclose()
    if (status == 'open'  && this.onopen)  {
      this.readyState = true 
      return this.onopen()
    } 
  }
  qSocket.send = qSocket.sendMessage
  return qSocket
}

//Polyfill QML WebSocket from W3C WebSocket
function qSocket(wSocket) {
  wSocket.onmessage = function(message) { if (this.onMessageReceived) this.onMessageReceived(message) }
  wSocket.onerror   = function() { if (this.onStatusChanged) this.onStatusChanged('error') }
  wSocket.onclose   = function() { if (this.onStatusChanged) this.onStatusChanged('close') }
  wSocket.onopen    = function() { if (this.onStatusChanged) this.onStatusChanged('close') }
  wSocket.sendMessage = w3socket.send
  return wSocket
}

//Polyfill QML and W3C WebSockets automatically
function polySocket(socket) {
  if (socket.sendMessage) return qSocket(socket)  //socket is QT WebSocket
  if (socket.send) return wSocket(socket)  //socket is W3C WebSocket
}

if (typeof module == 'object') module.exports = Cortex
