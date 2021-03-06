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

const axios = require('axios')

exports.orderCancellation = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send();
        }

        admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
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
                        assetURL: req.body.asset_url,
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

        admin.firestore().collection(`users`).doc(`${req.body.seller_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.price * 0.085;
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
                        assetURL: req.body.asset_url,
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

        return admin.firestore().collection(`users`).doc(`${req.body.seller_id}`).get().then(response => {
            const data = response.data();

            if (data) {
                //const email = data.email;
                const email = data.email;
                const fee = req.body.item.price * 0.085;
                const processing = req.body.item.price * 0.03;
                const payout = req.body.item.price - fee - processing;

                console.log(`sendShippingLabel email to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-0215a6c29937473ea4b204b3d94fe073',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        assetURL: req.body.item.asset_url,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        price: req.body.item.price,
                        label: req.body.ship_tracking.label
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

        return admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const total = req.body.item.price + req.body.shipping_cost;

                console.log(`Order Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-1470cf9fcbd74918b5ce0c78db3005d2',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        subtotal: req.body.item.price,
                        shipping: req.body.shipping_cost,
                        total: total,
                        assetURL: req.body.item.asset_url,
                        link: `https://nxtdrop.com/checkout?tID=${req.body.id}`
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

        return admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
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
                        assetURL: req.body.asset_url
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

        admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
            const data = response.data();
            let trackingURL;

            switch (req.body.ship_tracking.carrier) {
                case 'UPS':
                    trackingURL = `http://theupsstore.ca/track/${req.body.ship_tracking.tracking_id}`;
                    break;
                case 'Canada Post':
                    trackingURL = `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${req.body.ship_tracking.tracking_id}`;
                    break;
                default:
                    break;
            }

            if (data) {
                //const email = data.email;
                const email = data.email;
                const total = req.body.item.price + req.body.shipping_cost;

                console.log(`VerifiedShipped Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-80bb3123058f4d39b130b8e54510fd54',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        subtotal: req.body.item.price,
                        shipping: req.body.shipping_cost,
                        total: total,
                        assetURL: req.body.item.aseet_url,
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

        admin.firestore().collection(`users`).doc(`${req.body.seller_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.item.price * 0.085;
                const processing = req.body.item.price * 0.03;
                const payout = req.body.item.price - fee - processing;

                console.log(`VerifiedShipped Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    bcc: { email: 'nxtdrop.com+e17f9774a6@invite.trustpilot.com' },
                    templateId: 'd-41bb9f19ad2344f8b585ce6c1948a820',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        assetURL: req.body.item.asset_url,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        price: req.body.item.price
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

        admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
            const data = response.data();

            if (data) {
                //const email = data.email;
                const email = data.email;
                const total = req.body.item.price + req.body.shipping_cost;

                console.log(`VerifiedFailed Email Buyer to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-ab08e34c230b4e8b8370ff5090810bfa',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        subtotal: req.body.item.price,
                        shipping: req.body.shippingCost,
                        total: total,
                        assetURL: req.body.item.asset_url,
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

        admin.firestore().collection(`users`).doc(`${req.body.seller_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.item.price * 0.085;
                const processing = req.body.item.price * 0.03;
                const payout = req.body.item.price - fee - processing;

                console.log(`VerifiedFailed Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-83cd9d7140b34bc7ae3bb1c5781c2315',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        assetURL: req.body.item.asset_url,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        price: req.body.item.price
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

        admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const total = req.body.item.price + req.body.shipping_cost;
                const est_arrival = `${new Date(Date.now() + (86400000 * 21)).toLocaleString("en-CA", { day: "2-digit", month: "2-digit", year: "numeric" })} - ${new Date(Date.now() + (86400000 * 28)).toLocaleString("en-CA", { day: "2-digit", month: "2-digit", year: "numeric" })}`

                console.log(`Order Email Buyer to ${email}.`);

                const msg: any = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-e920cad3da0d4e0b8f77501bdabe1d54',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        subtotal: req.body.item.price,
                        shipping: req.body.shipping_cost,
                        total,
                        assetURL: req.body.item.asset_url,
                        est_arrival,
                        link: ''
                    }
                }

                if (!isUndefined(req.body.discount)) {
                    msg.dynamic_template_data.discount = req.body.discount.amount;
                    msg.dynamic_template_data.total = total - req.body.discount.amount;
                }

                if (req.body.transaction_type === 'bid_accepted') {
                    const transactionID = `${req.body.id}`;
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

        return admin.firestore().collection(`users`).doc(`${req.body.seller_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.item.price * 0.085;
                const processing = req.body.item.price * 0.03;
                const payout = req.body.item.price - fee - processing;
                const transactionID = `${req.body.id}`;

                console.log(`Order Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'orders@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-3cb6d3dae09a4697b153d93e1fb15ab4',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        assetURL: req.body.item.asset_url,
                        fee: fee,
                        processing: processing,
                        payout: payout,
                        sellerID: req.body.seller_id,
                        tid: ''
                    }
                }

                if (req.body.transaction_type === 'bid_accepted') {
                    msg.templateId = 'd-8650dfd5d93f4b16b594cf02c49e9070';
                } else {
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

        return admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const total = req.body.item.price + req.body.shipping_cost;

                console.log(`Product Shipment Email to ${email}. body: ${JSON.stringify(req.body)}`);

                const msg = {
                    to: email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-f3cb1b96abc148ca963c4ffac9b5c2c4',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        subtotal: req.body.item.price,
                        shipping: req.body.shipping_cost,
                        total: total,
                        assetURL: req.body.item.asset_url,
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

        console.log(`To: ${req.body.email}, Name: ${req.body.first_name + ' ' + req.body.last_name}`);

        const msg = {
            to: req.body.email,
            from: { email: 'notifications@nxtdrop.com', name: 'NXTDROP' },
            templateId: 'd-35761f77395f4395bf843c0d9d2352d8',
            dynamic_template_data: {
                name: req.body.first_name + ' ' + req.body.last_name,
                uid: req.body.uid
            }
        }

        const firstRequest = {
            method: 'PUT',
            url: '/v3/marketing/contacts',
            body: {
                "list_ids": ["8773202d-7de5-4d53-93b0-f6d7f85b0fa0"],
                "contacts": [{
                    "email": req.body.email,
                    "first_name": req.body.first_name,
                    "last_name": req.body.last_name,
                    "custom_fields": {
                        "w2_D": `${new Date(req.body.creation_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`,
                        "w4_T": "no",
                        "w7_D": `${new Date(req.body.last_login).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`
                    }
                }]
            }
        }

        //console.log(firstRequest)

        sgClient.request(firstRequest).then(([firstResponse, firstBody]: any) => {
            //console.log(firstBody.persisted_recipients[0])
            console.log(`Added to NXTDROP list: ${firstResponse.statusCode}`)
        }).catch((err: any) => {
            console.error(err);
        })

        return sgMail.send(msg).then((content: any) => {
            //console.log(content);
            console.log('email sent')
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
    .document('products/{product_id}')
    .onCreate((snap, context) => {
        const data = snap.data()
        const objectID = snap.id

        // Add data to the Algolia index
        return index.addObject({
            objectID,
            ...data
        })
    })

exports.unindexProduct = functions.firestore
    .document('products/{product_id}')
    .onDelete((snap, context) => {
        const objectID = snap.id

        // Delete an ID from the index
        return index.deleteObject(objectID)
    });

exports.editProduct = functions.firestore
    .document('products/{product_id}')
    .onUpdate((snap, context) => {
        const data = snap.after.data()
        const objectID = snap.after.id

        return index.addObject({
            objectID,
            ...data
        })
    })

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

        admin.firestore().collection(`users`).doc(`${req.body.buyer_id}`).get().then(response => {
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
                        assetURL: req.body.asset_url,
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

        admin.firestore().collection(`users`).doc(`${req.body.seller_id}`).get().then(response => {
            const data = response.data();
            if (data) {
                const email = data.email;
                const fee = req.body.item.price * 0.085;
                const processing = req.body.item.price * 0.03;
                const payout = req.body.item.price - fee - processing;

                console.log(`Order Email Seller to ${email}.`);

                const msg = {
                    to: email,
                    from: { email: 'orders@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-9f39e7893ca54fbd878aa84de5c61bd4',
                    dynamic_template_data: {
                        model: req.body.item.model,
                        size: req.body.item.size,
                        condition: req.body.item.condition,
                        assetURL: req.body.item.asset_url,
                        subtotal: req.body.item.price,
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
        if (req.method !== 'PUT') {
            return res.status(403).send(false);
        }

        const uid = req.body.code;

        return admin.firestore().collection(`users`).doc(`${uid}`).update({
            is_active: true
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
        if (req.method !== 'PUT') {
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
                    firstName: uData.first_name,
                    lastName: uData.last_name,
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
        if (req.method !== 'PUT') {
            return res.status(403).send(false);
        }

        const firstRequest = {
            method: 'PUT',
            url: '/v3/marketing/contacts',
            body: {
                "list_ids": ["0af827b1-be5e-425a-97ec-5d2b78d28d83"],
                "contacts": [{
                    "email": req.body.email
                }]
            }
        }

        return sgClient.request(firstRequest).then(([firstResponse, firstBody]: any) => {
            console.log(`Added to Newsletter list: ${firstResponse.statusCode}`);
            return res.status(200).send(true)
        }).catch((err: any) => {
            console.error(err);
            return res.status(200).send(false)
        })

    });
});

exports.droppedCartReminder = functions.pubsub.schedule('every 15 minutes from 6:00 to 20:00').timeZone('America/Edmonton').onRun((context) => {
    const threshold = Date.now() - 172800000;
    return admin.firestore().collection('users').where('last_item_in_cart.timestamp', '<=', threshold).get().then(data => {
        data.docs.forEach(doc => {
            const user_data = doc.data()

            return admin.firestore().collection('products').doc(user_data.last_item_in_cart.product_id).collection('listings').where('condition', '==', 'new').where('size', '==', user_data.last_item_in_cart.size).get().then(res => {
                if (!res.empty) {
                    const prod_data = res.docs[0].data()

                    const msg = {
                        to: user_data.email,
                        from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                        templateId: 'd-b7580434edad4bd7a66b8350f5ce4ca6',
                        dynamic_template_data: {
                            model: prod_data.model,
                            assetURL: prod_data.asset_url,
                            product_id: user_data.last_item_in_cart.product_id
                        }
                    }

                    sgMail.send(msg).then((content: any) => {
                        console.log(`dropped cart email sent to ${user_data.uid}`);

                        admin.firestore().collection('users').doc(user_data.uid).update({
                            last_item_in_cart: admin.firestore.FieldValue.delete()
                        }).then(() => {
                            return null;
                        }).catch(err => {
                            console.error(`Could delete last_item_in_cart for ${user_data.uid}`)
                            return null;
                        })
                    }).catch((err: any) => {
                        console.error(`Could send dropped cart email ${user_data.uid}: ${err}`)
                        return null;
                    })
                }
            }).catch(err => {
                console.error(err)
                return null;
            })
        })
    }).catch(err => {
        console.error(err)
        return null;
    })
})

exports.lowestAskNotification = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'PUT') {
            return res.status(403).send(false);
        }

        const buyer_list: any[] = []
        const seller_list: any[] = []

        await notifyBuyers()

        await notifySellers()

        res.status(200).send();

        return;

        function notifyBuyers() {
            return admin.firestore().collection(`products`).doc(`${req.body.product_id}`).collection(`offers`).where('condition', '==', `${req.body.condition}`).where('size', '==', `${req.body.size}`).get()
                .then(bids => {
                    console.log('getting bids...')
                    bids.docs.forEach(bid => {
                        console.log(`getting buyer ${bid.data().buyer_id}`)
                        admin.firestore().collection(`users`).doc(`${bid.data().buyer_id}`).get().then(user_data => {
                            const data = user_data.data();

                            if (!isNullOrUndefined(data) && req.body.seller_id !== data.uid && !buyer_list.includes(data.email)) {
                                buyer_list.push(data.email)

                                const msg: any = {
                                    to: data.email,
                                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                                    templateId: 'd-c5ca84af85994118bb5cfdd2608c3095',
                                    dynamic_template_data: {
                                        model: bid.data().model,
                                        size: bid.data().size,
                                        condition: bid.data().condition,
                                        bid_amount: bid.data().price,
                                        shipping: 15,
                                        total: bid.data().price + 15,
                                        assetURL: bid.data().asset_url,
                                        lowest_ask: req.body.price,
                                        update_bid: `https://nxtdrop.com/edit-offer/${bid.data().offer_id}`,
                                        buy_now: `https://nxtdrop.com/checkout?product=${req.body.listing_id}&sell=false`
                                    }
                                }

                                sgMail.send(msg).then((content: any) => {
                                    console.log(`email sent to buyer ${data.username}`)
                                }).catch((err: any) => {
                                    console.error(err)
                                    buyer_list.pop()
                                })
                            }
                        }).catch(err => {
                            console.error(err)
                        })
                    })
                }).catch(err => {
                    console.error(err)
                })
        }

        function notifySellers() {
            return admin.firestore().collection(`products`).doc(`${req.body.product_id}`).collection(`listings`).where('size', '==', `${req.body.size}`).where('condition', '==', `${req.body.condition}`).get()
                .then(asks => {
                    console.log('getting asks...')
                    asks.docs.forEach(ask => {
                        console.log(`getting seller ${ask.data().seller_id}`)
                        admin.firestore().collection(`users`).doc(`${ask.data().seller_id}`).get().then(user_data => {
                            const data = user_data.data()
                            console.log(seller_list)

                            if (!isNullOrUndefined(data) && req.body.seller_id !== data.uid && !seller_list.includes(data.email)) {
                                seller_list.push(data.email)

                                const msg: any = {
                                    to: data.email,
                                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                                    templateId: 'd-d56fddb8b3544fd4b9359530518eeff2',
                                    dynamic_template_data: {
                                        model: ask.data().model,
                                        size: ask.data().size,
                                        condition: ask.data().condition,
                                        ask_amount: ask.data().price,
                                        payment_processing: ask.data().price * .03,
                                        seller_fee: ask.data().price * .085,
                                        payout: ask.data().price * .885,
                                        assetURL: ask.data().asset_url,
                                        lowest_ask: req.body.price,
                                        update_ask: `https://nxtdrop.com/edit-listing/${ask.data().listing_id}`,
                                        sell_now: `https://nxtdrop.com/product/${req.body.product_id}`
                                    }
                                }

                                sgMail.send(msg).then((content: any) => {
                                    console.log(`email sent to seller ${data.username}`)
                                }).catch((err: any) => {
                                    console.error(err)
                                    seller_list.pop()
                                })
                            }
                        }).catch(err => {
                            console.error(err)
                        })
                    })
                }).catch(err => {
                    console.error(err)
                })
        }
    })
})

exports.highestBidNotification = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'PUT') {
            return res.status(403).send(false);
        }

        const buyer_list: any[] = []
        const seller_list: any[] = []
        const prodRef = admin.firestore().collection(`products`).doc(`${req.body.product_id}`)

        await notifySellers()

        await notifyBuyers()

        return res.status(200).send()

        function notifySellers() {
            return prodRef.collection(`listings`).where('size', '==', `${req.body.size}`).where('condition', '==', `${req.body.condition}`).get()
                .then(asks => {
                    //console.log('getting asks...')

                    asks.docs.forEach(ask => {
                        //console.log(`getting seller ${ask.data().seller_id}`)
                        admin.firestore().collection(`users`).doc(`${ask.data().seller_id}`).get().then(user_data => {
                            const data = user_data.data()
                            console.log(seller_list)

                            if (!isNullOrUndefined(data) && req.body.buyer_id !== data.uid && !seller_list.includes(data.email)) {
                                seller_list.push(data.email)

                                const msg: any = {
                                    to: data.email,
                                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                                    templateId: 'd-152610f1330b43399eb86d1d222b3c92',
                                    dynamic_template_data: {
                                        model: ask.data().model,
                                        size: ask.data().size,
                                        condition: ask.data().condition,
                                        ask_amount: ask.data().price,
                                        payment_processing: ask.data().price * .03,
                                        seller_fee: ask.data().price * .085,
                                        payout: ask.data().price * .885,
                                        assetURL: ask.data().asset_url,
                                        highest_bid: req.body.price,
                                        update_ask: `https://nxtdrop.com/edit-listing/${ask.data().listing_id}`,
                                        sell_now: `https://nxtdrop.com/checkout?product=${req.body.offer_id}&sell=true`
                                    }
                                }

                                sgMail.send(msg).then((content: any) => {
                                    console.log(`email sent to seller ${data.username}`)
                                }).catch((err: any) => {
                                    console.error(err)
                                    seller_list.pop()
                                })
                            }
                        }).catch(err => {
                            console.error(err)
                        })
                    })
                }).catch(err => {
                    console.error(err)
                })
        }


        function notifyBuyers() {
            return prodRef.collection(`offers`).where(`size`, `==`, `${req.body.size}`).where(`condition`, `==`, `${req.body.condition}`).get()
                .then(bids => {
                    //console.log(`getting bids...`)

                    bids.docs.forEach(bid => {
                        //console.log(`getting buyer ${bid.data().buyer_id}`)
                        admin.firestore().collection(`users`).doc(`${bid.data().buyer_id}`).get().then(user_data => {
                            const data = user_data.data()
                            console.log(buyer_list)

                            if (!isNullOrUndefined(data) && req.body.buyer_id !== data.uid && !buyer_list.includes(data.email)) {
                                buyer_list.push(data.email)

                                const msg: any = {
                                    to: data.email,
                                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                                    templateId: 'd-1a41c84bde3f4908b5c9478a8d2827fa',
                                    dynamic_template_data: {
                                        model: bid.data().model,
                                        size: bid.data().size,
                                        condition: bid.data().condition,
                                        bid_amount: bid.data().price,
                                        shipping: 15,
                                        total: bid.data().price + 15,
                                        assetURL: bid.data().asset_url,
                                        highest_bid: req.body.price,
                                        update_bid: `https://nxtdrop.com/edit-offer/${bid.data().offer_id}`,
                                        buy_now: `https://nxtdrop.com/product/${req.body.product_id}`
                                    }
                                }

                                sgMail.send(msg).then((content: any) => {
                                    console.log(`email sent to buyer ${data.username}`)
                                }).catch((err: any) => {
                                    console.error(err)
                                    buyer_list.pop()
                                })
                            }
                        }).catch(err => {
                            console.error(err)
                        })
                    })
                }).catch(err => {
                    console.error(err)
                })
        }
    })
})

exports.forwardPurchase = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(403).send(false)
        }

        return axios.default({
            method: 'POST',
            url: 'https://my.referralcandy.com/api/v1/purchase.json',
            data: req.body
        }).then((response: any) => {
            console.log(`Status code: ${response.status}`)

            return res.status(200).send(response.data)
        }).catch((error: any) => {
            console.log(`Error: ${error}`)

            return res.status(500).send(error)
        })
    })
})

exports.askNotification = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        const askData = req.body

        return admin.firestore().collection('users').doc(askData.seller_id).get().then(response => {
            const userData = response.data()

            if (!isNullOrUndefined(userData)) {
                const msg: any = {
                    to: userData.email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: '',
                    dynamic_template_data: {
                        model: askData.model,
                        size: askData.size,
                        condition: askData.condition,
                        ask_amount: askData.price,
                        payment_processing: askData.price * .03,
                        seller_fee: askData.price * .085,
                        payout: askData.price * .885,
                        assetURL: askData.asset_url
                    }
                }

                if (req.method === 'POST') {
                    msg.templateId = 'd-97c460f321244bd0afbcaf7373a66d22'
                } else if (req.method === 'PATCH') {
                    msg.templateId = 'd-badbe4a324e444cba3a43b598903e907'
                } else if (req.method === 'PUT') {
                    msg.templateId = 'd-6b7583d4eab94968a164b7b5fbe2270f'
                } else {
                    console.error('Cannot send email. Wrong method.')
                    return res.status(200).send(false)
                }

                return sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to seller ${userData.username}`)
                }).catch((err: any) => {
                    console.error(`Couldn't send email to seller: ${err}`)
                })
            }
        })
    })
})

