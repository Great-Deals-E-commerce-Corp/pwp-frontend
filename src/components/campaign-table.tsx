
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import type { Campaign, CampaignStatus } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
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

type CampaignTableProps = {
  campaigns: Campaign[]
  title: string
  description: string
  userRole: string | null
  onStatusChange?: (id: string, status: Campaign['status']) => void
  showSelection?: boolean
  selectedCampaignIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onDelete?: (id: string) => void
}

export function CampaignTable({
  campaigns,
  title,
  description,
  userRole,
  onStatusChange,
  showSelection = false,
  selectedCampaignIds = [],
  onSelectionChange = () => {},
  onDelete,
}: CampaignTableProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [campaigns]);

  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return campaigns.slice(startIndex, startIndex + itemsPerPage);
  }, [campaigns, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(campaigns.length / itemsPerPage);


  const handleAction = (action: 'view' | 'edit', id: string) => {
    const targetPath = userRole === 'finance' ? `/dashboard/campaigns/${id}` : `/dashboard/campaigns/${id}?action=${action}`;
    router.push(targetPath)
  }
  
  const handleShopOpsAction = (id: string) => {
    router.push(`/shop-operations/campaigns/${id}`)
  }

  const handleDelete = () => {
    if (campaignToDelete && onDelete) {
      onDelete(campaignToDelete.id)
    }
    setCampaignToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  const getStatusOptions = (currentStatus: CampaignStatus): CampaignStatus[] => {
    switch (currentStatus) {
        case 'Submitted':
            return ['Submitted', 'Validated', 'Returned'];
        case 'Validated':
            return ['Validated', 'Active', 'Returned'];
        case 'Active':
            return ['Active', 'Completed'];
        default:
            return [];
    }
  };

  const ActivityCell = ({ campaign }: { campaign: Campaign }) => {
    const [activity, setActivity] = React.useState<{ text: string, color: string } | null>(null)

    React.useEffect(() => {
        if (campaign.status === 'Active') {
            setActivity({ text: 'Running Campaign', color: 'bg-blue-500' });
        } else if (campaign.status === 'Submitted') {
             setActivity({ text: 'Submitted to Shop Ops', color: 'bg-sky-500' });
        } else if (campaign.status === 'Validated') {
            setActivity({ text: 'Configuring to Run Campaign', color: 'bg-cyan-500' });
        } else if (campaign.status === 'Completed') {
            setActivity({ text: 'Campaign Ended', color: 'bg-purple-500' });
        } else if (campaign.status === 'Returned') {
            setActivity({ text: 'Needs Revision', color: 'bg-orange-500' });
        }
        else {
            setActivity({ text: 'Inactive', color: 'bg-gray-400' });
        }
    }, [campaign.status]);

    if (activity === null) {
        return (
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
                <span className="text-muted-foreground">...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", activity.color)} />
            <span>{activity.text}</span>
        </div>
    )
  }
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    onSelectionChange(checked === true ? campaigns.map((c) => c.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
      if (checked) {
          onSelectionChange([...selectedCampaignIds, id]);
      } else {
          onSelectionChange(selectedCampaignIds.filter((campaignId) => campaignId !== id));
      }
  };

  const isAllSelected = campaigns.length > 0 && selectedCampaignIds.length === campaigns.length;
  const isSomeSelected = selectedCampaignIds.length > 0 && !isAllSelected;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showSelection && (
                <TableHead>
                   <Checkbox
                    checked={isAllSelected ? true : (isSomeSelected ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                   />
                </TableHead>
              )}
              <TableHead>Campaign ID</TableHead>
              <TableHead>Campaign Type</TableHead>
              <TableHead>Program Name</TableHead>
              <TableHead className="hidden md:table-cell">Brand Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="hidden lg:table-cell">Start Date</TableHead>
              <TableHead className="hidden lg:table-cell">End Date</TableHead>
              <TableHead className="hidden xl:table-cell">Created By</TableHead>
              <TableHead className="hidden xl:table-cell">Date Created</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCampaigns.map((campaign) => {
              const statusOptions = getStatusOptions(campaign.status);
              const canChangeStatus = userRole === 'shop-ops' && statusOptions.length > 1;

              return (
              <TableRow key={campaign.id} data-state={selectedCampaignIds.includes(campaign.id) && "selected"}>
                {showSelection && (
                    <TableCell>
                        <Checkbox
                            checked={selectedCampaignIds.includes(campaign.id)}
                            onCheckedChange={(checked) => handleSelectOne(campaign.id, !!checked)}
                            aria-label="Select row"
                        />
                    </TableCell>
                )}
                <TableCell className="font-medium">{campaign.id}</TableCell>
                <TableCell>{campaign.campaignType}</TableCell>
                <TableCell className="font-medium">{campaign.programName}</TableCell>
                <TableCell className="hidden md:table-cell">{campaign.brandName}</TableCell>
                <TableCell>
                  {canChangeStatus ? (
                     <Select
                        defaultValue={campaign.status}
                        onValueChange={(value) => onStatusChange?.(campaign.id, value as Campaign['status'])}
                      >
                       <SelectTrigger className="w-[120px] h-8 text-xs">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                  ) : (
                    <StatusBadge status={campaign.status} />
                  )}
                </TableCell>
                <TableCell>
                    <ActivityCell campaign={campaign} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(campaign.startDate)}</TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(campaign.endDate)}</TableCell>
                <TableCell className="hidden xl:table-cell">{campaign.createdBy}</TableCell>
                <TableCell className="hidden xl:table-cell">{formatDate(campaign.createdAt)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => userRole === 'shop-ops' ? handleShopOpsAction(campaign.id) : handleAction('view', campaign.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {(userRole === 'commercial' && (campaign.status === 'Draft' || campaign.status === 'Returned')) && (
                        <DropdownMenuItem onClick={() => handleAction('edit', campaign.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {userRole === 'commercial' && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setCampaignToDelete(campaign);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
        </div>
      </CardContent>
      {campaigns.length > 0 && (
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Total Campaigns: <strong>{campaigns.length}</strong>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the campaign "{campaignToDelete?.programName}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCampaignToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={handleDelete}>
                        Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </Card>
  )
}
