import EventEmitter from 'es6-event-emitter';

export class CdctsCall extends EventEmitter {

  /**
  * Create a CdctsCall. Normally created by CdctsDevice.
  *
  * Once a call is created, you can either make a call with `makeCall()`
  * or set yourself up to recieve an incoming call with `incomingCall()`
  *
  * @param {UA} UA - A SIP.js User Agent
  * @param {String} inviteUri - A Properly formatted SIP.js invite URI (create with SIP.URI)
  *
  * @emits CdctsCall#connecting
  */
  constructor(UA) {
    super();
    this._mute = false;
    this._status = 'starting';
    this._callType = '';
    this.UA = UA;
    this._docBody = document.getElementsByTagName('body')[0];
    this.audioElement = false;

    this.UA.start();

  }

  /**
  * Make a call to a phone number
  *
  * @param {URI} inviteUri - A SIP.js URI that includes the phone number to connect to
  */
  makeCall(inviteUri) {
    this._callType = 'outgoing';
    this._session = this.UA.invite(inviteUri, this._getAudioElement());
    this._attatchSessionEvents(this._session);
  }

  /**
  * Set up to handle an incoming call.
  * The calling function will then be able to accept or reject the call.
  *
  * @param {Session} session - A SIP.js Session, specifically of the SIP.ServerContext type
  */
  incomingCall(session) {
    this._callType = 'incoming';
    this._session = session;
    this._attatchSessionEvents();
  }


  _getAudioElement() {
    if (!this.audioElement) {
      this.audioElement = document.createElement('audio');
      this.audioElement.className = 'cdcts-sipjs-remote-audio';
      this._docBody.appendChild(this.audioElement);
    }
    return this.audioElement;
  }

