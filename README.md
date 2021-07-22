# cdcts WebRTC SIP JavaScript library

![npm (scoped)](https://img.shields.io/npm/v/cdcts-sipjs)

The cdcts SIP-based WebRTC JS library powers up your web application with the ability to make and receive phone calls directly in the browser.

Check out the library in action in [this web dialer demo](https://webrtc.cdcts.com/).

_Looking for more WebRTC features, JSON-RPC support or need to quickly get spun up with a React app? cdcts also has a robust [WebRTC SDK](https://github.com/team-cdcts/webrtc) available as a separate npm module._

## Installation

Install this package with [npm](https://www.npmjs.com/):

```shell
$ npm install --save cdcts-sipjs
```

or using [yarn](https://yarnpkg.com/lang/en/):

```shell
$ yarn add cdcts-sipjs
```

## Usage

Import [CdctsDevice](https://github.com/team-cdcts/cdcts-sipjs/docs/CdctsDevice.md) in the module where you need it.

```javascript
import { CdctsDevice } from 'cdcts-sipjs';
```

### Example config and initiation

```javascript
let config = {
  host: 'sip.cdcts.com',
  port: '7443',
  wsServers: 'wss://sip.cdcts.com:7443',
  displayName: 'Phone User',
  username: 'testuser',
  password: 'testuserPassword',
  stunServers: 'stun:stun.cdcts.com:3478',
  turnServers: {
    urls: ['turn:turn.cdcts.com:3478?transport=tcp'],
    username: 'turnuser',
    password: 'turnpassword',
  },
  registrarServer: 'sip:sip.cdcts.com:7443',
};

let device = new CdctsDevice(config);
```

### Example phone call

```javascript
let activeCall = device.initiateCall('1235556789');

activeCall.on('connecting', () => {
  console.log("it's connecting!");
});
activeCall.on('accepted', () => {
  console.log("We're on a phone call!");
});
```

See the [CdctsDevice](https://github.com/team-cdcts/cdcts-sipjs/docs/CdctsDevice.md) and [cdctsCall](https://github.com/team-cdcts/cdcts-sipjs/docs/cdctsCall.md) for more details.

## Development

### Building the package

When working on the package directly, please use [yarn](https://github.com/yarnpkg/yarn) instead of npm.

```shell
$ yarn build
# Or to watch for changes to files:
$ yarn start
```

### Running tests

```shell
$ yarn test
```

### Generating Docs

We use [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown) to generate GitHub friendly docs.

```shell
$ yarn docs
```
