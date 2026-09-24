import { describe, expect, it } from 'vitest'
import {
  AttendanceStatus,
  ScheduleWindowStatus,
  classifyScheduleItem,
} from '../../src/domain/attendanceStatus.js'

const startAt = new Date('2026-09-17T08:00:00.000Z')
const endAt = new Date('2026-09-17T09:00:00.000Z')
const at = (minutes, seconds = 0) =>
  new Date(startAt.getTime() + minutes * 60 * 1000 + seconds * 1000)

describe('attendance schedule domain', () => {
  it('exposes the schedule window statuses', () => {
    expect(ScheduleWindowStatus).toEqual({
      BELUM_DIBUKA: 'BELUM_DIBUKA',
      BISA_ABSEN: 'BISA_ABSEN',
      SELESAI: 'SELESAI',
    })
  })

  it('marks a session before the scan window as not yet open', () => {
    expect(
      classifyScheduleItem({ startAt, endAt, now: at(-15, -1) }),
    ).toEqual({
      windowStatus: ScheduleWindowStatus.BELUM_DIBUKA,
      attendanceStatus: null,
      scanned: false,
    })
  })

  it('opens the window exactly 15 minutes before start', () => {
    expect(classifyScheduleItem({ startAt, endAt, now: at(-15) })).toEqual({
      windowStatus: ScheduleWindowStatus.BISA_ABSEN,
      attendanceStatus: null,
      scanned: false,
    })
  })

  it('keeps a session open until exactly end time', () => {
    expect(classifyScheduleItem({ startAt, endAt, now: endAt })).toEqual({
      windowStatus: ScheduleWindowStatus.BISA_ABSEN,
      attendanceStatus: null,
      scanned: false,
    })
  })

  it('marks a finished session as closed with computed absent status', () => {
    expect(
      classifyScheduleItem({ startAt, endAt, now: at(61) }),
    ).toEqual({
      windowStatus: ScheduleWindowStatus.SELESAI,
      attendanceStatus: AttendanceStatus.TIDAK_HADIR,
      scanned: false,
    })
  })

  it('uses the record status when the student already scanned', () => {
    const record = { status: AttendanceStatus.TERLAMBAT }
    expect(
      classifyScheduleItem({
        startAt,
        endAt,
        now: at(16, 30),
        record,
      }),
    ).toEqual({
      windowStatus: ScheduleWindowStatus.BISA_ABSEN,
      attendanceStatus: AttendanceStatus.TERLAMBAT,
      scanned: true,
    })
  })

  it('never marks a scanned session as absent after it ends', () => {
    const record = { status: AttendanceStatus.HADIR }
    expect(
      classifyScheduleItem({ startAt, endAt, now: at(90), record }),
    ).toEqual({
      windowStatus: ScheduleWindowStatus.SELESAI,
      attendanceStatus: AttendanceStatus.HADIR,
      scanned: true,
    })
  })
})