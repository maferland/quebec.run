type WithLocation = {
  latitude: number
  longitude: number
  date: Date
}

export function groupByLocation<T extends WithLocation>(items: T[]): T[][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = `${item.latitude.toFixed(6)},${item.longitude.toFixed(6)}`
    const list = groups.get(key)
    if (list) list.push(item)
    else groups.set(key, [item])
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.date.getTime() - b.date.getTime())
  }
  return Array.from(groups.values())
}