exports.bidNotification = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        const bidData = req.body

        return admin.firestore().collection('users').doc(bidData.buyer_id).get().then(response => {
            const userData = response.data()

            if (!isNullOrUndefined(userData)) {
                const msg: any = {
                    to: userData.email,
                    from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                    templateId: 'd-1a41c84bde3f4908b5c9478a8d2827fa',
                    dynamic_template_data: {
                        model: bidData.model,
                        size: bidData.size,
                        condition: bidData.condition,
                        bid_amount: bidData.price,
                        shipping: 15,
                        total: bidData.price + 15,
                        assetURL: bidData.asset_url
                    }
                }

                if (req.method === 'POST') {
                    msg.templateId = 'd-38407b824d7047edada7bbc909c029d8'
                } else if (req.method === 'PATCH') {
                    msg.templateId = 'd-10484ff3ef174315aa876bc8cd8aa585'
                } else if (req.method === 'PUT') {
                    msg.templateId = 'd-0ecdd8499214420fa2d78e7941ba6e51'
                } else {
                    console.error('Cannot send email. Wrong method.')
                    return res.status(200).send(false)
                }

                return sgMail.send(msg).then((content: any) => {
                    console.log(`email sent to buyer ${userData.username}`)
                }).catch((err: any) => {
                    console.error(err)
                })
            }
        })
    })
})

