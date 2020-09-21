export class Product {
    productID: string;
    brand: string;
    line: string;
    model: string;
    assetURL: string;
    colorway: string;
    yearMade: string;
    lowestPrice?: number;
    retailPrice?: number;
    sizes: Array<string>;
    SKU?: string;
    size_category: string;
    product_type: string;
    sizes_available?: Array<string>;
    sizes_lowest_ask?: { [key: string]: number };
}
