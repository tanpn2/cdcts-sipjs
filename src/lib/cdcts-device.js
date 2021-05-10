import { UA, ReferClientContext } from 'sip.js';
import EventEmitter from 'es6-event-emitter';
import { CdctsCall } from './cdcts-call';

/**
* Represents the software phone running in a web browser or other context.
*
* @class
*/
class CdctsDevice extends EventEmitter {

  /**
  * Create a new CdctsDevice.
  *
  * @param {Object} config Configuration Object
  * @param {String} config.host The host name or IP address of the SIP server
  * @param {String} config.port The port of the SIP server
  * @param {String} config.wsServers URI(s) of the WebSocket Servers. Format `wss://123.0.0.0:5066`. An array of strings is also accepted.
  * @param {String} config.username The username for the SIP server
  * @param {String} config.password The passweord for the SIP server
  * @param {String} config.displayName The human readable name passed in the from field. Will be used for Caller ID
  * @param {String} config.stunServers URI(s) for how to connect to the STUN servers. Format `stun:stun.cdcts.com:8000`. An array of strings is also accepted.
  * @param {Object} config.turnServers Details for how to connect to the TURN servers. An array of objects is also accepted.
  * @param {String} config.turnServers.urls URI(s) for the TURN server(s). Format `turn:turn.cdcts.com:8000?transport=tcp`. An array of strings is also accepted.
  * @param {String} config.turnServers.username Username to authenticate on TURN server(s)
  * @param {String} config.turnServers.password Password to authenticate on TURN server(s)
  * @param {String} config.registrarServer URI for the registrar Server. Format `sip:123.0.0.0:5066`
  * @param {Boolean} config.traceSip If true, SIP traces will be logged to the dev console.
  * @param {String} config.logLevel One of "debug", "log", "warn", "error", "off".  default is "log"

  */
  constructor(config) {
    super();
    if (!config || typeof (config) !== 'object') { throw new TypeError("CdctsDevice: Missing config"); }
    if (!config.host) { throw new TypeError("CdctsDevice: Missing 'host' parameter"); }
    if (!config.port) { throw new TypeError("CdctsDevice: Missing 'port' parameter"); }

    this.config = config;

    this.host = config.host;
    this.port = config.port;
    this.uri = `sip:${config.username}@${config.host}`;
    this.path = config.path || '';
    this.wsServers = arrayify(config.wsServers);
    this.username = config.username;
    this.password = config.password;
    this.displayName = config.displayName || config.username;
    this.stunServers = arrayify(config.stunServers);
    this.turnServers = config.turnServers;
    this.registrarServer = config.registrarServer;

    this._userAgent = null;

    this._ensureConnectivityWithSipServer();

    // let uri = new SIP.URI("sip", this.username, this.host, this.port).toString();

    let sipUAConfig = {
      uri: `sip:${this.username}@${this.host}`,
      transportOptions: { wsServers: [`wss://${this.host}:${this.port}${this.path}`] },
      authorizationUsersip: this.username,
      password: this.password,
      displayName: this.displayName,
      // stunServers: this.stunServers,
      // turnServers: this.turnServers,
      // registrarServer: this.registrarServer
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        },
      }
    };
    if (config.traceSip) {
      sipUAConfig.traceSip = true;
    }
    if (config.logLevel) {
      if (config.logLevel === "off") {
        sipUAConfig.log = { builtinEnabled: false };
      } else {
        sipUAConfig.log = { level: config.logLevel };
      }
    }
    this._userAgent = new UA(sipUAConfig);

    /**
    * wsConnecting event
    *
    * Fired when the device attempts to connect to the WebSocket server.
    * If the connection drops, the device will try to reconnect and this event will fire again.
    *
    * @event CdctsDevice#wsConnecting
    * @type {object}
    * @property {number} attempts - the number of connection attempts that have been made
    */
    this._userAgent.on("connecting", (args) => { this.trigger("wsConnecting", { attempts: args.attempts }); });

    /**
    * wsConnected event
    *
    * Fired when the WebSocket connection has been established.
    *
    * @event CdctsDevice#wsConnected
    */
    this._userAgent.on("connected", () => { this.trigger("wsConnected"); });

    /**
    * wsDisconnected event
    *
    * Fried when the WebSocket connection attempt fails.
    *
    * @event CdctsDevice#wsDisconnected
    */
    this._userAgent.on("disconnected", () => { this.trigger("wsDisconnected"); });

    /**
    * registered event
    *
    * Fired when a the device has been successfully registered to recieve calls.
    *
    * @event CdctsDevice#registered
    */
    this._userAgent.on("registered", () => { this.trigger("registered"); });

    /**
    * unregistered event
    *
    * Fired as the result of a call to `unregister()` or if a periodic re-registration fails.
    *
    * @event CdctsDevice#unregistered
    * @type {object}
    * @property {object} cause - null if `unregister()` was called, otherwise see [SIPjs causes]{@link http://sipjs.com/api/0.15.0/causes/}
    * @property {object} response - The SIP message which caused the failure, if it exists.
    */
    this._userAgent.on("unregistered", (response, cause) => {
      this.trigger("unregistered", { cause: cause, response: response });
    });

    /**
    * registrationFailed event
    *
    * Fired when a registration attepmt fails.
    *
    * @event CdctsDevice#registrationFailed
    * @type {object}
    * @property {object} cause - see [SIPjs causes]{@link http://sipjs.com/api/0.15.0/causes/}
    * @property {object} response - The SIP message which caused the failure, if it exists.
    */
    this._userAgent.on("registrationFailed", (cause, response) => {
      this.trigger("registrationFailed", { cause: cause, response: response });
    });

    /**
    * incomingInvite event
    *
    * Fired when the device recieves an INVITE request
    * @event CdctsDevice#invite
    * @type {Session}
    */
    this._userAgent.on("invite", (session) => {
      this._activeCall = new CdctsCall(this._userAgent);
      this._activeCall.incomingCall(session);
      this.trigger("incomingInvite", { activeCall: this._activeCall });
      console.log("****session****", session)
    });

    /**
    * message event
    *
    * @event CdctsDevice#message
    * @type {object}
    * @property {object} message - Contains the SIP message sent and server context necessary to receive and send replies.
    */
    this._userAgent.on("message", (message) => { this.trigger("message", { message: message }); });

  }

  /**
  * Start the connection to the WebSocket server, and restore the previous state if stopped.
  * You need to start the WebSocket connection before you can send or recieve calls. If you
  * try to `initiateCall` without first starting the connection, it will be started for you,
  * but it will not be stopped when the call is terminated.
  */
  startWS() {
    this._userAgent.start();
  }

  /**
  * Stop the connection to the WebSocket server, saving the state so it can be restored later
  * (by `start`).
  */
  stopWS() {
    this._userAgent.stop();
  }

  /**
  * Status of the WebSocket connection
  *
  * @return {Boolean} isConnected `true` if the device is connected to the WebSocket server, `false` otherwise
  */
  isWSConnected() {
    return this._userAgent.isConnected();
  }

  /**
  * Register the device with the SIP server so that it can receive incoming calls.
  *
  * @param {Object} options
  * @param {String[]} options.extraHeaders SIP headers that will be added to each REGISTER request. Each header is string in the format `"X-Header-Name: Header-value"`.
  * @emits CdctsDevice#registered
  */
  register(options) {
    this._userAgent.register(options);
  }

  /**
  * Unregister the device from the SIP server; it will no longer recieve incoming calls.
  *
  * @param {Object} options
  * @param {Boolean} options.all [Optional] - if set & `true` it will unregister *all* bindings for the SIP user.
  * @param {String[]} options.extraHeaders SIP headers that will be added to each REGISTER request. Each header is string in the format `"X-Header-Name: Header-value"`.
  * @emits CdctsDevice#unregistered
  */
  unregister(options) {
    this._userAgent.register(options);
  }

  /**
  * Status of SIP registration
  *
  * @return {Boolean} isRegistered `true` if the device is registered with the SIP Server, `false` otherwise
  */
  isRegistered() {
    return this._userAgent.isRegistered();
  }

  /**
  * Make a phone call
  *
  * @param {String} phoneNumber The desination phone number to connect to. Just digits, no punctuation. Example `"12065551111"`.
  * @return {CdctsCall} activeCall Keep an eye on the call's state by listening to events emitted by activeCall
  */
  initiateCall(phoneNumber) {
    // let uri = new SIP.URI("sip", phoneNumber, this.host, this.port).toString();
    this._activeCall = new CdctsCall(this._userAgent);
    console.log("_activeCall", phoneNumber, this._activeCall)
    this._activeCall.makeCall(phoneNumber)
    return this._activeCall;
  }
  /**
  * Answer phone call
  *
  * @return {CdctsCall} activeCall Keep an eye on the call's state by listening to events emitted by activeCall
  */
  accept() {
    this._activeCall._session.accept()
    this._activeCall._session.on('trackAdded', function () {
      var pc = this.sessionDescriptionHandler.peerConnection;
      // var this.audioElement = this.audioElement;
      var player = document.getElementsByClassName("cdcts-sipjs-remote-audio")[0];
      console.log("player", player)
      // this.audioElement.className = 'cdcts-sipjs-remote-audio';
      var remoteStream = new MediaStream();
      pc.getReceivers().forEach(function (receiver) {
        remoteStream.addTrack(receiver.track);
      });
      if (typeof player.srcObject !== 'undefined') {
        player.srcObject = remoteStream;
      } else if (typeof player.mozSrcObject !== 'undefined') {
        player.mozSrcObject = remoteStream;
      } else if (typeof player.src !== 'undefined') {
        player.src = URL.createObjectURL(remoteStream);
      } else {
        console.log('Error attaching stream to element.');
      }
      player.play();
      return this._activeCall;
    })
  }
  /**
  * Get a reference to the call currently in progress
  *
  * @return {CdctsCall} activeCall Keep an eye on the call's state by listening to events emitted by activeCall
  */
  activeCall() { return this._activeCall; }

  /**
   * Refer
   * @param {String} phoneNumber The phonenumber can to refer
   */
  referNumber(phoneNumber) {
    console.log("this",this)
    this._refer = new ReferClientContext(UA, this, phoneNumber)
    this._refer.refer()
    return _refer
  }
  // Ensure that we can connect to the SIP server.
  // Due to a bug in chrome, we need to open an http connection to the SIP server
  // before trying to connect via Web Socket.
  //
  //  https://bugs.chromium.org/p/chromium/issues/detail?id=329884
  _ensureConnectivityWithSipServer() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.addEventListener("error", () => {
        console.info("Failed http connection to SIP server is expected. It is related to a chrome bug.");
      });
      xhr.open("GET", `https://${this.host}:${this.port}`, true);
      xhr.send();
    } catch (e) {
      // do nothing. If an error occurs, it's not going to matter here.
    }
  }
}

function arrayify(item) {
  if (Array.isArray(item)) {
    return item.slice(0); // Shallow Copy
  } else {
    let arr = [];
    arr.push(item);
    return arr;
  }
}


export { CdctsDevice };
