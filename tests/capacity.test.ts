import { describe, expect, it } from 'vitest'
import {
  buildDashboard,
  monthBounds,
  overlapsMonth,
  periodsOverlap,
  placesTaken,
} from '../app/utils/capacity'
import type { CapacityOverview } from '../shared/types/capacity'

describe('placesTaken', () => {
  it('full-time children each take a place', () => {
    expect(placesTaken(4, 0, 0)).toBe(4)
  })

  it('pairs one 3-day with one 2-day', () => {
    expect(placesTaken(0, 1, 1)).toBe(1)
  })

  it('still charges a whole place without a partner', () => {
    expect(placesTaken(0, 1, 0)).toBe(1)
    expect(placesTaken(0, 0, 1)).toBe(1)
  })

  it('matches 4 FT + 3 three-day + 1 two-day = 7 places', () => {
    expect(placesTaken(4, 3, 1)).toBe(7)
  })

  it('uses the larger part-time group after pairing', () => {
    expect(placesTaken(0, 5, 2)).toBe(5)
    expect(placesTaken(0, 2, 5)).toBe(5)
  })
})

describe('month overlap', () => {
  it('uses the last day of the month', () => {
    expect(monthBounds('2026-09')).toEqual({
      start: '2026-09-01',
      end: '2026-09-30',
    })
  })

  it('handles the last day of a leap-year February', () => {
    expect(monthBounds('2028-02').end).toBe('2028-02-29')
  })

  it('includes open-ended records that already started', () => {
    expect(overlapsMonth('2025-09-01', null, '2026-09-01', '2026-09-30')).toBe(
      true,
    )
  })

  it('skips records that start after the month', () => {
    expect(overlapsMonth('2026-10-01', null, '2026-09-01', '2026-09-30')).toBe(
      false,
    )
  })

  it('skips records that ended before the month', () => {
    expect(
      overlapsMonth('2026-01-01', '2026-08-31', '2026-09-01', '2026-09-30'),
    ).toBe(false)
  })

  it('detects periods that are active in the same month but never overlap', () => {
    expect(
      periodsOverlap('2026-09-01', '2026-09-10', '2026-09-20', '2026-09-30'),
    ).toBe(false)
    expect(periodsOverlap('2026-09-01', '2026-09-20', '2026-09-20', null)).toBe(
      true,
    )
  })
})

const sample: CapacityOverview = {
  meta: {
    month: '2026-09',
    effective_on: '2026-09-30',
    timezone: 'America/Edmonton',
    available_months: ['2026-09'],
  },
  age_groups: [
    { id: 'infant', label: 'Infant' },
    { id: 'toddler', label: 'Toddler' },
  ],
  attendance_types: [
    { id: 'full_time', label: 'Full time', abbreviation: 'FT' },
    {
      id: 'three_days_per_week',
      label: 'Three days per week',
      abbreviation: '3D',
    },
    { id: 'two_days_per_week', label: 'Two days per week', abbreviation: '2D' },
  ],
  centres: [{ id: 'c1', name: 'South Centre', abbreviation: 'SC' }],
  classrooms: [
    {
      id: 'r1',
      centre_id: 'c1',
      name: '201',
      capacity: 2,
      accepted_age_group_ids: ['infant'],
    },
  ],
  enrolments: [
    {
      id: 'e1',
      centre_id: 'c1',
      starts_on: '2025-09-01',
      ends_on: null,
      attendance_type: 'full_time',
      age_group: 'infant',
      child: {
        id: 'ch1',
        first_name: 'Ada',
        last_name: 'Cole',
        date_of_birth: '2026-01-01',
      },
      assignment: {
        id: 'a1',
        classroom_id: 'r1',
        starts_on: '2025-09-01',
        ends_on: null,
      },
    },
    {
      id: 'e2',
      centre_id: 'c1',
      starts_on: '2025-09-01',
      ends_on: null,
      attendance_type: 'full_time',
      age_group: 'toddler',
      child: {
        id: 'ch2',
        first_name: 'Ben',
        last_name: 'Cole',
        date_of_birth: '2024-01-01',
      },
      assignment: {
        id: 'a2',
        classroom_id: 'r1',
        starts_on: '2025-09-01',
        ends_on: null,
      },
    },
    {
      id: 'e3',
      centre_id: 'c1',
      starts_on: '2025-09-01',
      ends_on: null,
      attendance_type: 'three_days_per_week',
      age_group: 'infant',
      child: {
        id: 'ch3',
        first_name: 'Cara',
        last_name: 'Cole',
        date_of_birth: '2026-01-01',
      },
      assignment: null,
    },
    {
      id: 'e4',
      centre_id: 'c1',
      starts_on: '2025-09-01',
      ends_on: null,
      attendance_type: 'two_days_per_week',
      age_group: 'infant',
      child: {
        id: 'ch4',
        first_name: 'Drew',
        last_name: 'Cole',
        date_of_birth: '2026-01-01',
      },
      assignment: {
        id: 'a4',
        classroom_id: 'r1',
        starts_on: '2026-10-01',
        ends_on: null,
      },
    },
  ],
}

