
'use server';

/**
 * @fileOverview This file defines a Genkit flow for scanning trade letters and extracting campaign details.
 *
 * - scanTradeLetter - A function that accepts a trade letter (as a data URI) and returns extracted campaign details.
 * - ScanTradeLetterInput - The input type for the scanTradeLetter function.
 * - ScanTradeLetterOutput - The return type for the scanTradeLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanTradeLetterInputSchema = z.object({
  tradeLetterDataUri: z
    .string()
    .describe(
      "The trade letter as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanTradeLetterInput = z.infer<typeof ScanTradeLetterInputSchema>;

const ProductPromotionSchema = z.object({
    barcode: z.string().describe("The product's barcode."),
    productName: z.string().describe("The name of the specific product."),
    srp: z.coerce.number().describe('The Suggested Retail Price (VAT inclusive).'),
    discountedPrice: z.number().describe('The final price after discount.').optional(),
    discountValue: z.number().describe('The value of the discount.').optional(),
    discountPercentage: z.number().describe('The discount percentage.').optional(),
});

const ScanTradeLetterOutputSchema = z.object({
  campaignDetails: z.object({
    brandName: z.string().optional().describe('The brand name associated with the campaign.'),
    programName: z.string().optional().describe('The name of the program or campaign.'),
    startDate: z.string().optional().describe('The start date of the campaign (YYYY-MM-DD).'),
    endDate: z.string().optional().describe('The end date of the campaign (YYYY-MM-DD).'),
    objectives: z.string().optional().describe('The objectives of the campaign.'),
    tradeLetterDate: z.string().optional().describe('The date on the trade letter (YYYY-MM-DD).'),
    distributor: z.string().optional().describe('The name of the distributor.'),
    promotionDuration: z.string().optional().describe('The duration of the promotion (e.g., "30 days", "1 month").'),
    website: z.string().optional().describe('The website for the promotion, if any.'),
    remarks: z.string().optional().describe('Any remarks or notes from the trade letter.'),
    promotions: z.array(ProductPromotionSchema).optional().describe('A list of products and their promotion details. Extract barcode, product name, SRP (vat inc), and discounted price. Also extract discount value and discount percentage if they are explicitly mentioned.'),
    approvers: z.array(z.string()).optional().describe('List of undersigned or approvers mentioned in the document.'),
  }),
});

export type ScanTradeLetterOutput = z.infer<typeof ScanTradeLetterOutputSchema>;

export async function scanTradeLetter(input: ScanTradeLetterInput): Promise<ScanTradeLetterOutput> {
  return scanTradeLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanTradeLetterPrompt',
  input: {schema: ScanTradeLetterInputSchema},
  output: {schema: ScanTradeLetterOutputSchema},
  prompt: `You are an expert marketing assistant. Your job is to extract relevant campaign details from a trade letter. The trade letter will be passed to you as a data URI. Extract the following information and return it as a JSON object.

- Brand Name: The brand name of the product or company in the trade letter.
- Program Name: The name of the marketing program or campaign.
- Start Date: The start date of the campaign. Format this as YYYY-MM-DD.
- End Date: The end date of the campaign. Format as YYYY-MM-DD.
- Objectives: What are the objectives of the campaign?
- Trade Letter Date: The date written on the trade letter. Format as YYYY-MM-DD.
- Distributor: The name of the distributor.
- Promotion Duration: The total duration of the promo (e.g., "30 days").
- Website: The promotional website, if mentioned.
- Remarks: Any other notes or remarks from the document.
- Promotions: A list of all products with their specific promotion details. This might be in a table. For each product, extract:
  - Barcode
  - Product Name
  - SRP (vat inc): Suggested Retail Price, VAT inclusive.
  - Discounted Price: The final price for the customer.
  - Discount Value: The value of the discount, if explicitly mentioned.
  - Discount %: The percentage of the discount, if explicitly mentioned.
- Approvers: A list of names of the undersigned or approvers.

Here is the trade letter:

{{media url=tradeLetterDataUri}}
`,
});

const scanTradeLetterFlow = ai.defineFlow(
  {
    name: 'scanTradeLetterFlow',
    inputSchema: ScanTradeLetterInputSchema,
    outputSchema: ScanTradeLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    if (output?.campaignDetails?.promotions) {
        output.campaignDetails.promotions = output.campaignDetails.promotions.map(promo => {
            const newPromo = {...promo};
            if (typeof newPromo.srp === 'number' && typeof newPromo.discountedPrice === 'number') {
                // Only calculate if not already present
                if (newPromo.discountValue === undefined || newPromo.discountValue === null) {
                    newPromo.discountValue = newPromo.srp - newPromo.discountedPrice;
                }
                if (newPromo.discountPercentage === undefined || newPromo.discountPercentage === null) {
                    if (newPromo.srp > 0) {
                        newPromo.discountPercentage = ((newPromo.srp - newPromo.discountedPrice) / newPromo.srp) * 100;
                    } else {
                        newPromo.discountPercentage = 0;
                    }
                }
            }
            return newPromo;
        });
    }

    return output!;
  }
);
