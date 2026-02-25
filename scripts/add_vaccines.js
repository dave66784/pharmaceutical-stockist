const ExcelJS = require('exceljs');
const xml2js = require('xml2js');
const fs = require('fs');

async function processFile() {
    const xmlFile = '/Users/saurabhdave/Developer/Workspace/pharmaceutical-stockist/scripts/cat.xml';
    const xlsxFile = '/Users/saurabhdave/Developer/Workspace/pharmaceutical-stockist/scripts/product_upload_template.xlsx';

    const xmlData = fs.readFileSync(xmlFile, 'utf8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxFile);

    const sheet = workbook.getWorksheet('Products');
    if (!sheet) {
        throw new Error("Could not find 'Products' sheet in the excel file.");
    }

    // items is an array of objects representing the first level
    const mainItems = result.menu.item;

    for (const mainItem of mainItems) {
        const subCategory = mainItem.$['android:title'];

        if (mainItem.menu && mainItem.menu[0] && mainItem.menu[0].item) {
            const subItems = mainItem.menu[0].item;

            for (const subItem of subItems) {
                const title = subItem.$['android:title'];
                // parse title "Name (Manufacturer)"
                const match = title.match(/(.*?)\s*\((.*?)\)/);
                let name = title.trim();
                let manufacturer = '';

                if (match) {
                    name = match[1].trim();
                    manufacturer = match[2].trim();
                }

                // Add row:
                // Name *, Description, Manufacturer, Price *, Stock Quantity *, Category *, Image URL, Prescription Required, Is Bundle Offer, Bundle Buy Quantity, Bundle Free Quantity, Bundle Price, Sub-Category
                sheet.addRow([
                    name,                             // 1: Name
                    `${subCategory} Vaccine`,         // 2: Description
                    manufacturer,                     // 3: Manufacturer
                    50.0,                             // 4: Price
                    100,                              // 5: Stock
                    'Vaccines',                       // 6: Category
                    '',                               // 7: Image URL
                    'TRUE',                           // 8: Prescription Required
                    'FALSE',                          // 9: Is Bundle Offer
                    '',                               // 10: Bundle Buy
                    '',                               // 11: Bundle Free
                    '',                               // 12: Bundle Price
                    subCategory                       // 13: Sub-Category
                ]);
            }
        }
    }

    await workbook.xlsx.writeFile(xlsxFile);
    console.log('Successfully updated template with vaccines!');
}

processFile().catch(console.error);
