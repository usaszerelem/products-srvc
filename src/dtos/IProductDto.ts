export type KeyValue = {
    key: string;
    value: string;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     IProductDto:
 *       required:
 *         - isActive
 *         - sku
 *         - name
 *         - description
 *         - stockQuantity
 *         - purchasePrice
 *         - salePrice
 *         - categories
 *         - images
 *         - attributes
 *       type: object
 *       description: Information provided on a products.
 *       properties:
 *         isActive:
 *           type: boolean
 *           description: Indicates whether this product is active and can be sold.
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (sku) is a unique identifier that retailers assign to products to keep track of stock levels internally. If a product has different colors and sizes, each variation has a unique SKU number.
 *           example: MH01-XS-Black
 *         name:
 *           type: string
 *           description: Name of the product
 *           example: Chaz Kangeroo Hoodie-XS-Black
 *         description:
 *           type: string
 *           description: A product description is a form of marketing copy used to describe and explain the benefits of your product. In other words, it provides all the information and details of your product on your ecommerce site.
 *           example: Ideal for cold-weather training or work outdoors, the Chaz Hoodie promises superior warmth with every wear.
 *         stockQuantity:
 *           type: number
 *           description: Number of items that are in stock.
 *           example: 100
 *         purchasePrice:
 *           type: number
 *           description: Amount each item costs to purchase.
 *           example: 48.10
 *         salePrice:
 *           type: number
 *           description: Amount that each item is made available for purchase.
 *           example: 57.72
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Categories that this product belongs to.
 *           example: ["Clothing>Men>Tops>Hoodies & Sweatshirts", "Clothing>Collections>Eco Friendly", "Clothing"]
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs to various product information images.
 *           example: ["http://eimages.valtim.com/acme-images/product/m/h/mh01-black_main.jpg"]
 *         attributes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *             example:
 *               - key: Size
 *                 value: Medium
 *               - key: Color
 *                 value: Blue
 */

export type IProductDto = {
    _id?: string;
    isActive: boolean;
    sku: string;
    name: string;
    description: string;
    stockQuantity: number;
    purchasePrice: number;
    salePrice: number;
    categories: string[];
    images: string[];
    attributes: KeyValue[];
    createdAt?: string;
    updatedAt?: string;
};
