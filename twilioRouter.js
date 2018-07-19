const Router = require('express').Router;
const router = new Router();
const twilio = require('twilio');
const fs = require('fs');
require('dotenv').config();


const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
//https://www.twilio.com/console/voice/twiml/apps  // brain2 app  ++ the line 54
const appSID = process.env.APP_SID;
const callerId = process.env.CALLER_ID;

const ClientCapability = require('twilio').jwt.ClientCapability;
const VoiceResponse = require('twilio').twiml.VoiceResponse;

function tokenGenerator() {
    const identity = 'Guest';
    const capability = new ClientCapability({
        accountSid,
        authToken,
    });

    capability.addScope(new ClientCapability.IncomingClientScope(identity));
    capability.addScope(new ClientCapability.OutgoingClientScope({
        applicationSid: appSID,
        clientName: identity,
    }));
    return {
        identity: identity,
        token: capability.toJwt(),
    };
};

router.get('/token', (req, res) => {
    res.send(tokenGenerator());
});

router.post('/voice', twilio.webhook({ validate: false }), function (req, res, next) {
    var twiml = new VoiceResponse();
    var dial = twiml.dial({
        callerId: callerId,
        record: 'record-from-answer',
        // record: 'record-from-ringing',
        //change that !!!!
        recordingStatusCallback: 'https://ec2-18-219-233-254.us-east-2.compute.amazonaws.com/getRecording',
    });
    dial.conference('My conference')
    res.send(twiml.toString());
});


const client = require('twilio')(accountSid, authToken);
router.post('/getRecording', (req, res) => {
    // console.log(req.body['RecordingDuration']);
    let recordingId = req.body.RecordingSid;

    const promise = client.api.v2010
        .accounts(accountSid)
        .recordings(recordingId)
        .fetch();
    promise.then(response => {
        // console.log(response);
        let regexp = /([^]*?).json/;
        console.log('date created: ' + response.dateCreated);
        console.log('date updated: ' + response.dateUpdated);

        //save the audio file
        https.get(regexp.exec('https://api.twilio.com' + response.uri)[1] + '.mp3', (res) => {
            let fileStream = fs.createWriteStream('record3.mp3');
            res.pipe(fileStream);
        });
    });
})

module.exports = router;