// Imports
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as algoliasearch from 'algoliasearch';
import * as cryptoString from 'crypto-random-string';
import * as twilio from 'twilio';
import { isUndefined, isNullOrUndefined } from 'util';
import * as crypto from 'crypto';

// initalizations
admin.initializeApp();
const env = functions.config();

// tslint:disable-next-line: prefer-const
let arr: any[] = [];

// Initialize the Algolia Client
const client = algoliasearch(env.algolia.appid, env.algolia.apikey);
const index = client.initIndex('prod_PRODUCTS');

// CORS
const cors = require('cors')({ origin: true });

// Sendgrid Mail Setup
//const SENDGRID_API_TESTKEY = env.sendgrid.key_test;
const SENDGRID_API_KEY = env.sendgrid.key;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

// Sendgrid Web Api Setup
const sgClient = require('@sendgrid/client');
sgClient.setApiKey(SENDGRID_API_KEY);

// Twilio Init
const twClient = twilio(env.twilio.sid, env.twilio.token);

exports.orderCancellation = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                let shipping = 0;

                if (!isNullOrUndefined(req.body.shippingCost)) {
                    shipping = req.body.shippingCost;
                }

                console.log(`Order Cancellation Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-e044c539f9fc44e893c7b0de43757da2',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping,
                        total: req.body.total,
                        assetURL: req.body.assetURL,
                        link: '',
                        cancellationNote: req.body.cancellationNote
                    }
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to buyer`);
                }).catch((err: any) => {
                    console.error(`Could send email to buyer: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending buyer email`);
        });

        admin.firestore().collection(`users`).doc(`${req.body.sellerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.price * 0.095;
                const processing = req.body.price * 0.03;
                const payout = req.body.price - fee - processing;

                console.log(`Order Cancellation Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-3a33db14afc544b2b6507d6be937cff3',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        assetURL: req.body.assetURL,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        cancellationNote: req.body.cancellationNote
                    }
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to seller`);
                }).catch((err: any) => {
                    console.error(`Could send email to seller: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending seller email`);
        })

        return res.status(200);
    });
});

exports.sendShippingLabel = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        return admin.firestore().collection(`users`).doc(`${req.body.sellerID}`).get().then(response => {
            const data = response.data();

            if (data) {
                //const email = data.email;
                const email = data.email;
                const fee = req.body.price * 0.095;
                const processing = req.body.price * 0.03;
                const payout = req.body.price - fee - processing;

                console.log(`sendShippingLabel email to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-0215a6c29937473ea4b204b3d94fe073',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        assetURL: req.body.assetURL,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        price: req.body.price,
                        label: req.body.shipTracking.label
                    }
                }

                return sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to seller`);
                    return res.status(200).send();
                }).catch((err: any) => {
                    console.error(`Could send email to seller: ${err}`);
                    return res.status(500).send();
                })
            } else {
                console.error(`seller don't exist`);
                return res.status(500).send();
            }
        }).catch(err => {
            console.error(`error sending seller email`);
            return res.status(500).send();
        });
    });
});

exports.offerAcceptedReminder = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        return admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const total = req.body.price + req.body.shippingCost;
                const transactionID = `${req.body.buyerID}-${req.body.sellerID}-${req.body.soldAt}`;

                console.log(`Order Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-1470cf9fcbd74918b5ce0c78db3005d2',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.assetURL,
                        link: `https://nxtdrop.com/checkout?tID=${transactionID}`
                    }
                }

                return sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to buyer`);
                    return res.status(200);
                }).catch((err: any) => {
                    console.error(`Could send email to buyer: ${err}`);
                    return res.status(500);
                })
            } else {
                console.error(`buyer don't exist`);
                return res.status(500);
            }
        }).catch(err => {
            console.error(`error sending buyer email`);
            return res.status(500);
        });
    });
});

exports.orderDelivered = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        return admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();

            if (data) {
                //const email = data.email;
                const email = data.email;
                const total = req.body.price + req.body.shippingCost;

                console.log(`orderDelivered Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    bcc: { email: 'nxtdrop.com+e17f9774a6@invite.trustpilot.com' },
                    templateId: 'd-2544c5b2779547ee9d5915e0c111e3f6',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.assetURL
                    }
                }

                return sgMail.send(msg).then((content: any) => {
                    console.log(`email sent`);
                    return res.status(200);
                }).catch((err: any) => {
                    console.error(`Could send email to: ${err}`);
                    return res.status(500);
                })
            } else {
                console.error(`buyer don't exist`);
                return res.status(500);
            }
        }).catch(err => {
            console.error(`error sending email`);
            return res.status(500);
        });
    });
});