exports.enterGiveaway = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        const firstRequest = {
            method: 'PUT',
            url: '/v3/marketing/contacts',
            body: {
                "list_ids": ["98ca9ef9-f9df-47c3-b850-9a03334b57fe"],
                "contacts": [{
                    "email": req.body.email
                }]
            }
        }

        return sgClient.request(firstRequest).then(([firstResponse, firstBody]: any) => {
            console.log(`Added to list`);
            return res.status(200).send(true)
        }).catch((err: any) => {
            console.error(err);
            return res.status(200).send(false)
        })
    })
})

exports.expiredAsk = functions.pubsub.schedule('every 5 minutes').timeZone('America/Edmonton').onRun((context: any) => {
    const date = Date.now()

    return admin.firestore().collection('asks').where('expiration_date', '<=', date).limit(100).get()
        .then(response => {
            response.forEach(data => {
                admin.firestore().collection('products').doc(data.get('product_id')).collection('listings').doc(data.id).delete()
                    .then(() => {
                        admin.firestore().collection('users').doc(data.get('seller_id')).get()
                            .then(user_response => {
                                const user_data = user_response.data()

                                if (!isNullOrUndefined(user_data)) {
                                    const msg: any = {
                                        to: user_data.email,
                                        from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                                        templateId: 'd-d0caee4fa00a44299dedfee11e23f07d',
                                        dynamic_template_data: {
                                            assetURL: data.data().asset_url,
                                            model: data.data().model,
                                            size: data.data().size,
                                            condition: data.data().condition,
                                            amount: data.data().price,
                                            fee: data.data().price * .085,
                                            payment_processing: data.data().price * .03,
                                            payout: data.data().price * .885,
                                            id: data.data().listing_id
                                        }
                                    }

                                    sgMail.send(msg)
                                        .then(() => {
                                            console.log('email sent to seller')
                                            admin.firestore().collection('asks').doc(data.id)
                                                .update({
                                                    expiration_date: admin.firestore.FieldValue.delete()
                                                })
                                                .catch(err => {
                                                    console.error(err)
                                                })
                                        })
                                        .catch((err: any) => {
                                            console.error(err)
                                        })
                                }
                            })
                            .catch(err => {
                                console.error(err)
                            })
                    })
                    .catch(err => {
                        console.error(err)
                    })
            })

            return null
        })
        .catch(err => {
            console.error(err)
            return null
        })
})

