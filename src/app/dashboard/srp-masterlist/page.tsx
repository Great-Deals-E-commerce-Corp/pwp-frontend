
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SrpMasterlistTable } from '@/components/srp-masterlist-table'
import type { SKUItem, SrpHistory, SrpVersion } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import Papa from 'papaparse'
import { Upload, X, Save, Loader2, Search, Download, History } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { formatDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


const VersionHistory = ({ history, onDownload }: { history: SrpHistory, onDownload: (version: SrpVersion) => void }) => {
    if (history.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Version History
                </CardTitle>
                <CardDescription>
                    Review and download previous versions of the SRP Masterlist.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Version</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Reason for Change</TableHead>
                            <TableHead>Original File</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map(version => (
                            <TableRow key={version.version}>
                                <TableCell>v{version.version}</TableCell>
                                <TableCell>{formatDate(version.timestamp, true)}</TableCell>
                                <TableCell>{version.user}</TableCell>
                                <TableCell className="max-w-xs truncate">{version.reason}</TableCell>
                                <TableCell>{version.originalFileName || 'N/A'}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => onDownload(version)}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function SrpMasterlistPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [srpHistory, setSrpHistory] = useState<SrpHistory>([])
  const [currentMasterlist, setCurrentMasterlist] = useState<SKUItem[]>([])
  
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewData, setPreviewData] = useState<SKUItem[]>([])
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [brandFilter, setBrandFilter] = useState('All')
  const [businessUnitFilter, setBusinessUnitFilter] = useState('All')

  // State for the save reason dialog
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [saveReason, setSaveReason] = useState('');
  const [dataToSave, setDataToSave] = useState<{data: SKUItem[], type: 'upload' | 'edit' | null}>({ data: [], type: null });

  const loadItems = useCallback(() => {
    setIsLoading(true);
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    try {
      const storedHistory = localStorage.getItem('srpMasterlistHistory');
      const history: SrpHistory = storedHistory ? JSON.parse(storedHistory) : [];
      
      // Sort by version descending to easily get the latest
      const sortedHistory = history.sort((a, b) => b.version - a.version);

      setSrpHistory(sortedHistory);
      if (sortedHistory.length > 0) {
        // The first item is the latest version
        setCurrentMasterlist(sortedHistory[0].data);
      } else {
        setCurrentMasterlist([]);
      }
    } catch (error) {
      console.error("Failed to load SRP masterlist history from localStorage", error);
      setSrpHistory([]);
      setCurrentMasterlist([]);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load SRP masterlist history.',
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadItems();
  }, [loadItems]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fileData = results.data as any[];

        const headerAliases: { [key in keyof Omit<SKUItem, 'id'>]: string[] } = {
          platform: ['platform'],
          sku: ['sku'],
          productName: ['product name', 'productname'],
          businessUnit: ['business unit', 'businessunit'],
          brand: ['brand'],
          subBrand: ['sub-brand', 'sub brand', 'subbrand'],
          caseConfiguration: ['case configuration', 'caseconfiguration'],
          unitOfMeasure: ['unit of measure', 'unitofmeasure', 'uom'],
          srpPerCaseVatin: ['srp per case (vatin)', 'srppercasevatin', 'srp/case (vatin)'],
          srpPerCaseVatex: ['srp per case (vatex)', 'srppercasevatex', 'srp/case (vatex)'],
          srpPerPieceVatin: ['srp per piece (vatin)', 'srpperpiecevatin', 'srp/pc (vatin)'],
          srpPerPieceVatex: ['srp per piece (vatex)', 'srpperpiecevatex', 'srp/pc (vatex)'],
          dateStart: ['date start', 'datestart', 'start date'],
          dateEnd: ['date end', 'dateend', 'end date'],
          timeStart: ['time start', 'timestart', 'start time'],
          timeEnd: ['time end', 'timeend', 'end time'],
          remarks: ['remarks if any', 'remarks'],
          lazadaShopSku: ['lazada shop sku', 'lazadashopsku'],
          shopeeProductId: ['shopee product id', 'shopeeproductid'],
          shopeeVariationId: ['shopee variation id', 'shopeevariationid'],
        };
        
        const aliasToKeyMap = new Map<string, keyof SKUItem>();
        for (const key in headerAliases) {
          headerAliases[key as keyof typeof headerAliases].forEach(alias => {
            aliasToKeyMap.set(alias.toLowerCase().trim(), key as keyof SKUItem);
          });
        }
        
        const mappedData = fileData.map((row, index) => {
          const newRow: Partial<SKUItem> = {};
          
          for (const rawHeader in row) {
            if (Object.prototype.hasOwnProperty.call(row, rawHeader)) {
              const normalizedHeader = rawHeader.trim().toLowerCase();
              const key = aliasToKeyMap.get(normalizedHeader);
              if (key) {
                (newRow as any)[key] = row[rawHeader];
              }
            }
          }
          (newRow as SKUItem).id = `row-${Date.now()}-${index}`;
          return newRow as SKUItem;
        });
        
        const filteredData = mappedData.filter(item => item.sku || item.productName);

        if (filteredData.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Mapping Error',
                description: 'Could not map any columns from the file. Please check the file headers and try again.'
            })
            return;
        }

        setPreviewData(filteredData);
        setIsPreviewing(true);
        toast({
            title: 'File Uploaded',
            description: `${filteredData.length} records are ready for preview.`
        })
      },
      error: (error: any) => {
        toast({ variant: 'destructive', title: 'Upload Error', description: `Failed to parse CSV file: ${error.message}` })
      }
    });
  };

  const handleSavePreview = () => {
    setDataToSave({ data: previewData, type: 'upload' });
    setIsReasonDialogOpen(true);
  }
  
  const handleCancelPreview = () => {
    setIsPreviewing(false);
    setPreviewData([]);
    setFileName('');
  }

  const handleUpdateItem = (updatedItem: SKUItem) => {
    const listToUpdate = isPreviewing ? previewData : currentMasterlist;
    const updatedList = listToUpdate.map(item => item.id === updatedItem.id ? updatedItem : item);
    setDataToSave({ data: updatedList, type: 'edit' });
    setIsReasonDialogOpen(true);
  }

  const handleSaveNewVersion = () => {
    if (!saveReason) {
        toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for this change.' });
        return;
    }
    if (!dataToSave.data || dataToSave.data.length === 0) return;

    const newVersionNumber = srpHistory.length > 0 ? Math.max(...srpHistory.map(v => v.version)) + 1 : 1;
    const user = userRole ? (userRole.charAt(0).toUpperCase() + userRole.slice(1)) : 'System';

    const newVersion: SrpVersion = {
        version: newVersionNumber,
        timestamp: new Date().toISOString(),
        reason: saveReason,
        user: user,
        data: dataToSave.data,
        originalFileName: dataToSave.type === 'upload' ? fileName : srpHistory[0]?.originalFileName
    };

    const newHistory = [newVersion, ...srpHistory];
    localStorage.setItem('srpMasterlistHistory', JSON.stringify(newHistory));
    
    // Reset state and reload
    setSrpHistory(newHistory);
    setCurrentMasterlist(newVersion.data);
    setIsReasonDialogOpen(false);
    setSaveReason('');
    setDataToSave({ data: [], type: null });
    
    if (isPreviewing) {
        handleCancelPreview();
    }
    
    toast({
        title: 'Success!',
        description: `Version ${newVersionNumber} of the SRP Masterlist has been saved.`
    });
  }

  const handleDownloadVersion = (version: SrpVersion) => {
    const csv = Papa.unparse(version.data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const downloadFileName = version.originalFileName 
      ? `version-${version.version}-${version.originalFileName}` 
      : `version-${version.version}-export.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', downloadFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
        title: 'Download Started',
        description: `Downloading version ${version.version}.`
    });
  }
  
  const handleExportCurrentView = () => {
    if (filteredItems.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Data to Export',
            description: 'There are no items matching the current filters.'
        });
        return;
    }

    const csv = Papa.unparse(filteredItems);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'srp_masterlist_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
        title: 'Export Successful',
        description: `${filteredItems.length} items have been exported.`
    });
  }

  const itemsToDisplay = isPreviewing ? previewData : currentMasterlist;

  const { uniquePlatforms, uniqueBrands, uniqueBusinessUnits } = useMemo(() => {
    const platforms = new Set(currentMasterlist.map(item => item.platform).filter(Boolean) as string[]);
    const brands = new Set(currentMasterlist.map(item => item.brand).filter(Boolean) as string[]);
    const businessUnits = new Set(currentMasterlist.map(item => item.businessUnit).filter(Boolean) as string[]);
    return {
      uniquePlatforms: Array.from(platforms).sort(),
      uniqueBrands: Array.from(brands).sort(),
      uniqueBusinessUnits: Array.from(businessUnits).sort(),
    };
  }, [currentMasterlist]);
  
  const filteredItems = useMemo(() => {
    return itemsToDisplay.filter(item => {
        if (!item) return false;
        
        const searchTermLower = searchTerm.toLowerCase();

        const matchesSearch = searchTerm === '' ||
            (item.sku && String(item.sku).toLowerCase().includes(searchTermLower)) ||
            (item.productName && item.productName.toLowerCase().includes(searchTermLower));
        
        const matchesPlatform = platformFilter === 'All' || item.platform === platformFilter;
        const matchesBrand = brandFilter === 'All' || item.brand === brandFilter;
        const matchesBusinessUnit = businessUnitFilter === 'All' || item.businessUnit === businessUnitFilter;

        return matchesSearch && matchesPlatform && matchesBrand && matchesBusinessUnit;
    });
  }, [itemsToDisplay, searchTerm, platformFilter, brandFilter, businessUnitFilter]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">SRP Masterlist</h1>
            <p className="text-muted-foreground">
                Manage the Suggested Retail Price masterlist for all products.
            </p>
        </div>
      </div>

       <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
        <div className="space-y-2 flex-auto min-w-[240px]">
          <Label htmlFor="search-input" className="font-bold text-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search by SKU, Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-foreground"
            />
          </div>
        </div>
        <div className="space-y-2 flex-auto min-w-[180px]">
          <Label htmlFor="platform-filter" className="font-bold text-foreground">Platform</Label>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger id="platform-filter" className="border-foreground">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Platforms</SelectItem>
              {uniquePlatforms.map(platform => (
                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
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
          <Label htmlFor="business-unit-filter" className="font-bold text-foreground">Business Unit</Label>
          <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
            <SelectTrigger id="business-unit-filter" className="border-foreground">
              <SelectValue placeholder="Filter by Business Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Business Units</SelectItem>
              {uniqueBusinessUnits.map(unit => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Manage Data</CardTitle>
              <CardDescription>Upload a CSV file to update the masterlist or edit items directly in the table.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                  {userRole === 'commercial' && (
                    <Button asChild variant="outline" className="relative">
                        <label htmlFor="srp-upload" className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload New Version
                            <input 
                                id="srp-upload"
                                type="file"
                                accept=".csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                onClick={(e) => (e.currentTarget.value = '')}
                            />
                        </label>
                    </Button>
                  )}
                  {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                  <Button variant="outline" onClick={handleExportCurrentView}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Current View
                  </Button>
              </div>
              {isPreviewing && (
                  <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                      <p className="text-sm font-medium">You are previewing a new file with {previewData.length} records.</p>
                      <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCancelPreview}><X className="mr-2 h-4 w-4" />Cancel</Button>
                          <Button size="sm" onClick={handleSavePreview}><Save className="mr-2 h-4 w-4" />Save as New Version</Button>
                      </div>
                  </div>
              )}
          </CardContent>
      </Card>
      
      <SrpMasterlistTable 
        items={filteredItems} 
        userRole={userRole} 
        onUpdateItem={handleUpdateItem}
        key={isPreviewing ? 'preview' : srpHistory[0]?.version ?? 'masterlist'}
      />

      <VersionHistory history={srpHistory} onDownload={handleDownloadVersion} />

      <AlertDialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Reason for Change</AlertDialogTitle>
                <AlertDialogDescription>
                    Please provide a brief reason for this update. This will be recorded in the version history.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="save-reason">Reason</Label>
                <Textarea
                    id="save-reason"
                    placeholder="e.g., Updated pricing for Q3, corrected SKU details for Brand X..."
                    value={saveReason}
                    onChange={(e) => setSaveReason(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSaveReason('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveNewVersion}>Save New Version</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  )
}

    