exports.verifiedShipped = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();
            let trackingURL;

            switch (req.body.shipTracking.carrier) {
                case 'UPS':
                    trackingURL = `http://theupsstore.ca/track/${req.body.shipTracking.trackingID}`;
                    break;
                case 'Canada Post':
                    trackingURL = `https://www.canadapost.ca/trackweb/en#/details/${req.body.shipTracking.trackingID}`;
                    break;
                default:
                    break;
            }

            if (data) {
                //const email = data.email;
                const email = data.email;
                const total = req.body.price + req.body.shippingCost;

                console.log(`VerifiedShipped Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-80bb3123058f4d39b130b8e54510fd54',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.assetURL,
                        trackingURL: trackingURL
                    }
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to buyer`);
                }).catch((err: any) => {
                    console.error(`Could send email to buyer: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending buyer email`);
        });

        admin.firestore().collection(`users`).doc(`${req.body.sellerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.price * 0.095;
                const processing = req.body.price * 0.03;
                const payout = req.body.price - fee - processing;

                console.log(`VerifiedShipped Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    bcc: { email: 'nxtdrop.com+e17f9774a6@invite.trustpilot.com' },
                    templateId: 'd-41bb9f19ad2344f8b585ce6c1948a820',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        assetURL: req.body.assetURL,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        price: req.body.price
                    }
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to seller`);
                }).catch((err: any) => {
                    console.error(`Could send email to seller: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending seller email`);
        })

        return res.status(200);
    });
});

exports.verifiedFailed = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();

            if (data) {
                //const email = data.email;
                const email = data.email;
                const total = req.body.price + req.body.shippingCost;

                console.log(`VerifiedFailed Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-ab08e34c230b4e8b8370ff5090810bfa',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.assetURL,
                    }
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to buyer`);
                }).catch((err: any) => {
                    console.error(`Could send email to buyer: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending buyer email`);
        });

        admin.firestore().collection(`users`).doc(`${req.body.sellerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.price * 0.095;
                const processing = req.body.price * 0.03;
                const payout = req.body.price - fee - processing;

                console.log(`VerifiedFailed Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-83cd9d7140b34bc7ae3bb1c5781c2315',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        assetURL: req.body.assetURL,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        price: req.body.price
                    }
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to seller`);
                }).catch((err: any) => {
                    console.error(`Could send email to seller: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending seller email`);
        })

        return res.status(200);
    });
});

exports.orderConfirmation = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const total = req.body.price + req.body.shippingCost;

                console.log(`Order Email Buyer to ${email}.`);

                const msg: any = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-e920cad3da0d4e0b8f77501bdabe1d54',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.assetURL,
                        link: ''
                    }
                }

                if (!isUndefined(req.body.discount)) {
                    msg.dynamic_template_data.discount = req.body.discount;
                    msg.dynamic_template_data.total = total - req.body.discount;
                }

                if (req.body.type === 'sold') {
                    const transactionID = `${req.body.buyerID}-${req.body.sellerID}-${req.body.soldAt}`;
                    msg.templateId = 'd-1ea40fbf9ad848638489561243162e97';
                    msg.dynamic_template_data.link = `https://nxtdrop.com/checkout?tID=${transactionID}`;
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to buyer`);
                }).catch((err: any) => {
                    console.error(`Could send email to buyer: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending buyer email`);
        });

        return admin.firestore().collection(`users`).doc(`${req.body.sellerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.price * 0.095;
                const processing = req.body.price * 0.03;
                const payout = req.body.price - fee - processing;
                let transactionID;

                console.log(`Order Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'orders@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-3cb6d3dae09a4697b153d93e1fb15ab4',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        assetURL: req.body.assetURL,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        sellerID: req.body.sellerID,
                        tid: ''
                    }
                }

                if (req.body.type === 'sold') {
                    transactionID = `${req.body.buyerID}-${req.body.sellerID}-${req.body.soldAt}`;
                    msg.templateId = 'd-8650dfd5d93f4b16b594cf02c49e9070';
                } else {
                    transactionID = `${req.body.buyerID}-${req.body.sellerID}-${req.body.boughtAt}`;
                    msg.dynamic_template_data.tid = transactionID;
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to seller`);
                }).catch((err: any) => {
                    console.error(`Could send email to seller: ${err}`);
                })
            } else {
                console.error(`Seller don't exist`);
            }

            return res.status(200);
        }).catch(err => {
            console.error(`error sending seller email`);
        })
    });
});

