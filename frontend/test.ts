import { productService } from './src/services/productService.js';
import axios from 'axios';

// Mock api setup for node environment
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

productService.getProductsByCategory = async (category, page = 0, size = 12, subCategories = []) => {
    const params: any = { page, size };
    if (subCategories && subCategories.length > 0) {
        params.subCategory = subCategories.join(',');
    }
    console.log("Fetching by category:", category, "params:", params, "subCategories provided:", subCategories);
    const response = await api.get(`/products/category/${category}`, {
        params,
    });
    return response.data;
};

async function test() {
    const result = await productService.getProductsByCategory('VACCINES', 0, 12, ['Tdap']);
    console.log("Returned products count:", result.data.content.length);
    console.log("Names:", result.data.content.map(p => p.name));
}

test().catch(console.error);
