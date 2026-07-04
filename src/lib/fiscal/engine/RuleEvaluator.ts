import type { FormulaNode, ConditionNode } from './types'

export class RuleEvaluator {
  evaluateFormula(formula: FormulaNode, ctx: Record<string, number | string | boolean>): number {
    switch (formula.op) {
      case 'multiply':
        return (ctx[formula.field] as number) * formula.factor

      case 'multiply_fields':
        return (ctx[formula.fields[0]] as number) * (ctx[formula.fields[1]] as number)

      case 'subtract':
        return (ctx[formula.field] as number) - (ctx[formula.minus] as number)

      case 'fixed':
        return formula.value

      case 'sum':
        return formula.fields.reduce((acc, f) => acc + ((ctx[f] as number) ?? 0), 0)

      case 'max_zero':
        return Math.max(0, this.evaluateFormula(formula.formula, ctx))

      case 'bracket_lookup':
        return 0

      default:
        throw new Error(`FormulaNode op inconnu`)
    }
  }

  evaluateConditions(
    conditions: ConditionNode[],
    ctx: Record<string, number | string | boolean>
  ): boolean {
    if (conditions.length === 0) return true
    return conditions.every(c => this.evaluateCondition(c, ctx))
  }

  private evaluateCondition(
    cond: ConditionNode,
    ctx: Record<string, number | string | boolean>
  ): boolean {
    if ('op' in cond && (cond.op === 'and' || cond.op === 'or')) {
      if (cond.op === 'and') return cond.conditions.every(c => this.evaluateCondition(c, ctx))
      return cond.conditions.some(c => this.evaluateCondition(c, ctx))
    }

    const node = cond as Extract<ConditionNode, { field: string }>
    const val = ctx[node.field]

    switch (node.op) {
      case 'lte': return (val as number) <= node.value
      case 'gte': return (val as number) >= node.value
      case 'lt':  return (val as number) <  node.value
      case 'gt':  return (val as number) >  node.value
      case 'eq':  return val === node.value
      case 'in':  return node.values.includes(val as string | number)
      default:    return false
    }
  }
}
