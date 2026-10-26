// CRA's Jest environment predates the TextEncoder browser global used by React Router 7.
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
