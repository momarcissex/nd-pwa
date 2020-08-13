export class Product {
    productID: string;
    brand: string;
    line: string;
    model: string;
    assetURL: string;
    colorway: string;
    yearMade: string;
    type: string;
    lowestPrice?: number;
    retailPrice?: number;
    views?: number;
    sizes?: Array<number>;
    SKU?: string;
    size_category?: string;
    product_type?: string;
}
