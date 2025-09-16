
'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { CampaignTable } from '@/components/campaign-table'
import { mockCampaigns } from '@/lib/mock-data'
import type { Campaign } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PLATFORMS } from '@/lib/types'
import { Search, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
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

export default function ApprovalsPage() {
  const [allPendingCampaigns, setAllPendingCampaigns] = useState<Campaign[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false)
  const [disapprovalRemarks, setDisapprovalRemarks] = useState('')
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
    setAllPendingCampaigns(campaignsToLoad.filter((c) => c.status === 'Submitted'));
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as any;
    setUserRole(role);
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
  }, [searchTerm, platformFilter])

  const pendingCampaigns = useMemo(() => {
    return allPendingCampaigns.filter(campaign => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
            campaign.programName.toLowerCase().includes(searchTermLower) ||
            (campaign.brandName && campaign.brandName.toLowerCase().includes(searchTermLower));

        const matchesPlatform = platformFilter === 'All' || (campaign as any).platformName === platformFilter;

        return matchesSearch && matchesPlatform;
    })
  }, [allPendingCampaigns, searchTerm, platformFilter]);

  const updateCampaignsInStorage = (ids: string[], updates: Partial<Campaign>) => {
    if (typeof window === 'undefined') return 0;
    const storedCampaigns: Campaign[] = JSON.parse(localStorage.getItem('campaigns') || JSON.stringify(mockCampaigns));
    let updatedCount = 0;
    const updatedCampaigns = storedCampaigns.map(c => {
        if (ids.includes(c.id)) {
            updatedCount++;
            return { ...c, ...updates };
        }
        return c;
    });
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
    return updatedCount;
  }

  const handleBulkApprove = () => {
    const count = updateCampaignsInStorage(selectedCampaignIds, { 
      status: 'Validated', 
      approvedBy: 'approver@demo.com',
      dateApproved: new Date().toISOString().split('T')[0] 
    });
    loadCampaigns(); // Re-load campaigns to update UI
    setSelectedCampaignIds([]);
    toast({
      title: 'Campaigns Approved',
      description: `${count} campaign(s) have been approved and sent to ShopOps for validation.`,
    })
  }

  const handleBulkDisapprove = () => {
    if (!disapprovalRemarks) {
        toast({ variant: 'destructive', title: 'Remarks required', description: 'Please provide remarks for disapproval.' })
        return
    }
    const count = updateCampaignsInStorage(selectedCampaignIds, { status: 'Returned', remarks: disapprovalRemarks });
    loadCampaigns(); // Re-load campaigns to update UI
    setSelectedCampaignIds([]);
    setDisapprovalRemarks('');
    setIsDisapproveDialogOpen(false);
    toast({
      variant: 'destructive',
      title: 'Campaigns Returned',
      description: `${count} campaign(s) have been returned to the commercial team.`,
    })
  }

  if (!userRole || userRole !== 'commercial-approver') return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p>This page is for commercial approvers only.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaign Approvals ({pendingCampaigns.length})</h1>
          <p className="text-muted-foreground">
            Review and approve campaigns submitted by the commercial team.
          </p>
        </div>
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
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full md:w-[180px] border-foreground">
            <SelectValue placeholder="Filter by platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Platforms</SelectItem>
            {PLATFORMS.map(platform => (
              <SelectItem key={platform} value={platform}>{platform}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

       <div className="flex items-center gap-2">
        <Button
          onClick={handleBulkApprove}
          disabled={selectedCampaignIds.length === 0}
        >
          <ThumbsUp className="mr-2 h-4 w-4" /> Approve Selected ({selectedCampaignIds.length})
        </Button>
        <Button
          variant="destructive"
          onClick={() => setIsDisapproveDialogOpen(true)}
          disabled={selectedCampaignIds.length === 0}
        >
          <ThumbsDown className="mr-2 h-4 w-4" /> Return Selected ({selectedCampaignIds.length})
        </Button>
      </div>

      {pendingCampaigns.length > 0 ? (
        <CampaignTable
          campaigns={pendingCampaigns}
          title="Pending Approval"
          description="These campaigns are waiting for your review."
          userRole={userRole}
          showSelection={true}
          selectedCampaignIds={selectedCampaignIds}
          onSelectionChange={setSelectedCampaignIds}
        />
      ) : (
        <div className="flex items-center justify-center h-48 bg-card border rounded-md">
            <p className="text-muted-foreground">There are no campaigns pending approval.</p>
        </div>
      )}

      <AlertDialog open={isDisapproveDialogOpen} onOpenChange={setIsDisapproveDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Return Campaigns</AlertDialogTitle>
                <AlertDialogDescription>
                    You are about to return {selectedCampaignIds.length} campaign(s). Please provide your remarks. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="disapproval-remarks">Remarks</Label>
                <Textarea
                    id="disapproval-remarks"
                    placeholder="Add remarks for returning the campaign..."
                    value={disapprovalRemarks}
                    onChange={(e) => setDisapprovalRemarks(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDisapprove}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  )
}
