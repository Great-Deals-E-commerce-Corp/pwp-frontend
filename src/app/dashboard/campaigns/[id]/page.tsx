
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Send, FileText } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/status-badge'
import { mockCampaigns } from '@/lib/mock-data'
import type { Campaign, CampaignStatus, CampaignType } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CAMPAIGN_TYPES } from '@/lib/types'

const productPromotionSchema = z.object({
  productName: z.string(),
  barcode: z.string(),
  srp: z.coerce.number(),
  discountedPrice: z.preprocess((val) => (val === "" || val == null ? undefined : val), z.coerce.number().optional()),
  discountValue: z.preprocess((val) => (val === "" || val == null ? undefined : val), z.coerce.number().optional()),
  discountPercentage: z.preprocess((val) => (val === "" || val == null ? undefined : val), z.coerce.number().optional()),
});

const campaignSchema = z.object({
  id: z.string(),
  programName: z.string().min(1, 'Program name is required'),
  brandName: z.string().optional(),
  campaignType: z.enum(CAMPAIGN_TYPES, {
    required_error: 'Campaign type is required'
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  objectives: z.string().min(1, 'Objectives are required'),
  status: z.custom<CampaignStatus>(),
  remarks: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string().optional(),
  tradeLetterDate: z.string().optional(),
  distributor: z.string().optional(),
  promotionDuration: z.string().optional(),
  website: z.string().optional(),
  extractedRemarks: z.string().optional(),
  promotions: z.array(productPromotionSchema).optional(),
  approvers: z.array(z.string()).optional(),
  tradeLetterDataUri: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>

export default function CampaignDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'promotions'
  })

  const tradeLetterDataUri = form.watch('tradeLetterDataUri');

  const updateCampaignInStorage = (updatedCampaign: Campaign) => {
    if (typeof window === 'undefined') return;
    const storedCampaigns: Campaign[] = JSON.parse(localStorage.getItem('campaigns') || JSON.stringify(mockCampaigns));
    const campaignIndex = storedCampaigns.findIndex((c) => c.id === updatedCampaign.id);
    if (campaignIndex > -1) {
      const { tradeLetterDataUri, ...campaignToStore } = updatedCampaign;
      storedCampaigns[campaignIndex] = campaignToStore as Campaign;
      localStorage.setItem('campaigns', JSON.stringify(storedCampaigns));
      if (tradeLetterDataUri) {
        localStorage.setItem(`campaign_trade_letter_${updatedCampaign.id}`, tradeLetterDataUri);
      }
    }
  }

  const loadCampaign = useCallback(() => {
    const campaignId = params.id as string;
    if (!campaignId) return;

    const role = localStorage.getItem('userRole');
    setUserRole(role);
    
    const allCampaigns: Campaign[] = JSON.parse(localStorage.getItem('campaigns') || JSON.stringify(mockCampaigns));
    const foundCampaign = allCampaigns.find((c) => c.id === campaignId);

    if (foundCampaign) {
      const tradeLetterDataUri = localStorage.getItem(`campaign_trade_letter_${campaignId}`);
      const fullCampaignData = {
          ...foundCampaign,
          tradeLetterDataUri: tradeLetterDataUri || undefined
      }
      setCampaign(fullCampaignData);
    }
    const action = searchParams.get('action');
    if (action === 'edit' && (role === 'commercial')) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [params.id, searchParams]);

  useEffect(() => {
    loadCampaign();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'campaigns' || (event.key && event.key.startsWith('campaign_trade_letter_'))) {
        loadCampaign();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadCampaign]);

  useEffect(() => {
    if (campaign) {
      form.reset(campaign)
    }
  }, [campaign, form]);
  
  const onSaveSubmit = (data: CampaignFormValues) => {
    const updatedCampaign = { ...campaign, ...data } as Campaign;
    updateCampaignInStorage(updatedCampaign);
    setCampaign(updatedCampaign);
    setIsEditing(false)
    toast({ title: 'Campaign Updated', description: 'Your changes have been saved.' });
  }

  const onSubmit = (data: CampaignFormValues) => {
    const updatedData = { ...campaign, ...data, status: 'Submitted' as const };
    updateCampaignInStorage(updatedData as Campaign);
    setCampaign(updatedData as Campaign);
    setIsEditing(false);
    toast({
        title: "Campaign Submitted",
        description: "Your campaign has been submitted to ShopOps."
    });
    router.push('/dashboard');
  }


  if (!campaign) {
    return <div>Loading campaign...</div>
  }

  const isFinanceUser = userRole === 'finance';
  const canEdit = isEditing && !isFinanceUser;
  const canSubmit = userRole === 'commercial' && (campaign.status === 'Draft' || campaign.status === 'Returned');

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">
                {canEdit ? `Editing: ${campaign.programName}` : `Program: ${campaign.programName}`}
            </h1>
        </div>
      
        <Form {...form}>
            <form onSubmit={e => e.preventDefault()} className="space-y-4">
            <Card>
                <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{campaign.programName}</CardTitle>
                        <CardDescription>{campaign.brandName}</CardDescription>
                    </div>
                    <StatusBadge status={campaign.status} />
                </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="tradeLetterDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date (Trade Letter)</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} value={field.value || ''} disabled={!canEdit} />
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
                      <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!canEdit}>
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
                <div className="space-y-2">
                    <Label>Trade Letter Document</Label>
                    {tradeLetterDataUri ? (
                    <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                        type="button"
                        onClick={() => window.open(tradeLetterDataUri!)}
                    >
                        <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">View Uploaded Document</span>
                    </Button>
                    ) : (
                    <div className="flex items-center h-10 rounded-md border border-input bg-background px-3">
                        <p className="text-sm text-muted-foreground">No document uploaded.</p>
                    </div>
                    )}
                </div>
                <FormField
                    control={form.control}
                    name="distributor"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Distributor</FormLabel>
                        <FormControl>
                        <Input {...field} value={field.value || ''} disabled={!canEdit} />
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
                        <Input {...field} value={field.value || ''} disabled={!canEdit} />
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
                        <Input {...field} value={field.value || ''} disabled={!canEdit} />
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
                        <Input type="date" {...field} value={field.value || ''} disabled={!canEdit} />
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
                        <Input type="date" {...field} value={field.value || ''} disabled={!canEdit} />
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
                        <Input {...field} value={field.value || ''} disabled={!canEdit} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                        <Input {...field} value={field.value || ''} disabled={!canEdit} />
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
                        <Textarea {...field} value={field.value || ''} disabled={!canEdit} />
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
                        <Textarea {...field} value={field.value || ''} disabled={!canEdit} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {campaign.remarks && !isEditing && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-t">
                        <dt className="font-medium text-muted-foreground">Remarks</dt>
                        <dd className="md:col-span-2"><p className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded-md">{campaign.remarks}</p></dd>
                    </div>
                )}
                {campaign.approvers && campaign.approvers.length > 0 && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2 py-3">
                        <dt className="font-medium text-muted-foreground">Approvers</dt>
                        <dd className="md:col-span-2 flex flex-wrap gap-2">{campaign.approvers.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}</dd>
                    </div>
                )}
                </CardContent>
            </Card>
            
            {fields && fields.length > 0 && (
            <Card>
                <CardHeader>
                <CardTitle>Promotion Details</CardTitle>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>SRP</TableHead>
                        <TableHead>Discounted Price</TableHead>
                        <TableHead>Discount Value</TableHead>
                        <TableHead>Discount %</TableHead>
                        {canEdit && <TableHead />}
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {fields.map((field, index) => (
                        <TableRow key={field.id}>
                        <TableCell><Input {...form.register(`promotions.${index}.productName`)} disabled={!canEdit}/></TableCell>
                        <TableCell><Input {...form.register(`promotions.${index}.barcode`)} disabled={!canEdit}/></TableCell>
                        <TableCell><Input type="number" step="any" {...form.register(`promotions.${index}.srp`)} disabled={!canEdit}/></TableCell>
                        <TableCell><Input type="number" step="any" {...form.register(`promotions.${index}.discountedPrice`)} disabled={!canEdit}/></TableCell>
                        <TableCell><Input type="number" step="any" {...form.register(`promotions.${index}.discountValue`)} disabled={!canEdit}/></TableCell>
                        <TableCell><Input type="number" step="any" {...form.register(`promotions.${index}.discountPercentage`)} disabled={!canEdit}/></TableCell>
                        {canEdit && (
                            <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            </TableCell>
                        )}
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
            )}

            {canEdit && (
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={form.handleSubmit(onSaveSubmit)}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
                {canSubmit && (
                    <Button type="button" onClick={form.handleSubmit(onSubmit)}>
                        <Send className="mr-2 h-4 w-4" />
                        Submit
                    </Button>
                )}
            </div>
            )}
            </form>
        </Form>
    </div>
  )
}
