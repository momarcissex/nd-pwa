import { NxtdropCC } from './nxtdrop_cc'
import { Ask } from './ask'
import { Bid } from './bid'

export class Transaction {
    buyer_id: string;
    seller_id: string;
    cancellation_note?: string;
    discount?: NxtdropCC | number;
    id: string;
    item: Ask | Bid;
    payment_id: string;
    purchase_date: number;
    shipping_cost?: number;
    ship_tracking: {
        address: {
            city: string,
            country: string,
            street: string,
            line2: string,
            postal_code: string,
            province: string,
            recipient: string,
        },
        carrier?: string,
        label?: string,
        tracking_id?: string
    }
    status: {
        cancelled: boolean,
        delivered: boolean,
        delivered_for_authentication: boolean,
        seller_confirmation?: boolean,
        shipped: boolean,
        shipped_for_verification: boolean,
        verified: boolean,
    }
    total: number;
    transaction_type: "purchase" | "bid_accepted";
}