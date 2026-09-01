import type {
  AgeGroupId,
  AttendanceTypeId,
  CapacityOverview,
} from '../../shared/types/capacity'

export type ChildRow = {
  enrolmentId: string
  name: string
  attendanceShort: string
  ageGroupLabel: string
  attendanceType: AttendanceTypeId
  ageGroupMismatch: boolean
}

export type RoomRow = {
  id: string
  name: string
  capacity: number
  acceptedLabels: string[]
  children: ChildRow[]
  fullTime: number
  threeDay: number
  twoDay: number
  placesUsed: number
  overCapacity: boolean
  ageGroupMismatchCount: number
}

export type CentreRow = {
  id: string
  name: string
  rooms: RoomRow[]
  unassigned: ChildRow[]
  capacity: number
  placesUsed: number
}

export function monthBounds(yearMonth: string) {
  const [yearText, monthText] = yearMonth.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    start: `${yearMonth}-01`,
    end: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function overlapsMonth(
  startsOn: string,
  endsOn: string | null,
  monthStart: string,
  monthEnd: string,
) {
  if (startsOn > monthEnd) return false
  if (endsOn !== null && endsOn < monthStart) return false
  return true
}

export function periodsOverlap(
  firstStartsOn: string,
  firstEndsOn: string | null,
  secondStartsOn: string,
  secondEndsOn: string | null,
) {
  const firstStartsBeforeSecondEnds =
    secondEndsOn === null || firstStartsOn <= secondEndsOn
  const secondStartsBeforeFirstEnds =
    firstEndsOn === null || secondStartsOn <= firstEndsOn
  return firstStartsBeforeSecondEnds && secondStartsBeforeFirstEnds
}

export function placesTaken(
  fullTime: number,
  threeDay: number,
  twoDay: number,
) {
  return fullTime + Math.max(threeDay, twoDay)
}

export function buildDashboard(data: CapacityOverview) {
  const { start, end } = monthBounds(data.meta.month)
  const ageLabel = new Map(
    data.age_groups.map((group) => [group.id, group.label]),
  )
  const attendanceShort = new Map(
    data.attendance_types.map((type) => [type.id, type.abbreviation]),
  )

  const roomsByCentre = new Map<string, RoomRow[]>()
  const roomLookup = new Map<
    string,
    { accepted: Set<AgeGroupId>; room: RoomRow }
  >()

  for (const classroom of data.classrooms) {
    const room: RoomRow = {
      id: classroom.id,
      name: classroom.name,
      capacity: classroom.capacity,
      acceptedLabels: classroom.accepted_age_group_ids.map(
        (id) => ageLabel.get(id) ?? id,
      ),
      children: [],
      fullTime: 0,
      threeDay: 0,
      twoDay: 0,
      placesUsed: 0,
      overCapacity: false,
      ageGroupMismatchCount: 0,
    }
    const list = roomsByCentre.get(classroom.centre_id) ?? []
    list.push(room)
    roomsByCentre.set(classroom.centre_id, list)
    roomLookup.set(classroom.id, {
      accepted: new Set(classroom.accepted_age_group_ids),
      room,
    })
  }

  const unassignedByCentre = new Map<string, ChildRow[]>()

  for (const enrolment of data.enrolments) {
    if (!overlapsMonth(enrolment.starts_on, enrolment.ends_on, start, end))
      continue

    const assignment = enrolment.assignment
    const assignedRoom =
      assignment &&
      overlapsMonth(assignment.starts_on, assignment.ends_on, start, end) &&
      periodsOverlap(
        enrolment.starts_on,
        enrolment.ends_on,
        assignment.starts_on,
        assignment.ends_on,
      )
        ? roomLookup.get(assignment.classroom_id)
        : undefined

    const row: ChildRow = {
      enrolmentId: enrolment.id,
      name: `${enrolment.child.first_name} ${enrolment.child.last_name}`,
      attendanceType: enrolment.attendance_type,
      attendanceShort:
        attendanceShort.get(enrolment.attendance_type) ??
        enrolment.attendance_type,
      ageGroupLabel: ageLabel.get(enrolment.age_group) ?? enrolment.age_group,
      ageGroupMismatch: assignedRoom
        ? !assignedRoom.accepted.has(enrolment.age_group)
        : false,
    }

    if (!assignedRoom) {
      const list = unassignedByCentre.get(enrolment.centre_id) ?? []
      list.push(row)
      unassignedByCentre.set(enrolment.centre_id, list)
      continue
    }

    assignedRoom.room.children.push(row)
  }

  const centres = data.centres.map((centre) => {
    const rooms = (roomsByCentre.get(centre.id) ?? []).map((room) => {
      let fullTime = 0
      let threeDay = 0
      let twoDay = 0
      for (const child of room.children) {
        switch (child.attendanceType) {
          case 'full_time':
            fullTime += 1
            break
          case 'three_days_per_week':
            threeDay += 1
            break
          case 'two_days_per_week':
            twoDay += 1
            break
          default:
            throw new Error(
              `Unsupported attendance type: ${child.attendanceType}`,
            )
        }
      }
      const placesUsed = placesTaken(fullTime, threeDay, twoDay)
      return {
        ...room,
        children: [...room.children].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        fullTime,
        threeDay,
        twoDay,
        placesUsed,
        overCapacity: placesUsed > room.capacity,
        ageGroupMismatchCount: room.children.filter(
          (child) => child.ageGroupMismatch,
        ).length,
      }
    })

    rooms.sort((a, b) => {
      const rank = (room: RoomRow) =>
        (room.overCapacity ? 2 : 0) + (room.ageGroupMismatchCount > 0 ? 1 : 0)
      const diff = rank(b) - rank(a)
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name, undefined, { numeric: true })
    })

    return {
      id: centre.id,
      name: centre.name,
      rooms,
      unassigned: [...(unassignedByCentre.get(centre.id) ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      capacity: rooms.reduce((sum, room) => sum + room.capacity, 0),
      placesUsed: rooms.reduce((sum, room) => sum + room.placesUsed, 0),
    }
  })

  const placesUsed = centres.reduce((sum, centre) => sum + centre.placesUsed, 0)
  const totalCapacity = centres.reduce(
    (sum, centre) => sum + centre.capacity,
    0,
  )
  const assignedChildren = centres.reduce(
    (sum, centre) =>
      sum +
      centre.rooms.reduce((count, room) => count + room.children.length, 0),
    0,
  )
  const issues: string[] = []

  for (const centre of centres) {
    for (const room of centre.rooms) {
      if (room.overCapacity) {
        issues.push(
          `${centre.name}: room ${room.name} uses ${room.placesUsed} of ${room.capacity} places`,
        )
      }
      if (room.ageGroupMismatchCount) {
        issues.push(
          `${centre.name}: room ${room.name} has ${room.ageGroupMismatchCount} age-group mismatches`,
        )
      }
    }
    for (const child of centre.unassigned) {
      issues.push(
        `${centre.name}: ${child.name} has no classroom (${child.ageGroupLabel}, ${child.attendanceShort})`,
      )
    }
  }

  return {
    month: data.meta.month,
    effectiveOn: data.meta.effective_on,
    timezone: data.meta.timezone,
    availableMonths: data.meta.available_months,
    centres,
    placesUsed,
    totalCapacity,
    openPlaces: centres.reduce(
      (sum, centre) =>
        sum +
        centre.rooms.reduce(
          (count, room) => count + Math.max(room.capacity - room.placesUsed, 0),
          0,
        ),
      0,
    ),
    assignedChildren,
    overCapacityRooms: centres.reduce(
      (sum, centre) =>
        sum + centre.rooms.filter((room) => room.overCapacity).length,
      0,
    ),
    unassigned: centres.reduce(
      (sum, centre) => sum + centre.unassigned.length,
      0,
    ),
    ageGroupMismatches: centres.reduce(
      (sum, centre) =>
        sum +
        centre.rooms.reduce(
          (count, room) => count + room.ageGroupMismatchCount,
          0,
        ),
      0,
    ),
    issues,
  }
}