// Product Shipment Email
exports.productShipment = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        return admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const total = req.body.price + req.body.shippingCost;

                console.log(`Product Shipment Email to ${email}. body: ${JSON.stringify(req.body)}`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-f3cb1b96abc148ca963c4ffac9b5c2c4',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.assetURL,
                    }
                }

                return sgMail.send(msg).then((content: any) => {
                    console.log(`email sent`);
                    return res.status(200).send(JSON.stringify('sent'));
                }).catch((err: any) => {
                    console.error(err);
                    return res.status(500).send(JSON.stringify('error'));
                })
            } else {
                res.status(500).send(JSON.stringify('error'));
            }
        })
    });
});

// Email Invite
exports.inviteFriend = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send(false);
        }

        const name = req.body.name;
        const phoneNumber = req.body.phoneNumber;


        return twClient.messages.create({
            body: `Your friend ${name} invited you to NXTDROP,the first Canadian online sneaker marketplace like StockX & GOAT. Visit nxtdrop.com/welcome to see how it works.`,
            from: '+15873273010',
            to: `${phoneNumber}`,
        }).then(message => {
            console.log(message);
            return res.status(200).send(true);
        }).catch(err => {
            console.error(err);
            return res.send(false);
        });
    });
});

exports.smsNotifications = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send(false);
        }

        const phoneNumber = req.body.phoneNumber;
        const msg = req.body.msg;

        return twClient.messages.create({
            body: `${msg}`,
            from: '+15873273010',
            to: `${phoneNumber}`,
        }).then(message => {
            console.log(message);
            return res.status(200).send(true);
        }).catch(err => {
            console.error(err);
            return res.send(false);
        });
    });
})

// Email when password is changed
exports.changedPassword = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send('Forbidden!');
        }

        console.log(`To: ${req.body.toEmail}, Name: ${req.body.name}`);

        const msg = {
            to: req.body.toEmail,
            from: { email: 'notifications@nxtdrop.com', name: 'NXTDROP' },
            templateId: 'd-0911ed5ff8ee46e3982bd3d8074ce831',
            dynamic_template_data: {
                name: req.body.toName,
                subject: 'Did you change your password?',
            },
        };

        return sgMail.send(msg).then((content: any) => {
            return res.status(200).send(content);
        }).catch((err: any) => {
            return res.send(err);
        });
    });
});


// Email to activate account
exports.accountCreated = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send('Forbidden!');
        }

        console.log(`To: ${req.body.toEmail}, Name: ${req.body.toFirstName + ' ' + req.body.toLastName}`);

        const msg = {
            to: req.body.toEmail,
            from: { email: 'notifications@nxtdrop.com', name: 'NXTDROP' },
            templateId: 'd-35761f77395f4395bf843c0d9d2352d8',
            dynamic_template_data: {
                name: req.body.toFirstName + ' ' + req.body.toLastName,
                uid: req.body.toUid
            }
        };

        const firstRequest = {
            method: 'POST',
            url: '/v3/contactdb/recipients',
            body: [{
                "email": req.body.toEmail,
                "first_name": req.body.toFirstName,
                "last_name": req.body.toLastName
            }]
        };

        sgClient.request(firstRequest).then(([firstResponse, firstBody]: any) => {
            console.log(firstBody.persisted_recipients[0])
            const r = {
                method: 'POST',
                url: `/v3/contactdb/lists/9601603/recipients/${firstBody.persisted_recipients[0]}`,
            }

            sgClient.request(r).then(([secondResponse, secondBody]: any) => {
                console.log(`Added to NXTDROP list: ${secondResponse.statusCode}`);
            });
        }).catch((err: any) => {
            console.error(err);
        })

        return sgMail.send(msg).then((content: any) => {
            console.log(content);
            return res.status(200).send(true);
        }).catch((err: any) => {
            console.error(err);
            return res.send(false);
        });
    });
});

