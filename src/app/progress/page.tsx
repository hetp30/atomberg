import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UOM_LABELS, getScoreColor, getScoreBg } from '@/lib/goalUtils'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any

  const sheet = await prisma.goalSheet.findFirst({
    where: { employeeId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { 
      goals: { 
        include: { 
          achievements: true,
          checkinComments: { include: { manager: true } }
        } 
      },
      cycle: true
    }
  })

  if (!sheet) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4 text-white">My Progress</h1>
        <div className="bg-amber-950/50 p-4 rounded-xl border border-amber-800 text-amber-200">
          You don't have any goal sheets yet.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">My Progress</h1>
        <p className="text-sm text-slate-400">View your overall progress across all quarters for {sheet.cycle.name}.</p>
      </div>

      <div className="space-y-6">
        {sheet.goals.map((goal: any, i: number) => {
          // Find latest achievement
          const latestAch = goal.achievements.length > 0 
            ? goal.achievements.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            : null
            
          const score = latestAch ? latestAch.progressScore : 0

          return (
            <Card key={goal.id} className="bg-slate-900 border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-800/50 pb-3 border-b border-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base text-white font-medium mb-1">
                      <span className="text-slate-400 mr-2">{i + 1}.</span> {goal.title}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">{goal.thrustArea}</span>
                      <span>Target: <span className="font-mono text-white">{goal.target}</span></span>
                      <span>Weightage: <span className="font-mono text-white">{goal.weightage}%</span></span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Overall Score</p>
                      <p className={`text-xl font-mono font-bold ${getScoreColor(score)}`}>{score}%</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                
                {/* Quarters grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(phase => {
                    const ach = goal.achievements.find((a: any) => a.cyclePhase === phase)
                    const comment = goal.checkinComments.find((c: any) => c.phase === phase)
                    
                    return (
                      <div key={phase} className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{phase}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full
                            ${!ach ? 'bg-slate-800 text-slate-500' : 
                              ach.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400' :
                              ach.status === 'ON_TRACK' ? 'bg-blue-900/50 text-blue-400' :
                              'bg-slate-800 text-slate-300'}`}>
                            {ach ? ach.status.replace('_', ' ') : 'NO DATA'}
                          </span>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-[10px] text-slate-500 uppercase">Actual</p>
                          <p className="text-sm font-mono text-white">{ach ? ach.actualValue : '—'}</p>
                        </div>
                        
                        {ach && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getScoreBg(ach.progressScore)}`}
                                style={{ width: `${Math.min(ach.progressScore, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-mono font-bold ${getScoreColor(ach.progressScore)}`}>
                              {ach.progressScore}%
                            </span>
                          </div>
                        )}

                        {/* Manager Comment */}
                        {comment && (
                          <div className="mt-3 pt-2 border-t border-slate-800">
                            <p className="text-[10px] text-indigo-400 font-semibold mb-1 flex items-center justify-between">
                              Manager Comment
                              <span className="text-slate-500 font-normal">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </p>
                            <p className="text-xs text-slate-300 italic">"{comment.comment}"</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
