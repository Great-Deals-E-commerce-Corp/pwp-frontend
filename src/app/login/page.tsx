
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dna, Rocket, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockCampaigns, mockSrpMasterlist } from '@/lib/mock-data'
import type { Campaign, SKUItem } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState('commercial')

  const handleLogin = () => {
    // In a real app, you'd perform authentication here.
    // For this demo, we'll store the role in localStorage
    // and redirect based on the selected role.
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', userRole)
      
      const storedCampaigns = localStorage.getItem('campaigns');
      if (!storedCampaigns || storedCampaigns === 'undefined') {
          localStorage.setItem('campaigns', JSON.stringify(mockCampaigns));
      }

      const storedSrpMasterlist = localStorage.getItem('srpMasterlist');
      if (!storedSrpMasterlist || storedSrpMasterlist === 'undefined') {
          localStorage.setItem('srpMasterlist', JSON.stringify(mockSrpMasterlist));
      }

      localStorage.removeItem('hasNewNotification');
      if (userRole === 'shop-ops') {
          localStorage.setItem('hasNewNotification', 'true');
      }
    }

    if (userRole === 'shop-ops') {
      router.push('/shop-operations')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Rocket className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">PWP Campaign</CardTitle>
          <CardDescription>
            Log in to your account to manage promotional campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  defaultValue="demo@promoplan.pro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" defaultValue="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">
                      <div className="flex items-center gap-2">
                        <Dna className="h-4 w-4" /> Commercial
                      </div>
                    </SelectItem>
                    <SelectItem value="shop-ops">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4" /> ShopOps
                      </div>
                    </SelectItem>
                    <SelectItem value="finance">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Finance
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