// Email to reset account
exports.resetPassword = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send('Forbidden!');
        }

        const code = cryptoString({ length: 24, type: 'url-safe' });
        console.log(`To: ${req.body.toEmail}, Name: ${req.body.toUsername}, Code: ${code}`);

        return admin.firestore().collection(`users`).doc(`${req.body.toUid}`).set({
            resetCode: code
        }, { merge: true }).then(() => {
            const msg = {
                to: req.body.toEmail,
                from: { email: 'notifications@nxtdrop.com', name: 'NXTDROP' },
                templateId: 'd-1630d61513f54005944c4abb4cb268ed',
                dynamic_template_data: {
                    username: req.body.toUsername,
                    uid: req.body.toUid,
                    email: req.body.toEmail,
                    code: code
                }
            };

            return sgMail.send(msg).then((content: any) => {
                console.log(content);
                return res.send(true);
            }).catch((err: any) => {
                console.error(err);
                return res.send(false);
            });
        }).catch(err => {
            console.error(err);
            return res.send(false);
        })
    });
});

// Change Password using Admin SDK
exports.newPassword = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'PUT') {
            return res.status(403).send(false);
        }

        return admin.firestore().collection(`users`).doc(`${req.body.uid}`).get().then(response => {
            const data = response.data();
            if (data) {
                if (data.resetCode === req.body.code) {
                    return admin.auth().updateUser(req.body.uid, {
                        password: req.body.newPass
                    }).then(r => {
                        console.log(`Password Changed`);
                        admin.firestore().collection(`users`).doc(`${req.body.uid}`).update({
                            resetCode: admin.firestore.FieldValue.delete()
                        }).then(() => {
                            console.log(`resetCode deleted`);
                        }).catch(err => {
                            console.error(`resetCode could not be deleted: ${err}`);
                        });
                        return res.send(true);
                    }).catch(err => {
                        console.error(err);
                        res.send(false);
                    });
                } else {
                    console.error(`resetCode: ${data.resetCode}, bodyCode: ${req.body.code}`);
                    return res.send(false);
                }
            } else {
                console.error(`Users does not exist`);
                return res.send(false);
            }
        });
    });
});

// Algolia Update
exports.indexProducts = functions.firestore
    .document('products/{productID}')
    .onCreate((snap, context) => {
        const data = snap.data();
        const objectID = snap.id;

        // Add data to the Algolia index
        return index.addObject({
            objectID,
            ...data
        });
    });

exports.unindexProduct = functions.firestore
    .document('products/{productID}')
    .onDelete((snap, context) => {
        const objectID = snap.id;

        // Delete an ID from the index
        return index.deleteObject(objectID);
    });

exports.addFirestoreDataToAlgolia = functions.https.onRequest((req, res) => {

    // tslint:disable-next-line: no-floating-promises
    admin.firestore().collection('products').get().then((docs) => {

        docs.forEach(doc => {
            const user = doc.data();
            user.objectID = doc.id;

            arr.push(user);
        });

        index.saveObjects(arr, (err: any, content: any) => {
            res.status(200).send(content);
        });

    });
});

exports.snkrsInvitation = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send('Forbidden!');
        }

        const msg = {
            to: req.body.email,
            from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
            templateId: 'd-e5e4d6fa0d1f4c6295a999bffc654cb1',
            dynamic_template_data: {
                username: req.body.username,
                email: req.body.email,
            }
        };

        return sgMail.send(msg).then((content: any) => {
            console.log(content);
            return res.send(true);
        }).catch((err: any) => {
            console.error(err);
            return res.send(false);
        });
    });
});

exports.sendGiftCard = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send('Forbidden!');
        }

        const msg: any = {
            to: req.body.email,
            from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
            templateId: 'd-c3466f43205846deaba1fde2fa5f0d5f',
            dynamic_template_data: {
                message: req.body.message,
                code: req.body.code,
                expirationDate: new Date(req.body.expirationDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: "America/New_York", timeZoneName: 'long' })
            }
        }

        if (req.body.giftCard15) {
            msg.dynamic_template_data.giftCard15 = true;
        } else if (req.body.giftCard20) {
            msg.dynamic_template_data.giftCard20 = true;
        } else if (req.body.giftCard25) {
            msg.dynamic_template_data.giftCard25 = true;
        } else if (req.body.giftCard50) {
            msg.dynamic_template_data.giftCard50 = true;
        } else if (req.body.giftCard75) {
            msg.dynamic_template_data.giftCard75 = true;
        } else if (req.body.giftCard100) {
            msg.dynamic_template_data.giftCard100 = true;
        } else if (req.body.giftCard200) {
            msg.dynamic_template_data.giftCard200 = true;
        }

        return sgMail.send(msg).then((content: any) => {
            console.log(content);
            return res.send(true);
        }).catch((err: any) => {
            console.error(err);
            return res.send(false);
        });
    });
});

