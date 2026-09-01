export type AgeGroupId =
  'infant' | 'baby' | 'toddler' | 'preschool' | 'kindergarten' | 'school'

export type AttendanceTypeId =
  'full_time' | 'three_days_per_week' | 'two_days_per_week'

export type Meta = {
  month: string
  effective_on: string
  timezone: string
  available_months: string[]
}

export type AgeGroup = {
  id: AgeGroupId
  label: string
}

export type AttendanceType = {
  id: AttendanceTypeId
  label: string
  abbreviation: string
}

export type Centre = {
  id: string
  name: string
  abbreviation: string
}

export type Classroom = {
  id: string
  centre_id: string
  name: string
  capacity: number
  accepted_age_group_ids: AgeGroupId[]
}

export type Child = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
}

export type ClassroomAssignment = {
  id: string
  classroom_id: string
  starts_on: string
  ends_on: string | null
}

export type Enrolment = {
  id: string
  centre_id: string
  starts_on: string
  ends_on: string | null
  attendance_type: AttendanceTypeId
  age_group: AgeGroupId
  child: Child
  assignment: ClassroomAssignment | null
}

export type CapacityOverview = {
  meta: Meta
  age_groups: AgeGroup[]
  attendance_types: AttendanceType[]
  centres: Centre[]
  classrooms: Classroom[]
  enrolments: Enrolment[]
}