exports.expiredBid = functions.pubsub.schedule('every 5 minutes').timeZone('America/Edmonton').onRun((context: any) => {
    const date = Date.now()

    return admin.firestore().collection('bids').where('expiration_date', '<=', date).limit(100).get()
        .then(response => {
            response.forEach(data => {
                admin.firestore().collection('products').doc(data.get('product_id')).collection('offers').doc(data.id).delete()
                    .then(() => {
                        admin.firestore().collection('users').doc(data.get('buyer_id')).get()
                            .then(user_response => {
                                const user_data = user_response.data()

                                if (!isNullOrUndefined(user_data)) {
                                    const msg: any = {
                                        to: user_data.email,
                                        from: { email: 'do-not-reply@nxtdrop.com', name: 'NXTDROP' },
                                        templateId: 'd-b94b8c957f90497b97824f849b415471',
                                        dynamic_template_data: {
                                            assetURL: data.data().asset_url,
                                            model: data.data().model,
                                            size: data.data().size,
                                            condition: data.data().condition,
                                            amount: data.data().price,
                                            shipping: 15,
                                            total: data.data().price + 15,
                                            id: data.data().offer_id
                                        }
                                    }

                                    sgMail.send(msg)
                                        .then(() => {
                                            console.log('email sent to buyer')
                                            admin.firestore().collection('bids').doc(data.id)
                                                .update({
                                                    expiration_date: admin.firestore.FieldValue.delete()
                                                })
                                                .catch(err => {
                                                    console.error(err)
                                                })
                                        })
                                        .catch((err: any) => {
                                            console.error(err)
                                        })
                                }
                            })
                            .catch(err => {
                                console.error(err)
                            })
                    })
                    .catch(err => {
                        console.error(err)
                    })
            })

            return null
        })
        .catch(err => {
            console.error(err)
            return null
        })
})

