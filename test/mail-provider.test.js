'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const https = require('node:https');

test('ZeptoMail API sends PDF attachments using its documented JSON fields', async () => {
  process.env.ZEPTO_SEND_MAIL_TOKEN = 'synthetic-test-token';
  const { ZeptoApiProvider } = require('../mail-provider');
  const provider = new ZeptoApiProvider();
  const originalRequest = https.request;
  let requestOptions;
  let sentPayload;
  https.request = (options, callback) => {
    requestOptions = options;
    const req = new EventEmitter();
    req.write = (body) => { sentPayload = body; };
    req.end = () => {
      const response = new EventEmitter();
      response.statusCode = 201;
      setImmediate(() => {
        callback(response);
        response.emit('data', '{"data":[{"code":"messageid"}]}');
        response.emit('end');
      });
    };
    req.destroy = (error) => req.emit('error', error);
    return req;
  };
  try {
    const pdf = Buffer.from('%PDF-1.7 synthetic challan');
    const outcome = await provider.send({
      to: 'student@example.com', subject: 'ShipLens fee challan', text: 'Challan attached.',
      attachments: [{ filename: 'ShipLens-Challan-TEST.pdf', content: pdf, contentType: 'application/pdf' }],
    });
    assert.equal(outcome.sent, true);
    assert.equal(requestOptions.path, '/v1.1/email');
    const payload = JSON.parse(sentPayload);
    assert.deepEqual(payload.attachments, [{
      name: 'ShipLens-Challan-TEST.pdf', mime_type: 'application/pdf', content: pdf.toString('base64'),
    }]);
    assert.equal(payload.attachment, undefined);
    assert.equal(Buffer.from(payload.attachments[0].content, 'base64').toString(), pdf.toString());
  } finally {
    https.request = originalRequest;
    delete process.env.ZEPTO_SEND_MAIL_TOKEN;
  }
});
