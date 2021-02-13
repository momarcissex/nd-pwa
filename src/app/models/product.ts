export class Product {
    product_id: string;
    brand: string;
    line: string;
    model: string;
    asset_url: string;
    colorway: string;
    release_date: string;
    lowest_price?: number;
    retail_price?: number;
    sizes: Array<string>;
    SKU?: string;
    size_category: string;
    product_type: string;
    sizes_available?: Array<string>;
    sizes_lowest_ask?: { [key: string]: number };
    collections?: Array<string>;
}
