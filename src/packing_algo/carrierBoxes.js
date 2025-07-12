// Generate the box sizes for the specific carrier
function carrierBoxes(carrier) {
  switch (carrier) {
    case "USPS":
      return [
        // USPS Priority Mail Flat Rate Boxes
        [12.5, 9.5, 5.375, "USPS Small Flat Rate Box", "Flat Rate"],
        [11.875, 3.375, 13.625, "USPS Medium Flat Rate Box 1", "Flat Rate"],
        [11, 8.5, 5.5, "USPS Medium Flat Rate Box 2", "Flat Rate"],
        [12.25, 12, 5.5, "USPS Large Flat Rate Box", "Flat Rate"],
        [23.6875, 11.75, 3, "USPS Board Game Flat Rate Box", "Flat Rate"],
        
        // USPS Priority Mail Regional Rate Boxes
        [10.125, 7.125, 5, "USPS Regional Rate Box A1", "Regional Rate"],
        [10.9375, 8.6875, 2.75, "USPS Regional Rate Box A2", "Regional Rate"],
        [12.25, 10.5, 5.5, "USPS Regional Rate Box B1", "Regional Rate"],
        [14.375, 11.875, 2.75, "USPS Regional Rate Box B2", "Regional Rate"],
        
        // USPS Priority Mail Express Boxes
        [11.625, 8.375, 5.375, "USPS Priority Mail Express Box", "Express"],
        [13.625, 11.875, 3.375, "USPS Priority Mail Express Box 2", "Express"],
        
        // USPS Priority Mail Envelopes
        [12.5, 9.5, 0.5, "USPS Priority Mail Envelope", "Flat Rate Envelope"],
        [15, 9.5, 0.5, "USPS Priority Mail Legal Envelope", "Flat Rate Envelope"],
        [12.5, 9.5, 0.75, "USPS Priority Mail Padded Envelope", "Flat Rate Envelope"],
        [15, 9.5, 0.75, "USPS Priority Mail Legal Padded Envelope", "Flat Rate Envelope"],
        
        // USPS Priority Mail Express Envelopes
        [12.5, 9.5, 0.5, "USPS Priority Mail Express Envelope", "Express Envelope"],
        [15, 9.5, 0.5, "USPS Priority Mail Express Legal Envelope", "Express Envelope"],
        [12.5, 9.5, 0.75, "USPS Priority Mail Express Padded Envelope", "Express Envelope"],
        
        // USPS First-Class Package Service
        [9, 6, 0.25, "USPS First-Class Envelope", "First-Class"],
        [10, 7, 0.5, "USPS First-Class Package", "First-Class"],
        [12, 8, 0.75, "USPS First-Class Large Package", "First-Class"],
        
        // USPS Media Mail Boxes
        [11, 8.5, 5.5, "USPS Media Mail Box - Small", "Media Mail"],
        [12, 12, 5.5, "USPS Media Mail Box - Medium", "Media Mail"],
        [14, 12, 8, "USPS Media Mail Box - Large", "Media Mail"],
        
        // USPS Variable Size Boxes (for custom dimensions)
        [12, 12, 12, "USPS Variable Size - Small", "Variable"],
        [18, 18, 18, "USPS Variable Size - Medium", "Variable"],
        [24, 24, 24, "USPS Variable Size - Large", "Variable"],
        [30, 30, 30, "USPS Variable Size - Extra Large", "Variable"]
      ];
    case "No Carrier":
      return [
        // Small Boxes
        [4, 4, 4, "Small Cube Box", "Box Only Price: $1.25"],
        [6, 6, 4, "Small Box", "Box Only Price: $1.50"],
        [8, 6, 4, "Small Rectangle Box", "Box Only Price: $1.75"],
        [8, 8, 8, "Medium Cube Box", "Box Only Price: $2.25"],
        [9, 6, 6, "Book Box Small", "Box Only Price: $2.00"],
        [10, 8, 6, "Shoe Box", "Box Only Price: $2.50"],
        [12, 9, 6, "Shoebox Large", "Box Only Price: $2.75"],

        // Medium Boxes
        [12, 12, 8, "Medium Square Box", "Box Only Price: $3.25"],
        [14, 14, 14, "Large Cube Box", "Box Only Price: $4.25"],
        [16, 12, 8, "Medium Moving Box", "Box Only Price: $3.75"],
        [18, 14, 12, "Medium Large Box", "Box Only Price: $4.50"],
        [18, 18, 16, "Extra Large Cube Box", "Box Only Price: $5.25"],
        [20, 20, 20, "Giant Cube Box", "Box Only Price: $6.50"],

        // Large Boxes
        [20, 16, 12, "Large Box", "Box Only Price: $4.75"],
        [22, 22, 22, "Extra Large Cube", "Box Only Price: $7.25"],
        [24, 18, 18, "Large Moving Box", "Box Only Price: $5.50"],
        [24, 24, 24, "XXL Cube Box", "Box Only Price: $8.25"],
        [28, 16, 16, "Large Storage Box", "Box Only Price: $6.25"],
        [30, 18, 18, "Extra Large Moving Box", "Box Only Price: $7.50"],

        // Extra Large Boxes
        [36, 24, 24, "Wardrobe Box", "Box Only Price: $12.50"],
        [40, 22, 22, "Large Equipment Box", "Box Only Price: $14.75"],
        [48, 24, 24, "Extra Large Storage Box", "Box Only Price: $16.50"],

        // Specialty Boxes
        [24, 14, 6, "Keyboard Box", "Box Only Price: $4.25"],
        [28, 20, 6, "Monitor Box Small", "Box Only Price: $6.75"],
        [32, 24, 6, "Monitor Box Large", "Box Only Price: $8.50"],
        [40, 30, 6, "TV Box Medium", "Box Only Price: $12.75"],
        [48, 32, 6, "TV Box Large", "Box Only Price: $16.50"],
        [60, 40, 6, "TV Box Extra Large", "Box Only Price: $22.50"],

        // Picture and Mirror Boxes
        [30, 20, 4, "Picture Box Small", "Box Only Price: $5.25"],
        [36, 24, 4, "Picture Box Medium", "Box Only Price: $6.75"],
        [48, 32, 4, "Picture Box Large", "Box Only Price: $9.50"],
        [60, 40, 4, "Picture Box Extra Large", "Box Only Price: $12.75"],

        // Long Boxes and Tubes
        [36, 6, 6, "Tube Box Small", "Box Only Price: $4.50"],
        [48, 6, 6, "Tube Box Medium", "Box Only Price: $5.75"],
        [60, 6, 6, "Tube Box Large", "Box Only Price: $7.25"],
        [72, 8, 8, "Long Box Extra Large", "Box Only Price: $9.50"],

        // Specialty Item Boxes
        [24, 16, 16, "Computer Box", "Box Only Price: $8.25"],
        [40, 12, 12, "Golf Club Box", "Box Only Price: $11.50"],
        [54, 8, 32, "Bike Box", "Box Only Price: $18.75"],
        [15, 15, 15, "File Box", "Box Only Price: $4.75"],
        [18, 18, 28, "Wine Box 2-Bottle", "Box Only Price: $6.25"],
        [18, 18, 42, "Wine Box 3-Bottle", "Box Only Price: $7.50"],

        // Heavy-Duty Boxes
        [16, 16, 16, "Heavy Duty Small", "Box Only Price: $5.25"],
        [18, 18, 18, "Heavy Duty Medium", "Box Only Price: $6.50"],
        [24, 24, 24, "Heavy Duty Large", "Box Only Price: $8.75"],
        [30, 30, 30, "Heavy Duty Extra Large", "Box Only Price: $12.50"],

        // Book and Media Boxes
        [12, 9, 6, "Book Box Medium", "Box Only Price: $3.25"],
        [15, 12, 10, "Book Box Large", "Box Only Price: $4.50"],
        [20, 12, 12, "Media Box", "Box Only Price: $5.25"],

        // Dish Pack and Kitchen Boxes
        [18, 18, 18, "Dish Pack Box", "Box Only Price: $7.25"],
        [24, 24, 24, "Kitchen Box Large", "Box Only Price: $8.50"],
        [16, 16, 16, "Kitchen Box Medium", "Box Only Price: $6.25"],

        // Mailers and Flat Boxes
        [12, 9, 2, "Large Letter Mailer", "Box Only Price: $1.75"],
        [15, 12, 3, "Document Box", "Box Only Price: $2.25"],
        [20, 16, 4, "Flat Item Box", "Box Only Price: $3.50"],
        [24, 18, 4, "Large Flat Box", "Box Only Price: $4.25"],

        // Standard Envelopes and Paks
        [10, 7, 0.25, "Small Envelope", "Box Only Price: $0.75"],
        [12.5, 9.5, 0.25, "Standard Envelope", "Box Only Price: $0.95"],
        [15, 9.5, 0.25, "Legal Envelope", "Box Only Price: $1.15"],
        [12.5, 9.5, 0.5, "Padded Envelope", "Box Only Price: $1.45"],
        [14.75, 11.5, 1, "Bubble Mailer - Small", "Box Only Price: $1.75"],
        [19, 12.5, 1.5, "Bubble Mailer - Large", "Box Only Price: $2.25"],
        [14.75, 11.5, 0.75, "Poly Mailer - Small", "Box Only Price: $1.25"],
        [19, 12.5, 0.75, "Poly Mailer - Large", "Box Only Price: $1.75"],
        [24, 14, 1, "Poly Mailer - Extra Large", "Box Only Price: $2.25"],
      ];
    case "USPS":
      return [
        // Priority Mail Flat Rate Boxes
        [8.6875, 5.4375, 1.75, "Priority Mail Flat Rate Small Box", "Free with Service"],
        [11, 8.5, 5.5, "Priority Mail Flat Rate Medium Box 1", "Free with Service"],
        [13.625, 11.875, 3.375, "Priority Mail Flat Rate Medium Box 2", "Free with Service"],
        [12.25, 12, 6, "Priority Mail Flat Rate Large Box", "Free with Service"],
        [23.6875, 11.75, 3, "Priority Mail Flat Rate Board Game Box", "Free with Service"],
        [23.6875, 11.75, 12, "Priority Mail Flat Rate Large Board Game Box", "Free with Service"],

        // Priority Mail Large and Extra Large Boxes
        [24, 18, 18, "Priority Mail Extra Large Box 1", "Free with Service"],
        [24, 24, 24, "Priority Mail Extra Large Box 2", "Free with Service"],
        [30, 20, 20, "Priority Mail Large Military Box", "Free with Service"],
        [20, 20, 15, "Priority Mail Large Cube Box", "Free with Service"],

        // Priority Mail Regional Rate Boxes
        [10.125, 7.125, 5, "Priority Mail Regional Rate Box A1", "Free with Service"],
        [13.0625, 11.0625, 2.5, "Priority Mail Regional Rate Box A2", "Free with Service"],
        [16.25, 14.5, 6, "Priority Mail Regional Rate Box B1", "Free with Service"],
        [12, 10.25, 5, "Priority Mail Regional Rate Box B2", "Free with Service"],

        // Priority Mail Express Boxes
        [11.75, 8.75, 5.75, "Priority Mail Express Medium Box", "Free with Service"],
        [14.5, 11.75, 2.375, "Priority Mail Express Flat Rate Box", "Free with Service"],
        [12.25, 12.25, 6, "Priority Mail Express Box - 1095", "Free with Service"],
        [13.625, 11.875, 3.375, "Priority Mail Express Box - 1097", "Free with Service"],

        // Priority Mail Standard Boxes
        [7.25, 7.25, 6.5, "Priority Mail Medium Cube-Shaped Box", "Free with Service"],
        [9.4375, 6.4375, 2.1875, "Priority Mail Small Box", "Free with Service"],
        [13.4375, 11.625, 2.5, "Priority Mail Medium Box 2", "Free with Service"],
        [12.25, 12, 8.5, "Priority Mail Large Box", "Free with Service"],
        [14.875, 5.25, 7.375, "Priority Mail Shoe Box", "Free with Service"],
        [8.75, 5.5625, 0.875, "Priority Mail DVD Box", "Free with Service"],

        // Priority Mail Tube Boxes
        [25.5625, 6, 5.25, "Priority Mail Small Tube Box", "Free with Service"],
        [38.0625, 6.25, 4.25, "Priority Mail Medium Tube Box", "Free with Service"],
        [48, 6, 6, "Priority Mail Large Tube Box", "Free with Service"],

        // Priority Mail Envelopes and Paks
        [12.5, 9.5, 0.5, "Priority Mail Flat Rate Envelope", "Free with Service"],
        [15, 9.5, 0.5, "Priority Mail Legal Flat Rate Envelope", "Free with Service"],
        [12.5, 9.5, 1, "Priority Mail Padded Flat Rate Envelope", "Free with Service"],
        [10, 7, 0.5, "Priority Mail Small Flat Rate Envelope", "Free with Service"],

        // Priority Mail Express Envelopes
        [15.5, 12.5, 0.5, "Priority Mail Express Envelope", "Free with Service"],
        [15, 9.5, 0.5, "Priority Mail Express Legal Envelope", "Free with Service"],
        [12.5, 9.5, 1, "Priority Mail Express Padded Envelope", "Free with Service"],

        // First-Class Mail Envelopes
        [11.5, 6.125, 0.25, "First-Class Mail Large Envelope", "Free with Service"],
        [10, 5, 0.25, "First-Class Mail Envelope", "Free with Service"],

        // First Class Envelopes and Paks (Available for Purchase)
        [11.5, 9, 0.25, "USPS First Class Envelope", "Box Only Price: $0.95"],
        [15, 9.5, 0.25, "USPS First Class Legal Envelope", "Box Only Price: $1.15"],
        [12.5, 9.5, 0.5, "USPS First Class Padded Envelope", "Box Only Price: $1.75"],
        [15.5, 12, 0.75, "USPS First Class Bubble Mailer", "Box Only Price: $1.95"],
        [19, 12.5, 1, "USPS First Class Poly Mailer", "Box Only Price: $1.50"],
      ];
    case "FedEx":
      return [
        // FedEx Envelopes and Paks (Box-only prices)
        [9.5, 12.5, 1, "FedEx Envelope", "Free with Service"],
        [9.5, 15.5, 1, "FedEx Legal Envelope", "Free with Service"],
        [9.75, 11.5, 1, "FedEx Clinical Pak", "Box Only Price: $3.65"],
        [10.25, 12.75, 1, "FedEx Pak", "Box Only Price: $1.65"],
        [12, 15.5, 3, "FedEx Large Pak", "Box Only Price: $2.05"],
        [11.75, 14.75, 1.5, "FedEx Padded Pak", "Box Only Price: $2.05"],

        // FedEx Boxes - Standard (Box-only prices)
        [12.375, 10.875, 1.5, "FedEx Small Box", "Box Only Price: $1.95"],
        [13.25, 11.5, 2.375, "FedEx Medium Box", "Box Only Price: $2.35"],
        [17.5, 12.375, 3, "FedEx Large Box", "Box Only Price: $2.75"],
        [11.875, 11, 10.375, "FedEx Extra Large Box", "Box Only Price: $3.15"],

        // FedEx Specialty Boxes (Box-only prices)
        [6, 6, 38, "FedEx Tube", "Box Only Price: $5.05"],
        [15, 15, 48, "FedEx Golf Club Box", "Box Only Price: $12.95"],
        [54, 8, 32, "FedEx Bike Box", "Box Only Price: $21.95"],
        [20, 8, 50, "FedEx Guitar Box", "Box Only Price: $18.95"],
        [38, 8, 26, "FedEx TV Box Small", "Box Only Price: $15.95"],
        [46, 8, 30, "FedEx TV Box Medium", "Box Only Price: $19.95"],
        [56, 8, 36, "FedEx TV Box Large", "Box Only Price: $24.95"],
        [24, 16, 16, "FedEx Computer Box", "Box Only Price: $8.95"],
        [18, 18, 28, "FedEx Wine Box - 2 Bottles", "Box Only Price: $10.95"],
        [18, 18, 42, "FedEx Wine Box - 3 Bottles", "Box Only Price: $12.95"],
        [24, 20, 12, "FedEx Picture Box Small", "Box Only Price: $9.95"],
        [36, 24, 12, "FedEx Picture Box Medium", "Box Only Price: $14.95"],
        [48, 32, 12, "FedEx Picture Box Large", "Box Only Price: $19.95"],

        // API Box Sizes from FedEx
        [10.9, 1.5, 12.3, "FedEx Small Box", "FedEx One Rate: From $12.95"],
        [11.5, 2.4, 13, "FedEx Medium Box", "FedEx One Rate: From $18.25"],
        [12.4, 3, 17.9, "FedEx Large Box", "FedEx One Rate: From $24.45"],
        [15.75, 14.13, 6, "FedEx Extra Large Box", "FedEx One Rate: From $24.45"],
        [38,6,6, "FedEx Tube", "FedEx One Rate: From $22.85"],

        // FEDEX_10KG_BOX : Designed for shipments up to 10 kg (22 lbs).
        // FEDEX_25KG_BOX: Designed for shipments up to 25 kg (55 lbs).

        // From https://www.fedex.com/en-us/shipping/packing/supplies/boxes.html
        [8,8,8, "FedEx Small Box", "Box Only Price: $1.75"],
        [12,12,18,"FedEx Store Box", "Box Only Price: $3.75"],
        [13,9,11,"FedEx Standard Box", "Box Only Price: $2.75"],
        [16,16,16,"FedEx Standard Box", "Box Only Price: $4.29"],
        [14,14,14,"FedEx Standard Box", "Box Only Price: $3.75"],
        [14,14,14,"FedEx Standard Box", "Box Only Price: $6.29"],
        [23,17,12,"FedEx Standard Box", "Box Only Price: $4.75"],
        [12,9,6,"FedEx Standard In-Store Box", "Box Only Price: $3.75"],
        [11,11,11,"FedEx Standard In-Store Box", "Box Only Price: $2.50"],
        [17,17,7,"FedEx Standard In-Store Box", "Box Only Price: $3.25"],
        [20,20,12,"FedEx Standard In-Store Box", "Box Only Price: $4.50"],
        [11,11,11,"FedEx Standard In-Store Box", "Box Only Price: $2.50"],
        [22,22,22,"FedEx Standard In-Store Box", "Box Only Price: $7.00"],
        [18,13,11.75,"FedEx Standard In-Store Box", "Box Only Price: $2.50"],

        // FedEx Freight
        [48, 48, 5.5, "FedEx Freight Box 48x40", "Contact FedEx Store for price"],
        [48, 48, 6, "FedEx Freight Box 48x40", "Contact FedEx Store for price"]
      ];
    case "UPS":
      return [
        // These are standard UPS box sizes - DO NOT MODIFY
        [6, 6, 6, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [6, 6, 48, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [8, 8, 8, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [10, 10, 10, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [12, 12, 6, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [12, 12, 12, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [14, 14, 14, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [15, 12, 10, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [15, 15, 48, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [16, 16, 4, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [16, 16, 16, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [17, 11, 8, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [18, 18, 18, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [20, 12, 12, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [20, 20, 12, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [20, 20, 20, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [24, 18, 6, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [24, 18, 18, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [24, 24, 16, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [24, 24, 24, "UPS Standard Box", "Contact your local UPS Store® for box price"],
        [30, 24, 6, "UPS Standard Box", "Contact your local UPS Store® for box price"],

        // Express Boxes
        [13, 11, 2, "UPS Express Box - Small", "Free with Express Service"],
        [16, 11, 3, "UPS Express Box - Medium", "Free with Express Service"],
        [18, 13, 3, "UPS Express Box - Large", "Free with Express Service"],
        
        // Express Tubes and Paks
        [38, 3.5, 3.5, "UPS Express Tube", "Free with Express Service"],
        [12.5, 9.5, 0.25, "UPS Express Envelope", "Free with Express Service"],
        [15, 9.5, 0.25, "UPS Express Legal Envelope", "Free with Express Service"],
        [14.75, 11.5, 2, "UPS Express Pak", "Free with Express Service"],
        [16, 13, 2, "UPS Laboratory Pak", "Free with Express Service"],
        
        // Standard Envelopes and Paks (Available for Purchase)
        [12.5, 9.5, 0.25, "UPS Standard Envelope", "Box Only Price: $1.25"],
        [15, 9.5, 0.25, "UPS Legal Envelope", "Box Only Price: $1.50"],
        [14.75, 11.5, 1, "UPS Padded Envelope", "Box Only Price: $2.25"],
        [16, 11.75, 1.5, "UPS Poly Mailer", "Box Only Price: $1.95"],
        [19, 12.5, 2, "UPS Bubble Mailer", "Box Only Price: $2.75"],
        
        // Reusable Express Boxes
        [11.75, 11, 2, "UPS Small Express Box", "Free with Express Service"],
        [13.25, 11.5, 3, "UPS Medium Express Box", "Free with Express Service"],
        [17.25, 13, 3, "UPS Large Express Box", "Free with Express Service"],
        [24, 18, 18, "UPS Extra Large Express Box", "Free with Express Service"],

        // Simple Rate Boxes (Fixed Rate Shipping)
        [11, 8, 2, "UPS Simple Rate - Extra Small", "Box Only Price: $2.85"],
        [13, 11, 2, "UPS Simple Rate - Small", "Box Only Price: $3.15"],
        [16, 11, 3, "UPS Simple Rate - Medium", "Box Only Price: $3.45"],
        [18, 13, 3, "UPS Simple Rate - Large", "Box Only Price: $3.95"],
        [21, 16, 15, "UPS Simple Rate - Extra Large", "Box Only Price: $4.95"],

        // Standard UPS Store Boxes
        [8, 6, 4, "UPS Store Box - Extra Small", "Box Only Price: $2.85"],
        [13, 11, 2, "UPS Store Box - Small", "Box Only Price: $3.15"],
        [16, 13, 3, "UPS Store Box - Medium", "Box Only Price: $3.45"],
        [18, 13, 3, "UPS Store Box - Large", "Box Only Price: $3.95"],
        [24, 18, 18, "UPS Store Box - Extra Large", "Box Only Price: $4.95"],

        // Specialty Boxes
        [37, 4.5, 4.5, "UPS Store Express Tube", "Box Only Price: $6.95"],
        [48, 8, 6, "UPS Store Golf Club Box", "Box Only Price: $15.95"],
        [54, 8, 28, "UPS Store Bike Box", "Box Only Price: $24.95"],
        [48, 32, 8, "UPS Store TV Box - 42\"", "Box Only Price: $19.95"],
        [56, 36, 8, "UPS Store TV Box - 55\"", "Box Only Price: $24.95"],
        [65, 43, 8, "UPS Store TV Box - 70\"", "Box Only Price: $29.95"],
        [28, 15, 15, "UPS Store Laptop Box", "Box Only Price: $9.95"],
        [24, 16, 16, "UPS Store Desktop Box", "Box Only Price: $12.95"],

        // Heavy-Duty Boxes
        [16, 16, 16, "UPS Store Heavy-Duty - Small", "Box Only Price: $6.95"],
        [18, 18, 18, "UPS Store Heavy-Duty - Medium", "Box Only Price: $7.95"],
        [24, 24, 24, "UPS Store Heavy-Duty - Large", "Box Only Price: $9.95"],
        [30, 30, 30, "UPS Store Heavy-Duty - XL", "Box Only Price: $12.95"],

        // Picture and Art Boxes
        [24, 20, 12, "UPS Store Picture Box - Small", "Box Only Price: $11.95"],
        [36, 24, 12, "UPS Store Picture Box - Medium", "Box Only Price: $15.95"],
        [48, 32, 12, "UPS Store Picture Box - Large", "Box Only Price: $19.95"],

        // Wine Shipping Boxes
        [18, 18, 28, "UPS Store Wine Box - 2 Bottle", "Box Only Price: $14.95"],
        [18, 18, 42, "UPS Store Wine Box - 3 Bottle", "Box Only Price: $16.95"],

        // UPS Freight
        [48, 48, 5.5, "UPS Freight Box 48x40", "Contact UPS Store for price"],
        [48, 48, 6, "UPS Freight Box 48x40", "Contact UPS Store for price"]
      ];
    default:
      return [
        [12, 12, 12, "Standard box", "Contact carrier for price"]
      ];
  }
}

export { carrierBoxes };