  _attatchSessionEvents(session) {
    /**
    * connecting event:
    *
    * Fired as the system starts to make the connection.
    * This is after the userMedia (microphone) has been aquired.
    *
    * @event CdctsCall#connecting
    * @type {object}
    */
    this._session.on("connecting", () => { this.trigger("connecting"); this._status = 'initiating'; });

    /**
    * progress event:
    *
    * Usually fired twice during call intialization, once for TRYING and once for RINGING.
    *
    * @event CdctsCall#progress
    * @type {object}
    * @property {object} response - Details of the response
    */
    this._session.on("progress", (response) => {
      if (response.statusCode == 183 && response.body && this._session.hasOffer && !this._session.dialog) {
        if (!response.hasHeader('require') || response.getHeader('require').indexOf('100rel') === -1) {
          if (this._session.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
            // @hack: https://github.com/onsip/SIP.js/issues/242
            this._session.status = SIP.Session.C.STATUS_EARLY_MEDIA
            this._waitingForApplyingAnswer(session, response)
          }
        }
      }
      this.trigger("progress", response)
    });

    /**
    * accepted event:
    *
    * Fired when the call was accepted by the callee. The call is now connected.
    *
    * @event CdctsCall#accepted
    * @type {object}
    * @property {object} data - Details of the response
    */
    this._session.on("accepted", (data) => { this.trigger("accepted", data), this._status = 'connected'; });

    /**
    * dtmf event:
    *
    * Sent when the user has successfully sent a DTMF (keypad) signal.
    *
    * @event CdctsCall#dtmf
    * @type {object}
    * @property {object} request - Details of the request
    * @property {string} dtmf - the key(s) that were submitted
    */
    this._session.on("dtmf", (request, dtmf) => this.trigger("dtmf", request, dtmf));

    /**
    * muted event:
    *
    * Fired when the system has successfully responded to a mute request.
    *
    * @event CdctsCall#muted
    * @type {object}
    * @property {object} data - Details of the response
    */
    this._session.on("muted", (data) => this.trigger("muted", data));

    /**
    * unmuted event
    *
    * Fired when the system has successfully responded to an unmute request.
    *
    * @event CdctsCall#unmuted
    * @type {object}
    * @property {object} data - Details of the response
    */
    this._session.on("unmuted", (data) => this.trigger("unmuted", data));

    /**
    * cancel event:
    *
    * Fired when the call was terminated before end to end connection was established,
    * usually by the user's request.
    *
    * @event CdctsCall#cancel
    */
    this._session.on("cancel", () => { this.trigger("cancel"); this._status = 'ended' });

    /**
    * refer event
    *
    * @event CdctsCall#refer
    * @property {function} callback
    * @property {object} response
    * @property {object} newSession
    */
    this._session.on("refer", (callback, response, newSession) => { this.trigger("rejected"); });

    /**
    * replaced event
    *
    * @event CdctsCall#replaced
    * @property {object} newSession
    */
    this._session.on("replaced", (newSession) => { this.trigger("rejected", newSession); });

    /**
    * rejected event
    *
    * @event CdctsCall#rejected
    * @property {object} response
    * @property {object} cause
    */
    this._session.on("rejected", (response, cause) => { this.trigger("rejected", response, cause); this._status = 'ended' });

    /**
    * failed event
    *
    * @event CdctsCall#failed
    * @property {object} response
    * @property {object} cause
    */
    this._session.on("failed", (response, cause) => { this.trigger("failed", response, cause); this._status = 'ended' });

    /**
    * terminated event
    *
    * @event CdctsCall#terminated
    * @property {object} response
    * @property {object} cause
    */
    this._session.on("terminated", (message, cause) => { this.trigger("terminated", message, cause); this._status = 'ended'; });

    /**
    * bye event
    *
    * @event CdctsCall#bye
    */
    this._session.on("bye", () => { this.trigger("bye"); this._status = 'ended' });

    /**
    * userMediaRequest event:
    *
    * Fired when the every time the system checks to see if it has microphone permission from the user.
    * You can use this to detect when the browser's "Allow website to use microphone" dialog is open,
    * but you will need to be somewhat careful. This event will fire even if the user already has
    * given permission, then will be immediately followed by a {@link CdctsCall#userMedia} event.
    * If you wish to have your UI display some sort of "asking for permission" element, you may need to
    * debounce this event; listening for {@link CdctsCall#userMedia} to cancel your UI update.
    *
    * @event CdctsCall#userMediaRequest
    * @property {object} constraints
    */
    this._session.on('trackAdded', function () {
      if (session) {
        var pc = session.sessionDescriptionHandler.peerConnection;
        // var this.audioElement = this.audioElement;
        // this.audioElement.className = 'cdcts-sipjs-remote-audio';
        var remoteStream = new MediaStream();
        pc.getReceivers().forEach(function (receiver) {
          remoteStream.addTrack(receiver.track);
        });
        if (typeof session.passedOptions.srcObject !== 'undefined') {
          session.passedOptions.srcObject = remoteStream;
        } else if (typeof session.passedOptions.mozSrcObject !== 'undefined') {
          session.passedOptions.mozSrcObject = remoteStream;
        } else if (typeof session.passedOptions.src !== 'undefined') {
          session.passedOptions.src = URL.createObjectURL(remoteStream);
        } else {
          console.log('Error attaching stream to element.');
        }
        session.passedOptions.play();
      }
    });
    // this._session.mediaHandler.on("userMediaRequest", (constraints) => {this.trigger("userMediaRequest", constraints);});

    // /**
    // * userMedia event:
    // *
    // * Fired when the system has aquired permission to use the microphone. This will happen either
    // * immediately after {@link CdctsCall#userMediaRequest} if the user has previously given permission
    // * or after the user approves the request.
    // *
    // * @event CdctsCall#userMedia
    // * @property {object} stream
    // */
    // this._session.mediaHandler.on("userMedia", (stream) => {this.trigger("userMedia", stream);});

    // /**
    // * userMediaFailed event:
    // *
    // * Fired when the user refuses permission to use the microphone. There is no way back from this
    // * except for the user to go into browser settings and remove the exception for your site.
    // *
    // * @event CdctsCall#userMediaFailed
    // * @property {object} error
    // */
    // this._session.mediaHandler.on("userMediaFailed", (error) => {this.trigger("userMediaFailed", error);});

    // /**
    // * iceGathering event
    // *
    // * @event CdctsCall#iceGathering
    // */
    // this._session.mediaHandler.on("iceGathering", () => {this.trigger("iceGathering");});

    // /**
    // * iceCandidate event
    // *
    // * @event CdctsCall#iceCandidate
    // * @property {object} candidate
    // */
    // this._session.mediaHandler.on("iceCandidate", (candidate) => {this.trigger("iceCandidate", candidate);});

    // /**
    // * iceGatheringComplete event
    // *
    // * @event CdctsCall#iceGatheringComplete
    // */
    // this._session.mediaHandler.on("iceGatheringComplete", () => {this.trigger("iceGatheringComplete");});

    // /**
    // * iceConnection event
    // *
    // * @event CdctsCall#iceConnection
    // */
    // this._session.mediaHandler.on("iceConnection", () => {this.trigger("iceConnection");});

    // /**
    // * iceConnectionChecking event
    // *
    // * @event CdctsCall#iceConnectionChecking
    // */
    // this._session.mediaHandler.on("iceConnectionChecking", () => {this.trigger("iceConnectionChecking");});

    // /**
    // * iceConnectionConnected event
    // *
    // * @event CdctsCall#iceConnectionConnected
    // */
    // this._session.mediaHandler.on("iceConnectionConnected", () => {this.trigger("iceConnectionConnected");});

    // /**
    // * iceConnectionCompleted event
    // *
    // * @event CdctsCall#iceConnectionCompleted
    // */
    // this._session.mediaHandler.on("iceConnectionCompleted", () => {this.trigger("iceConnectionCompleted");});

    // /**
    // * iceConnectionFailed event
    // *
    // * @event CdctsCall#iceConnectionFailed
    // */
    // this._session.mediaHandler.on("iceConnectionFailed", () => {this.trigger("iceConnectionFailed");});

    // /**
    // * iceConnectionDisconnected event
    // *
    // * @event CdctsCall#iceConnectionDisconnected
    // */
    // this._session.mediaHandler.on("iceConnectionDisconnected", () => {this.trigger("iceConnectionDisconnected");});

    // /**
    // * iceConnectionClosed event
    // *
    // * @event CdctsCall#iceConnectionClosed
    // */
    // this._session.mediaHandler.on("iceConnectionClosed", () => {this.trigger("iceConnectionClosed");});

    // /**
    // * getDescription event
    // *
    // * @event CdctsCall#getDescription
    // * @property {object} sdpWrapper
    // */
    // this._session.mediaHandler.on("getDescription", (sdpWrapper) => {this.trigger("getDescription", sdpWrapper);});

    // /**
    // * setDescription event
    // *
    // * @event CdctsCall#setDescription
    // * @property {object} sdpWrapper
    // */
    // this._session.mediaHandler.on("setDescription", (sdpWrapper) => {this.trigger("setDescription", sdpWrapper);});

    // /**
    // * dataChannel event
    // *
    // * @event CdctsCall#dataChannel
    // * @property {object} dataChannel
    // */
    // this._session.mediaHandler.on("dataChannel", (dataChannel) => {this.trigger("dataChannel", dataChannel);});

    // /**
    // * addStream event
    // *
    // * @event CdctsCall#addStream
    // * @property {object} stream
    // */
    // this._session.mediaHandler.on("addStream", (stream) => {this.trigger("addStream", stream);});

  }

