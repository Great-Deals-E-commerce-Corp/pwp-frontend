
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { mockCampaigns } from '@/lib/mock-data'
import type { Campaign } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function ShopOpsCampaignDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)

  const loadCampaign = useCallback(() => {
    const campaignId = params.id as string;
    if (!campaignId) return;

    const allCampaigns: Campaign[] = JSON.parse(localStorage.getItem('campaigns') || JSON.stringify(mockCampaigns));
    const foundCampaign = allCampaigns.find((c) => c.id === campaignId)
    if (foundCampaign) {
      const tradeLetterDataUri = localStorage.getItem(`campaign_trade_letter_${campaignId}`);
      const fullCampaignData = {
          ...foundCampaign,
          tradeLetterDataUri: tradeLetterDataUri || undefined
      }
      setCampaign(fullCampaignData);
    }
  }, [params.id]);

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
  }, [loadCampaign])

  if (!campaign) {
    return <div>Loading campaign...</div>
  }

  const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    value ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b">
        <dt className="font-medium text-muted-foreground">{label}</dt>
        <dd className="md:col-span-2">{value}</dd>
      </div>
    ) : null
  )

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Campaign Details</h1>
        </div>
      
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
            <CardContent>
                <dl>
                    <DetailItem
                        label="Trade Letter Document"
                        value={
                            campaign.tradeLetterDataUri ? (
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left"
                                type="button"
                                onClick={() => window.open(campaign.tradeLetterDataUri!)}
                            >
                                <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">View Uploaded Document</span>
                            </Button>
                            ) : (
                            <div className="flex items-center h-10 rounded-md border border-input bg-background px-3">
                                <p className="text-sm text-muted-foreground">No document uploaded.</p>
                            </div>
                            )
                        }
                    />
                    <DetailItem label="Campaign Type" value={campaign.campaignType} />
                    <DetailItem label="Distributor" value={campaign.distributor} />
                    <DetailItem label="Start Date" value={formatDate(campaign.startDate)} />
                    <DetailItem label="End Date" value={formatDate(campaign.endDate)} />
                    <DetailItem label="Trade Letter Date" value={formatDate(campaign.tradeLetterDate)} />
                    <DetailItem label="Date Created" value={formatDate(campaign.createdAt)} />
                    <DetailItem label="Promotion Duration" value={campaign.promotionDuration} />
                    <DetailItem label="Website" value={<a href={campaign.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{campaign.website}</a>} />
                    <DetailItem label="Objectives" value={campaign.objectives} />
                    <DetailItem label="Extracted Remarks" value={campaign.extractedRemarks} />
                    {campaign.remarks && (
                        <DetailItem label="Remarks" value={<p className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded-md">{campaign.remarks}</p>} />
                    )}
                    {campaign.approvers && campaign.approvers.length > 0 && (
                        <DetailItem label="Approvers" value={<div className="flex flex-wrap gap-2">{campaign.approvers.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}</div>} />
                    )}
                </dl>
            </CardContent>
        </Card>

        {campaign.promotions && campaign.promotions.length > 0 && (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.promotions.map((promo, index) => (
                    <TableRow key={index}>
                      <TableCell>{promo.productName}</TableCell>
                      <TableCell>{promo.barcode}</TableCell>
                      <TableCell>{formatCurrency(promo.srp)}</TableCell>
                      <TableCell>{formatCurrency(promo.discountedPrice)}</TableCell>
                      <TableCell>{formatCurrency(promo.discountValue)}</TableCell>
                      <TableCell>{promo.discountPercentage != null ? `${promo.discountPercentage.toFixed(2)}%` : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
