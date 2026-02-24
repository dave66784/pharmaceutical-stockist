# Product Upload Template

Download this template, fill it with your product data, and upload it via the Admin Dashboard.

## Excel Format

The file should have the following columns (in this exact order):

| Column | Name | Type | Required | Example |
|--------|------|------|----------|---------|
| A | Name | Text | Yes | Paracetamol 500mg |
| B | Description | Text | No | Pain relief tablets |
| C | Manufacturer | Text | No | PharmaCo |
| D | Price | Number | Yes | 5.99 |
| E | Stock Quantity | Number | Yes | 100 |
| F | Category | Text | Yes | PAIN_RELIEF |
| G | Image URL | Text | No | https://example.com/image.jpg |
| H | Prescription Required | Boolean | No | false |
| I | Is Bundle Offer | Boolean | No | true |
| J | Bundle Buy Quantity | Number | No | 10 |
| K | Bundle Free Quantity | Number | No | 2 |
| L | Bundle Price | Number | No | 50.00 |

## Valid Categories

- PAIN_RELIEF
- ANTIBIOTICS
- VITAMINS
- COLD_FLU
- DIGESTIVE
- DIABETES
- CARDIOVASCULAR
- SKINCARE
- FIRST_AID
- VACCINES
- OTHER

## Sample Data

```
Name,Description,Manufacturer,Price,Stock Quantity,Category,Image URL,Prescription Required,Is Bundle Offer,Bundle Buy Quantity,Bundle Free Quantity,Bundle Price
Paracetamol 500mg,Pain relief tablets,PharmaCo,5.99,100,PAIN_RELIEF,https://example.com/paracetamol.jpg,false,true,10,2,50.00
Vitamin C 1000mg,Immune support,VitaCo,12.99,50,VITAMINS,https://example.com/vitaminc.jpg,false,false,,,
Amoxicillin 500mg,Antibiotic capsules,AntibioMed,25.00,30,ANTIBIOTICS,https://example.com/amoxicillin.jpg,true,false,,,
COVID-19 Vaccine,mRNA vaccine,VaxCorp,0.00,200,VACCINES,,true,false,,,
```

## Notes

- The first row must be the header row
- Prescription Required can be: true, false, yes, no, 1, 0
- Price must be a positive number
- Stock Quantity must be a non-negative integer
- If validation errors occur during upload, you'll receive a detailed error message
