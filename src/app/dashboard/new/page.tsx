'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Upload, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { scanTradeLetter } from '@/ai/flows/trade-letter-scanner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mockCampaigns } from '@/lib/mock-data'
import type { Campaign } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CAMPAIGN_TYPES } from '@/lib/types'

const productPromotionSchema = z.object({
  barcode: z.string(),
  productName: z.string(),
  srp: z.coerce.number(),
  discountedPrice: z.preprocess((val) => (val === "" || val == null ? undefined : val), z.coerce.number().optional()),
  discountValue: z.preprocess((val) => (val === "" || val == null ? undefined : val), z.coerce.number().optional()),
  discountPercentage: z.preprocess((val) => (val === "" || val == null ? undefined : val), z.coerce.number().optional()),
});

const campaignSchema = z.object({
  programName: z.string().min(1, 'Program name is required'),
  brandName: z.string().optional(),
  campaignType: z.enum(CAMPAIGN_TYPES, {
    required_error: "Please select a campaign type.",
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  objectives: z.string().min(1, 'Objectives are required'),
  tradeLetterDate: z.string().optional(),
  distributor: z.string().optional(),
  promotionDuration: z.string().optional(),
  website: z.string().optional(),
  extractedRemarks: z.string().optional(),
  promotions: z.array(productPromotionSchema).optional(),
  approvers: z.array(z.string()).optional(),
  tradeLetterDataUri: z.string().optional(),
})

type CampaignFormValues = z.infer<typeof campaignSchema>

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [fileName, setFileName] = useState('')

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      programName: '',
      brandName: '',
      campaignType: undefined,
      startDate: '',
      endDate: '',
      objectives: '',
      tradeLetterDate: '',
      distributor: 'Great Deals Ecommerce Corp',
      promotionDuration: '',
      website: '',
      extractedRemarks: '',
      promotions: [],
      approvers: [],
      tradeLetterDataUri: '',
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "promotions"
  });

  const tradeLetterDataUri = form.watch('tradeLetterDataUri');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsScanning(true)
    
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const dataUri = reader.result as string
      form.setValue('tradeLetterDataUri', dataUri);
      try {
        const result = await scanTradeLetter({ tradeLetterDataUri: dataUri })
        const details = result.campaignDetails
        
        form.reset({
          ...form.getValues(),
          programName: details.programName,
          brandName: details.brandName,
          startDate: details.startDate,
          endDate: details.endDate,
          objectives: details.objectives,
          tradeLetterDate: details.tradeLetterDate,
          distributor: details.distributor || 'Great Deals Ecommerce Corp',
          promotionDuration: details.promotionDuration,
          website: details.website || '',
          extractedRemarks: details.remarks || '',
          promotions: details.promotions || [],
          approvers: details.approvers || [],
          tradeLetterDataUri: dataUri,
        })

        toast({
          title: 'Scan Successful!',
          description: 'Campaign details have been pre-filled from the trade letter.',
        })
      } catch (error) {
        console.error('Error scanning trade letter:', error)
        toast({
          variant: 'destructive',
          title: 'Scan Failed',
          description: 'Could not extract details from the uploaded file. Please fill the form manually.',
        })
      } finally {
        setIsScanning(false)
      }
    }
  }

  const getCampaignsFromStorage = (): Campaign[] => {
    try {
        const storedCampaignsJson = localStorage.getItem('campaigns');
        if (!storedCampaignsJson || storedCampaignsJson === 'undefined') {
            throw new Error('Campaigns not found in localStorage');
        }
        return JSON.parse(storedCampaignsJson);
    } catch (error) {
        console.warn('Could not load campaigns from localStorage. Initializing with mock data and returning that.', error);
        localStorage.setItem('campaigns', JSON.stringify(mockCampaigns));
        return mockCampaigns;
    }
  }

  const onSubmit = (data: CampaignFormValues) => {
    const campaigns = getCampaignsFromStorage();
    
    const { tradeLetterDataUri, ...campaignData } = data;
    const newCampaignId = `CAM-${Date.now().toString(36).toUpperCase()}`;

    const newCampaign: Campaign = {
        ...campaignData,
        id: newCampaignId,
        status: 'Submitted',
        createdBy: 'commercial@demo.com',
        createdAt: new Date().toISOString().split('T')[0],
    }
    campaigns.unshift(newCampaign);
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
    
    if (tradeLetterDataUri) {
      localStorage.setItem(`campaign_trade_letter_${newCampaign.id}`, tradeLetterDataUri);
    }
    
    toast({
      title: 'Campaign Submitted!',
      description: 'Your new campaign has been submitted to ShopOps.',
    })
    
    const redirectPath = data.campaignType ? `/dashboard/campaign-modules?tab=${encodeURIComponent(data.campaignType)}` : '/dashboard/campaign-modules';
    router.push(redirectPath)
  }

  const onSaveDraft = () => {
    const data = form.getValues();
     if (!data.campaignType) {
      form.setError("campaignType", { type: "manual", message: "Please select a campaign type." });
      return;
    }
    const campaigns = getCampaignsFromStorage();
    
    const { tradeLetterDataUri, ...campaignData } = data;
    const newCampaignId = `CAM-${Date.now().toString(36).toUpperCase()}`;

    const newCampaign: Campaign = {
        ...campaignData,
        id: newCampaignId,
        status: 'Draft',
        createdBy: 'commercial@demo.com',
        createdAt: new Date().toISOString().split('T')[0],
    }
    campaigns.unshift(newCampaign);
    localStorage.setItem('campaigns', JSON.stringify(campaigns));

    if (tradeLetterDataUri) {
        localStorage.setItem(`campaign_trade_letter_${newCampaign.id}`, tradeLetterDataUri);
    }

    toast({
      title: 'Draft Saved!',
      description: 'Your campaign has been saved as a draft.',
    })
    
    const redirectPath = data.campaignType ? `/dashboard/campaign-modules?tab=${encodeURIComponent(data.campaignType)}` : '/dashboard/campaign-modules';
    router.push(redirectPath)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Create Campaign</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Trade Letter AI Scanner</CardTitle>
          <CardDescription>
            Upload a trade letter (image or PDF) to automatically fill in the campaign details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="relative">
              <label htmlFor="trade-letter-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                {tradeLetterDataUri ? 'Change Document' : 'Upload Document'}
                <input
                  id="trade-letter-upload"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  disabled={isScanning}
                />
              </label>
            </Button>
            {isScanning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : tradeLetterDataUri ? (
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => window.open(tradeLetterDataUri)}
                >
                    <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">View {fileName}</span>
                </Button>
            ) : fileName ? (
                <span className="text-sm text-muted-foreground">{fileName}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Fill in the details for your new campaign or edit the scanned information.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tradeLetterDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date (Trade Letter)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="campaignType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a campaign type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAMPAIGN_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="distributor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distributor</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Great Deals Ecommerce Corp" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AquaFizz" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="programName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Summer Sale 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="promotionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotion Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 30 days" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. www.example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Objectives</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the campaign objectives..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="extractedRemarks"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Extracted Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Remarks extracted from the document..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Promotion Details</CardTitle>
                <CardDescription>
                  Review and edit the product promotion details extracted from the document.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>SRP</TableHead>
                      <TableHead>Discounted Price</TableHead>
                      <TableHead>Discount Value</TableHead>
                      <TableHead>Discount %</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Input {...form.register(`promotions.${index}.productName`)} />
                        </TableCell>
                        <TableCell>
                          <Input {...form.register(`promotions.${index}.barcode`)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="any" {...form.register(`promotions.${index}.srp`)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="any" {...form.register(`promotions.${index}.discountedPrice`)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="any" {...form.register(`promotions.${index}.discountValue`)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="any" {...form.register(`promotions.${index}.discountPercentage`)} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" type="button" onClick={onSaveDraft}>Save as Draft</Button>
              <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
