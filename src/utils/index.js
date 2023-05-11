const maxPositions = 2500

function releventDistance(prev, cur) {
  if (!prev) { return true }
  if (prev.attributes.ignition !== cur.attributes.ignition) {
    return true
  }
  if (prev.attributes.motion !== cur.attributes.motion) {
    return true
  }
  return new Date(cur.fixTime).getTime() - new Date(prev.fixTime).getTime() > 1000 * 40
}

export function reducePositions(positions) {
  if (positions.length < maxPositions) return positions
  return positions.reduce((acc, cur) => {
    const prev = (acc && acc.slice(-1)[0])
    if (releventDistance(prev, cur)) { acc.push(cur) }
    return acc
  }, [])
}
