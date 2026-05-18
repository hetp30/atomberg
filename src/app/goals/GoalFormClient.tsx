'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Trash2, Plus, Info, Target, AlertCircle } from 'lucide-react'
import { THRUST_AREAS, UOM_LABELS, validateGoalSheet, GoalInput, STATUS_COLORS } from '@/lib/goalUtils'
import { Badge } from '@/components/ui/badge'

export default function GoalFormClient({ cycle, existingSheet }: { cycle: any; existingSheet: any }) {
  const router = useRouter()
  const isReadOnly = existingSheet && ['SUBMITTED', 'APPROVED', 'LOCKED'].includes(existingSheet.status)
  
  const [goals, setGoals] = useState<GoalInput[]>(
    existingSheet?.goals || [{ title: '', thrustArea: '', description: '', uomType: 'MIN', target: '', weightage: 10 }]
  )
  const [loading, setLoading] = useState(false)

  const validation = validateGoalSheet(goals)
  const weightageColor = validation.total > 100 ? 'text-red-400' : validation.total === 100 ? 'text-green-400' : 'text-amber-400'

  const updateGoal = (index: number, field: keyof GoalInput, value: any) => {
    if (isReadOnly) return
    const newGoals = [...goals]
    newGoals[index] = { ...newGoals[index], [field]: value }
    setGoals(newGoals)
  }

  const addGoal = () => {
    if (isReadOnly || goals.length >= 8) return
    setGoals([...goals, { title: '', thrustArea: '', description: '', uomType: 'MIN', target: '', weightage: 10 }])
  }

  const removeGoal = (index: number) => {
    if (isReadOnly || goals.length <= 1) return
    const newGoals = [...goals]
    newGoals.splice(index, 1)
    setGoals(newGoals)
  }

  const saveSheet = async () => {
    if (!validation.valid) {
      toast.error(validation.errors[0])
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, cycleId: cycle.id }),
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success('Goal sheet saved as DRAFT successfully.')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to save goal sheet.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const submitSheet = async () => {
    if (!existingSheet) {
      toast.error('Please save your goals as draft first.')
      return
    }
    
    if (!validation.valid) {
      toast.error(validation.errors[0])
      return
    }

    setLoading(true)
    try {
      // First save the latest goals
      const saveRes = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, cycleId: cycle.id }),
      })
      
      if (!saveRes.ok) {
        const data = await saveRes.json()
        toast.error(data.error || 'Failed to save goals before submitting.')
        setLoading(false)
        return
      }

      // Then submit the sheet
      const res = await fetch('/api/goals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: existingSheet.id }),
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success('Goal sheet SUBMITTED for approval!')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to submit goal sheet.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Goals</h1>
          <p className="text-sm text-slate-400">Cycle: {cycle.name}</p>
        </div>
        
        {existingSheet && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Status</p>
              <Badge className={STATUS_COLORS[existingSheet.status] || 'bg-slate-700'}>
                {existingSheet.status}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {existingSheet?.status === 'RETURNED' && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-red-200 flex items-center gap-2 mb-1">
            <AlertCircle size={16} /> Manager returned your sheet
          </h3>
          <p className="text-sm text-red-300 ml-6">"{existingSheet.returnComment}"</p>
        </div>
      )}

      {existingSheet?.status === 'APPROVED' && (
        <div className="bg-green-950/50 border border-green-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-green-200 flex items-center gap-2">
            <Info size={16} /> Goals Approved & Locked
          </h3>
          <p className="text-sm text-green-300 ml-6 mt-1">Your goals have been approved by your manager and cannot be edited. Head to the Quarterly Check-in to log your progress.</p>
        </div>
      )}

      {/* Progress Bar for Weightage */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-1">Total Weightage</p>
            <p className={`text-2xl font-bold ${weightageColor}`}>{validation.total}%</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {goals.length}/8 Goals
          </div>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${validation.total === 100 ? 'bg-green-500' : validation.total > 100 ? 'bg-red-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(validation.total, 100)}%` }}
          />
        </div>
        {!validation.valid && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertCircle size={12} /> {validation.errors[0]}
          </p>
        )}
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map((goal, index) => (
          <Card key={index} className="bg-slate-900 border-slate-800 shadow-sm relative overflow-hidden group">
            {goal.isShared && (
              <div className="absolute top-0 right-0 bg-indigo-600/20 text-indigo-300 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                Shared by Admin
              </div>
            )}
            <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                  {index + 1}
                </div>
                <CardTitle className="text-base text-white font-medium">
                  {goal.title || `New Goal ${index + 1}`}
                </CardTitle>
              </div>
              {!isReadOnly && !goal.isShared && (
                <button 
                  onClick={() => removeGoal(index)}
                  disabled={goals.length <= 1}
                  className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Goal Title</Label>
                <Input 
                  value={goal.title} 
                  onChange={e => updateGoal(index, 'title', e.target.value)}
                  disabled={isReadOnly || goal.isShared}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., Increase Q3 Sales Revenue"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Thrust Area</Label>
                <Select disabled={isReadOnly || goal.isShared} value={goal.thrustArea} onValueChange={v => updateGoal(index, 'thrustArea', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {THRUST_AREAS.map(ta => <SelectItem key={ta} value={ta}>{ta}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Unit of Measurement (UoM)</Label>
                <Select disabled={isReadOnly || goal.isShared} value={goal.uomType} onValueChange={v => updateGoal(index, 'uomType', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {Object.entries(UOM_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Description (Optional)</Label>
                <Textarea 
                  value={goal.description} 
                  onChange={e => updateGoal(index, 'description', e.target.value)}
                  disabled={isReadOnly || goal.isShared}
                  className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                  placeholder="Provide context on how this goal will be achieved..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Target Value</Label>
                <Input 
                  type={goal.uomType === 'TIMELINE' ? 'date' : 'text'}
                  value={goal.target} 
                  onChange={e => updateGoal(index, 'target', e.target.value)}
                  disabled={isReadOnly || goal.isShared}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder={goal.uomType === 'TIMELINE' ? '' : 'e.g., 500000'}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Weightage (%)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    min="10" max="100"
                    value={goal.weightage || ''} 
                    onChange={e => updateGoal(index, 'weightage', Number(e.target.value))}
                    disabled={isReadOnly}
                    className={`bg-slate-800 border-slate-700 text-white font-mono pl-8 ${Number(goal.weightage) < 10 && !isReadOnly ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">%</div>
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Actions */}
      {!isReadOnly && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={addGoal}
            disabled={goals.length >= 8}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto border-dashed"
          >
            <Plus size={16} className="mr-2" /> Add Goal
          </Button>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {!existingSheet && (
              <Button 
                onClick={saveSheet}
                disabled={!validation.valid || loading}
                className="bg-slate-700 hover:bg-slate-600 text-white flex-1 sm:flex-none"
              >
                Save Draft
              </Button>
            )}
            {(!existingSheet || existingSheet.status === 'DRAFT' || existingSheet.status === 'RETURNED') && (
              <Button 
                onClick={existingSheet ? submitSheet : saveSheet}
                disabled={!validation.valid || loading || (!existingSheet && !validation.valid)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none font-semibold shadow-lg shadow-indigo-600/20"
              >
                {existingSheet ? 'Submit for Approval' : 'Save & Submit'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
