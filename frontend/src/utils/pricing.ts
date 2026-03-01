export interface Product {
    isBundleOffer: boolean;
    price: number;
    bundleBuyQuantity?: number;
    bundleFreeQuantity?: number;
    bundlePrice?: number;
}

export const calculateItemTotal = (product: Product, quantity: number): number => {
    if (
        product.isBundleOffer &&
        product.bundleBuyQuantity &&
        product.bundleFreeQuantity &&
        product.bundlePrice
    ) {
        const unitSize = product.bundleBuyQuantity + product.bundleFreeQuantity;
        if (quantity >= unitSize) {
            const numBundles = Math.floor(quantity / unitSize);
            const remainder = quantity % unitSize;
            const bundleCost = (numBundles * product.bundlePrice) + (remainder * product.price);
            const fullCost = product.price * quantity;
            // Only apply bundle if it actually saves money
            return bundleCost < fullCost ? bundleCost : fullCost;
        }
    }
    return product.price * quantity;
};

export const calculateItemFreeQuantity = (product: Product, quantity: number): number => {
    if (
        product.isBundleOffer &&
        product.bundleBuyQuantity &&
        product.bundleFreeQuantity
    ) {
        const unitSize = product.bundleBuyQuantity + product.bundleFreeQuantity;
        if (quantity >= unitSize) {
            return Math.floor(quantity / unitSize) * product.bundleFreeQuantity;
        }
    }
    return 0;
};
