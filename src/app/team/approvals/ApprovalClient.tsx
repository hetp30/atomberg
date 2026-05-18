'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, User } from 'lucide-react'
import { UOM_LABELS, validateGoalSheet, GoalInput } from '@/lib/goalUtils'

export default function ApprovalClient({ sheets }: { sheets: any[] }) {
  const router = useRouter()
  const [expandedSheet, setExpandedSheet] = useState<string | null>(sheets[0]?.id || null)
  
  // Local state for goals to allow inline editing by manager before approval
  const [editedGoals, setEditedGoals] = useState<Record<string, GoalInput[]>>(
    sheets.reduce((acc, sheet) => {
      acc[sheet.id] = [...sheet.goals]
      return acc
    }, {})
  )
  
  const [returnComments, setReturnComments] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAction = async (sheetId: string, action: 'APPROVE' | 'RETURN') => {
    const goals = editedGoals[sheetId]
    
    if (action === 'APPROVE') {
      const validation = validateGoalSheet(goals)
      if (!validation.valid) {
        toast.error(`Cannot approve: ${validation.errors[0]}`)
        return
      }
    }
    
    if (action === 'RETURN') {
      if (!returnComments[sheetId]?.trim()) {
        toast.error('A return comment is required.')
        return
      }
    }

    setActionLoading(`${sheetId}-${action}`)
    try {
      const res = await fetch('/api/goals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId,
          action,
          returnComment: action === 'RETURN' ? returnComments[sheetId] : undefined,
          updatedGoals: action === 'APPROVE' ? goals : undefined
        }),
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(`Sheet ${action.toLowerCase()}d successfully.`)
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to process action.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setActionLoading(null)
    }
  }

  const updateGoal = (sheetId: string, index: number, field: keyof GoalInput, value: any) => {
    const newGoals = [...editedGoals[sheetId]]
    newGoals[index] = { ...newGoals[index], [field]: value }
    setEditedGoals({ ...editedGoals, [sheetId]: newGoals })
  }

  return (
    <div className="space-y-6">
      {sheets.map(sheet => {
        const isExpanded = expandedSheet === sheet.id
        const goals = editedGoals[sheet.id]
        const validation = validateGoalSheet(goals)

        return (
          <Card key={sheet.id} className="bg-slate-900 border-slate-800 shadow-md overflow-hidden">
            {/* Header / Accordion Trigger */}
            <div 
              className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors flex items-center justify-between ${isExpanded ? 'bg-slate-800/20' : ''}`}
              onClick={() => setExpandedSheet(isExpanded ? null : sheet.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-900 rounded-full flex items-center justify-center text-indigo-300">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{sheet.employee.name}</h3>
                  <p className="text-sm text-slate-400">Submitted: {new Date(sheet.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4 hidden sm:block">
                  <p className="text-xs text-slate-400">Total Weightage</p>
                  <p className={`font-mono font-bold ${validation.total === 100 ? 'text-green-400' : 'text-red-400'}`}>
                    {validation.total}%
                  </p>
                </div>
                {isExpanded ? <ChevronDown className="text-slate-500" /> : <ChevronRight className="text-slate-500" />}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 sm:p-6 bg-slate-950/50">
                <div className="space-y-4 mb-6">
                  {goals.map((goal, i) => (
                    <div key={goal.id || i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium text-white mb-1"><span className="text-slate-500 mr-2">{i + 1}.</span>{goal.title}</h4>
                          <div className="flex gap-2 text-xs">
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{goal.thrustArea}</span>
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{UOM_LABELS[goal.uomType as any]?.split('—')[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Target Value (Editable)</label>
                          <Input 
                            value={goal.target}
                            onChange={(e) => updateGoal(sheet.id, i, 'target', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white h-8 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Weightage % (Editable)</label>
                          <Input 
                            type="number"
                            value={goal.weightage}
                            onChange={(e) => updateGoal(sheet.id, i, 'weightage', Number(e.target.value))}
                            className="bg-slate-950 border-slate-700 text-white h-8 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Validation Error */}
                {!validation.valid && (
                  <div className="bg-red-950/50 border border-red-800 text-red-300 p-3 rounded-lg text-sm mb-6">
                    <strong>Validation Error:</strong> {validation.errors[0]}<br/>
                    <span className="text-xs opacity-80">You must fix this before approving the goals.</span>
                  </div>
                )}

                {/* Action Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300 block">Return for Rework</label>
                    <Textarea 
                      placeholder="Explain what needs to be changed..."
                      value={returnComments[sheet.id] || ''}
                      onChange={(e) => setReturnComments({...returnComments, [sheet.id]: e.target.value})}
                      className="bg-slate-900 border-slate-700 text-white resize-none"
                      rows={3}
                    />
                    <Button 
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleAction(sheet.id, 'RETURN')}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === `${sheet.id}-RETURN` ? 'Returning...' : <><XCircle size={16} className="mr-2" /> Return to Employee</>}
                    </Button>
                  </div>

                  <div className="space-y-3 flex flex-col justify-end">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Approval Consequence</p>
                      <p className="text-sm text-slate-300">Approving will <strong>LOCK</strong> these goals. The employee will no longer be able to edit them and they will move to the check-in phase.</p>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAction(sheet.id, 'APPROVE')}
                      disabled={!validation.valid || !!actionLoading}
                    >
                      {actionLoading === `${sheet.id}-APPROVE` ? 'Approving...' : <><CheckCircle2 size={16} className="mr-2" /> Approve & Lock Goals</>}
                    </Button>
                  </div>
                </div>

              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
