'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Info, Lock, Clock } from 'lucide-react'
import { computeProgressScore, getScoreColor, getScoreBg, GoalStatus, UOM_LABELS } from '@/lib/goalUtils'

export default function CheckinClient({ cycle, sheet }: { cycle: any; sheet: any }) {
  const router = useRouter()
  const now = new Date()
  const windowOpen = new Date(cycle.windowOpen)
  const windowClose = new Date(cycle.windowClose)
  const isWindowActive = now >= windowOpen && now <= windowClose

  const [saving, setSaving] = useState<string | null>(null)
  
  // Local state for fast UI updates, initialized from DB achievements
  const [actuals, setActuals] = useState<Record<string, { value: string, status: string }>>(
    sheet.goals.reduce((acc: any, goal: any) => {
      const ach = goal.achievements.find((a: any) => a.cyclePhase === cycle.phase)
      acc[goal.id] = { 
        value: ach?.actualValue || '', 
        status: ach?.status || 'NOT_STARTED' 
      }
      return acc
    }, {})
  )

  const handleSave = async (goal: any) => {
    const data = actuals[goal.id]
    if (!data.value && goal.uomType !== 'ZERO') {
      toast.error('Please enter an actual achievement value.')
      return
    }

    setSaving(goal.id)
    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          cyclePhase: cycle.phase,
          actualValue: data.value,
          status: data.status,
        }),
      })
      
      const resData = await res.json()
      if (res.ok) {
        toast.success('Progress saved!')
        router.refresh()
      } else {
        toast.error(resData.error || 'Failed to save progress.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Quarterly Check-in</h1>
          <p className="text-sm text-slate-400">Log your progress for {cycle.name} — Phase: {cycle.phase}</p>
        </div>
      </div>

      {!isWindowActive && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-red-200 flex items-center gap-2">
            <Lock size={16} /> Check-in Window Closed
          </h3>
          <p className="text-sm text-red-300 ml-6 mt-1">
            The reporting window for {cycle.phase} opens on {windowOpen.toLocaleDateString()} and closes on {windowClose.toLocaleDateString()}.
            You cannot edit achievements right now.
          </p>
        </div>
      )}

      {isWindowActive && (
        <div className="bg-indigo-950/50 border border-indigo-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-indigo-200 flex items-center gap-2">
            <Clock size={16} /> Window is Open
          </h3>
          <p className="text-sm text-indigo-300 ml-6 mt-1">
            Please log your actual achievements. Your manager will review these values.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {sheet.goals.map((goal: any, index: number) => {
          const actual = actuals[goal.id]
          const score = computeProgressScore(goal.uomType as any, goal.target, actual.value)
          
          return (
            <Card key={goal.id} className="bg-slate-900 border-slate-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base text-white font-medium mb-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {index + 1}
                      </div>
                      {goal.title}
                    </CardTitle>
                    <p className="text-xs text-slate-400 ml-8 bg-slate-800 inline-block px-2 py-0.5 rounded">
                      {UOM_LABELS[goal.uomType as keyof typeof UOM_LABELS]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Target Value</p>
                    <p className="text-lg font-mono font-bold text-white">{goal.target}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                <div className="md:col-span-4 space-y-2">
                  <Label className="text-slate-300">Actual Achievement</Label>
                  <Input 
                    type={goal.uomType === 'TIMELINE' ? 'date' : 'text'}
                    value={actual.value} 
                    onChange={e => setActuals({...actuals, [goal.id]: {...actual, value: e.target.value}})}
                    disabled={!isWindowActive}
                    className="bg-slate-800 border-slate-700 text-white font-mono"
                    placeholder="Enter actual value..."
                  />
                </div>

                <div className="md:col-span-3 space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <Select 
                    disabled={!isWindowActive} 
                    value={actual.status} 
                    onValueChange={v => setActuals({...actuals, [goal.id]: {...actual, status: v}})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="ON_TRACK">On Track</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3">
                  <Label className="text-slate-300 mb-2 block">Progress Score</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getScoreBg(score)}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    <span className={`font-bold font-mono text-lg ${getScoreColor(score)}`}>{score}%</span>
                  </div>
                </div>

                <div className="md:col-span-2 text-right">
                  {isWindowActive && (
                    <Button 
                      onClick={() => handleSave(goal)}
                      disabled={saving === goal.id}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                    >
                      {saving === goal.id ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
