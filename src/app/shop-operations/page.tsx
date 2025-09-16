
'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Download, Search } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CampaignTable } from '@/components/campaign-table'
import { mockCampaigns } from '@/lib/mock-data'
import type { Campaign } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CAMPAIGN_TYPES } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Papa from 'papaparse'

const VIEWABLE_STATUSES: Campaign['status'][] = ['Submitted', 'Validated', 'Active', 'Completed']

export default function ShopOperationsPage() {
  const [allShopOpsCampaigns, setAllShopOpsCampaigns] = useState<Campaign[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('All')
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const { toast } = useToast()

  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [returnRemarks, setReturnRemarks] = useState('')
  const [campaignToReturnId, setCampaignToReturnId] = useState<string | null>(null)

  const loadCampaigns = useCallback(() => {
    let campaignsToLoad: Campaign[];
    try {
        const storedCampaignsJson = localStorage.getItem('campaigns');
        if (!storedCampaignsJson || storedCampaignsJson === 'undefined') {
            throw new Error('No campaigns found in storage, using mock data.');
        }
        campaignsToLoad = JSON.parse(storedCampaignsJson);
    } catch (error) {
        console.warn('Failed to load campaigns from localStorage, falling back to mock data:', error);
        campaignsToLoad = mockCampaigns;
        localStorage.setItem('campaigns', JSON.stringify(campaignsToLoad));
    }
    setAllShopOpsCampaigns(campaignsToLoad.filter((c) => VIEWABLE_STATUSES.includes(c.status)));
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as any
    setUserRole(role)
    loadCampaigns();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'campaigns') {
            loadCampaigns();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    }
  }, [loadCampaigns])
  
  useEffect(() => {
    setSelectedCampaignIds([]);
  }, [searchTerm, statusFilter, campaignTypeFilter])

  const campaigns = useMemo(() => {
    return allShopOpsCampaigns.filter(campaign => {
      const searchTermLower = searchTerm.toLowerCase();
      
      const matchesSearch = searchTerm === '' ||
        campaign.programName.toLowerCase().includes(searchTermLower) ||
        (campaign.brandName && campaign.brandName.toLowerCase().includes(searchTermLower));

      const matchesStatus = statusFilter === 'All' || campaign.status === statusFilter;
      const matchesCampaignType = campaignTypeFilter === 'All' || campaign.campaignType === campaignTypeFilter;

      return matchesSearch && matchesStatus && matchesCampaignType;
    });
  }, [allShopOpsCampaigns, searchTerm, statusFilter, campaignTypeFilter]);


  const handleStatusChange = (id: string, status: Campaign['status']) => {
    if (status === 'Returned') {
        setCampaignToReturnId(id);
        setIsReturnDialogOpen(true);
        return;
    }

    const allCampaignsInStorage: Campaign[] = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const campaignIndex = allCampaignsInStorage.findIndex((c) => c.id === id);
    if (campaignIndex > -1) {
        allCampaignsInStorage[campaignIndex].status = status;
        localStorage.setItem('campaigns', JSON.stringify(allCampaignsInStorage));
    }
    
    loadCampaigns(); // Re-load to update UI

    toast({ title: "Status Updated", description: `Campaign ${id} is now ${status}.`});
  }

  const handleReturnCampaign = () => {
    if (!returnRemarks) {
        toast({ variant: 'destructive', title: 'Remarks required', description: 'Please provide remarks for returning the campaign.' })
        return
    }
    if (!campaignToReturnId) return

    const allCampaignsInStorage: Campaign[] = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const campaignIndex = allCampaignsInStorage.findIndex((c) => c.id === campaignToReturnId);
    if (campaignIndex > -1) {
        allCampaignsInStorage[campaignIndex].status = 'Returned';
        allCampaignsInStorage[campaignIndex].remarks = returnRemarks;
        localStorage.setItem('campaigns', JSON.stringify(allCampaignsInStorage));
    }
    
    loadCampaigns(); // Re-load to update UI
    
    toast({ title: "Campaign Returned", description: `Campaign ${campaignToReturnId} has been returned with remarks.`});
    
    setCampaignToReturnId(null);
    setReturnRemarks('');
    setIsReturnDialogOpen(false);
  }

  const formatDateForExport = (dateString?: string): string => {
    if (!dateString) return ""
    try {
      const date = new Date(`${dateString}T00:00:00`)
      return format(date, "MM/dd/yy")
    } catch (e) {
      return dateString
    }
  }
  
  const handleExport = () => {
    if (campaigns.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data to Export',
        description: 'There are no campaigns matching the current filters.',
      });
      return;
    }

    const campaignsToExport = campaigns;

    // Flatten data for CSV: one row per promotion
    const flattenedData = campaignsToExport.flatMap(campaign => {
      const baseDetails = {
        'Campaign ID': campaign.id,
        'Program Name': campaign.programName,
        'Brand Name': campaign.brandName || '',
        'Campaign Type': campaign.campaignType || '',
        'Start Date': formatDateForExport(campaign.startDate),
        'End Date': formatDateForExport(campaign.endDate),
        'Status': campaign.status,
        'Objectives': campaign.objectives,
        'Distributor': campaign.distributor || '',
        'Promotion Duration': campaign.promotionDuration || '',
        'Website': campaign.website || '',
        'Approvers': campaign.approvers?.join('; ') || '',
        'Remarks': campaign.remarks || '',
        'Extracted Remarks': campaign.extractedRemarks || '',
        'Created By': campaign.createdBy,
        'Date Created': formatDateForExport(campaign.createdAt),
      };

      if (campaign.promotions && campaign.promotions.length > 0) {
        return campaign.promotions.map(promo => ({
          ...baseDetails,
          'Product Name': promo.productName,
          'Barcode': promo.barcode,
          'SRP': promo.srp,
          'Discounted Price': promo.discountedPrice ?? '',
          'Discount Value': promo.discountValue ?? '',
          'Discount %': promo.discountPercentage ?? '',
        }));
      } else {
        // Handle campaigns with no promotions
        return [{
          ...baseDetails,
          'Product Name': 'N/A',
          'Barcode': 'N/A',
          'SRP': 'N/A',
          'Discounted Price': 'N/A',
          'Discount Value': 'N/A',
          'Discount %': 'N/A',
        }];
      }
    });

    if (flattenedData.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Data to Export',
            description: 'The selected campaigns have no data to export.',
        });
        return;
    }

    const csv = Papa.unparse(flattenedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'shopops_campaign_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    toast({
        title: "Export Successful",
        description: `${campaignsToExport.length} campaign(s) have been exported.`
    });
  };

  if (!userRole || userRole !== 'shop-ops') return (
    <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>This page is for ShopOps team only.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ShopOps</h1>
          <p className="text-muted-foreground">
            View, validate, and manage promotional campaigns.
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by program, brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-foreground"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] border-foreground">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {VIEWABLE_STATUSES.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={campaignTypeFilter} onValueChange={setCampaignTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px] border-foreground">
            <SelectValue placeholder="Filter by campaign type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Campaign Types</SelectItem>
            {CAMPAIGN_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CampaignTable
        campaigns={campaigns}
        title="Actionable Campaigns"
        description="All campaigns ready for operational processing."
        userRole={userRole}
        onStatusChange={handleStatusChange}
        showSelection={true}
        selectedCampaignIds={selectedCampaignIds}
        onSelectionChange={setSelectedCampaignIds}
      />
      
      <AlertDialog open={isReturnDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setReturnRemarks('')
            setCampaignToReturnId(null)
          }
          setIsReturnDialogOpen(open)
      }}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Return Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                    You are about to return a campaign. Please provide your remarks for the Commercial team. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="return-remarks">Remarks</Label>
                <Textarea
                    id="return-remarks"
                    placeholder="e.g., Missing product details for SKU-123..."
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReturnCampaign}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  )
}