exports.sendRequestConfirmation = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send('Forbidden!');
        }

        const msg: any = {
            to: req.body.email,
            from: { email: 'notifications@nxtdrop.com', name: 'NXTDROP' },
            templateId: 'd-0e311dc7d6bf4bc9a285baf1e15b3e95',
            dynamic_template_data: {
                productURL: req.body.productURL
            }
        }

        return sgMail.send(msg).then((content: any) => {
            console.log(content);
            return res.send(true);
        }).catch((err: any) => {
            console.error(err);
            return res.send(false);
        });
    });
});

exports.deliveredForVerification = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        admin.firestore().collection(`users`).doc(`${req.body.buyerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const total = req.body.price + req.body.shippingCost;

                console.log(`Order Email Buyer to ${email}.`);

                const msg: any = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-f0264d6227614c95addb39e6264b2a09',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        subtotal: req.body.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.assetURL,
                        link: ''
                    }
                }

                if (!isUndefined(req.body.discount)) {
                    msg.dynamic_template_data.discount = req.body.discount;
                    msg.dynamic_template_data.total = total - req.body.discount;
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to buyer`);
                }).catch((err: any) => {
                    console.error(`Could send email to buyer: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending buyer email`);
        });

        admin.firestore().collection(`users`).doc(`${req.body.sellerID}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.price * 0.095;
                const processing = req.body.price * 0.03;
                const payout = req.body.price - fee - processing;

                console.log(`Order Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'orders@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-9f39e7893ca54fbd878aa84de5c61bd4',
                    dynamic_template_data: {
                        model: req.body.model,
                        size: req.body.size,
                        condition: req.body.condition,
                        assetURL: req.body.assetURL,
                        subtotal: req.body.price,
                        fee: fee,
                        processing: processing,
                        payout: payout
                    }
                }

                sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to seller`);
                }).catch((err: any) => {
                    console.error(`Could send email to seller: ${err}`);
                })
            } else {
                console.error(`buyer don't exist`);
            }
        }).catch(err => {
            console.error(`error sending seller email`);
        })

        return res.status(200);
    });
});

exports.activateAccount = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method != 'PUT') {
            return res.status(403).send(false);
        }

        const uid = req.body.code;

        return admin.firestore().collection(`users`).doc(`${uid}`).update({
            isActive: true
        }).then(() => {
            return res.status(200).send(true);
        }).catch(err => {
            console.error(err);
            return res.status(200).send(false)
        });
    });
});

exports.IntercomData = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method != 'PUT') {
            return res.status(403).send(false);
        }

        const uid = req.body.uid;

        return admin.firestore().collection('users').doc(`${uid}`).get().then(userData => {
            const hash = crypto.createHmac('sha256', env.intercom.hmackey).update(uid).digest('hex');

            const uData = userData.data();

            if (isUndefined(uData)) {
                return res.status(200).send(false);
            } else {
                const data = {
                    firstName: uData.firstName,
                    lastName: uData.lastName,
                    hash: hash
                }

                return res.status(200).send(data);
            }
        }).catch(err => {
            console.error(err)
            return res.status(200).send(false);
        })
    });
});

exports.addToNewsletter = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method != 'PUT') {
            return res.status(403).send(false);
        }

        const firstRequest = {
            method: 'POST',
            url: '/v3/contactdb/recipients',
            body: [{
                "email": req.body.email
            }]
        };

        return sgClient.request(firstRequest).then(([firstResponse, firstBody]: any) => {
            console.log(firstBody.persisted_recipients[0])
            const r = {
                method: 'POST',
                url: `/v3/contactdb/lists/11551126/recipients/${firstBody.persisted_recipients[0]}`,
            }

            return sgClient.request(r).then(([secondResponse, secondBody]: any) => {
                console.log(`Added to Newsletter list: ${secondResponse.statusCode}`);
                return res.status(200).send(true)
            });
        }).catch((err: any) => {
            console.error(err);
            return res.status(200).send(false)
        })

    });
});