// Business logic utilities — all rules from atom.txt Section 6
// These are enforced at BOTH the API layer and UI layer.

export type UoMType = 'MIN' | 'MAX' | 'TIMELINE' | 'ZERO'
export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
export type SheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'LOCKED'
export type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED'
export type Phase = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface GoalInput {
  id?: string
  title: string
  thrustArea: string
  description: string
  uomType: UoMType
  target: string
  weightage: number
  isShared?: boolean
}

export interface ValidationResult {
  valid: boolean
  total: number
  errors: string[]
}

// RULE 1: Total weightage must equal exactly 100%
// RULE 2: Each goal min 10%
// RULE 3: Maximum 8 goals
export function validateGoalSheet(goals: GoalInput[]): ValidationResult {
  const errors: string[] = []
  const total = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0)

  if (goals.length === 0) errors.push('At least 1 goal is required.')
  if (goals.length > 8) errors.push('Maximum 8 goals are allowed per cycle.')

  goals.forEach((g, i) => {
    if (!g.title.trim()) errors.push(`Goal ${i + 1}: Title is required.`)
    if (!g.target.trim()) errors.push(`Goal ${i + 1}: Target is required.`)
    if (Number(g.weightage) < 10) errors.push(`Goal ${i + 1}: Minimum weightage is 10%.`)
  })

  if (Math.abs(total - 100) > 0.01) {
    errors.push(`Total weightage must equal exactly 100% (currently ${total.toFixed(1)}%).`)
  }

  return { valid: errors.length === 0, total, errors }
}

// Progress score computation — exact formulas from BRD Section 2.2
// RULE: Division by zero must be handled gracefully (return 0, not crash)
export function computeProgressScore(uomType: UoMType, target: string, actual: string): number {
  const t = parseFloat(target)
  const a = parseFloat(actual)

  if (isNaN(a)) return 0

  switch (uomType) {
    case 'MIN': {
      // Higher is better: Achievement ÷ Target × 100
      if (isNaN(t) || t === 0) return 0
      return Math.min(Math.round((a / t) * 100), 200) // cap at 200% for display
    }
    case 'MAX': {
      // Lower is better: Target ÷ Achievement × 100
      if (isNaN(t) || a === 0) return 0 // RULE: division by zero → 0%, not crash
      return Math.min(Math.round((t / a) * 100), 200)
    }
    case 'TIMELINE': {
      // Date-based: on or before deadline = 100%, after = 0%
      // target = deadline date string, actual = completion date string
      try {
        const targetDate = new Date(target).getTime()
        const actualDate = new Date(actual).getTime()
        if (isNaN(targetDate) || isNaN(actualDate)) return 0
        return actualDate <= targetDate ? 100 : 0
      } catch {
        return 0
      }
    }
    case 'ZERO': {
      // Zero = success: if 0 → 100%, else 0%
      return a === 0 ? 100 : 0
    }
    default:
      return 0
  }
}

// Score colour helper for UI
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

// Status badge colours
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-600 text-slate-200',
  SUBMITTED: 'bg-blue-600 text-blue-100',
  APPROVED: 'bg-green-600 text-green-100',
  RETURNED: 'bg-red-600 text-red-100',
  LOCKED: 'bg-purple-600 text-purple-100',
  NOT_STARTED: 'bg-slate-600 text-slate-200',
  ON_TRACK: 'bg-blue-600 text-blue-100',
  COMPLETED: 'bg-green-600 text-green-100',
}

export const THRUST_AREAS = [
  'Financial',
  'Customer',
  'Internal Process',
  'Learning & Growth',
  'Operations',
  'Technology',
  'Quality',
  'Sales',
  'HR',
]

export const UOM_LABELS: Record<UoMType, string> = {
  MIN: 'Min — Higher is better (e.g. Revenue)',
  MAX: 'Max — Lower is better (e.g. TAT, Cost)',
  TIMELINE: 'Timeline — Date-based completion',
  ZERO: 'Zero-based — e.g. Safety Incidents',
}