describe('buildDashboard', () => {
  it('does not count unassigned children against the room', () => {
    const dashboard = buildDashboard(sample)
    const room = dashboard.centres[0]!.rooms[0]!
    expect(room.children).toHaveLength(2)
    expect(room.placesUsed).toBe(2)
    expect(dashboard.centres[0]!.unassigned.map((child) => child.name)).toEqual(
      ['Cara Cole', 'Drew Cole'],
    )
    expect(dashboard.assignedChildren).toBe(2)
    expect(dashboard.openPlaces).toBe(0)
    expect(dashboard.effectiveOn).toBe('2026-09-30')
    expect(dashboard.timezone).toBe('America/Edmonton')
  })

  it('flags age-group mismatches and over capacity', () => {
    const dashboard = buildDashboard(sample)
    expect(dashboard.centres[0]!.rooms[0]!.ageGroupMismatchCount).toBe(1)
    expect(
      dashboard.issues.some((item) => item.includes('age-group mismatches')),
    ).toBe(true)

    const crowded = structuredClone(sample)
    crowded.classrooms[0]!.capacity = 1
    const over = buildDashboard(crowded)
    expect(over.centres[0]!.rooms[0]!.overCapacity).toBe(true)
    expect(over.overCapacityRooms).toBe(1)
  })

  it('does not offset open rooms with another room being over capacity', () => {
    const mixed = structuredClone(sample)
    mixed.classrooms[0]!.capacity = 1
    mixed.classrooms.push({
      id: 'r2',
      centre_id: 'c1',
      name: '202',
      capacity: 3,
      accepted_age_group_ids: ['infant'],
    })

    const dashboard = buildDashboard(mixed)
    expect(dashboard.totalCapacity).toBe(4)
    expect(dashboard.placesUsed).toBe(2)
    expect(dashboard.openPlaces).toBe(3)
  })

  it('treats a non-overlapping assignment as unassigned', () => {
    const disjoint = structuredClone(sample)
    disjoint.enrolments[0]!.ends_on = '2026-09-10'
    disjoint.enrolments[0]!.assignment!.starts_on = '2026-09-20'

    const dashboard = buildDashboard(disjoint)
    expect(dashboard.centres[0]!.rooms[0]!.children).toHaveLength(1)
    expect(
      dashboard.centres[0]!.unassigned.map((child) => child.name),
    ).toContain('Ada Cole')
  })

  it('rejects an attendance type outside the API contract', () => {
    const invalid = structuredClone(sample)
    invalid.enrolments[0]!.attendance_type = 'weekends' as never

    expect(() => buildDashboard(invalid)).toThrow(
      'Unsupported attendance type: weekends',
    )
  })
})
