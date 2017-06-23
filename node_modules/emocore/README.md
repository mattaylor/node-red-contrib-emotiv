## Emotiv Cortex JS Client and Mock Service.

### Getting Started 

nodejs required

`$ npm install`
`$ npm start`

To Test from Chrome..

- Install A websocket extension like https://chrome.google.com/webstore/detail/simple-websocket-client/pfdhoblngboilpfeibdedpjgfnlcodoo?hl=en
- Connect to 'ws://localhost:8000`
- To Authorise a client sent `{ "id":1, "method":"authorise", "params": {"license": $myLicenseKey }
- To create a session and subscribe to eeg events `{ "id":1, "method":"createSession", "params": {"_auth":$auth_response_token, "streams":["eeg"] } }`

Additional API's defined below..

### From QT/QML

```javascript
import "cortex.js" as Cortex

Rectangle {
  width: 360
  height: 360
  WebSocket {
    id: qSocket
    url: 'wss://localhost:8000'
  }
  property var cortex: new Cortex({client: 'myApp1', socket:qSocket})
  Component.onCompleted: {
    cortex.createSession()
    cortex.on('eeg').then(eeg => /* do something with eeg sample */)
    cortex.on('cog').then(cog => /* do something with performance metrics */)
    cortex.on('qua').then(qua => /* do something with contact quality */)
  }
}
```


### RPC API: 

See [RPCAPI](/rpcapi.md) for more details

__Start Session:__
```javascript
<< 	{ "id":1, "jsonrpc":"2.0", "method":"createSession", "params": { "subscribe":["qua"], "_auth": "abc" } }
>> 	{ "id":1 
    , "result":  
       { "id"   : "1234-abcd-abcd-abcd"
       , "status" : "opened"
       , "created" : "2016-12-13T03:13:13.841Z"
       , "headset": "Insight-1234" 
       , "streams": 
         { "eeg": { "cols": ["AF3","F7","F3","FC5","T7","P7","O1","O2","P8","T8","FC6","F4","F8","AF4"], "spec": ["float"], "freq": 128 }
         , "dev": { "cols": ["AF3","F7","F3","FC5","T7","P7","O1","O2","P8","T8","FC6","F4","F8","AF4"], "spec": ["enum"],  "freq": 2 }
         , "cog": { "cols": ["int", "med", "foc", "fru", "exc", "eng", "lex"], freq: 2 }
         , "dev": { "cols": ["battery", "BT Signal"], "spec": ["enum"], "freq": 2, "enums": ["none", "poor", "fair", "good" ] }
         , "pow": { "cols": ["alpha", "betaL", "betaL", "gamma", "delta"], "freq": 8 }
         , "fac": { "cols": ["smile", "laugh", "clench", "frown", "suprise", "blink", "smirk_RL", "look_RL", "look_UD", "wink_RL" ], "freq": 2 }
         , "ses": { "cols": ["status"] }
         , "mot": { "cols": ["gyroX", "gyroY",  "gyroZ"], "freq": 2 }
         , "pro": { "cols": ["action", "status", "score"] }
         }
       }
     }
```

__Close Session:__
```javascript
<< { "id":1, "jsonrpc":"2.0", "method":"updateSession", "params": { "status": "closed", "_auth": "abc" } }
>> { "id":1, "result":"ok" }
```

__Subscribe:__
```javascript
<< { "id":1, "jsonrpc":"2.0", "method":"subscribe", "params": "streams":["cog","eeg"], "_auth": "abc" } }
>> { "id":1, "result":"ok" }
```

__UnSubscribe:__
```javascript
<< { "id":1, "jsonrpc":"2.0", "method":"unsubscribe", "params": "streams":["cog","eeg"], "_auth": "abc" } }
>> { "id":1, "result":"ok" }
```

__Authorize:__
```javascript
<< { "id":1, "jsonrpc":"2.0", "method":"authorize", "params": { "license:"myLic1" } }
>> { "id":1, "result": {"_auth":"AWKU3flNae", "expires":"1234", "scope":["eeg"], "balance":10}}
```
### Messages: 

__EEG Samples:__
```javascript
{ "sid" : "ABCD-9999", "time" : 1489217636863 , "eeg": [111,111,111,111,111] }
```

__Performance Metrics:__
```javascript
{ "sid" : "ABCD-9999", "time" : 1489217636863 , "cog": [55,55,55,55,55,55] }
```

__Facial Expressions:__
```javascript
{ "sid"  : "ABCD-9999", "time" : 1489217636863 , "fac": [1, 0.341, 1, 0.444, 0.555, 1] }
```

__Mental Commands:__
```javascript
{ "sid" : "ABCD-9999", "time" : 1489217636863 , "com": ["moveR", 0.98] }
```

__Profile Training:__
```javascript
{ "sid"  : "ABCD-9999", "time" : 1489217636863 , "pro": ["moveR","complete"] }
```

__Contact Quality:__
```javascript
{ "sid"  : "ABCD-9999", "time" : 1489217636863 , "qua": [4, 1, 1, 1, 0, 1]
```

__Headset Device:__
```javascript
{ "sid"  : "ABCD-9999", "time" : 1489217636863 , "dev": [3, 4] }
```

### JS Client API


__Basic Usage:__
```javascript
var cortex = new Cortex({ host: 'localhost', port:8000, client:'myApp1', license:'myLic1'})
cortex.call('createSession'}).then(res => {/* do something */})
cortex.on('qua', msg => { /* do something with contact quality event*/} )
cortex.on('fac', msg => { /* do something with facial expression event*/ })
cortex.on('mot', msg => { /* do something with motion sensor event*/ })
cortex.on('eeg', msg => { /* do something with eeg data event*/ })

```
__Session Based:__
```javascript
var session = new Cortex({client:'myApp1', license:'myLic'}).newSession()
session.on(qua, msg => { /* do something with contact quality for this session */ })
session.on(eeg, msg => { /* do something with contact quality for this session */ })
session.call('injectMarker', { stop:12, label:'phase1'}) 
session.set({status:'closed'}) 
```