exports.extendAskBid = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'PATCH') {
            return res.status(200).send(false)
        }

        const batch = admin.firestore().batch()

        if (req.body.mode === 'ask') {
            return admin.firestore().collection('users').doc(req.body.user_id).collection('listings').doc(req.body.id)
                .get()
                .then(response => {
                    const new_date = Date.now()

                    const data = {
                        assetURL: response.get('asset_url'),
                        condition: response.get('condition'),
                        created_at: response.get('created_at'),
                        expiration_date: new_date + (86400000 * 30),
                        last_updated: new_date,
                        listingID: response.get('listing_id'),
                        model: response.get('model'),
                        price: response.get('price'),
                        productID: response.get('product_id'),
                        sellerID: response.get('seller_id'),
                        size: response.get('size')
                    }

                    if (response.exists) {
                        batch.set(admin.firestore().collection('products').doc(response.get('product_id')).collection('listings').doc(response.id), data)
                        batch.update(admin.firestore().collection('asks').doc(response.id), data)
                        batch.update(admin.firestore().collection('users').doc(response.get('seller_id')).collection('listings').doc(response.id), data)

                        return batch.commit()
                            .then(() => {
                                return res.status(200).send(true)
                            })
                            .catch(err => {
                                console.error(err)
                                return res.status(200).send(false)
                            })
                    } else {
                        return res.status(200).send(false)
                    }
                })
                .catch(err => {
                    console.error(err)
                    return res.status(200).send(false)
                })
        } else if (req.body.mode === 'bid') {
            return admin.firestore().collection('users').doc(req.body.user_id).collection('offers').doc(req.body.id)
                .get()
                .then(response => {
                    const new_date = Date.now()

                    const data = {
                        assetURL: response.get('asset_url'),
                        buyerID: response.get('buyer_id'),
                        condition: response.get('condition'),
                        created_at: response.get('created_at'),
                        expiration_date: new_date + (86400000 * 30),
                        last_updated: new_date,
                        model: response.get('model'),
                        offerID: response.get('offer_id'),
                        price: response.get('price'),
                        productID: response.get('product_id'),
                        size: response.get('size')
                    }

                    if (response.exists) {
                        batch.set(admin.firestore().collection('products').doc(response.get('product_id')).collection('offers').doc(response.id), data)
                        batch.update(admin.firestore().collection('bids').doc(response.id), data)
                        batch.update(admin.firestore().collection('users').doc(response.get('buyer_id')).collection('offers').doc(response.id), data)

                        return batch.commit()
                            .then(() => {
                                return res.status(200).send(true)
                            })
                            .catch(err => {
                                console.error(err)
                                return res.status(200).send(false)
                            })
                    } else {
                        return res.status(200).send(false)
                    }
                })
                .catch(err => {
                    console.error(err)
                    return res.status(200).send(false)
                })
        } else {
            return res.status(200).send(false)
        }
    })
})

