export type KeyValue = {
    key: string;
    value: string;
};

export type IProductDto = {
    _id?: string;
    isActive: boolean;
    sku: string;
    name: string;
    description: string;
    inStock: boolean;
    stockQuantity: number;
    purchasePrice: number;
    salePrice: number;
    categories: string[];
    images: string[];
    attributes: KeyValue[];
    createdAt?: string;
    updatedAt?: string;
};
