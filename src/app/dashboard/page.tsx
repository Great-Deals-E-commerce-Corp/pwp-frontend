
'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CampaignTable } from '@/components/campaign-table'
import { mockCampaigns } from '@/lib/mock-data'
import type { Campaign, CampaignStatus } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import Papa from 'papaparse'

export default function DashboardPage() {
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('All')
  const [brandFilter, setBrandFilter] = useState('All')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const { toast } = useToast()

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
    setAllCampaigns(campaignsToLoad);
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('userRole')
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
  
  const campaignsForRole = useMemo(() => {
    if (userRole === 'commercial') {
      return allCampaigns.filter(c => c.createdBy === 'commercial@demo.com');
    }
    if (userRole === 'shop-ops') {
      const RELEVANT_STATUSES: CampaignStatus[] = ['Submitted', 'Validated', 'Active', 'Completed'];
      return allCampaigns.filter(c => RELEVANT_STATUSES.includes(c.status));
    }
    return allCampaigns;
  }, [allCampaigns, userRole]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(allCampaigns.map(c => c.brandName).filter(Boolean) as string[]);
    return Array.from(brands).sort();
  }, [allCampaigns]);

  const filteredData = useMemo(() => {
    return campaignsForRole.filter(campaign => {
      const searchTermLower = searchTerm.toLowerCase();
      
      const matchesSearch = searchTerm === '' ||
        campaign.programName.toLowerCase().includes(searchTermLower) ||
        (campaign.brandName && campaign.brandName.toLowerCase().includes(searchTermLower));

      const matchesStatus = statusFilter === 'All' || campaign.status === statusFilter;
      const matchesCampaignType = campaignTypeFilter === 'All' || campaign.campaignType === campaignTypeFilter;
      const matchesBrand = brandFilter === 'All' || campaign.brandName === brandFilter;

      const campaignStart = new Date(campaign.startDate);
      const campaignEnd = new Date(campaign.endDate);
      const filterStart = startDateFilter ? new Date(startDateFilter) : null;
      const filterEnd = endDateFilter ? new Date(endDateFilter) : null;

      if (filterStart) filterStart.setUTCHours(0, 0, 0, 0);
      if (filterEnd) filterEnd.setUTCHours(23, 59, 59, 999);
      
      const afterFilterStart = !filterStart || campaignEnd >= filterStart;
      const beforeFilterEnd = !filterEnd || campaignStart <= filterEnd;

      return matchesSearch && matchesStatus && matchesCampaignType && matchesBrand && afterFilterStart && beforeFilterEnd;
    });
  }, [campaignsForRole, searchTerm, statusFilter, campaignTypeFilter, brandFilter, startDateFilter, endDateFilter]);
  
  const handleDeleteCampaign = (campaignId: string) => {
    const currentCampaigns: Campaign[] = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const updatedCampaigns = currentCampaigns.filter((c) => c.id !== campaignId)
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
    loadCampaigns(); // Reload data to update UI
    toast({
      variant: 'destructive',
      title: 'Campaign Deleted',
      description: `The campaign has been successfully deleted.`,
    })
  }

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data to Export',
        description: 'There are no campaigns matching the current filters.',
      });
      return;
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

    const dataToExport = filteredData.flatMap(campaign => {
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
            return [{ ...baseDetails, 'Product Name': 'N/A', 'Barcode': 'N/A', 'SRP': 'N/A', 'Discounted Price': 'N/A', 'Discount Value': 'N/A', 'Discount %': 'N/A' }];
        }
    });
    
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'dashboard_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
        title: 'Export Successful',
        description: `${filteredData.length} campaigns exported.`
    });
  }


  if (!userRole) return <div>Loading...</div>

  const getDashboardDescription = () => {
    switch(userRole) {
      case 'commercial':
        return 'Manage your promotional campaigns.'
      case 'shop-ops':
        return 'View all campaigns relevant to ShopOps.'
      case 'finance':
        return 'View all company-wide promotional campaigns.'
      default:
        return 'Oversee all promotional campaigns.'
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaign Dashboard</h1>
          <p className="text-muted-foreground">
            {getDashboardDescription()}
          </p>
        </div>
        <div className="flex items-center gap-2">
            {userRole === 'commercial' && (
            <Link href="/dashboard/new" passHref>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Campaign
                </Button>
            </Link>
            )}
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
            </Button>
        </div>
      </div>

       <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
        <div className="space-y-2 flex-auto min-w-[240px]">
          <Label htmlFor="search-input" className="font-bold text-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search by program, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-foreground"
            />
          </div>
        </div>
        <div className="space-y-2 flex-auto min-w-[180px]">
          <Label htmlFor="status-filter" className="font-bold text-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="border-foreground">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {CAMPAIGN_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-auto min-w-[180px]">
          <Label htmlFor="campaign-type-filter" className="font-bold text-foreground">Campaign Type</Label>
          <Select value={campaignTypeFilter} onValueChange={setCampaignTypeFilter}>
            <SelectTrigger id="campaign-type-filter" className="border-foreground">
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
        <div className="space-y-2 flex-auto min-w-[180px]">
          <Label htmlFor="brand-filter" className="font-bold text-foreground">Brand</Label>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger id="brand-filter" className="border-foreground">
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Brands</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-auto min-w-[180px]">
          <Label htmlFor="start-date-filter" className="font-bold text-foreground">Start Date</Label>
          <Input 
            id="start-date-filter"
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="border-foreground"
          />
        </div>
        <div className="space-y-2 flex-auto min-w-[180px]">
          <Label htmlFor="end-date-filter" className="font-bold text-foreground">End Date</Label>
          <Input 
            id="end-date-filter"
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="border-foreground"
          />
        </div>
      </div>
      
      <CampaignTable
        campaigns={filteredData}
        title={"All Campaigns"}
        description={"A list of all campaigns in the system."}
        userRole={userRole}
        onDelete={handleDeleteCampaign}
      />
    </div>
  )
}