exports.updateContact = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'PATCH') {
            return res.status(200).send(false)
        }

        if (req.body.mode === 'name_change') {
            const request = {
                method: 'PUT',
                url: '/v3/marketing/contacts',
                body: {
                    "contacts": [{
                        "email": req.body.email,
                        "first_name": req.body.first_name,
                        "last_name": req.body.last_name
                    }]
                }
            }

            return sgClient.request(request)
                .then(() => {
                    console.log(`contact updated`)
                })
                .catch((err: any) => {
                    console.error(err)
                })
        } else if (req.body.mode === 'email_change') {
            const first_request = {
                method: "POST",
                url: "/v3/marketing/contacts/search",
                body: {
                    "query": `email LIKE '${req.body.old_email}'`
                }
            }

            return sgClient.request(first_request)
                .then(([responseHead, responseBody]: any) => {
                    if (responseHead.statusCode === 200) {
                        const second_request = {
                            method: 'DELETE',
                            url: `v3/marketing/contacts?ids=${responseBody.result[0].id}`
                        }

                        return sgClient.request(second_request)
                            .then(() => {
                                const third_request = {
                                    method: 'PUT',
                                    url: '/v3/marketing/contacts',
                                    body: {
                                        "list_ids": ["88fd12c4-81e5-4381-8249-d7977726f061"],
                                        "contacts": [{
                                            "email": req.body.new_email,
                                            "first_name": req.body.first_name,
                                            "last_name": req.body.last_name,
                                            "custom_fields": {
                                                "w2_D": `${new Date(req.body.creation_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`,
                                                "w4_T": "no",
                                                "w7_D": `${new Date(req.body.last_login).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`
                                            }
                                        }]
                                    }
                                }

                                return sgClient.request(third_request)
                                    .then(() => {
                                        console.log('contact updated')
                                        return res.status(200).send()
                                    })
                                    .catch((err: any) => {
                                        console.error(err)
                                        return res.status(500).send()
                                    })
                            })
                            .catch((err: any) => {
                                console.error(err)
                                return res.status(500).send()
                            })
                    }
                })
                .catch((err: any) => {
                    console.error(err)
                    return res.status(500).send()
                })
        } else if (req.body.mode === 'purchase') {
            return admin.firestore().collection('userVerification').doc(req.body.uid).get()
                .then(response => {
                    const user_data = response.data()

                    if (!isNullOrUndefined(user_data)) {
                        const request = {
                            method: 'PUT',
                            url: '/v3/marketing/contacts',
                            body: {
                                "contacts": [{
                                    "email": user_data.email,
                                    "custom_fields": {
                                        "w4_T": 'yes'
                                    }
                                }]
                            }
                        }

                        return sgClient.request(request)
                            .then(() => {
                                console.log(`contact updated`)
                                return res.status(200).send()
                            })
                            .catch((err: any) => {
                                console.error(err)
                                return res.status(500).send()
                            })
                    }
                })
                .catch(err => {
                    console.error(err)
                    return res.status(500).send()
                })
        } else if (req.body.mode === 'login') {
            return admin.firestore().collection('userVerification').doc(req.body.uid).get()
                .then(response => {
                    const user_data = response.data()

                    if (!isNullOrUndefined(user_data)) {
                        const request = {
                            method: 'PUT',
                            url: '/v3/marketing/contacts',
                            body: {
                                "contacts": [{
                                    "email": user_data.email,
                                    "custom_fields": {
                                        "w7_D": `${new Date(req.body.last_login).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`
                                    }
                                }]
                            }
                        }

                        return sgClient.request(request)
                            .then(() => {
                                console.log(`contact updated`)
                                return res.status(200).send()
                            })
                            .catch((err: any) => {
                                console.error(err)
                                return res.status(500).send()
                            })
                    }
                })
                .catch(err => {
                    console.error(err)
                    return res.status(500).send()
                })
        }
    })
})

