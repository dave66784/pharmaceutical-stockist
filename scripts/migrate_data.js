const ExcelJS = require('exceljs');

async function migrateData() {
    const oldFile = '/Users/saurabhdave/Developer/Workspace/pharmaceutical-stockist/scripts/product_upload_template.xlsx';
    const newFile = '/Users/saurabhdave/Developer/Workspace/pharmaceutical-stockist/scripts/product_upload_template_v1.xlsx';

    const oldWorkbook = new ExcelJS.Workbook();
    await oldWorkbook.xlsx.readFile(oldFile);
    const oldSheet = oldWorkbook.getWorksheet('Products');

    const newWorkbook = new ExcelJS.Workbook();
    await newWorkbook.xlsx.readFile(newFile);
    const newSheet = newWorkbook.getWorksheet('Products');

    if (!oldSheet || !newSheet) {
        throw new Error("Could not find 'Products' sheet in one of the files.");
    }

    // Copy rows from old to new, skipping the header (row 1)
    let addedCount = 0;
    oldSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            // Get row values as an array. ExcelJS typically returns an array where index 0 is empty (1-based), 
            // but addRow takes a standard 0-based array or an object. Let's slice from 1 to avoid the empty first element.
            const rowValues = row.values;
            const valuesToInsert = Array.isArray(rowValues) ? rowValues.slice(1) : rowValues;
            newSheet.addRow(valuesToInsert);
            addedCount++;
        }
    });

    await newWorkbook.xlsx.writeFile(newFile);
    console.log(`Successfully migrated ${addedCount} products to the new template!`);
}

migrateData().catch(console.error);
