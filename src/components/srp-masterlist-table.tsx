
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { SKUItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Save, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SrpMasterlistTableProps = {
  items: SKUItem[]
  userRole: string | null
  onUpdateItem: (item: SKUItem) => void
}

const COLUMNS: { key: keyof SKUItem; label: string }[] = [
    { key: 'platform', label: 'Platform' },
    { key: 'sku', label: 'SKU' },
    { key: 'productName', label: 'Product Name' },
    { key: 'businessUnit', label: 'Business Unit' },
    { key: 'brand', label: 'Brand' },
    { key: 'subBrand', label: 'Sub-Brand' },
    { key: 'caseConfiguration', label: 'Case Configuration' },
    { key: 'unitOfMeasure', label: 'Unit of Measure' },
    { key: 'srpPerCaseVatin', label: 'SRP per Case (VATIN)' },
    { key: 'srpPerCaseVatex', label: 'SRP per Case (VATEX)' },
    { key: 'srpPerPieceVatin', label: 'SRP per Piece (VATIN)' },
    { key: 'srpPerPieceVatex', label: 'SRP per Piece (VATEX)' },
    { key: 'dateStart', label: 'Date Start' },
    { key: 'dateEnd', label: 'Date End' },
    { key: 'timeStart', label: 'Time Start' },
    { key: 'timeEnd', label: 'Time End' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'lazadaShopSku', label: 'Lazada Shop SKU' },
    { key: 'shopeeProductId', label: 'Shopee Product ID' },
    { key: 'shopeeVariationId', label: 'Shopee Variation ID' },
];

export function SrpMasterlistTable({ items, userRole, onUpdateItem }: SrpMasterlistTableProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<SKUItem>()
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const handleEdit = (item: SKUItem) => {
    setEditingRowId(item.id)
    reset(item)
  }

  const handleCancel = () => {
    setEditingRowId(null)
    reset()
  }

  const onSubmit = (data: SKUItem) => {
    onUpdateItem({ ...data, id: editingRowId! })
    setEditingRowId(null)
  }

  const isEditable = userRole === 'commercial';

  return (
    <Card>
      <CardHeader>
        <CardTitle>SRP Masterlist Records</CardTitle>
        <CardDescription>
          A complete list of all SRP items. Scroll right to see all details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                {isEditable && <TableHead className="sticky left-0 z-10 bg-card">Actions</TableHead>}
                {COLUMNS.map(col => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const isEditingThisRow = editingRowId === item.id;
                return (
                  <TableRow key={item.id}>
                    {isEditingThisRow ? (
                        <>
                         <TableCell className="sticky left-0 z-10 bg-card flex gap-2">
                            <Button size="icon" className="h-8 w-8" onClick={handleSubmit(onSubmit)}>
                                <Save className="h-4 w-4" />
                            </Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                         {COLUMNS.map(col => (
                            <TableCell key={col.key}>
                                <Input 
                                    {...register(col.key)} 
                                    defaultValue={item[col.key] as string | number}
                                    className="text-xs h-8"
                                />
                            </TableCell>
                         ))}
                        </>
                    ) : (
                        <>
                          {isEditable && (
                            <TableCell className="sticky left-0 z-10 bg-card">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                          {COLUMNS.map(col => (
                            <TableCell key={col.key}>{String(item[col.key] ?? '')}</TableCell>
                          ))}
                        </>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {items.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                No records found. Upload a CSV file to get started.
            </div>
        )}
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Total Records: <strong>{items.length}</strong>
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
    </Card>
  )
}
