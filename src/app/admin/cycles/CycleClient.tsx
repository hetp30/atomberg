'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Check, Clock } from 'lucide-react'

export default function CycleClient({ initialCycles }: { initialCycles: any[] }) {
  const router = useRouter()
  const [cycles, setCycles] = useState(initialCycles)
  const [loading, setLoading] = useState(false)
  
  const [newCycle, setNewCycle] = useState({
    name: 'FY 2026-27',
    phase: 'GOAL_SETTING',
    windowOpen: new Date().toISOString().split('T')[0],
    windowClose: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    isActive: true
  })

  const createCycle = async () => {
    if (!newCycle.name) return toast.error('Cycle name is required')
    
    setLoading(true)
    try {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCycle),
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success('Goal Cycle Created!')
        if (data.cycle.isActive) {
          // Update local state to reflect that other cycles are no longer active
          setCycles([data.cycle, ...cycles.map(c => ({...c, isActive: false}))])
        } else {
          setCycles([data.cycle, ...cycles])
        }
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to create cycle')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Cycle Management</h1>
        <p className="text-sm text-slate-400">Configure quarterly windows for goal setting and achievements.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus size={18} className="text-indigo-400" /> Create New Cycle / Phase
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Cycle Name</label>
            <Input 
              value={newCycle.name} onChange={e => setNewCycle({...newCycle, name: e.target.value})}
              className="bg-slate-950 border-slate-700 text-white" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Phase</label>
            <Select value={newCycle.phase} onValueChange={v => setNewCycle({...newCycle, phase: v})}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="GOAL_SETTING">Goal Setting</SelectItem>
                <SelectItem value="Q1">Quarter 1 (Q1)</SelectItem>
                <SelectItem value="Q2">Quarter 2 (Q2)</SelectItem>
                <SelectItem value="Q3">Quarter 3 (Q3)</SelectItem>
                <SelectItem value="Q4">Quarter 4 (Q4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Window Opens</label>
            <Input 
              type="date"
              value={newCycle.windowOpen} onChange={e => setNewCycle({...newCycle, windowOpen: e.target.value})}
              className="bg-slate-950 border-slate-700 text-white" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Window Closes</label>
            <Input 
              type="date"
              value={newCycle.windowClose} onChange={e => setNewCycle({...newCycle, windowClose: e.target.value})}
              className="bg-slate-950 border-slate-700 text-white" 
            />
          </div>
          <Button 
            onClick={createCycle} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
          >
            Create Cycle
          </Button>
        </CardContent>
      </Card>

      <h3 className="text-lg font-bold text-white mb-4">Historical Cycles</h3>
      <div className="space-y-3">
        {cycles.map(cycle => (
          <div key={cycle.id} className={`flex items-center justify-between p-4 rounded-xl border ${cycle.isActive ? 'bg-indigo-950/30 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center gap-4">
              {cycle.isActive ? (
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400"><Check size={20} /></div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500"><Clock size={20} /></div>
              )}
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  {cycle.name} 
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{cycle.phase.replace('_', ' ')}</span>
                  {cycle.isActive && <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">Active</span>}
                </h4>
                <p className="text-sm text-slate-400">
                  Window: {new Date(cycle.windowOpen).toLocaleDateString()} to {new Date(cycle.windowClose).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
