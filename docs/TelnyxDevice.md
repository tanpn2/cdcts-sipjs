<a name="CdctsDevice"></a>

## CdctsDevice
Represents the software phone running in a web browser or other context.

**Kind**: global class  

* [CdctsDevice](#CdctsDevice)
    * [new CdctsDevice(config)](#new_CdctsDevice_new)
    * [.startWS()](#CdctsDevice+startWS)
    * [.stopWS()](#CdctsDevice+stopWS)
    * [.isWSConnected()](#CdctsDevice+isWSConnected) ⇒ <code>Boolean</code>
    * [.register(options)](#CdctsDevice+register)
    * [.unregister(options)](#CdctsDevice+unregister)
    * [.isRegistered()](#CdctsDevice+isRegistered) ⇒ <code>Boolean</code>
    * [.initiateCall(phoneNumber)](#CdctsDevice+initiateCall) ⇒ <code>cdctsCall</code>
    * [.activeCall()](#CdctsDevice+activeCall) ⇒ <code>cdctsCall</code>
    * ["wsConnecting"](#CdctsDevice+event_wsConnecting)
    * ["wsConnected"](#CdctsDevice+event_wsConnected)
    * ["wsDisconnected"](#CdctsDevice+event_wsDisconnected)
    * ["registered"](#CdctsDevice+event_registered)
    * ["unregistered"](#CdctsDevice+event_unregistered)
    * ["registrationFailed"](#CdctsDevice+event_registrationFailed)
    * ["invite"](#CdctsDevice+event_invite)
    * ["message"](#CdctsDevice+event_message)

<a name="new_CdctsDevice_new"></a>

### new CdctsDevice(config)
Create a new CdctsDevice.


| Param | Type | Description |
| --- | --- | --- |
| config | <code>Object</code> | Configuration Object |
| config.host | <code>String</code> | The host name or IP address of the SIP server |
| config.port | <code>String</code> | The port of the SIP server |
| config.wsServers | <code>String</code> | URI(s) of the WebSocket Servers. Format `wss://123.0.0.0:5066`. An array of strings is also accepted. |
| config.username | <code>String</code> | The username for the SIP server |
| config.password | <code>String</code> | The passweord for the SIP server |
| config.displayName | <code>String</code> | The human readable name passed in the from field. Will be used for Caller ID |
| config.stunServers | <code>String</code> | URI(s) for how to connect to the STUN servers. Format `stun:stun.cdcts.com:8000`. An array of strings is also accepted. |
| config.turnServers | <code>Object</code> | Details for how to connect to the TURN servers. An array of objects is also accepted. |
| config.turnServers.urls | <code>String</code> | URI(s) for the TURN server(s). Format `turn:turn.cdcts.com:8000?transport=tcp`. An array of strings is also accepted. |
| config.turnServers.username | <code>String</code> | Username to authenticate on TURN server(s) |
| config.turnServers.password | <code>String</code> | Password to authenticate on TURN server(s) |
| config.registrarServer | <code>String</code> | URI for the registrar Server. Format `sip:123.0.0.0:5066` |
| config.traceSip | <code>Boolean</code> | If true, SIP traces will be logged to the dev console. |
| config.logLevel | <code>String</code> | One of "debug", "log", "warn", "error", "off".  default is "log" |

<a name="CdctsDevice+startWS"></a>

### CdctsDevice.startWS()
Start the connection to the WebSocket server, and restore the previous state if stopped.
You need to start the WebSocket connection before you can send or recieve calls. If you
try to `initiateCall` without first starting the connection, it will be started for you,
but it will not be stopped when the call is terminated.

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
<a name="CdctsDevice+stopWS"></a>

### CdctsDevice.stopWS()
Stop the connection to the WebSocket server, saving the state so it can be restored later
(by `start`).

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
<a name="CdctsDevice+isWSConnected"></a>

### CdctsDevice.isWSConnected() ⇒ <code>Boolean</code>
Status of the WebSocket connection

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
**Returns**: <code>Boolean</code> - isConnected `true` if the device is connected to the WebSocket server, `false` otherwise  
<a name="CdctsDevice+register"></a>

### CdctsDevice.register(options)
Register the device with the SIP server so that it can receive incoming calls.

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
**Emits**: <code>[registered](#CdctsDevice+event_registered)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.extraHeaders | <code>Array.&lt;String&gt;</code> | SIP headers that will be added to each REGISTER request. Each header is string in the format `"X-Header-Name: Header-value"`. |

<a name="CdctsDevice+unregister"></a>

### CdctsDevice.unregister(options)
Unregister the device from the SIP server; it will no longer recieve incoming calls.

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
**Emits**: <code>[unregistered](#CdctsDevice+event_unregistered)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.all | <code>Boolean</code> | [Optional] - if set & `true` it will unregister *all* bindings for the SIP user. |
| options.extraHeaders | <code>Array.&lt;String&gt;</code> | SIP headers that will be added to each REGISTER request. Each header is string in the format `"X-Header-Name: Header-value"`. |

<a name="CdctsDevice+isRegistered"></a>

### CdctsDevice.isRegistered() ⇒ <code>Boolean</code>
Status of SIP registration

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
**Returns**: <code>Boolean</code> - isRegistered `true` if the device is registered with the SIP Server, `false` otherwise  
<a name="CdctsDevice+initiateCall"></a>

### CdctsDevice.initiateCall(phoneNumber) ⇒ <code>cdctsCall</code>
Make a phone call

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
**Returns**: <code>cdctsCall</code> - activeCall Keep an eye on the call's state by listening to events emitted by activeCall  

| Param | Type | Description |
| --- | --- | --- |
| phoneNumber | <code>String</code> | The desination phone number to connect to. Just digits, no punctuation. Example `"12065551111"`. |

<a name="CdctsDevice+activeCall"></a>

### CdctsDevice.activeCall() ⇒ <code>cdctsCall</code>
Get a reference to the call currently in progress

**Kind**: instance method of <code>[CdctsDevice](#CdctsDevice)</code>  
**Returns**: <code>cdctsCall</code> - activeCall Keep an eye on the call's state by listening to events emitted by activeCall  
<a name="CdctsDevice+event_wsConnecting"></a>

### "wsConnecting"
wsConnecting event

Fired when the device attempts to connect to the WebSocket server.
If the connection drops, the device will try to reconnect and this event will fire again.

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| attempts | <code>number</code> | the number of connection attempts that have been made |

<a name="CdctsDevice+event_wsConnected"></a>

### "wsConnected"
wsConnected event

Fired when the WebSocket connection has been established.

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
<a name="CdctsDevice+event_wsDisconnected"></a>

### "wsDisconnected"
wsDisconnected event

Fried when the WebSocket connection attempt fails.

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
<a name="CdctsDevice+event_registered"></a>

### "registered"
registered event

Fired when a the device has been successfully registered to recieve calls.

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
<a name="CdctsDevice+event_unregistered"></a>

### "unregistered"
unregistered event

Fired as the result of a call to `unregister()` or if a periodic re-registration fails.

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cause | <code>object</code> | null if `unregister()` was called, otherwise see [SIPjs causes](http://sipjs.com/api/0.7.0/causes/) |
| response | <code>object</code> | The SIP message which caused the failure, if it exists. |

<a name="CdctsDevice+event_registrationFailed"></a>

### "registrationFailed"
registrationFailed event

Fired when a registration attepmt fails.

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cause | <code>object</code> | see [SIPjs causes](http://sipjs.com/api/0.7.0/causes/) |
| response | <code>object</code> | The SIP message which caused the failure, if it exists. |

<a name="CdctsDevice+event_invite"></a>

### "invite"
incomingInvite event

Fired when the device recieves an INVITE request

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
<a name="CdctsDevice+event_message"></a>

### "message"
message event

**Kind**: event emitted by <code>[CdctsDevice](#CdctsDevice)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | Contains the SIP message sent and server context necessary to receive and send replies. |

