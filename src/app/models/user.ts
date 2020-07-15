export interface User {
    uid: string;
    email: string;
    listed: number;
    ordered: number;
    sold: number;
    offers: number;
    isActive: boolean;
    creation_date: number;
    username: string;
    firstName: string;
    lastName: string;

    // Optional
    dob?: string
    freeShipping?: boolean;
    last_login?: number;
    last_known_ip_address?: string;
    last_item_in_cart?: Object;
    shippingAddress?: {
        selling?: {
            firstName: string,
            lastName: string,
            street: string,
            line2: string,
            city: string,
            province: string,
            postalCode: string,
            country: string
        },
        buying?: {
            firstName: string,
            lastName: string,
            street: string,
            line2: string,
            city: string,
            province: string,
            postalCode: string,
            country: string
        }
    }
}
