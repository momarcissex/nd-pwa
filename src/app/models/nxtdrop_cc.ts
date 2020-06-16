export class NxtdropCC {
    amount: number;
    cardID: string;
    expirationDate: number;
    initiationDate: number;
    reusable: boolean;
    type: 'cash' | 'percent';
    used_by: Array<string>
}