import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const tracksDir = path.join(projectRoot, 'src', 'tracks')

const TARGET_LAPS = 4
const RANGE_START = '2026-04-18'
const RANGE_END = '2026-07-22'

const baseLoopPoints = [
  [126.502238, 43.821622],
  [126.502114, 43.821616],
  [126.501982, 43.821587],
  [126.501878, 43.821553],
  [126.501806, 43.821527],
  [126.501742, 43.821498],
  [126.501686, 43.821457],
  [126.501558, 43.821423],
  [126.501422, 43.821388],
  [126.501334, 43.821339],
  [126.501238, 43.821304],
  [126.501134, 43.821284],
  [126.501078, 43.821255],
  [126.50103, 43.821206],
  [126.501038, 43.821146],
  [126.501022, 43.821091],
  [126.501022, 43.821056],
  [126.501046, 43.820996],
  [126.501098, 43.820946],
  [126.501122, 43.820905],
  [126.501162, 43.820853],
  [126.501202, 43.820816],
  [126.501286, 43.820778],
  [126.50133, 43.820747],
  [126.501394, 43.820732],
  [126.50153, 43.820752],
  [126.50169, 43.820801],
  [126.50181, 43.820842],
  [126.501917, 43.820875],
  [126.502048, 43.820903],
  [126.502192, 43.820941],
  [126.50228, 43.821001],
  [126.50238, 43.821013],
  [126.502508, 43.821018],
  [126.50256, 43.821076],
  [126.502612, 43.821137],
  [126.502608, 43.821218],
  [126.502564, 43.821301],
  [126.502544, 43.821373],
  [126.502512, 43.821443],
  [126.502468, 43.821526],
  [126.502392, 43.821561],
  [126.50232, 43.821607],
]

function hashString(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function formatDateOnly(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildTargetDays(startIsoDate, endIsoDate) {
  const startDate = new Date(`${startIsoDate}T00:00:00`)
  const endDate = new Date(`${endIsoDate}T00:00:00`)
  const targetDays = []

  for (
    const cursor = new Date(startDate);
    cursor.getTime() <= endDate.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const weekDay = cursor.getDay()
    const isWednesdayOrFriday = weekDay === 3 || weekDay === 5

    if (!isWednesdayOrFriday) {
      continue
    }

    const date = formatDateOnly(cursor)
    const rng = mulberry32(hashString(`config-${date}`))
    const hour = rng() < 0.84 ? 21 : 22
    const minute = Math.floor(rng() * 60)

    targetDays.push({
      date,
      startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      cadenceSpm: Math.round(165 + rng() * 12),
      targetSpeedKmh: roundTo(8.7 + rng() * 1.7, 1),
    })
  }

  return targetDays
}

function clearOldTrackFiles() {
  const trackFiles = fs
    .readdirSync(tracksDir)
    .filter((fileName) => /^workout-\d{4}-\d{2}-\d{2}\.json$/i.test(fileName))

  trackFiles.forEach((fileName) => {
    fs.unlinkSync(path.join(tracksDir, fileName))
  })
}

function mulberry32(seed) {
  let source = seed >>> 0
  return function next() {
    source += 0x6d2b79f5
    let value = source
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function roundTo(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

function formatDateTimeLocal(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

function haversineKm(from, to) {
  const earthRadiusKm = 6371
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)

  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function distanceKm(points) {
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += haversineKm(points[index - 1], points[index])
  }
  return total
}

function jitterPointByMeters(lng, lat, angleRad, meters) {
  const eastMeters = Math.cos(angleRad) * meters
  const northMeters = Math.sin(angleRad) * meters

  const metersPerDegLat = 111320
  const metersPerDegLng = 111320 * Math.cos(toRadians(lat))

  return {
    lng: roundTo(lng + eastMeters / metersPerDegLng, 6),
    lat: roundTo(lat + northMeters / metersPerDegLat, 6),
  }
}

function buildJitteredLaps(baseLoop, laps, rng) {
  const jitteredPoints = []
  let minJitter = Number.POSITIVE_INFINITY
  let maxJitter = Number.NEGATIVE_INFINITY

  for (let lapIndex = 0; lapIndex < laps; lapIndex += 1) {
    for (let pointIndex = 0; pointIndex < baseLoop.length; pointIndex += 1) {
      const [lng, lat] = baseLoop[pointIndex]
      const jitterMeters = 1 + rng()
      const jitterAngle = rng() * Math.PI * 2
      const jittered = jitterPointByMeters(lng, lat, jitterAngle, jitterMeters)

      minJitter = Math.min(minJitter, jitterMeters)
      maxJitter = Math.max(maxJitter, jitterMeters)

      jitteredPoints.push({
        ...jittered,
        jitterMeters,
      })
    }
  }

  return {
    jitteredPoints,
    jitterRange: {
      min: roundTo(minJitter, 2),
      max: roundTo(maxJitter, 2),
    },
  }
}

function withTimestamps(points, date, startTime, durationMin) {
  const start = new Date(`${date}T${startTime}:00`)
  const stepMs = (durationMin * 60 * 1000) / Math.max(points.length - 1, 1)

  return points.map((point, index) => ({
    lng: point.lng,
    lat: point.lat,
    timestamp: formatDateTimeLocal(new Date(start.getTime() + stepMs * index)),
  }))
}

const targetDays = buildTargetDays(RANGE_START, RANGE_END)
clearOldTrackFiles()

const reports = []

for (const day of targetDays) {
  const rng = mulberry32(hashString(day.date))
  const { jitteredPoints, jitterRange } = buildJitteredLaps(baseLoopPoints, TARGET_LAPS, rng)

  const measuredDistanceKm = distanceKm(jitteredPoints)
  const totalDistanceKm = roundTo(measuredDistanceKm, 2)
  const totalDurationMin = roundTo((totalDistanceKm / day.targetSpeedKmh) * 60, 2)
  const averageSpeedKmh = roundTo(totalDistanceKm / (totalDurationMin / 60), 2)

  const points = withTimestamps(jitteredPoints, day.date, day.startTime, totalDurationMin)

  const workout = {
    id: `workout-${day.date}`,
    date: day.date,
    startTime: day.startTime,
    totalDistanceKm,
    totalDurationMin,
    averageSpeedKmh,
    cadenceSpm: day.cadenceSpm,
    points,
  }

  const fileName = `workout-${day.date}.json`
  const filePath = path.join(tracksDir, fileName)
  fs.writeFileSync(filePath, `${JSON.stringify(workout, null, 2)}\n`, 'utf8')

  reports.push(
    `${fileName}: laps ${TARGET_LAPS}, points ${points.length}, distance ${totalDistanceKm} km, jitter ${jitterRange.min}-${jitterRange.max} m`,
  )
}

console.log('Generated workout records:')
reports.forEach((line) => console.log(`- ${line}`))
