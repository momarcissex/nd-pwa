export interface User {
    creation_date: number;
    email: string;
    firstName: string;
    isActive: boolean;
    lastName: string;
    listed: number;
    offers: number;
    ordered: number;
    sold: number;
    uid: string;
    username: string;

    // Optional
    dob?: string
    freeShipping?: boolean;
    last_item_in_cart?: Object;
    last_known_ip_address?: string;
    last_login?: number;
    recently_viewed?: string[];
    shippingAddress?: {
        buying?: {
            city: string,
            country: string,
            firstName: string,
            lastName: string,
            line2: string,
            postalCode: string,
            province: string,
            street: string
        },
        selling?: {
            city: string,
            country: string,
            firstName: string,
            lastName: string,
            line2: string,
            postalCode: string,
            province: string,
            street: string
        }
    }
    exp002?: {
        timestamp: number;
        viewed: number;
    }
}
