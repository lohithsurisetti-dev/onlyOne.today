declare module 'google-trends-api' {
  export function dailyTrends(options: { geo: string }): Promise<string>
  export function realTimeTrends(options: { geo: string; category?: string }): Promise<string>
  export function interestOverTime(options: { keyword: string; startTime?: Date }): Promise<string>
}

