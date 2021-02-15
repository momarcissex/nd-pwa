export interface User {
    creation_date: number;
    email: string;
    firstName?: string;
    first_name: string;
    isActive?: boolean;
    is_active: boolean;
    lastName?: string;
    last_name: string;
    listed: number;
    offers: number;
    ordered: number;
    sold: number;
    uid: string;
    username: string;

    // Optional
    dob?: string
    free_shipping?: boolean;
    last_login?: number;
    last_known_ip_address?: string;
    last_item_in_cart?: Object;
    shipping_address?: {
        selling?: {
            first_name: string,
            last_name: string,
            street: string,
            line2: string,
            city: string,
            province: string,
            postal_code: string,
            country: string
        },
        buying?: {
            first_name: string,
            last_name: string,
            street: string,
            line2: string,
            city: string,
            province: string,
            postal_code: string,
            country: string
        }
    }
    exp002?: {
        timestamp: number;
        viewed: number;
    }
    recently_viewed?: Array<string>;
}
