export class Transaction {
    id?: string;
    assetURL: string;
    boughtAt?: number;
    soldAt?: number;
    purchaseDate: number;
    cancellationNote?: string;
    buyerID: string;
    condition: string;
    listedAt: number;
    listingID?: string;
    offerID?: string;
    model: string;
    paymentID: string;
    price: number;
    productID: string;
    sellerID: string;
    shippingCost?: number;
    discount?: number;
    total: number;
    size: string;
    status: {
        cancelled: boolean,
        delivered: boolean,
        deliveredForAuthentication: boolean,
        shipped: boolean,
        shippedForVerification: boolean,
        verified: boolean,
        sellerConfirmation?: boolean
    };
    type: string;
}