import { InitDatabase } from '../startup/database';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { IProductDto, KeyValue } from '../dtos/IProductDto';
import parseBool from '../utils/parseBool';
import { Product, validateProduct } from '../models/product';

createWrapper();

function createWrapper() {
    createAllProducts().then(() => console.log('Products created'));
}

async function createAllProducts(): Promise<void> {
    const db = await InitDatabase();

    if (db) {
        const csvFilePath = path.resolve(__dirname, 'Sample-Products.csv');
        console.log(csvFilePath);
        let hasErrors: boolean = false;
        // let longestName: number = 0;
        // let longestDesc: number = 0;
        // let longestSku: number = 0;

        fs.createReadStream(csvFilePath)
            .pipe(parse({ delimiter: ',', from_line: 2 }))
            .on('data', async function (row: Array<string>) {
                if (hasErrors === false) {
                    const prod: IProductDto = {
                        isActive: false,
                        sku: '',
                        name: '',
                        description: '',
                        stockQuantity: 0,
                        purchasePrice: 0,
                        salePrice: 0,
                        categories: [],
                        images: [],
                        attributes: [],
                    };

                    const csvColumns = 20;

                    for (let col: number = 1; col < csvColumns; col++) {
                        switch (col) {
                            case 1:
                                prod.sku = row[col];

                                // if (prod.sku.length > longestSku) {
                                //     longestSku = prod.sku.length;
                                //     console.log(`Longest Sku: ${longestSku}`);
                                // }
                                break;

                            case 2:
                                prod.name = row[col];

                                // if (prod.name.length > longestName) {
                                //     longestName = prod.name.length;
                                //     console.log(`Longest Name: ${longestName}`);
                                // }
                                break;

                            case 3:
                                prod.isActive = parseBool(row[col]);
                                break;

                            case 4:
                                prod.description = row[col];

                                // if (prod.description.length > longestDesc) {
                                //     longestDesc = prod.description.length;
                                //     console.log(`Longest Desc: ${longestDesc}`);
                                // }
                                break;

                            case 5:
                                prod.stockQuantity = parseInt(row[col]);
                                break;

                            case 6:
                                prod.purchasePrice = Number(row[col].replace(/[^0-9\.-]+/g, ''));
                                break;

                            case 7:
                                prod.salePrice = Number(row[col].replace(/[^0-9\.-]+/g, ''));
                                break;

                            case 8:
                                // Clothing>Men>Tops>Hoodies & Sweatshirts|Clothing>Collections>Eco Friendly|Clothing
                                const categories: Array<string> = row[col].split('|');

                                categories.forEach(function (item: string) {
                                    prod.categories.push(item);
                                });

                                break;

                            case 9:
                                // http://eimages.valtim.com/acme-images/product/m/h/mh01-gray_main.jpg,http://eimages.valtim.com/acme-images/product/m/h/mh01-gray_alt1.jpg,http://eimages.valtim.com/acme-images/product/m/h/mh01-gray_back.jpg
                                const images: Array<string> = row[col].split(',');

                                images.forEach(function (item: string) {
                                    prod.images.push(item);
                                });
                                break;

                            case 10:
                            case 12:
                            case 14:
                            case 16:
                            case 18:
                                if (row[col].length > 0) {
                                    const kvp: KeyValue = {
                                        key: row[col],
                                        value: row[col + 1],
                                    };

                                    prod.attributes.push(kvp);
                                    col++;
                                }
                                break;
                        }
                    }

                    // Now we should have a valid product JSON that we can validate and save to database.

                    const { error } = validateProduct(prod);

                    if (error) {
                        console.log(error.message);
                        hasErrors = true;
                    } else {
                        let product = new Product(prod);
                        product = await product.save();
                        //console.log('Product was added. entityId: ' + product._id);
                    }
                }
            })
            .on('end', function () {
                console.log('finished');
            })
            .on('error', function (error) {
                console.log(error.message);
                console.log('Exiting process');
                process.exit();
            });
    }
}