exports.daily_report = functions.pubsub.schedule('every day 00:00').timeZone('America/Edmonton').onRun((context: any) => {
    //get today's and yesterday's 
    const date = new Date()
    const tz = date.toLocaleString("en-US", { timeZone: "America/Edmonton", timeZoneName: "short" }).split(" ").slice(-1)[0];
    const dateString = date.toString();
    const offset = Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`);

    const t = new Date()
    const d = new Date(+t.toLocaleString().split(',')[0].split('/')[2], +t.toLocaleString().split(',')[0].split('/')[0] - 1, +t.toLocaleString().split(',')[0].split('/')[1])


    const today = new Date(d.getTime() - offset).getTime()
    const yesterday = new Date(d.getTime() - offset).setDate(new Date(d.getTime() - offset).getDate() - 1)

    let active_users = 0
    let sign_ups = 0
    let asks = 0
    let bids = 0
    let sales = 0

    //get # of active users
    return admin.firestore().collection('users').where('last_login', '>=', yesterday).where('last_login', '<', today).get().then(acUsers_res => {
        active_users = acUsers_res.docs.length

        //get # of signups
        return admin.firestore().collection('users').where('creation_date', '>=', yesterday).where('creation_date', '<', today).get().then(signUp_res => {
            sign_ups = signUp_res.docs.length

            //get # of asks
            return admin.firestore().collection('asks').where('created_at', '>=', yesterday).where('created_at', '<', today).get().then(ask_response => {
                asks = ask_response.docs.length

                //get # of bids
                return admin.firestore().collection('bids').where('created_at', '>=', yesterday).where('created_at', '<', today).get().then(bid_response => {
                    bids = bid_response.docs.length

                    //get # of sales
                    return admin.firestore().collection('transactions').where('purchase_date', '>=', yesterday).where('purchase_date', '<', today).get().then(sale_res => {
                        sales = sale_res.docs.length

                        const payload = { "text": `Day ${new Date(yesterday).toISOString().slice(0, 10)}:\n# of Active Users: ${active_users}\n# of Sign Ups: ${sign_ups}\n# of Asks: ${asks}\n# of Bids: ${bids}\n# of Transactions: ${sales}` }

                        console.log(payload)

                        return axios.default({
                            method: 'POST',
                            url: env.slack.daily_report,
                            data: JSON.stringify(payload)
                        }).then((response: any) => {
                            console.log(`Status code: ${response.status}`)
                            return null
                        }).catch((error: any) => {
                            console.log(`Error: ${error}`)
                            return null
                        })
                    })
                        .catch(err => {
                            console.error('Get Sales error: ', err)
                        })
                })
                    .catch(err => {
                        console.error('Get Bids error: ', err)
                    })
            })
                .catch(err => {
                    console.error('Get Asks error: ', err)
                })
        })
            .catch(err => {
                console.error('Get SignUps error: ', err)
            })
    })
        .catch(err => {
            console.error('Get Active Users error: ', err)
        })
})