  /**
   * Accept an incoming call.
   * When a call is received `CdctsDevice` will create a new `CdctsCall` for the session
   * and emit a `incomingInvite` event.
   * The new `CdctsCall` is passed along with the event. Call `accept()` to accept the call.
   */
  answer() {
    if (this._callType !== 'incoming') {
      console.error("accept() method is only valid on incoming calls");
      return;
    }

    this._session.accept({
      media: {
        constraints: { audio: true, video: false },
        render: { remote: this._getAudioElement() }
      },
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        },
        render: { remote: this._getAudioElement() }
      }

    });
    console.log("accept", this)
    this._attatchSessionEvents(this);
  }

  /**
   * Reject an incoming call.
   * When a call is received `CdctsDevice` will create a new `CdctsCall` for the session
   * and emit a `incomingInvite` event.
   * The new `CdctsCall` is passed along with the event. Call `reject()` to reject the call.
   */
  reject() {
    if (this._callType !== 'incoming') {
      console.error("reject() method is only valid on incoming calls");
      return;
    }
    this._session.reject();
  }

  /**
   * The request object contains metadata about the current session,
   * including the who the call is going `to` and in the case of incoming calls,
   * who the call is coming `from`.
   *
   * @return {object} request
   */
  get request() {
    if (!this._session) {
      return false;
    }

    if (this._callType === 'incoming') {
      return this._session.transaction.request;
    } else if (this._callType === 'outgoing') {
      return this._session.request;
    } else {
      return false;
    }
  }

  /**
  * Is the call still initiating?
  *
  * @return {Boolean} isInitiating
  */
  isInitiating() {
    return this._status === 'initiating';
  }

  /**
  * Has the call connected?
  *
  * @return {Boolean} isConnected
  */
  isConnected() {
    return this._status === 'connected';
  }

  /**
  * Has the call ended?
  *
  * @return {Boolean} isEnded
  */
  isEnded() {
    return this._status === 'ended';
  }

  /**
  * Is this an incoming call?
  *
  * @return {Boolean} isIncoming
  */
  isIncoming() {
    return this._callType === 'incoming';
  }

  /**
  * Is this an outgoing call?
  *
  * @return {Boolean} isOutgoing
  */
  isOutgoing() {
    return this._callType === 'outgoing';
  }

  /**
  * End the session
  *
  * @emits CdctsCall#terminated
  */
  terminate() {
    this._session.terminate();
  }

  /**
  * Shutdown the connection to the WebRTC servers
  * @deprecated Please use CdctsDevice.stopWS instead.
  */
  shutdown() {
    this.UA.stop();
  }

  /**
  * Toggle mute
  *
  * @param {boolean} isMute - if true you want mute to be ON
  */
  mute(isMute /*bool*/) {
    this._mute = isMute;
    console.log("this._session",this._session)
    if (this._mute) {
      this._session.mute();
    } else {
      this._session.unmute();
    }
  }

  /**
  * Toggle hold
  *
  * @param {boolean} isHold - if true you want mute to be ON
  */
  hold(isHold /*bool*/) {
    if (isHold) {
      this._session.hold();
    } else {
      this._session.unhold();
    }
  }

  /**
  * Current mute state
  *
  * @return {boolean} true if call is on mute
  */
  isMuted() {
    return this._mute;
  }

  /**
  * Send phone keypad presses (DTMF tones)
  *
  * Used after the call is in progress.
  *
  * @param {string} digits - a string containg digits 0-9, *, #
  * @emits CdctsCall#dtmf
  */
  sendDigits(digits) {
    this._session.dtmf(digits);
  }

  /**
  * Send phone keypad presses (DTMF tones)
  *
  * Used after the call is in progress.
  *
  * @param {string} digits - a string containg digits 0-9, *, #
  * @emits CdctsCall#dtmf
  */
  refer(digits) {
    this._session.refer(digits);
  }

  /**
  * The "simple" status.
  *
  * All of the many phases of the call boiled down into 3 states: Initiating, Connected and Ended.
  *
  * @return {string} one of initiating, connected, ended
  */
  status() {
    return this._status;
  }

  _waitingForApplyingAnswer(session, response) {
    let i = 1,
      clearTimer

    setTimeout(function check() {
      i++
      clearTimer = setTimeout(check, 10)
      if (session && session.hasAnswer || i > 14) {
        if (session.hasAnswer) {
          clearTimeout(clearTimer)
        } else if (i === 15) {
          clearTimeout(clearTimer)
          session.sessionDescriptionHandler.setDescription(response.body).catch((error) => {
            session.logger.warn(error)
            session.failed(response, C.causes.BAD_MEDIA_DESCRIPTION)
            session.terminate({ statusCode: 488, reason_phrase: 'Bad Media Description' })
          })
        }
      }
    }, 10)
  }

}