exports.weekly_report = functions.pubsub.schedule('every monday 00:00').timeZone('America/Edmonton').onRun((context: any) => {
    //get today's and last_week's date
    const date = new Date()
    const tz = date.toLocaleString("en-US", { timeZone: "America/Edmonton", timeZoneName: "short" }).split(" ").slice(-1)[0];
    const dateString = date.toString();
    const offset = Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`);

    const t = new Date()
    const d = new Date(+t.toLocaleString().split(',')[0].split('/')[2], +t.toLocaleString().split(',')[0].split('/')[0] - 1, +t.toLocaleString().split(',')[0].split('/')[1])


    const today = new Date(d.getTime() - offset).getTime()
    const last_week = new Date(d.getTime() - offset).setDate(new Date(d.getTime() - offset).getDate() - 7)

    let active_users = 0
    let sign_ups = 0
    let asks = 0
    let bids = 0
    let sales = 0

    //get # of active users
    return admin.firestore().collection('users').where('last_login', '>=', last_week).where('last_login', '<', today).get().then(acUsers_res => {
        active_users = acUsers_res.docs.length

        //get # of signups
        return admin.firestore().collection('users').where('creation_date', '>=', last_week).where('creation_date', '<', today).get().then(signUp_res => {
            sign_ups = signUp_res.docs.length

            //get # of asks
            return admin.firestore().collection('asks').where('created_at', '>=', last_week).where('created_at', '<', today).get().then(ask_res => {
                asks = ask_res.docs.length

                //get # of bids
                return admin.firestore().collection('bids').where('created_at', '>=', last_week).where('created_at', '<', today).get().then(bid_res => {
                    bids = bid_res.docs.length

                    //get # of sales
                    return admin.firestore().collection('transactions').where('purchase_date', '>=', last_week).where('purchase_date', '<', today).get().then(sale_res => {
                        sales = sale_res.docs.length

                        const payload = { "text": `Week ${new Date(last_week).toISOString().slice(0, 10)} to ${new Date(today).toISOString().slice(0, 10)}:\n# of Active Users: ${active_users}\n# of Sign Ups: ${sign_ups}\n# of Asks: ${asks}\n# of Bids: ${bids}\n# of Transactions: ${sales}` }

                        console.log(payload)

                        return axios.default({
                            method: 'POST',
                            url: env.slack.weekly_report,
                            data: JSON.stringify(payload)
                        }).then((response: any) => {
                            console.log(`Status code: ${response.status}`)
                            return null
                        }).catch((error: any) => {
                            console.log(`Error: ${error}`)
                            return null
                        })
                    })
                        .catch(err => {
                            console.error('Get Sales error: ', err)
                        })
                })
                    .catch(err => {
                        console.error('Get Bids error: ', err)
                    })
            })
                .catch(err => {
                    console.error('Get Asks error: ', err)
                })
        })
            .catch(err => {
                console.error('Get SignUps error: ', err)
            })
    })
        .catch(err => {
            console.error('Get Active Users error: ', err)
        })
})

exports.trendingScoreUpdate = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== 'PATCH') {
            return res.status(200).send(false)
        }

        let score = 0

        return admin.firestore().collection('activity').where('product_id', '==', req.body.product_id).get()
            .then(response => {
                response.docs.forEach(data => {
                    if (data.data().event === "purchase") {
                        score += 100
                    } else if (data.data().event === "ask_placed") {
                        score += 20
                    } else if (data.data().event === "bid_place") {
                        score += 10
                    } else if (data.data().event === "product_view") {
                        score += 5
                    }
                })

                return admin.firestore().collection('products').doc(req.body.product_id).set({
                    trending_score: score
                }, { merge: true })
                    .then(() => {
                        return res.status(200).send(true)
                    })
                    .catch(err => {
                        console.error("Error Updating Trending Score: ", err)
                    })
            })
            .catch(err => {
                console.error("Error Fetching Activities: ", err)
            })
    })
})